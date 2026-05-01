// MechanicalPage.jsx
// Mechanical system controls for Fish Processing System
// Location: src/pages/MechanicalSaltOptimization/features/MechanicalPage.jsx

import React, { useState, useEffect } from "react";

const STYLES = `
  .mechanical-page {
    padding: 20px;
    background: #f8f9fa;
    min-height: 100vh;
    font-family: 'IBM Plex Sans', sans-serif;
  }

  .mechanical-header {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
  }

  .mechanical-title {
    font-size: 24px;
    font-weight: 700;
    color: #212529;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mechanical-title::before {
    content: "⚙️";
    font-size: 28px;
  }

  .mechanical-subtitle {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .mechanical-controls {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .mechanical-btn {
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

  .mechanical-btn:hover {
    background: #f8f9fa;
  }

  .mechanical-btn.active {
    background: #0d6efd;
    color: white;
    border-color: #0d6efd;
  }

  .system-overview {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    color: white;
  }

  .overview-title {
    font-size: 18px;
    font-weight: 600;
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
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }

  .overview-stat-value {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .overview-stat-label {
    font-size: 12px;
    opacity: 0.9;
  }

  .mechanical-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 24px;
  }

  .mechanical-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
  }

  .mechanical-card-title {
    font-size: 16px;
    font-weight: 600;
    color: #212529;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mechanical-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #198754;
  }

  .mechanical-status.warning {
    background: #ffc107;
  }

  .mechanical-status.error {
    background: #dc3545;
  }

  .mechanical-status.offline {
    background: #6c757d;
  }

  .control-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .control-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .control-label {
    font-size: 14px;
    color: #212529;
    font-weight: 500;
  }

  .control-value {
    font-size: 16px;
    font-weight: 600;
    color: #212529;
  }

  .control-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #dee2e6;
    outline: none;
    cursor: pointer;
  }

  .control-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #0d6efd;
    cursor: pointer;
  }

  .control-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #0d6efd;
    cursor: pointer;
    border: none;
  }

  .control-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 16px;
  }

  .control-btn {
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .control-btn.primary {
    background: #0d6efd;
    color: white;
  }

  .control-btn.primary:hover {
    background: #0b5ed7;
    transform: translateY(-1px);
  }

  .control-btn.danger {
    background: #dc3545;
    color: white;
  }

  .control-btn.danger:hover {
    background: #c82333;
  }

  .control-btn.secondary {
    background: #6c757d;
    color: white;
  }

  .control-btn.secondary:hover {
    background: #5c636a;
  }

  .control-btn.success {
    background: #198754;
    color: white;
  }

  .control-btn.success:hover {
    background: #157347;
  }

  .control-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .performance-metrics {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-top: 24px;
    box-shadow: 0 4px 6px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.1);
    border: 1px solid rgba(0,0,0,.05);
  }

  .metrics-title {
    font-size: 18px;
    font-weight: 600;
    color: #212529;
    margin-bottom: 16px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .metric-card {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    text-align: center;
  }

  .metric-value {
    font-size: 20px;
    font-weight: 700;
    color: #212529;
    margin-bottom: 4px;
  }

  .metric-label {
    font-size: 12px;
    color: #6c757d;
  }

  .alerts-section {
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

  .alert-severity.critical {
    background: #f8d7da;
    color: #721c24;
  }

  .alert-severity.high {
    background: #fff3cd;
    color: #856404;
  }

  .alert-severity.medium {
    background: #d4edda;
    color: #155724;
  }

  .alert-severity.low {
    background: #d1ecf1;
    color: #0c5460;
  }
`;

export default function MechanicalPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [controllerData, setControllerData] = useState(null);

  // Mock controller data
  useEffect(() => {
    const generateMockControllerData = () => ({
      boilingSystem: {
        status: 'online',
        temperature: 85.2,
        pressure: 12.5,
        flowRate: 45.8,
        efficiency: 92.3,
      },
      conveyorSystem: {
        status: 'online',
        speed: 2.8,
        load: 75.4,
        temperature: 42.1,
        power: 85.7,
      },
      coolingSystem: {
        status: 'warning',
        temperature: 4.2,
        pressure: 8.3,
        flowRate: 23.5,
        efficiency: 78.9,
      },
      filtrationSystem: {
        status: 'online',
        pressure: 15.2,
        flowRate: 67.8,
        turbidity: 2.3,
        efficiency: 88.4,
      }
    });

    setControllerData(generateMockControllerData());
  }, []);

  // Real-time controller data updates
  useEffect(() => {
    if (!autoRefresh || !controllerData) return;
    
    const interval = setInterval(() => {
      setControllerData(prev => ({
        ...prev,
        boilingSystem: {
          ...prev.boilingSystem,
          temperature: Math.min(100, Math.max(70, prev.boilingSystem.temperature + (Math.random() - 0.5) * 3)),
          efficiency: Math.min(100, Math.max(80, prev.boilingSystem.efficiency + (Math.random() - 0.5) * 2)),
        },
        conveyorSystem: {
          ...prev.conveyorSystem,
          speed: Math.min(5, Math.max(1, prev.conveyorSystem.speed + (Math.random() - 0.5) * 0.5)),
          load: Math.min(100, Math.max(50, prev.conveyorSystem.load + (Math.random() - 0.5) * 5)),
        },
        coolingSystem: {
          ...prev.coolingSystem,
          temperature: Math.min(10, Math.max(2, prev.coolingSystem.temperature + (Math.random() - 0.5) * 1)),
          efficiency: Math.min(100, Math.max(70, prev.coolingSystem.efficiency + (Math.random() - 0.5) * 3)),
        }
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, [autoRefresh, controllerData]);

  if (!controllerData) {
    return <div className="mechanical-page">Loading...</div>;
  }

  const renderControllerCard = (name, controller) => (
    <div className="mechanical-card" key={name}>
      <div className="mechanical-card-title">
        <div className={`mechanical-status ${controller.status === 'warning' ? 'warning' : controller.status === 'error' ? 'error' : controller.status === 'offline' ? 'offline' : ''}`}></div>
        {name.replace(/([A-Z])/g, ' $1').trim()}
      </div>
      
      <div className="control-panel">
        {Object.entries(controller).filter(([key]) => key !== 'status').map(([key, value]) => (
          <div key={key} className="control-item">
            <span className="control-label">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </span>
            <span className="control-value">
              {typeof value === 'number' ? value.toFixed(1) : value}
              {key.includes('temperature') ? '°C' : key.includes('pressure') ? ' bar' : key.includes('flowRate') ? ' L/min' : key.includes('speed') ? ' m/s' : key.includes('load') || key.includes('efficiency') || key.includes('power') ? '%' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="control-buttons">
        <button className="control-btn primary">
          <span>▶️</span> Start
        </button>
        <button className="control-btn secondary">
          <span>⏸️</span> Pause
        </button>
        <button className="control-btn danger">
          <span>⛔</span> Stop
        </button>
        <button className="control-btn success">
          <span>🔄</span> Reset
        </button>
      </div>
    </div>
  );

  const getSystemOverview = () => {
    const systems = Object.keys(controllerData);
    const online = Object.values(controllerData).filter(s => s.status === 'online').length;
    const warning = Object.values(controllerData).filter(s => s.status === 'warning').length;
    const avgEfficiency = Object.values(controllerData).reduce((sum, s) => sum + (s.efficiency || 0), 0) / systems.length;
    
    return { total: systems.length, online, warning, avgEfficiency };
  };

  const overview = getSystemOverview();

  return (
    <>
      <style>{STYLES}</style>
      <div className="mechanical-page">
        <div className="mechanical-header">
          <h1 className="mechanical-title">Mechanical System Controllers</h1>
          <p className="mechanical-subtitle">Real-time control and monitoring of fish processing mechanical systems</p>
          <div className="mechanical-controls">
            <button className={`mechanical-btn ${autoRefresh ? 'active' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)}>
              🔄 Auto Refresh
            </button>
            <button className={`mechanical-btn ${realTimeMode ? 'active' : ''}`} onClick={() => setRealTimeMode(!realTimeMode)}>
              📡 Real-time
            </button>
          </div>
        </div>

        <div className="system-overview">
          <h3 className="overview-title">System Overview</h3>
          <div className="overview-stats">
            <div className="overview-stat">
              <div className="overview-stat-value">{overview.total}</div>
              <div className="overview-stat-label">Total Systems</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{overview.online}</div>
              <div className="overview-stat-label">Online</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{overview.warning}</div>
              <div className="overview-stat-label">Warning</div>
            </div>
            <div className="overview-stat">
              <div className="overview-stat-value">{overview.avgEfficiency.toFixed(1)}%</div>
              <div className="overview-stat-label">Avg Efficiency</div>
            </div>
          </div>
        </div>

        <div className="mechanical-grid">
          {Object.entries(controllerData).map(([name, controller]) => renderControllerCard(name, controller))}
        </div>

        <div className="performance-metrics">
          <h3 className="metrics-title">Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">98.2%</div>
              <div className="metric-label">System Uptime</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">1,247</div>
              <div className="metric-label">Total Cycles</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">45.3s</div>
              <div className="metric-label">Avg Cycle Time</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">12.4</div>
              <div className="metric-label">Active Alerts</div>
            </div>
          </div>
        </div>

        <div className="alerts-section">
          <h3 className="alerts-title">System Alerts</h3>
          <div className="alert-item">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <div className="alert-message">Cooling system efficiency below optimal range</div>
              <div className="alert-time">5 minutes ago</div>
            </div>
            <div className="alert-severity high">High</div>
          </div>
          <div className="alert-item">
            <div className="alert-icon">🔧</div>
            <div className="alert-content">
              <div className="alert-message">Scheduled maintenance for conveyor system</div>
              <div className="alert-time">2 hours ago</div>
            </div>
            <div className="alert-severity medium">Medium</div>
          </div>
          <div className="alert-item">
            <div className="alert-icon">✅</div>
            <div className="alert-content">
              <div className="alert-message">Boiling system calibration completed</div>
              <div className="alert-time">4 hours ago</div>
            </div>
            <div className="alert-severity low">Low</div>
          </div>
        </div>
      </div>
    </>
  );
}
