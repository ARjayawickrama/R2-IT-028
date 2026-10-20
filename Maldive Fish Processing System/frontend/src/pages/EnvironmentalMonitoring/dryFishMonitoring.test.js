import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMoistureMetrics,
  createSafetyAlerts,
  getThermalStatistics,
  validateThermalGrid,
} from './dryFishMonitoring.js';

test('thermal statistics require exactly 64 finite numeric readings', () => {
  assert.equal(validateThermalGrid(Array(63).fill(30)), false);
  assert.equal(validateThermalGrid([...Array(63).fill(30), Number.NaN]), false);
  assert.equal(validateThermalGrid(Array(64).fill(30)), true);
  assert.deepEqual(getThermalStatistics(Array(64).fill(30)), {
    min: 30,
    max: 30,
    average: 30,
    difference: 0,
  });
});

test('moisture metrics reject unavailable or invalid readings', () => {
  const batch = { initialWeight: 1000, initialMoisture: 78.67, targetMoisture: 20 };
  assert.equal(calculateMoistureMetrics(batch, 0), null);
  assert.equal(calculateMoistureMetrics(batch, Number.NaN), null);
  assert.equal(calculateMoistureMetrics(batch, 1000).complete, false);
});

test('safety alerts use validated 64-pixel data and explicit thresholds', () => {
  const result = createSafetyAlerts({
    mqttConnected: true,
    telemetryReceivedAt: 1000,
    now: 2000,
    chamberTemperature: 51,
    thermalGrid: [...Array(63).fill(30), 52],
    invalidSensors: [],
    highTemperatureThreshold: 50,
    maxTemperatureDifference: 10,
  });
  assert.deepEqual(
    result.alerts.map(alert => alert.key),
    ['high-chamber-temperature', 'high-thermal-pixel', 'uneven-thermal-distribution']
  );
  assert.equal(result.statistics.max, 52);
});
