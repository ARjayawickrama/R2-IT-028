// SensorPage.jsx
// Sensor monitoring for Fish Processing System
// Location: src/pages/MechanicalSaltOptimization/features/SensorPage.jsx

import React, { useState, useEffect } from "react";

const STYLES = `
  .sensor-page {
    padding: 20px;
    background: #f8f9fa;
    min-height: 100vh;
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .sensor-header {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
  }

  .sensor-title {
    font-size: 24px;
    font-weight: 700;
    color: #212529;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sensor-title::before {
    content: "🌡️";
    font-size: 28px;
  }

  .sensor-subtitle {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .sensor-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .sensor-btn {
    padding: 8px 16px;
    border: 1px solid #dee2e6;
    background: white;
    color: #212529;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .sensor-btn:hover {
    background: #f8f9fa;
  }

  .sensor-btn.active {
    background: #0d6efd;
    color: white;
    border-color: #0d6efd;
  }

  .overview-panel {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
  }

  .overview-title {
    font-size: 18px;
    font-weight: 600;
    color: #212529;
    margin-bottom: 16px;
  }

  .overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }

  .overview-stat {
    text-align: center;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .overview-stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #212529;
    margin-bottom: 4px;
  }

  .overview-stat-label {
    font-size: 12px;
    color: #6c757d;
  }

  .sensor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }

  .sensor-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
    position: relative;
  }

  .sensor-card-title {
    font-size: 16px;
    font-weight: 600;
    color: #212529;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sensor-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #198754;
  }

  .sensor-status.warning {
    background: #ffc107;
  }

  .sensor-status.error {
    background: #dc3545;
  }

  .sensor-value {
    font-size: 36px;
    font-weight: 700;
    color: #212529;
    margin-bottom: 8px;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .sensor-unit {
    font-size: 16px;
    font-weight: 400;
    color: #6c757d;
  }

  .sensor-label {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 16px;
  }

  .sensor-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .sensor-metric {
    text-align: center;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .sensor-metric-value {
    font-size: 14px;
    font-weight: 600;
    color: #212529;
    margin-bottom: 2px;
  }

  .sensor-metric-label {
    font-size: 10px;
    color: #6c757d;
  }

  .sensor-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .sensor-trend.up {
    color: #198754;
  }

  .sensor-trend.down {
    color: #dc3545;
  }

  .sensor-trend.stable {
    color: #6c757d;
  }

  .sensor-chart {
    height: 60px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-top: 12px;
    position: relative;
    overflow: hidden;
  }

  .sensor-chart-line {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #0d6efd;
    transform: translateY(0);
  }

  .alerts-panel {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-top: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
  }

  .alerts-title {
    font-size: 18px;
    font-weight: 600;
    color: #212529;
    margin-bottom: 16px;
  }

  .alert-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .alert-icon {
    font-size: 16px;
  }

  .alert-content {
    flex: 1;
  }

  .alert-message {
    font-size: 14px;
    color: #212529;
    margin-bottom: 2px;
  }

  .alert-time {
    font-size: 12px;
    color: #6c757d;
  }

  .alert-severity {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
  }

  .alert-severity.high {
    background: #f8d7da;
    color: #721c24;
  }

  .alert-severity.medium {
    background: #fff3cd;
    color: #856404;
  }

  .alert-severity.low {
    background: #d4edda;
    color: #155724;
  }
`;

export default function SensorPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [sensorData, setSensorData] = useState(null);

  // Mock sensor data
  useEffect(() => {
    const generateMockSensorData = () => ({
      temperature: {
        current: 4.2,
        unit: '°C',
        status: 'normal',
        history: [4.1, 4.2, 4.3, 4.2, 4.1, 4.2, 4.2],
        trend: 'stable'
      },
      humidity: {
        current: 78,
        unit: '%',
        status: 'normal',
        history: [76, 77, 78, 79, 78, 77, 78],
        trend: 'up'
      },
      ph: {
        current: 7.2,
        unit: 'pH',
        status: 'normal',
        history: [7.1, 7.2, 7.3, 7.2, 7.1, 7.2, 7.2],
        trend: 'stable'
      },
      oxygen: {
        current: 8.4,
        unit: 'mg/L',
        status: 'warning',
        history: [8.6, 8.5, 8.4, 8.3, 8.4, 8.5, 8.4],
        trend: 'down'
      },
      salinity: {
        current: 35.2,
        unit: 'ppt',
        status: 'normal',
        history: [35.1, 35.2, 35.3, 35.2, 35.1, 35.2, 35.2],
        trend: 'stable'
      },
      turbidity: {
        current: 2.3,
        unit: 'NTU',
        status: 'normal',
        history: [2.1, 2.2, 2.3, 2.4, 2.3, 2.2, 2.3],
        trend: 'up'
      }
    });

    setSensorData(generateMockSensorData());
  }, []);

  // Real-time sensor data updates
  useEffect(() => {
    if (!autoRefresh || !sensorData) return;
    
    const interval = setInterval(() => {
      setSensorData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const sensor = updated[key];
          const change = (Math.random() - 0.5) * 0.4;
          sensor.current = Math.max(0, sensor.current + change);
          sensor.history = [...sensor.history.slice(1), sensor.current];
          
          // Update trend
          if (sensor.current > sensor.history[sensor.history.length - 2]) {
            sensor.trend = 'up';
          } else if (sensor.current < sensor.history[sensor.history.length - 2]) {
            sensor.trend = 'down';
          } else {
            sensor.trend = 'stable';
          }
        });
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, sensorData]);

  if (!sensorData) {
    return <div className="sensor-page">Loading...</div>;
  }

  const renderSensorCard = (key, sensor) => {
    const min = Math.min(...sensor.history);
    const max = Math.max(...sensor.history);
    const avg = (sensor.history.reduce((a, b) => a + b, 0) / sensor.history.length).toFixed(1);

    return (
      <div className="sensor-card" key={key}>
        <div className="sensor-card-title">
          <div className={`sensor-status ${sensor.status === 'warning' ? 'warning' : sensor.status === 'error' ? 'error' : ''}`}></div>
          {key.charAt(0).toUpperCase() + key.slice(1)} Sensor
        </div>
        
        <div className="sensor-value">
          {sensor.current.toFixed(1)}
          <span className="sensor-unit">{sensor.unit}</span>
        </div>
        
        <div className="sensor-label">Current Reading</div>
        
        <div className="sensor-metrics">
          <div className="sensor-metric">
            <div className="sensor-metric-value">{min.toFixed(1)}</div>
            <div className="sensor-metric-label">Min</div>
          </div>
          <div className="sensor-metric">
            <div className="sensor-metric-value">{max.toFixed(1)}</div>
            <div className="sensor-metric-label">Max</div>
          </div>
          <div className="sensor-metric">
            <div className="sensor-metric-value">{avg}</div>
            <div className="sensor-metric-label">Avg</div>
          </div>
          <div className="sensor-metric">
            <div className="sensor-metric-value">{sensor.history.length}</div>
            <div className="sensor-metric-label">Readings</div>
          </div>
        </div>
        
        <div className={`sensor-trend ${sensor.trend}`}>
          {sensor.trend === 'up' ? '↑' : sensor.trend === 'down' ? '↓' : '→'} {sensor.trend === 'stable' ? 'Stable' : sensor.trend}
        </div>
        
        <div className="sensor-chart">
          <div className="sensor-chart-line"></div>
        </div>
      </div>
    );
  };

  const getOverviewStats = () => {
    const total = Object.keys(sensorData).length;
    const normal = Object.values(sensorData).filter(s => s.status === 'normal').length;
    const warning = Object.values(sensorData).filter(s => s.status === 'warning').length;
    const error = Object.values(sensorData).filter(s => s.status === 'error').length;
    
    return { total, normal, warning, error };
  };

  const stats = getOverviewStats();

  return (
    <>
      <style>{STYLES}</style>
      <div className="sensor-page">
        <div className="sensor-header">
          <h1 className="sensor-title">Sensor Data</h1>
          <p className="sensor-subtitle">Real-time environmental monitoring and sensor data</p>
          <div className="sensor-controls">
            <button className={`sensor-btn ${autoRefresh ? 'active' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)}>
              🔄 Auto Refresh
            </button>
            <button className={`sensor-btn ${realTimeMode ? 'active' : ''}`} onClick={() => setRealTimeMode(!realTimeMode)}>
              📡 Real-time
            </button>
          </div>
        </div>

        <div className="overview-panel">
          <h3 className="overview-title">System Overview</h3>
          <div className="overview-stats">
            <div className="overview-stat">
              <div className="overview-stat-value">{stats.total}</div>
              <div className="overview-stat-label">Total Sensors</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{stats.normal}</div>
              <div className="overview-stat-label">Normal</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{stats.warning}</div>
              <div className="overview-stat-label">Warning</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{stats.error}</div>
              <div className="overview-stat-label">Error</div>
            </div>
          </div>
        </div>

        <div className="sensor-grid">
          {Object.entries(sensorData).map(([key, sensor]) => renderSensorCard(key, sensor))}
        </div>

        <div className="alerts-panel">
          <h3 className="alerts-title">Recent Alerts</h3>
          <div className="alert-item">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <div className="alert-message">Oxygen levels below optimal range</div>
              <div className="alert-time">2 minutes ago</div>
            </div>
            <div className="alert-severity medium">Medium</div>
          </div>
          <div className="alert-item">
            <div className="alert-icon">ℹ️</div>
            <div className="alert-content">
              <div className="alert-message">Temperature sensor calibrated successfully</div>
              <div className="alert-time">15 minutes ago</div>
            </div>
            <div className="alert-severity low">Low</div>
          </div>
          <div className="alert-item">
            <div className="alert-icon">✅</div>
            <div className="alert-content">
              <div className="alert-message">All systems operating normally</div>
              <div className="alert-time">1 hour ago</div>
            </div>
            <div className="alert-severity low">Low</div>
          </div>
        </div>
      </div>
    </>
  );
}
