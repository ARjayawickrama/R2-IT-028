import mongoose from 'mongoose';

const safetyIncidentSchema = new mongoose.Schema(
  {
    incidentKey: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'mqtt-disconnected',
        'telemetry-stale',
        'invalid-sensor-data',
        'high-chamber-temperature',
        'high-thermal-pixel',
        'uneven-thermal-distribution',
      ],
    },
    type: { type: String, required: true },
    severity: { type: String, enum: ['warning', 'critical'], required: true },
    active: { type: Boolean, default: true },
    firstOccurredAt: { type: Date, required: true },
    lastOccurredAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
    acknowledgedAt: { type: Date, default: null },
    lastEmailAttemptAt: { type: Date, default: null },
    lastEmailStatus: {
      type: String,
      enum: ['not_configured', 'pending', 'accepted', 'failed', 'cooldown', null],
      default: null,
    },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

safetyIncidentSchema.index({ active: 1, lastOccurredAt: -1 });

export default mongoose.model('SafetyIncident', safetyIncidentSchema);
