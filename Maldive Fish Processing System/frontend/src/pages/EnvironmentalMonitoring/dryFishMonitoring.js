export const MQTT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';
export const TELEMETRY_TOPIC = 'aquasense/fish/telemetry';
export const CONTROL_TOPIC = 'aquasense/fish/control';
export const SENSOR_STALE_MS = 15_000;
export const DEFAULT_HIGH_TEMPERATURE_C = 50;
export const DEFAULT_MAX_TEMPERATURE_DIFFERENCE_C = 10;
export const ALERT_EMAIL_COOLDOWN_MS = 10 * 60 * 1000;

export function isFiniteSensorNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateThermalGrid(grid) {
  return Array.isArray(grid) &&
    grid.length === 64 &&
    grid.every(isFiniteSensorNumber);
}

export function calculateMoistureMetrics(batch, currentWeight) {
  const { initialWeight, initialMoisture, targetMoisture } = batch;
  if (
    !isFiniteSensorNumber(initialWeight) || initialWeight <= 0 ||
    !isFiniteSensorNumber(currentWeight) || currentWeight <= 0 ||
    !isFiniteSensorNumber(initialMoisture) || initialMoisture < 0 || initialMoisture > 100 ||
    !isFiniteSensorNumber(targetMoisture) || targetMoisture < 0 || targetMoisture >= initialMoisture
  ) {
    return null;
  }

  const dryMatter = initialWeight * (1 - initialMoisture / 100);
  const moisture = ((currentWeight - dryMatter) / currentWeight) * 100;
  if (!Number.isFinite(moisture) || moisture < 0 || moisture > 100) return null;

  const progress = Math.max(
    0,
    Math.min(100, ((initialMoisture - moisture) / (initialMoisture - targetMoisture)) * 100)
  );
  return { moisture, progress, complete: moisture <= targetMoisture };
}

export function getThermalStatistics(grid) {
  if (!validateThermalGrid(grid)) return null;
  const min = Math.min(...grid);
  const max = Math.max(...grid);
  const average = grid.reduce((sum, value) => sum + value, 0) / grid.length;
  return { min, max, average, difference: max - min };
}

export function createSafetyAlerts({
  mqttConnected,
  telemetryReceivedAt,
  now,
  chamberTemperature,
  thermalGrid,
  invalidSensors,
  highTemperatureThreshold,
  maxTemperatureDifference,
}) {
  const alerts = [];
  const statistics = getThermalStatistics(thermalGrid);
  const timestamp = new Date(now).toISOString();

  const add = (alert) => alerts.push({
    severity: 'critical',
    timestamp,
    chamberTemperature: isFiniteSensorNumber(chamberTemperature) ? chamberTemperature : null,
    minTemperature: statistics?.min ?? null,
    maxTemperature: statistics?.max ?? null,
    averageTemperature: statistics?.average ?? null,
    temperatureDifference: statistics?.difference ?? null,
    thermalGrid: statistics ? thermalGrid : null,
    ...alert,
  });

  if (!mqttConnected) {
    add({
      key: 'mqtt-disconnected',
      type: 'MQTT disconnected',
      currentReading: 'Broker connection unavailable',
      threshold: null,
      recommendedAction: 'Check network access, broker availability, and device connection.',
    });
  }

  if (telemetryReceivedAt === null || now - telemetryReceivedAt > SENSOR_STALE_MS) {
    add({
      key: 'telemetry-stale',
      type: 'Missing or stale sensor telemetry',
      currentReading: telemetryReceivedAt === null ? 'No telemetry received' : 'Telemetry is stale',
      threshold: `Telemetry within ${SENSOR_STALE_MS / 1000} seconds`,
      recommendedAction: 'Inspect sensor wiring, ESP32 power, MQTT publishing, and the broker connection.',
    });
  }

  if (invalidSensors.length > 0) {
    add({
      key: 'invalid-sensor-data',
      type: 'Invalid sensor data',
      currentReading: invalidSensors.join(', '),
      threshold: 'Finite numeric readings and exactly 64 thermal pixels',
      recommendedAction: 'Inspect sensor output and firmware payload validation before restarting the cycle.',
    });
  }

  if (isFiniteSensorNumber(chamberTemperature) && chamberTemperature > highTemperatureThreshold) {
    add({
      key: 'high-chamber-temperature',
      type: 'High chamber temperature',
      currentReading: `${chamberTemperature.toFixed(1)} °C`,
      threshold: `${highTemperatureThreshold.toFixed(1)} °C`,
      recommendedAction: 'Inspect the chamber and independently verify heater shutdown and temperature controls.',
    });
  }

  if (statistics && statistics.max > highTemperatureThreshold) {
    add({
      key: 'high-thermal-pixel',
      type: 'High thermal pixel temperature',
      currentReading: `${statistics.max.toFixed(1)} °C`,
      threshold: `${highTemperatureThreshold.toFixed(1)} °C`,
      recommendedAction: 'Inspect the hot spot and independently verify heater shutdown and sensor readings.',
    });
  }

  if (statistics && statistics.difference > maxTemperatureDifference) {
    add({
      key: 'uneven-thermal-distribution',
      type: 'Uneven thermal distribution',
      currentReading: `${statistics.difference.toFixed(1)} °C`,
      threshold: `${maxTemperatureDifference.toFixed(1)} °C`,
      recommendedAction: 'Inspect airflow, fan operation, product placement, and chamber sensor calibration.',
    });
  }

  return { alerts, statistics };
}

export function renderThermalHeatmapPng(grid, timestamp) {
  if (!validateThermalGrid(grid) || typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const statistics = getThermalStatistics(grid);
  const left = 56;
  const top = 124;
  const cellSize = 76;
  const min = statistics.min;
  const range = statistics.max - min || 1;

  context.fillStyle = '#0f172a';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f8fafc';
  context.font = 'bold 28px sans-serif';
  context.fillText('AquaSense Industrial Monitor', left, 48);
  context.font = '16px sans-serif';
  context.fillText(`Thermal array · ${new Date(timestamp).toLocaleString()} · °C`, left, 78);

  grid.forEach((temperature, index) => {
    const x = left + (index % 8) * cellSize;
    const y = top + Math.floor(index / 8) * cellSize;
    const ratio = Math.max(0, Math.min(1, (temperature - min) / range));
    const hue = 240 - ratio * 240;
    context.fillStyle = `hsl(${hue}, 85%, 52%)`;
    context.fillRect(x, y, cellSize - 4, cellSize - 4);
    context.fillStyle = '#ffffff';
    context.font = 'bold 16px sans-serif';
    context.textAlign = 'center';
    context.fillText(temperature.toFixed(1), x + (cellSize - 4) / 2, y + 40);
  });

  context.textAlign = 'left';
  context.font = '15px sans-serif';
  context.fillStyle = '#cbd5e1';
  context.fillText(`Min ${statistics.min.toFixed(1)} °C`, left, 526);
  context.fillText(`Avg ${statistics.average.toFixed(1)} °C`, left + 190, 526);
  context.fillText(`Max ${statistics.max.toFixed(1)} °C`, left + 380, 526);
  context.fillText(`Δ ${statistics.difference.toFixed(1)} °C`, left + 570, 526);
  return canvas.toDataURL('image/png');
}
