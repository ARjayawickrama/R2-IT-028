import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import SafetyIncident from '../models/SafetyIncident.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const getRecipient = () => process.env.SAFETY_ALERT_RECIPIENT || 'wickramanju@gmail.com';
const allowedAlertKeys = new Set([
  'mqtt-disconnected',
  'telemetry-stale',
  'invalid-sensor-data',
  'high-chamber-temperature',
  'high-thermal-pixel',
  'uneven-thermal-distribution',
]);
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many safety notification requests. Try again later.' },
});
const allowedEmailStatuses = new Set(['accepted', 'failed', 'not_configured']);

let transporter;

function getEmailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

function finiteOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function validateAlert(alert) {
  return alert &&
    typeof alert === 'object' &&
    allowedAlertKeys.has(alert.key) &&
    typeof alert.type === 'string' &&
    alert.type.length <= 120 &&
    (alert.severity === 'warning' || alert.severity === 'critical') &&
    typeof alert.timestamp === 'string' &&
    Number.isFinite(Date.parse(alert.timestamp));
}

function parseHeatmap(dataUrl) {
  if (dataUrl === undefined || dataUrl === null) return null;
  if (typeof dataUrl !== 'string' || dataUrl.length > 2_800_000) {
    throw new Error('Heatmap image is too large or invalid.');
  }

  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error('Heatmap attachment must be a PNG data URL.');

  const buffer = Buffer.from(match[1], 'base64');
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (
    buffer.length > 2_000_000 ||
    buffer.length < pngSignature.length ||
    !buffer.subarray(0, pngSignature.length).equals(pngSignature)
  ) {
    throw new Error('Heatmap attachment is not a valid PNG image.');
  }
  return buffer;
}

router.use(protect);

router.get('/email-status', (req, res) => {
  const configured = Boolean(getEmailTransport());
  res.json({
    configured,
    recipient: getRecipient(),
    message: configured
      ? 'SMTP is configured; delivery status is confirmed per alert.'
      : 'Email notifications are not configured. Set SMTP environment variables on the backend.',
  });
});

router.post('/test-email', emailLimiter, async (req, res) => {
  const mailer = getEmailTransport();
  if (!mailer) {
    return res.status(503).json({
      emailStatus: 'not_configured',
      message: 'SMTP is not configured on the backend; no email was sent.',
    });
  }

  try {
    const info = await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: getRecipient(),
      subject: 'AquaSense Industrial Monitor email test',
      text: `This is an email delivery test requested by an authenticated AquaSense dashboard user at ${new Date().toISOString()}.\n\nThis confirms only that the SMTP provider accepted this message; it does not confirm inbox delivery.`,
    });
    if (!info.accepted?.length) {
      return res.status(502).json({
        emailStatus: 'failed',
        message: 'SMTP did not confirm acceptance of the test message.',
      });
    }

    res.json({
      emailStatus: 'accepted',
      message: 'The SMTP provider accepted the test message. This does not confirm inbox delivery.',
    });
  } catch (error) {
    console.error('AquaSense test email failed:', error.message);
    res.status(502).json({
      emailStatus: 'failed',
      message: 'The SMTP provider did not confirm acceptance of the test message.',
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const incidents = await SafetyIncident.find()
      .sort({ lastOccurredAt: -1 })
      .limit(50)
      .lean();
    res.json(incidents);
  } catch (error) {
    console.error('Error loading safety incident history:', error.message);
    res.status(500).json({ message: 'Could not load safety incident history.' });
  }
});

router.patch('/history/:id/acknowledge', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid safety incident ID.' });
  }

  try {
    const incident = await SafetyIncident.findByIdAndUpdate(
      req.params.id,
      { acknowledgedAt: new Date() },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: 'Safety incident not found.' });
    res.json(incident);
  } catch (error) {
    console.error('Error acknowledging safety incident:', error.message);
    res.status(500).json({ message: 'Could not acknowledge safety incident.' });
  }
});

router.patch('/alerts/email-status', async (req, res) => {
  const { incidentKeys, emailStatus } = req.body || {};
  if (
    !Array.isArray(incidentKeys) ||
    incidentKeys.length === 0 ||
    incidentKeys.length > allowedAlertKeys.size ||
    !incidentKeys.every(key => allowedAlertKeys.has(key)) ||
    !allowedEmailStatuses.has(emailStatus)
  ) {
    return res.status(400).json({ message: 'Invalid email delivery status update.' });
  }

  try {
    const update = { lastEmailStatus: emailStatus };
    if (emailStatus === 'not_configured' || emailStatus === 'failed') {
      update.lastEmailAttemptAt = null;
    }
    await SafetyIncident.updateMany(
      { incidentKey: { $in: incidentKeys }, active: true },
      { $set: update }
    );
    res.json({ emailStatus, message: 'Email delivery status recorded.' });
  } catch (error) {
    console.error('Could not record EmailJS delivery status:', error.message);
    res.status(500).json({ message: 'Could not record email delivery status.' });
  }
});

router.post('/alerts/evaluate', emailLimiter, async (req, res) => {
  const { activeAlerts, heatmapPng, deliveryMode = 'smtp' } = req.body || {};
  if (!Array.isArray(activeAlerts) || activeAlerts.length > allowedAlertKeys.size ||
      !activeAlerts.every(validateAlert) ||
      !['smtp', 'emailjs'].includes(deliveryMode)) {
    return res.status(400).json({ message: 'Invalid safety alert payload.' });
  }

  let heatmap;
  try {
    heatmap = parseHeatmap(heatmapPng);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const now = new Date();
  const activeKeys = activeAlerts.map(alert => alert.key);

  try {
    await SafetyIncident.updateMany(
      { active: true, incidentKey: { $nin: activeKeys } },
      { $set: { active: false, resolvedAt: now } }
    );

    const newIncidents = [];
    for (const alert of activeAlerts) {
      const result = await SafetyIncident.findOneAndUpdate(
        { incidentKey: alert.key },
        {
          $set: {
            type: alert.type,
            severity: alert.severity,
            active: true,
            lastOccurredAt: now,
            resolvedAt: null,
            acknowledgedAt: null,
            snapshot: {
              chamberTemperature: finiteOrNull(alert.chamberTemperature),
              minTemperature: finiteOrNull(alert.minTemperature),
              maxTemperature: finiteOrNull(alert.maxTemperature),
              averageTemperature: finiteOrNull(alert.averageTemperature),
              temperatureDifference: finiteOrNull(alert.temperatureDifference),
              threshold: alert.threshold ?? null,
              currentReading: alert.currentReading ?? null,
              recommendedAction: alert.recommendedAction ?? null,
              timestamp: alert.timestamp,
            },
          },
          $setOnInsert: { firstOccurredAt: now },
        },
        { upsert: true, new: false, rawResult: true }
      );

      if (!result.value || result.value.active !== true) {
        newIncidents.push(alert);
      }
    }

    let emailStatus = 'not_needed';
    const mailer = deliveryMode === 'smtp' ? getEmailTransport() : null;
    let emailAlertKeys = [];
    if (newIncidents.length > 0) {
      if (deliveryMode === 'emailjs') {
        const cooldownMs = Number(process.env.SAFETY_ALERT_COOLDOWN_MS || 600000);
        for (const alert of newIncidents) {
          const incident = await SafetyIncident.findOne({ incidentKey: alert.key }).lean();
          const withinCooldown = incident?.lastEmailAttemptAt &&
            now - incident.lastEmailAttemptAt < cooldownMs;
          if (withinCooldown) continue;
          emailAlertKeys.push(alert.key);
          await SafetyIncident.updateOne(
            { incidentKey: alert.key },
            { $set: { lastEmailAttemptAt: now, lastEmailStatus: 'pending' } }
          );
        }
        emailStatus = emailAlertKeys.length > 0 ? 'pending' : 'cooldown';
      } else if (!mailer) {
        emailStatus = 'not_configured';
        await SafetyIncident.updateMany(
          { incidentKey: { $in: newIncidents.map(alert => alert.key) }, active: true },
          { $set: { lastEmailStatus: emailStatus } }
        );
      } else {
        const cooldownMs = Number(process.env.SAFETY_ALERT_COOLDOWN_MS || 600000);
        const eligibleAlerts = [];
        for (const alert of newIncidents) {
          const incident = await SafetyIncident.findOne({ incidentKey: alert.key }).lean();
          const withinCooldown = incident?.lastEmailAttemptAt &&
            now - incident.lastEmailAttemptAt < cooldownMs;
          if (withinCooldown) continue;
          eligibleAlerts.push(alert);
          await SafetyIncident.updateOne(
            { incidentKey: alert.key },
            { $set: { lastEmailAttemptAt: now, lastEmailStatus: 'failed' } }
          );
        }

        if (eligibleAlerts.length === 0) {
          emailStatus = 'cooldown';
        } else {
          const details = eligibleAlerts.map(alert => [
            `${alert.severity.toUpperCase()}: ${alert.type}`,
            `Time: ${new Date(alert.timestamp).toLocaleString()}`,
            `Current reading: ${alert.currentReading || 'Unavailable'}`,
            `Threshold: ${alert.threshold ?? 'Not applicable'}`,
            `Chamber temperature: ${alert.chamberTemperature ?? 'Unavailable'} °C`,
            `Thermal minimum / maximum / average: ${alert.minTemperature ?? 'Unavailable'} / ${alert.maxTemperature ?? 'Unavailable'} / ${alert.averageTemperature ?? 'Unavailable'} °C`,
            `Thermal temperature difference: ${alert.temperatureDifference ?? 'Unavailable'} °C`,
            `Recommended action: ${alert.recommendedAction || 'Inspect the equipment and independently verify safe shutdown.'}`,
          ].join('\n')).join('\n\n');

          try {
            const info = await mailer.sendMail({
              from: process.env.SMTP_FROM,
              to: getRecipient(),
              subject: `[AquaSense] ${eligibleAlerts.length} drying-system safety alert${eligibleAlerts.length === 1 ? '' : 's'}`,
              text: `AquaSense Industrial Monitor\n\n${details}\n\nA heatmap image is attached only when validated thermal data was available.`,
              attachments: heatmap
                ? [{ filename: 'aquasense-thermal-heatmap.png', content: heatmap, contentType: 'image/png' }]
                : [],
            });
            if (!info.accepted?.length) throw new Error('SMTP server did not accept the recipient.');
            emailStatus = 'accepted';
            await SafetyIncident.updateMany(
              { incidentKey: { $in: eligibleAlerts.map(alert => alert.key) }, active: true },
              { $set: { lastEmailStatus: emailStatus } }
            );
          } catch (error) {
            console.error('Safety alert email delivery failed:', error.message);
            emailStatus = 'failed';
            await SafetyIncident.updateMany(
              { incidentKey: { $in: eligibleAlerts.map(alert => alert.key) }, active: true },
              { $set: { lastEmailStatus: emailStatus } }
            );
            return res.status(502).json({
              emailStatus,
              message: 'Safety incidents were recorded, but the email provider did not confirm delivery.',
            });
          }
        }
      }
    }

    res.json({
      emailStatus,
      configured: deliveryMode === 'emailjs' ? null : Boolean(mailer),
      incidentCount: activeAlerts.length,
      emailAlertKeys,
      message: emailStatus === 'pending'
        ? 'Safety incident recorded; EmailJS delivery is pending.'
        : emailStatus === 'accepted'
        ? 'The SMTP provider accepted the safety alert email.'
        : emailStatus === 'not_configured'
          ? 'The safety incident was recorded; email delivery is not configured.'
          : 'Safety incident state was updated.',
    });
  } catch (error) {
    console.error('Error processing safety alerts:', error.message);
    res.status(500).json({ message: 'Could not process safety alerts.' });
  }
});

export default router;
