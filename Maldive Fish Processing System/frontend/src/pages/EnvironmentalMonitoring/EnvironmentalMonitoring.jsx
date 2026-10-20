import React, { useMemo, useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import emailjs from '@emailjs/browser';
import { dryFishService, safetyService } from '../../services/api';
import {
  Scale, 
  Droplets, 
  Timer, 
  CheckCircle, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  FileDown, 
  Fish, 
  Thermometer, 
  Eye, 
  Wifi, 
  WifiOff,
  Flame,
  Fan,
  Activity,
  Bell,
  Check,
  Volume2,
  ShieldAlert
} from 'lucide-react';
import {
  ALERT_EMAIL_COOLDOWN_MS,
  CONTROL_TOPIC,
  DEFAULT_HIGH_TEMPERATURE_C,
  DEFAULT_MAX_TEMPERATURE_DIFFERENCE_C,
  MQTT_BROKER_URL,
  SENSOR_STALE_MS,
  TELEMETRY_TOPIC,
  calculateMoistureMetrics,
  createSafetyAlerts,
  getThermalStatistics,
  isFiniteSensorNumber,
  renderThermalHeatmapPng,
  validateThermalGrid,
} from './dryFishMonitoring.js';

// ── Helpers ────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) {
    return <div className="h-[28px] text-[10px] text-slate-400 flex items-center">Live telemetry sync...</div>;
  }
  const w = 110, h = 28, pad = 3;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const map = {
    drying:   { label: 'DRYING',   bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-500' },
    complete: { label: 'COMPLETE', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    pending:  { label: 'PENDING',  bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400'   },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'drying' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function DryFishMonitor() {
  const TARGET_MOISTURE = 20.0;
  const INITIAL_REF_MOISTURE = 78.67;
  const ALERT_RECIPIENT = 'wickramanju@gmail.com';
  const emailJsConfig = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  };
  const emailJsConfigured = Object.values(emailJsConfig).every(value => typeof value === 'string' && value.length > 0);

  const mqttClientRef = useRef(null);
  const batchesRef = useRef([]);
  const batchSaveTimersRef = useRef(new Map());
  const batchSaveQueuesRef = useRef(new Map());
  const activeCellsRef = useRef({ 1: false, 2: false });
  const pendingCommandsRef = useRef(new Map());
  const previousAlertKeysRef = useRef(null);
  const previousAudioAlertKeysRef = useRef('');
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState('all');
  const [now, setNow] = useState(Date.now());
  const [cell1, setCell1] = useState({ weight: null, active: null });
  const [cell2, setCell2] = useState({ weight: null, active: null });
  const [heaterSSR, setHeaterSSR] = useState(null);
  const [fanStatus, setFanStatus] = useState(null);
  const [safetyInterlockOk, setSafetyInterlockOk] = useState(false);
  const [chamberTemp, setChamberTemp] = useState(null);
  const [thermalMatrix, setThermalMatrix] = useState(null);
  const [lastTelemetryAt, setLastTelemetryAt] = useState(null);
  const [invalidSensors, setInvalidSensors] = useState(['Waiting for sensor telemetry']);
  const [batches, setBatches] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [batchError, setBatchError] = useState('');
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchWeight, setNewBatchWeight] = useState('');
  const [newBatchLoadCell, setNewBatchLoadCell] = useState('1');
  const [startingCells, setStartingCells] = useState([]);
  const [commandStates, setCommandStates] = useState({ 1: 'idle', 2: 'idle' });
  const [highTemperatureThreshold, setHighTemperatureThreshold] = useState(DEFAULT_HIGH_TEMPERATURE_C);
  const [maxTemperatureDifference, setMaxTemperatureDifference] = useState(DEFAULT_MAX_TEMPERATURE_DIFFERENCE_C);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [alertHistoryError, setAlertHistoryError] = useState('');
  const [emailStatus, setEmailStatus] = useState({ status: 'checking', message: 'Checking EmailJS configuration...' });
  const [alertSoundEnabled, setAlertSoundEnabled] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoTelemetry, setDemoTelemetry] = useState(null);
  const [testEmailPending, setTestEmailPending] = useState(false);
  const [isDeletingAllBatches, setIsDeletingAllBatches] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadBatches = async () => {
      try {
        const response = await dryFishService.getBatches();
        if (!isMounted) return;
        const loaded = response.data.map(batch => ({
          ...batch,
          id: batch._id || batch.id,
          moistureTrend: Array.isArray(batch.moistureTrend) ? batch.moistureTrend : [],
        }));
        batchesRef.current = loaded;
        setBatches(loaded);
      } catch (error) {
        console.error('Error loading dry-fish batches:', error);
        if (isMounted) setBatchError('Could not load batches. Confirm the backend and MongoDB are available.');
      } finally {
        if (isMounted) setIsLoadingBatches(false);
      }
    };
    const loadAlertHistory = async () => {
      try {
        const response = await safetyService.getHistory();
        if (isMounted) setAlertHistory(response.data);
      } catch (error) {
        console.error('Error loading alert history:', error);
        if (isMounted) setAlertHistoryError('Could not load alert history.');
      }
    };
    loadBatches();
    loadAlertHistory();
    setEmailStatus({
      status: emailJsConfigured ? 'configured' : 'not_configured',
      message: emailJsConfigured
        ? 'EmailJS is configured for browser-initiated alert delivery.'
        : 'EmailJS is not configured. Set the VITE_EMAILJS variables and restart the frontend.',
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => () => {
    for (const timer of batchSaveTimersRef.current.values()) window.clearTimeout(timer);
    for (const pending of pendingCommandsRef.current.values()) {
      window.clearTimeout(pending.timeout);
      pending.reject(new Error('Dashboard closed before hardware acknowledgement.'));
    }
  }, []);

  const persistBatchUpdate = (batch) => {
    const batchId = batch._id || batch.id;
    if (!batchId) return;

    const oldTimer = batchSaveTimersRef.current.get(batchId);
    if (oldTimer) window.clearTimeout(oldTimer);
    const timer = window.setTimeout(() => {
      batchSaveTimersRef.current.delete(batchId);
      const previous = batchSaveQueuesRef.current.get(batchId) || Promise.resolve();
      const save = previous
        .catch(() => {})
        .then(() => dryFishService.updateBatch(batchId, {
          currentWeight: batch.currentWeight,
          temp: batch.temp,
          moistureTrend: batch.moistureTrend,
          status: batch.status,
        }));
      batchSaveQueuesRef.current.set(batchId, save);
      save.catch(error => {
        console.error(`Could not save live batch ${batchId}:`, error);
        setBatchError('A live batch reading could not be saved to MongoDB.');
      }).finally(() => {
        if (batchSaveQueuesRef.current.get(batchId) === save) {
          batchSaveQueuesRef.current.delete(batchId);
        }
      });
    }, 500);
    batchSaveTimersRef.current.set(batchId, timer);
  };

  const applyHardwareState = (loadCell, isActive) => {
    activeCellsRef.current[loadCell] = isActive;
    if (loadCell === 1) setCell1(previous => ({ ...previous, active: isActive }));
    else setCell2(previous => ({ ...previous, active: isActive }));

    const matchingBatch = batchesRef.current.find(batch =>
      batch.loadCell === loadCell && (batch.status === 'drying' || batch.status === 'pending')
    );
    if (!matchingBatch) return;

    const metrics = calculateMoistureMetrics(matchingBatch, matchingBatch.currentWeight);
    const status = isActive
      ? 'drying'
      : metrics?.complete
        ? 'complete'
        : matchingBatch.status === 'drying'
          ? 'pending'
          : matchingBatch.status;
    if (matchingBatch.status === status) return;

    const updated = { ...matchingBatch, status };
    batchesRef.current = batchesRef.current.map(batch => batch.id === updated.id ? updated : batch);
    setBatches(batchesRef.current);
    persistBatchUpdate(updated);
  };

  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `AquaSense_Dashboard_${crypto.randomUUID()}`,
      clean: true,
      reconnectPeriod: 2500,
      connectTimeout: 10000,
    });
    mqttClientRef.current = client;
    client.on('connect', () => {
      setIsConnected(true);
      client.subscribe(TELEMETRY_TOPIC, { qos: 1 }, error => {
        if (error) {
          console.error('Could not subscribe to AquaSense telemetry:', error.message);
          setInvalidSensors(['MQTT telemetry subscription failed']);
        }
      });
    });
    client.on('reconnect', () => setIsConnected(false));
    client.on('offline', () => setIsConnected(false));
    client.on('close', () => setIsConnected(false));
    client.on('error', error => {
      console.error('AquaSense MQTT connection error:', error.message);
      setIsConnected(false);
    });

    client.on('message', (topic, message) => {
      if (topic !== TELEMETRY_TOPIC) return;
      let telemetry;
      try {
        telemetry = JSON.parse(message.toString());
      } catch (error) {
        console.error('Malformed AquaSense telemetry JSON:', error);
        setInvalidSensors(['Malformed MQTT JSON']);
        return;
      }

      if (!telemetry || typeof telemetry !== 'object' || Array.isArray(telemetry)) {
        setInvalidSensors(['Telemetry payload must be a JSON object']);
        return;
      }

      const errors = [];
      const weights = [telemetry.weight1, telemetry.weight2];
      weights.forEach((weight, index) => {
        if (!isFiniteSensorNumber(weight) || weight < 0) errors.push(`Load Cell ${index + 1} weight invalid or missing`);
      });
      if (!isFiniteSensorNumber(telemetry.chamber_temp)) errors.push('Chamber temperature invalid or missing');
      if (!validateThermalGrid(telemetry.thermal_grid)) errors.push('Thermal array must contain exactly 64 finite numbers');
      if (typeof telemetry.heater_ssr !== 'boolean') errors.push('Heater state missing');
      if (typeof telemetry.fan_status !== 'boolean') errors.push('Fan state missing');
      if (typeof telemetry.safety_interlock_ok !== 'boolean') errors.push('Safety interlock state missing');
      if (typeof telemetry.cell1_drying !== 'boolean') errors.push('Load Cell 1 cycle state missing');
      if (typeof telemetry.cell2_drying !== 'boolean') errors.push('Load Cell 2 cycle state missing');
      setInvalidSensors(errors);

      if (isFiniteSensorNumber(telemetry.weight1) && telemetry.weight1 >= 0) {
        setCell1(previous => ({ ...previous, weight: telemetry.weight1 }));
      }
      if (isFiniteSensorNumber(telemetry.weight2) && telemetry.weight2 >= 0) {
        setCell2(previous => ({ ...previous, weight: telemetry.weight2 }));
      }
      if (isFiniteSensorNumber(telemetry.chamber_temp)) setChamberTemp(telemetry.chamber_temp);
      setThermalMatrix(validateThermalGrid(telemetry.thermal_grid) ? telemetry.thermal_grid : null);
      if (typeof telemetry.heater_ssr === 'boolean') setHeaterSSR(telemetry.heater_ssr);
      if (typeof telemetry.fan_status === 'boolean') setFanStatus(telemetry.fan_status);
      if (typeof telemetry.safety_interlock_ok === 'boolean') setSafetyInterlockOk(telemetry.safety_interlock_ok);

      const coreTelemetryValid = [telemetry.weight1, telemetry.weight2, telemetry.chamber_temp]
        .every(value => isFiniteSensorNumber(value) && value >= 0) &&
        validateThermalGrid(telemetry.thermal_grid);
      if (coreTelemetryValid) setLastTelemetryAt(Date.now());

      if (typeof telemetry.cell1_drying === 'boolean') applyHardwareState(1, telemetry.cell1_drying);
      if (typeof telemetry.cell2_drying === 'boolean') applyHardwareState(2, telemetry.cell2_drying);

      const acknowledgement = telemetry.command_ack;
      if (acknowledgement && typeof acknowledgement.command_id === 'string') {
        const pending = pendingCommandsRef.current.get(acknowledgement.command_id);
        if (pending) {
          window.clearTimeout(pending.timeout);
          pendingCommandsRef.current.delete(acknowledgement.command_id);
          if (acknowledgement.accepted === true) pending.resolve(acknowledgement);
          else pending.reject(new Error(
            typeof acknowledgement.reason === 'string' ? acknowledgement.reason : 'Hardware rejected the command.'
          ));
        }
      }

      const updatedBatches = batchesRef.current.map(batch => {
        const currentWeight = batch.loadCell === 1 ? telemetry.weight1 : telemetry.weight2;
        if (!isFiniteSensorNumber(currentWeight) || currentWeight <= 0) return batch;
        const metrics = calculateMoistureMetrics(batch, currentWeight);
        if (!metrics) return batch;

        const actualActive = batch.loadCell === 1
          ? telemetry.cell1_drying === true
          : telemetry.cell2_drying === true;
        const status = metrics.complete
          ? 'complete'
          : actualActive
            ? 'drying'
            : batch.status === 'drying'
              ? 'pending'
              : batch.status;
        const updated = {
          ...batch,
          currentWeight,
          temp: isFiniteSensorNumber(telemetry.chamber_temp) ? telemetry.chamber_temp : batch.temp,
          status,
          moistureTrend: [...(batch.moistureTrend || []), Number(metrics.moisture.toFixed(1))].slice(-20),
        };
        if (
          updated.currentWeight !== batch.currentWeight ||
          updated.status !== batch.status ||
          updated.temp !== batch.temp ||
          updated.moistureTrend.length !== (batch.moistureTrend || []).length
        ) persistBatchUpdate(updated);
        return updated;
      });
      if (updatedBatches.some((batch, index) => batch !== batchesRef.current[index])) {
        batchesRef.current = updatedBatches;
        setBatches(updatedBatches);
      }
    });

    return () => {
      mqttClientRef.current = null;
      client.end(true);
    };
  }, []);

  const sendHardwareCommand = (loadCell, action) => new Promise((resolve, reject) => {
    const client = mqttClientRef.current;
    if (!client?.connected) {
      reject(new Error('MQTT is offline. No command was sent to the ESP32.'));
      return;
    }
    const commandId = crypto.randomUUID();
    const timeout = window.setTimeout(() => {
      pendingCommandsRef.current.delete(commandId);
      reject(new Error('ESP32 did not acknowledge the command. Hardware state remains unconfirmed.'));
    }, 10_000);
    pendingCommandsRef.current.set(commandId, { resolve, reject, timeout });

    client.publish(CONTROL_TOPIC, JSON.stringify({
      command_id: commandId,
      action,
      load_cell: loadCell,
      issued_at: new Date().toISOString(),
    }), { qos: 1 }, error => {
      if (!error) return;
      window.clearTimeout(timeout);
      pendingCommandsRef.current.delete(commandId);
      reject(error);
    });
  });

  const startDryingCycle = async (loadCell, cellData) => {
    if (cellData.active === true || startingCells.includes(loadCell)) return;
    if (demoMode || !isConnected || !safetyInterlockOk || !sensorFresh) {
      setBatchError('Start is blocked: live mode, fresh telemetry, MQTT, and the ESP32 safety interlock are required.');
      return;
    }
    if (!isFiniteSensorNumber(cellData.weight) || cellData.weight <= 0) {
      setBatchError(`Start is blocked: Load Cell ${loadCell} has no valid positive live weight.`);
      return;
    }

    setStartingCells(current => [...new Set([...current, loadCell])]);
    setCommandStates(current => ({ ...current, [loadCell]: 'pending' }));
    setBatchError('');

    try {
      let batch = batchesRef.current.find(item =>
        item.loadCell === loadCell && item.status === 'pending'
      );
      if (!batch) {
        const initialMoisture = INITIAL_REF_MOISTURE;
        const response = await dryFishService.createBatch({
          name: `Dry Fish Batch - Load Cell ${loadCell}`,
          loadCell,
          initialWeight: cellData.weight,
          currentWeight: cellData.weight,
          temp: isFiniteSensorNumber(chamberTemp) ? chamberTemp : 0,
          quality: 'Grade A',
          initialMoisture,
          targetMoisture: TARGET_MOISTURE,
          moistureTrend: [],
          status: 'pending',
        });
        batch = { ...response.data, id: response.data._id || response.data.id };
        batchesRef.current = [batch, ...batchesRef.current];
        setBatches(batchesRef.current);
      } else {
        const response = await dryFishService.updateBatch(batch.id, {
          initialWeight: cellData.weight,
          currentWeight: cellData.weight,
        });
        batch = { ...batch, ...response.data, id: response.data._id || response.data.id };
        batchesRef.current = batchesRef.current.map(item => item.id === batch.id ? batch : item);
        setBatches(batchesRef.current);
      }

      await sendHardwareCommand(loadCell, 'start_drying');
      setCommandStates(current => ({ ...current, [loadCell]: 'accepted' }));
    } catch (error) {
      console.error(`Could not start Load Cell ${loadCell}:`, error);
      setCommandStates(current => ({ ...current, [loadCell]: 'failed' }));
      setBatchError(error.message || 'Start command failed. Hardware state was not assumed.');
    } finally {
      setStartingCells(current => current.filter(cell => cell !== loadCell));
    }
  };

  const stopDryingCycle = async (loadCell) => {
    setCommandStates(current => ({ ...current, [loadCell]: 'pending' }));
    setBatchError('');
    try {
      await sendHardwareCommand(loadCell, 'stop_drying');
      setCommandStates(current => ({ ...current, [loadCell]: 'accepted' }));
    } catch (error) {
      console.error(`Could not stop Load Cell ${loadCell}:`, error);
      setCommandStates(current => ({ ...current, [loadCell]: 'failed' }));
      setBatchError(error.message || 'Stop command failed. Verify the hardware directly.');
    }
  };

  const toggleCell1 = () => {
    if (demoMode) return setBatchError('Hardware controls are disabled in demo mode.');
    return cell1.active === true ? stopDryingCycle(1) : startDryingCycle(1, cell1);
  };
  const toggleCell2 = () => {
    if (demoMode) return setBatchError('Hardware controls are disabled in demo mode.');
    return cell2.active === true ? stopDryingCycle(2) : startDryingCycle(2, cell2);
  };

  const createPendingBatch = async (event) => {
    event.preventDefault();
    const initialWeight = Number(newBatchWeight);
    if (!newBatchName.trim() || !Number.isFinite(initialWeight) || initialWeight <= 0 || ![1, 2].includes(Number(newBatchLoadCell))) {
      setBatchError('Enter a batch name and an initial weight greater than zero.');
      return;
    }

    setIsCreatingBatch(true);
    setBatchError('');
    try {
      const response = await dryFishService.createBatch({
        name: newBatchName.trim(),
        loadCell: Number(newBatchLoadCell),
        initialWeight,
        currentWeight: initialWeight,
        temp: isFiniteSensorNumber(chamberTemp) ? chamberTemp : 0,
        quality: 'Grade A',
        initialMoisture: INITIAL_REF_MOISTURE,
        targetMoisture: TARGET_MOISTURE,
        moistureTrend: [],
        status: 'pending',
      });
      const batch = { ...response.data, id: response.data._id || response.data.id };
      batchesRef.current = [batch, ...batchesRef.current];
      setBatches(batchesRef.current);
      setNewBatchName('');
      setNewBatchWeight('');
    } catch (error) {
      console.error('Could not create dry-fish batch:', error);
      setBatchError(error.response?.data?.message || 'Could not save the new batch to MongoDB.');
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const removeAllBatches = async () => {
    if (batches.length === 0 || cell1.active === true || cell2.active === true || isDeletingAllBatches) return;
    if (!window.confirm(`Permanently delete all ${batches.length} batches from MongoDB?`)) return;
    setIsDeletingAllBatches(true);
    try {
      await Promise.all(Array.from(batchSaveQueuesRef.current.values(), save => save.catch(() => {})));
      await dryFishService.deleteAllBatches();
      batchSaveTimersRef.current.forEach(timer => window.clearTimeout(timer));
      batchSaveTimersRef.current.clear();
      batchesRef.current = [];
      setBatches([]);
      setFilter('all');
    } catch (error) {
      console.error('Could not remove dry-fish batches:', error);
      setBatchError('Could not remove batches from MongoDB.');
    } finally {
      setIsDeletingAllBatches(false);
    }
  };

  const acknowledgeIncident = async (incidentId) => {
    try {
      const response = await safetyService.acknowledgeIncident(incidentId);
      setAlertHistory(previous => previous.map(incident =>
        incident._id === incidentId ? response.data : incident
      ));
    } catch (error) {
      console.error('Could not acknowledge safety alert:', error);
      setAlertHistoryError('Could not acknowledge alert. Check the backend connection.');
    }
  };

  const sendTestEmail = async () => {
    if (!emailJsConfigured) {
      setEmailStatus({
        status: 'not_configured',
        message: 'EmailJS is not configured. Set the VITE_EMAILJS variables and restart the frontend.',
      });
      return;
    }
    setTestEmailPending(true);
    try {
      await emailjs.send(emailJsConfig.serviceId, emailJsConfig.templateId, {
        to_email: ALERT_RECIPIENT,
        project_name: 'AquaSense Industrial Monitor',
        alert_type: 'Email delivery test',
        severity: 'TEST',
        timestamp: new Date().toLocaleString(),
        current_reading: 'Test message; no sensor reading',
        threshold: 'Not applicable',
        chamber_temperature: 'Unavailable',
        thermal_minimum: 'Unavailable',
        thermal_maximum: 'Unavailable',
        thermal_average: 'Unavailable',
        temperature_difference: 'Unavailable',
        recommended_action: 'This test confirms provider acceptance only. Check the recipient inbox separately.',
        heatmap_image: '',
      }, { publicKey: emailJsConfig.publicKey });
      setEmailStatus({
        status: 'accepted',
        message: 'EmailJS accepted the test message; this does not confirm inbox delivery.',
      });
    } catch (error) {
      console.error('Test email request failed:', error);
      setEmailStatus({
        status: 'failed',
        message: error?.text || 'EmailJS did not confirm acceptance of the test message.',
      });
    } finally {
      setTestEmailPending(false);
    }
  };

  const sendSafetyEmail = async (alerts, heatmapPng) => {
    const alert = alerts[0];
    const templateParams = {
      to_email: ALERT_RECIPIENT,
      project_name: 'AquaSense Industrial Monitor',
      alert_type: alerts.map(item => item.type).join('; '),
      severity: alerts.some(item => item.severity === 'critical') ? 'CRITICAL' : 'WARNING',
      timestamp: new Date(alert.timestamp).toLocaleString(),
      current_reading: alerts.map(item => `${item.type}: ${item.currentReading || 'Unavailable'}`).join('\n'),
      threshold: alerts.map(item => `${item.type}: ${item.threshold ?? 'Not applicable'}`).join('\n'),
      chamber_temperature: alert.chamberTemperature ?? 'Unavailable',
      thermal_minimum: alert.minTemperature ?? 'Unavailable',
      thermal_maximum: alert.maxTemperature ?? 'Unavailable',
      thermal_average: alert.averageTemperature ?? 'Unavailable',
      temperature_difference: alert.temperatureDifference ?? 'Unavailable',
      recommended_action: alerts.map(item => item.recommendedAction || 'Inspect the equipment and independently verify safe shutdown.').join('\n'),
      heatmap_image: heatmapPng || '',
    };
    return emailjs.send(
      emailJsConfig.serviceId,
      emailJsConfig.templateId,
      templateParams,
      { publicKey: emailJsConfig.publicKey }
    );
  };

  const sensorFresh = lastTelemetryAt !== null && now - lastTelemetryAt <= SENSOR_STALE_MS;
  const effectiveSensorFresh = demoMode ? Boolean(demoTelemetry) : sensorFresh;
  const effectiveChamberTemp = demoMode ? demoTelemetry?.chamberTemperature ?? null : chamberTemp;
  const effectiveThermalGrid = demoMode ? demoTelemetry?.thermalGrid ?? null : thermalMatrix;
  const thermalStatistics = useMemo(
    () => effectiveSensorFresh ? getThermalStatistics(effectiveThermalGrid) : null,
    [effectiveThermalGrid, effectiveSensorFresh]
  );
  const effectiveMqttConnected = demoMode ? true : isConnected;
  const safetySnapshot = useMemo(() => demoMode
    ? createSafetyAlerts({
        mqttConnected: true,
        telemetryReceivedAt: demoTelemetry ? now : null,
        now,
        chamberTemperature: effectiveChamberTemp,
        thermalGrid: effectiveThermalGrid,
        invalidSensors: demoTelemetry ? [] : ['Demo data has not been generated'],
        highTemperatureThreshold,
        maxTemperatureDifference,
      })
    : createSafetyAlerts({
        mqttConnected: isConnected,
        telemetryReceivedAt: lastTelemetryAt,
        now,
        chamberTemperature,
        thermalGrid,
        invalidSensors,
        highTemperatureThreshold,
        maxTemperatureDifference,
      }), [
        demoMode, demoTelemetry, now, effectiveChamberTemp, effectiveThermalGrid,
        isConnected, lastTelemetryAt, chamberTemp, thermalMatrix, invalidSensors,
        highTemperatureThreshold, maxTemperatureDifference,
      ]);

  useEffect(() => {
    setActiveAlerts(safetySnapshot.alerts);
  }, [safetySnapshot]);

  const alertKeyString = safetySnapshot.alerts.map(alert => alert.key).sort().join('|');

  useEffect(() => {
    if (demoMode) return undefined;
    const keyString = alertKeyString;
    if (keyString === previousAlertKeysRef.current) return undefined;
    previousAlertKeysRef.current = keyString;
    let cancelled = false;
    const recordAlerts = async () => {
      const heatmapPng = renderThermalHeatmapPng(effectiveThermalGrid, new Date(now).toISOString());
      const recordEmailStatus = async (incidentKeys, status) => {
        try {
          await safetyService.reportEmailStatus(incidentKeys, status);
        } catch (error) {
          console.error('Could not save EmailJS delivery status to MongoDB:', error);
          setAlertHistoryError('Email delivery status could not be saved to the backend.');
        }
      };
      try {
        const response = await safetyService.evaluateAlerts(safetySnapshot.alerts, heatmapPng);
        if (cancelled) return;
        const newlyTriggeredKeys = response.data.emailAlertKeys || [];
        if (newlyTriggeredKeys.length > 0 && !emailJsConfigured) {
          await recordEmailStatus(newlyTriggeredKeys, 'not_configured');
          setEmailStatus({
            status: 'not_configured',
            message: 'Safety incident recorded, but EmailJS is not configured; no alert email was sent.',
          });
        } else if (newlyTriggeredKeys.length > 0) {
          const newlyTriggeredAlerts = safetySnapshot.alerts.filter(alert => newlyTriggeredKeys.includes(alert.key));
          const newlyTriggeredHeatmap = newlyTriggeredAlerts.find(alert => alert.thermalGrid)?.thermalGrid;
          const acceptedKeys = [];
          const failedKeys = [];
          setEmailStatus({ status: 'pending', message: 'Sending safety alert through EmailJS...' });
          try {
            await sendSafetyEmail(
              newlyTriggeredAlerts,
              renderThermalHeatmapPng(newlyTriggeredHeatmap, newlyTriggeredAlerts[0]?.timestamp)
            );
            acceptedKeys.push(...newlyTriggeredKeys);
          } catch (error) {
            console.error('EmailJS did not accept the safety alert email:', error);
            failedKeys.push(...newlyTriggeredKeys);
          }
          if (acceptedKeys.length > 0) {
            await recordEmailStatus(acceptedKeys, 'accepted');
          }
          if (failedKeys.length > 0) {
            await recordEmailStatus(failedKeys, 'failed');
          }
          setEmailStatus({
            status: failedKeys.length === 0 ? 'accepted' : 'failed',
            message: failedKeys.length === 0
              ? `EmailJS accepted ${acceptedKeys.length} safety alert email(s); inbox delivery is not guaranteed.`
              : `EmailJS accepted ${acceptedKeys.length} and failed to accept ${failedKeys.length} safety alert email(s).`,
          });
        } else if (response.data.emailStatus === 'cooldown') {
          setEmailStatus({
            status: 'cooldown',
            message: 'A recently repeated incident is within the email cooldown window.',
          });
        }
        try {
          const history = await safetyService.getHistory();
          if (!cancelled) {
          setAlertHistory(history.data);
          setAlertHistoryError('');
          }
        } catch (error) {
          if (!cancelled) {
            console.error('Could not refresh alert history:', error);
            setAlertHistoryError('Could not update alert history.');
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Safety alert processing was not confirmed:', error);
        setEmailStatus(previous => ({
          ...previous,
          status: error.response?.data?.emailStatus || 'failed',
          message: error.response?.data?.message || 'Backend did not confirm alert processing or email acceptance.',
        }));
        setAlertHistoryError('Could not update alert history.');
      }
    };
    recordAlerts();
    return () => {
      cancelled = true;
    };
  }, [alertKeyString, demoMode]);

  useEffect(() => {
    if (!alertSoundEnabled || activeAlerts.length === 0) {
      if (activeAlerts.length === 0) previousAudioAlertKeysRef.current = '';
      return undefined;
    }
    const activeKeys = activeAlerts.map(alert => alert.key).sort().join('|');
    if (!activeKeys || activeKeys === previousAudioAlertKeysRef.current) return undefined;
    previousAudioAlertKeysRef.current = activeKeys;
    let audioContext;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.25);
      oscillator.onended = () => audioContext.close();
    } catch (error) {
      console.error('Could not play optional safety alert sound:', error);
    }
    return () => {
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    };
  }, [activeAlerts, alertSoundEnabled]);

  const setDemoModeEnabled = (enabled) => {
    setDemoMode(enabled);
    setDemoTelemetry(enabled
      ? { chamberTemperature: 28.5, thermalGrid: Array(64).fill(28.5) }
      : null);
  };

  const triggerDemoTemperatureAlert = () => {
    setDemoTelemetry({
      chamberTemperature: 50,
      thermalGrid: [...Array(63).fill(28.5), 50],
    });
  };

  const exportCsv = () => {
    const rows = [
      ['Batch', 'Load Cell', 'Initial Weight (g)', 'Current Weight (g)', 'Moisture (%)', 'Progress (%)', 'Status'],
      ...batches.map(batch => {
        const metrics = calculateMoistureMetrics(batch, batch.currentWeight);
        return [
          batch.name,
          batch.loadCell,
          batch.initialWeight,
          batch.currentWeight,
          metrics ? metrics.moisture.toFixed(2) : 'Unavailable',
          metrics ? metrics.progress.toFixed(2) : 'Unavailable',
          batch.status,
        ];
      }),
    ];
    const csv = rows.map(row => row.map(value =>
      `"${String(value).replaceAll('"', '""')}"`
    ).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aquasense-batches-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const effectiveCell1 = demoMode ? { weight: 750, active: false } : cell1;
  const effectiveCell2 = demoMode ? { weight: 680, active: false } : cell2;
  const effectiveHeaterSSR = demoMode ? false : effectiveSensorFresh ? heaterSSR : null;
  const effectiveFanStatus = demoMode ? true : effectiveSensorFresh ? fanStatus : null;

  // ── High-Precision Thermal Color Palette ──
  const getThermalStyle = (t) => {
    if (t >= 55) return { bg: '#dc2626', shadow: 'rgba(220, 38, 38, 0.4)', text: '#ffffff' };
    if (t >= 48) return { bg: '#ea580c', shadow: 'rgba(234, 88, 12, 0.4)', text: '#ffffff' };
    if (t >= 42) return { bg: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.35)', text: '#1e293b' };
    if (t >= 36) return { bg: '#eab308', shadow: 'rgba(234, 179, 8, 0.3)', text: '#1e293b' };
    if (t >= 30) return { bg: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.3)', text: '#ffffff' };
    if (t >= 25) return { bg: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.3)', text: '#ffffff' };
    return { bg: '#4f46e5', shadow: 'rgba(79, 70, 229, 0.3)', text: '#ffffff' };
  };

  // Thermal Stats
  const maxThermal = thermalStatistics?.max ?? null;
  const minThermal = thermalStatistics?.min ?? null;
  const avgThermal = thermalStatistics?.average ?? null;
  const temperatureDifference = thermalStatistics?.difference ?? null;

  const moistureBarColor = (mc) => mc <= 15 ? '#10b981' : mc <= 25 ? '#f59e0b' : '#ef4444';

  // Filters
  const dryingList = batches.filter(b => b.status === 'drying');
  const completeList = batches.filter(b => b.status === 'complete');
  const pendingList = batches.filter(b => b.status === 'pending');

  const filteredBatches = 
    filter === 'drying' ? dryingList :
    filter === 'complete' ? completeList :
    filter === 'pending' ? pendingList : batches;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 space-y-6">

      {/* ── Top Header ── */}
      <header className="bg-white border border-slate-200/80 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Fish size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">AquaSense Industrial Monitor</h1>
            <p className="text-xs text-slate-500 font-medium">Dual Load Cell & Industrial Thermal Matrix Telemetry</p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            effectiveHeaterSSR === true ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            <Flame size={13} />
            {effectiveHeaterSSR === null ? 'HEATER: UNKNOWN' : effectiveHeaterSSR ? 'HEATER: ON' : 'HEATER: OFF'}
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            effectiveFanStatus === true ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            <Fan size={13} className={effectiveFanStatus === true ? 'animate-spin' : ''} />
            {effectiveFanStatus === null ? 'FAN: UNKNOWN' : effectiveFanStatus ? 'FAN: ACTIVE' : 'FAN: OFF'}
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
            effectiveMqttConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            {effectiveMqttConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {demoMode ? 'DEMO (SIMULATED)' : effectiveMqttConnected ? 'MQTT Online' : 'MQTT Offline'}
          </div>

          <button onClick={exportCsv} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all">
            <FileDown size={14} /> Export CSV
          </button>
        </div>
      </header>

      <div className={`rounded-2xl border p-4 ${demoMode ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong>{demoMode ? 'DEMO MODE — simulated readings, not connected sensor data.' : 'LIVE HARDWARE MODE'}</strong>
            <p className="mt-1 text-xs opacity-80">
              {demoMode
                ? 'Demo alerts never send emails or commands to hardware.'
                : 'Public HiveMQ is not suitable for confidential or safety-critical telemetry without authenticated access controls.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDemoModeEnabled(!demoMode)} className="rounded-lg border px-3 py-2 text-xs font-bold">
              {demoMode ? 'Return to Live Mode' : 'Enter Demo Mode'}
            </button>
            {demoMode && (
              <button type="button" onClick={triggerDemoTemperatureAlert} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">
                Demo 50°C Alert
              </button>
            )}
          </div>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <section className="space-y-3" aria-live="assertive">
          {activeAlerts.map(alert => (
            <article key={alert.key} className="rounded-2xl border-2 border-red-500 bg-red-50 p-5 text-red-950 shadow-md">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 shrink-0 text-red-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-black">{alert.type}</h2>
                    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">CRITICAL</span>
                  </div>
                  <p className="mt-1 text-sm">{alert.currentReading} · threshold: {alert.threshold ?? 'not applicable'}</p>
                  <p className="mt-1 text-xs">Chamber: {alert.chamberTemperature ?? 'Unavailable'}°C · Min: {alert.minTemperature ?? 'Unavailable'}°C · Max: {alert.maxTemperature ?? 'Unavailable'}°C · Average: {alert.averageTemperature ?? 'Unavailable'}°C · Δ: {alert.temperatureDifference ?? 'Unavailable'}°C</p>
                  <p className="mt-1 text-xs">Detected: {new Date(alert.timestamp).toLocaleString()}</p>
                  <p className="mt-2 text-sm font-semibold">{alert.recommendedAction}</p>
                  {alert.thermalGrid && (
                    <div className="mt-3 grid max-w-md grid-cols-8 gap-1" aria-label="Thermal heatmap included in alert">
                      {alert.thermalGrid.map((value, index) => {
                        const style = getThermalStyle(value);
                        return <span key={index} title={`${value.toFixed(1)}°C`} className="flex aspect-square items-center justify-center rounded text-[9px] font-bold" style={{ backgroundColor: style.bg, color: style.text }}>{value.toFixed(0)}</span>;
                      })}
                    </div>
                  )}
                  {demoMode && <p className="mt-3 text-xs font-black">DEMO ONLY — email notification suppressed.</p>}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 lg:grid-cols-3">
        <div>
          <h2 className="font-bold text-slate-900">Safety thresholds</h2>
          <p className="mt-1 text-xs text-slate-500">Example values only; validate limits for the actual chamber before use.</p>
          <label className="mt-3 block text-xs font-semibold">High temperature (°C)
            <input type="number" value={highTemperatureThreshold} min="1" max="200" step="0.5" onChange={event => {
              const value = Number(event.target.value);
              if (Number.isFinite(value) && value >= 1 && value <= 200) setHighTemperatureThreshold(value);
            }} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="mt-3 block text-xs font-semibold">Maximum thermal difference (°C)
            <input type="number" value={maxTemperatureDifference} min="0.1" max="100" step="0.5" onChange={event => {
              const value = Number(event.target.value);
              if (Number.isFinite(value) && value > 0 && value <= 100) setMaxTemperatureDifference(value);
            }} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Email notification</h2>
          <p className="mt-1 text-xs text-slate-600">Recipient: <strong>{ALERT_RECIPIENT}</strong></p>
          <p className={`mt-2 text-xs font-semibold ${emailStatus.status === 'accepted' || emailStatus.status === 'configured' ? 'text-emerald-700' : emailStatus.status === 'failed' || emailStatus.status === 'not_configured' ? 'text-red-700' : 'text-slate-600'}`}>
            {emailStatus.status.toUpperCase()}: {emailStatus.message}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">EmailJS acceptance does not guarantee inbox delivery. Configure the template's recipient field to use <code>{'{{to_email}}'}</code>.</p>
          <button type="button" onClick={sendTestEmail} disabled={testEmailPending || demoMode || !emailJsConfigured} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            {testEmailPending ? 'Checking delivery...' : 'Send Test Email'}
          </button>
        </div>
        <div>
          <h2 className="font-bold text-slate-900">Sensor status</h2>
          <p className="mt-2 text-xs">MQTT: {demoMode ? 'Demo only' : isConnected ? 'Connected' : 'Disconnected'}</p>
          <p className="text-xs">Telemetry: {demoMode ? 'Simulated' : effectiveSensorFresh ? 'Fresh' : 'Missing or stale'}</p>
          <p className="text-xs">AMG8833: {demoMode ? 'Demo only' : effectiveSensorFresh && validateThermalGrid(thermalMatrix) ? '64 valid pixels' : 'Fault / waiting'}</p>
          <button type="button" onClick={() => setAlertSoundEnabled(value => !value)} className="mt-3 flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">
            <Volume2 size={14} /> {alertSoundEnabled ? 'Disable warning sound' : 'Enable warning sound'}
          </button>
        </div>
      </section>

      {batchError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{batchError}</p>}

      {/* ── Side-by-Side Dual Load Cell Hardware Processing Panels ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[
          { cellNum: 1, cellData: effectiveCell1, toggle: toggleCell1 },
          { cellNum: 2, cellData: effectiveCell2, toggle: toggleCell2 }
        ].map(({ cellNum, cellData, toggle }) => {
          const currentWeight = cellData.weight;
          const batch = batches.find(item => item.loadCell === cellNum && item.status !== 'complete');
          const metrics = effectiveSensorFresh && batch && isFiniteSensorNumber(currentWeight) && currentWeight > 0
            ? calculateMoistureMetrics(batch, currentWeight)
            : null;
          const mc = metrics?.moisture ?? null;
          const prg = metrics?.progress ?? null;
          const dryMatter = batch && isFiniteSensorNumber(batch.initialWeight) && isFiniteSensorNumber(batch.initialMoisture)
            ? (batch.initialWeight * (1 - batch.initialMoisture / 100)).toFixed(1)
            : null;
          const cycleActive = cellData.active === true;

          return (
            <div key={cellNum} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cycleActive ? 'bg-blue-600 animate-ping' : 'bg-slate-300'}`} />
                    <h2 className="text-blue-600 font-black text-sm tracking-wider">LOAD CELL {cellNum}</h2>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                    Target: {TARGET_MOISTURE}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Real-time Moisture */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-1 relative z-10">Moisture Content</p>
                    <h3 className={`text-2xl font-black relative z-10 ${metrics?.complete ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {mc === null ? 'Waiting for sensor data' : <>{mc.toFixed(1)}<span className="text-sm text-slate-400 font-normal ml-0.5">%</span></>}
                    </h3>
                    <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1 relative z-10 font-medium">
                      <Droplets size={11} className="text-blue-500" /> Wet Basis (MCwb)
                    </p>
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-blue-100/60 transition-all duration-300" 
                      style={{ height: mc === null ? '0%' : `${Math.min(100, mc)}%` }}
                    />
                  </div>

                  {/* Live Scale Weight from HX711 */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 flex flex-col justify-center items-center">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Live Scale Reading</p>
                    <h3 className="text-3xl font-black text-slate-900">
                      {effectiveSensorFresh && isFiniteSensorNumber(currentWeight) && currentWeight > 0 ? <>{currentWeight.toFixed(1)}<span className="text-xs text-slate-400 font-normal ml-0.5">g</span></> : 'Waiting'}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-medium">
                      <Scale size={14} /> {batch ? `Initial: ${batch.initialWeight}g` : 'No batch registered'}
                    </div>
                  </div>

                  {/* Process Progress */}
                  <div className={`rounded-2xl border p-4 flex flex-col justify-center ${metrics?.complete ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200/70'}`}>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Process Progress</p>
                    <h3 className={`text-3xl font-black ${metrics?.complete ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {prg === null ? '—' : `${prg.toFixed(0)}%`}
                    </h3>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${prg ?? 0}%` }} />
                    </div>
                    <div className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${metrics?.complete ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {metrics?.complete ? <><CheckCircle size={13} /> SAFE TO STORE</> : <><Timer size={13} className={cycleActive ? 'animate-spin' : ''} /> {cycleActive ? 'DRYING ACTIVE' : 'STANDBY'}</>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <AlertCircle size={14} className="text-blue-600 shrink-0" />
                  <span>Dry Solid Mass: <strong className="text-slate-700">{dryMatter === null ? 'Unavailable' : `${dryMatter}g`}</strong></span>
                </div>
                <button
                  onClick={toggle}
                  disabled={demoMode || startingCells.includes(cellNum) || (!cycleActive && (!effectiveMqttConnected || !safetyInterlockOk || !effectiveSensorFresh || !isFiniteSensorNumber(cellData.weight) || cellData.weight <= 0))}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:border-slate-300 ${
                    cycleActive
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {cycleActive ? <RotateCcw size={14} /> : <Play size={14} />}
                  {cycleActive ? 'Stop Drying Cycle' : startingCells.includes(cellNum) ? 'Waiting for ESP32...' : 'Start Drying Cycle'}
                </button>
                <span className="w-full text-right text-[10px] text-slate-500">Command: {commandStates[cellNum]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DS18B20 Temp Probe & Beautiful AMG8833 Thermal Array Display ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* DS18B20 Chamber Probe */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-500 border border-orange-100">
                <Thermometer size={18} />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">DS18B20 Chamber Temp</h3>
            </div>
            <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-600 px-2.5 py-0.5 rounded-full font-bold">1-Wire Digital</span>
          </div>
          <div className="my-4">
            <div className="text-5xl font-black text-slate-900">{effectiveSensorFresh && isFiniteSensorNumber(effectiveChamberTemp) ? `${effectiveChamberTemp.toFixed(1)}°C` : 'Waiting for sensor data'}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Internal air circulation temperature</p>
          </div>
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex justify-between">
            <span>Alert example: {highTemperatureThreshold}°C</span>
            <span className={`font-bold ${effectiveSensorFresh ? 'text-emerald-600' : 'text-red-600'}`}>{effectiveSensorFresh ? 'Fresh telemetry' : 'Sensor offline/stale'}</span>
          </div>
        </div>

        {/* ── Beautiful Redesigned AMG8833 GridEYE Thermal Array ── */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Thermal Header & Telemetry Metrics */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4 z-10">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                  <Eye size={16} />
                </div>
                <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-2">
                  AMG8833 GridEYE Thermal Camera
                  <span className={`inline-block w-2 h-2 rounded-full ${validateThermalGrid(effectiveThermalGrid) && effectiveSensorFresh ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">8×8 Infrared Focal Plane Array · Real-time Hotspot Tracking</p>
            </div>

            {/* Live Stats Pill Badges */}
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60">
              <div className="px-2.5 py-1 text-center border-r border-slate-700/60">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Min</span>
                <span className="text-xs font-black text-cyan-400">{minThermal === null ? '—' : `${minThermal.toFixed(1)}°C`}</span>
              </div>
              <div className="px-2.5 py-1 text-center border-r border-slate-700/60">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Avg</span>
                <span className="text-xs font-black text-amber-400">{avgThermal === null ? '—' : `${avgThermal.toFixed(1)}°C`}</span>
              </div>
              <div className="px-2.5 py-1 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Max</span>
                <span className="text-xs font-black text-rose-400">{maxThermal === null ? '—' : `${maxThermal.toFixed(1)}°C`}</span>
              </div>
            </div>
          </div>

          {/* Thermal Heatmap Matrix & Palette Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 z-10 my-2">
            
            {/* 8x8 Thermal Pixels Matrix */}
            <div className="p-3 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl">
              {effectiveSensorFresh && validateThermalGrid(effectiveThermalGrid) ? <div className="grid grid-cols-8 gap-1.5">
                {effectiveThermalGrid.map((pixelTemp, idx) => {
                  const style = getThermalStyle(pixelTemp);
                  return (
                    <div
                      key={idx}
                      title={`Pixel ${idx + 1}: ${Number(pixelTemp).toFixed(1)}°C`}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all duration-300 flex items-center justify-center text-[8px] font-black cursor-pointer hover:scale-125 hover:z-20"
                      style={{ 
                        backgroundColor: style.bg,
                        color: style.text,
                        boxShadow: `0 0 10px ${style.shadow}`
                      }}
                    >
                      {Math.round(pixelTemp)}
                    </div>
                  );
                })}
              </div> : <p className="max-w-xs p-8 text-center text-sm font-semibold text-rose-300">Waiting for exactly 64 valid thermal sensor readings.</p>}
            </div>

            {/* Thermal Palette Legend */}
            <div className="flex flex-col justify-center space-y-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                <Activity size={14} className="text-indigo-400" />
                Thermal Calibration Spectrum
              </div>
              
              {/* Visual Gradient Bar */}
              <div className="w-full sm:w-48 h-3 rounded-full bg-gradient-to-r from-indigo-600 via-cyan-400 via-amber-400 via-orange-500 to-rose-600 shadow-inner" />
              
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>&lt; 25°C (Cool)</span>
                <span>35°C</span>
                <span>&gt; 50°C (Hotspot)</span>
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                Hotspot detection algorithm active for uneven surface moisture evaporation.
              </div>
            </div>

          </div>

          <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-3 flex justify-between items-center z-10 mt-2">
            <span>Sensor: Panasonic AMG8833 (I2C 0x69)</span>
            <span className={`font-bold flex items-center gap-1 ${validateThermalGrid(effectiveThermalGrid) && effectiveSensorFresh ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${validateThermalGrid(effectiveThermalGrid) && effectiveSensorFresh ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {effectiveSensorFresh && validateThermalGrid(effectiveThermalGrid) ? '64 Frame Array OK' : 'Sensor fault / stale data'}
            </span>
          </div>

        </div>
      </div>

      {/* ── Real-time Interactive Batch Registry Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <form onSubmit={createPendingBatch} className="grid grid-cols-1 gap-3 border-b border-slate-100 p-5 md:grid-cols-4">
          <input value={newBatchName} onChange={event => setNewBatchName(event.target.value)} required maxLength={100} placeholder="Batch name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="number" min="0.01" step="0.01" value={newBatchWeight} onChange={event => setNewBatchWeight(event.target.value)} required placeholder="Initial weight (g)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select value={newBatchLoadCell} onChange={event => setNewBatchLoadCell(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="1">Assign to Load Cell 1</option>
            <option value="2">Assign to Load Cell 2</option>
          </select>
          <button type="submit" disabled={isCreatingBatch} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            {isCreatingBatch ? 'Saving...' : 'Add Pending Batch'}
          </button>
        </form>

        {/* Category Navigation Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All Batches', count: batches.length },
              { key: 'drying', label: 'Drying', count: dryingList.length },
              { key: 'complete', label: 'Complete', count: completeList.length },
              { key: 'pending', label: 'Pending', count: pendingList.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === tab.key 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  filter === tab.key ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">MongoDB batches ({filteredBatches.length} items)</span>
            <button type="button" onClick={removeAllBatches} disabled={batches.length === 0 || cell1.active === true || cell2.active === true || isDeletingAllBatches} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-40">
              {isDeletingAllBatches ? 'Removing...' : 'Remove All'}
            </button>
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-400 text-xs font-bold">
              No batches currently found under the "{filter.toUpperCase()}" category.
            </div>
          ) : (
            filteredBatches.map(batch => {
              const metrics = calculateMoistureMetrics(batch, batch.currentWeight);
              const mc = metrics?.moisture ?? null;
              const barColor = mc === null ? '#cbd5e1' : moistureBarColor(mc);
              const sparkColor = batch.status === 'complete' ? '#10b981' : batch.status === 'drying' ? '#f59e0b' : '#94a3b8';

              return (
                <div key={batch.id} className="border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{batch.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Batch {batch.id}
                        </p>
                      </div>
                      <StatusBadge status={batch.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-xl text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Weight</p>
                        <p className="text-xs font-bold text-slate-800">{isFiniteSensorNumber(batch.currentWeight) ? `${(batch.currentWeight / 1000).toFixed(2)} kg` : 'Unavailable'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Temp</p>
                        <p className="text-xs font-bold text-slate-800">
                          {batch.temp > 0 ? `${batch.temp}°C` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Quality</p>
                        <p className={`text-xs font-bold ${batch.quality === 'Grade A' ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {batch.quality}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                        <span>Moisture Level</span>
                        <span className="text-slate-700 font-bold">{mc === null ? 'Waiting for valid sensor data' : `${mc.toFixed(1)}%`}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: mc === null ? '0%' : `${Math.min(100, (mc / 80) * 100)}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Moisture Curve</span>
                    <Sparkline data={batch.moistureTrend} color={sparkColor} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Safety alert history</h2>
          {alertHistoryError && <p role="alert" className="mt-2 text-sm text-red-700">{alertHistoryError}</p>}
          {alertHistory.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No recorded safety incidents yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {alertHistory.map(incident => (
                <article key={incident._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="font-bold text-slate-800">{incident.type} {incident.active ? '(ACTIVE)' : '(RESOLVED)'}</p>
                    <p className="text-xs text-slate-500">Last occurred: {new Date(incident.lastOccurredAt).toLocaleString()} · Email: {incident.lastEmailStatus || 'not sent'}</p>
                    <p className="text-xs text-slate-500">Chamber: {incident.snapshot?.chamberTemperature ?? 'Unavailable'}°C · Min / Max: {incident.snapshot?.minTemperature ?? '—'} / {incident.snapshot?.maxTemperature ?? '—'}°C · Δ: {incident.snapshot?.temperatureDifference ?? '—'}°C</p>
                  </div>
                  {incident.acknowledgedAt
                    ? <span className="text-xs font-bold text-emerald-700">Acknowledged</span>
                    : <button type="button" onClick={() => acknowledgeIncident(incident._id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Acknowledge</button>}
                </article>
              ))}
            </div>
          )}
        </section>

      </div>

    </div>
  );
}