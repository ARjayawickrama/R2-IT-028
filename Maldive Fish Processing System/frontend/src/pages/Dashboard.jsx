import React, { useState, useEffect } from 'react';

// Mock chart components (replace with actual imports)
const ProductionChart = ({ data }) => (
  <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 8px' }}>
    {data.datasets[0].data.map((val, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: '100%', background: `linear-gradient(180deg, #2563EB 0%, #93C5FD 100%)`,
          borderRadius: '6px 6px 2px 2px', height: `${val * 1.8}px`,
          transition: 'height 0.6s cubic-bezier(.4,0,.2,1)', opacity: 0.85
        }} />
        <span style={{ fontSize: 9, color: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}>{data.labels[i]}</span>
      </div>
    ))}
  </div>
);

const QualityGauge = ({ data }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 4 }}>
    {data.labels.map((label, i) => (
      <div key={i} style={{ flex: '1 1 calc(50% - 5px)', minWidth: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', fontFamily: 'DM Mono, monospace' }}>
            {data.datasets[0].data[i]}%
          </span>
        </div>
        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99, width: `${data.datasets[0].data[i]}%`,
            background: `linear-gradient(90deg, #2563EB, #60A5FA)`,
            transition: 'width 1s cubic-bezier(.4,0,.2,1)'
          }} />
        </div>
      </div>
    ))}
  </div>
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(97.05);
  const [pulseActive, setPulseActive] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState("24h");
  const [exportFormat, setExportFormat] = useState("csv");

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth(prev => Math.max(85, Math.min(100, prev + (Math.random() - 0.5) * 2)));
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const productionData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [{ label: 'Chamber A', data: [65, 72, 78, 85, 89, 92] }]
  };

  const qualityMetrics = {
    labels: ['Temperature', 'Humidity', 'Salt Content', 'pH Level', 'Processing Time'],
    datasets: [{ data: [92, 88, 95, 90, 87] }]
  };

  const chamberData = [
    { id: 1, name: "Chamber A", temp: 2.4, humidity: 78, status: "active", efficiency: 94, operator: "John Doe" },
    { id: 2, name: "Chamber B", temp: 1.8, humidity: 82, status: "active", efficiency: 88, operator: "Jane Smith" },
    { id: 3, name: "Chamber C", temp: 3.2, humidity: 65, status: "warning", efficiency: 76, operator: "Mike Johnson" },
    { id: 4, name: "Chamber D", temp: 2.1, humidity: 74, status: "maintenance", efficiency: 92, operator: "Sarah Wilson" },
  ];

  const recentActivities = [
    { id: 1, action: "Temperature threshold exceeded", chamber: "Chamber C", time: "5 min ago", severity: "warning" },
    { id: 2, action: "Energy spike detected", chamber: "Chamber B", time: "15 min ago", severity: "info" },
    { id: 3, action: "Maintenance completed", chamber: "Chamber D", time: "1 hour ago", severity: "success" },
    { id: 4, action: "Quality check passed", chamber: "Chamber A", time: "2 hours ago", severity: "success" },
  ];

  const kpis = [
    { value: "2,847", label: "Total Production", unit: "kg", delta: "+12.5%", up: true, icon: "📦", color: "#2563EB", bg: "#EFF6FF" },
    { value: "93.8%", label: "Quality Score", unit: "", delta: "+3.2%", up: true, icon: "✅", color: "#059669", bg: "#ECFDF5" },
    { value: "342", label: "Energy Usage", unit: "kW", delta: "-5.1%", up: false, icon: "⚡", color: "#D97706", bg: "#FFFBEB" },
    { value: "24.5h", label: "Processing Time", unit: "", delta: "+8.7%", up: true, icon: "⏱", color: "#7C3AED", bg: "#F5F3FF" },
  ];

  const statusColors = { active: '#059669', warning: '#D97706', maintenance: '#2563EB' };
  const statusBg = { active: '#ECFDF5', warning: '#FFFBEB', maintenance: '#EFF6FF' };
  const statusText = { active: '#059669', warning: '#D97706', maintenance: '#2563EB' };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .fishgo-root {
      font-family: 'DM Sans', sans-serif;
      background: #F8FAFC;
      min-height: 100vh;
      color: #1E293B;
    }

    /* TOP HEADER */
    .top-header {
      background: #FFFFFF;
      border-bottom: 1.5px solid #E2E8F0;
      padding: 0 32px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 12px rgba(37,99,235,0.06);
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }

    .logo-text {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: #1E293B;
      letter-spacing: -0.3px;
    }

    .logo-text span { color: #2563EB; }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #F1F5F9;
      border-radius: 12px;
      padding: 4px;
    }

    .nav-btn {
      padding: 8px 18px;
      border-radius: 9px;
      border: none;
      background: transparent;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #64748B;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .nav-btn:hover { color: #1E293B; background: rgba(255,255,255,0.7); }

    .nav-btn.active {
      background: #FFFFFF;
      color: #2563EB;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(37,99,235,0.12), 0 1px 3px rgba(0,0,0,0.06);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      width: 36px; height: 36px;
      border-radius: 9px;
      border: 1.5px solid #E2E8F0;
      background: #FFFFFF;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.2s;
      color: #64748B;
    }

    .icon-btn:hover { border-color: #2563EB; color: #2563EB; box-shadow: 0 2px 8px rgba(37,99,235,0.1); }

    .health-badge {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 7px 14px;
      background: #ECFDF5;
      border: 1.5px solid #A7F3D0;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 600;
      color: #059669;
      font-family: 'DM Mono', monospace;
      transition: all 0.3s;
    }

    .health-dot {
      width: 8px; height: 8px;
      background: #059669;
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.8); }
    }

    /* MAIN CONTENT */
    .main-content {
      padding: 28px 32px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* PAGE HEADER */
    .page-header {
      margin-bottom: 28px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
    }

    .page-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.5px;
    }

    .page-subtitle {
      font-size: 14px;
      color: #94A3B8;
      margin-top: 4px;
      font-weight: 400;
    }

    .page-date {
      font-size: 12px;
      color: #94A3B8;
      font-family: 'DM Mono', monospace;
      text-align: right;
    }

    /* SECTION LABEL */
    .section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #94A3B8;
      margin-bottom: 14px;
    }

    /* KPI CARDS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 22px 22px 20px;
      position: relative;
      overflow: hidden;
      transition: all 0.25s ease;
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      border-radius: 18px 18px 0 0;
    }

    .kpi-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(37,99,235,0.1);
      border-color: #BFDBFE;
    }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .kpi-icon-wrap {
      width: 40px; height: 40px;
      border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }

    .kpi-delta {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 9px;
      border-radius: 99px;
      font-family: 'DM Mono', monospace;
    }

    .kpi-value {
      font-family: 'DM Mono', monospace;
      font-size: 30px;
      font-weight: 500;
      color: #0F172A;
      letter-spacing: -1px;
      line-height: 1;
      margin-bottom: 5px;
    }

    .kpi-label {
      font-size: 12px;
      color: #94A3B8;
      font-weight: 500;
    }

    .kpi-corner-deco {
      position: absolute;
      bottom: -12px; right: -12px;
      width: 60px; height: 60px;
      border-radius: 50%;
      opacity: 0.06;
    }

    /* CHARTS ROW */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 22px;
      transition: box-shadow 0.25s;
    }

    .card:hover { box-shadow: 0 8px 24px rgba(37,99,235,0.07); }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #1E293B;
      letter-spacing: -0.2px;
    }

    .card-actions {
      display: flex;
      gap: 6px;
    }

    .chip {
      padding: 4px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
      border: 1.5px solid #E2E8F0;
      background: #F8FAFC;
      color: #64748B;
      cursor: pointer;
      transition: all 0.15s;
    }

    .chip:hover, .chip.active { background: #EFF6FF; border-color: #BFDBFE; color: #2563EB; }

    /* CHAMBERS TABLE */
    .chambers-section { margin-bottom: 24px; }

    .chambers-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .chamber-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 16px;
      padding: 18px;
      transition: all 0.25s;
      position: relative;
      overflow: hidden;
    }

    .chamber-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.07);
    }

    .chamber-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .chamber-name {
      font-size: 13px;
      font-weight: 700;
      color: #1E293B;
    }

    .status-pill {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 99px;
      text-transform: capitalize;
      letter-spacing: 0.3px;
    }

    .chamber-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }

    .metric-item {}
    .metric-val {
      font-family: 'DM Mono', monospace;
      font-size: 18px;
      font-weight: 500;
      color: #0F172A;
    }

    .metric-lbl {
      font-size: 10px;
      color: #94A3B8;
      margin-top: 1px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .efficiency-bar-wrap {
      margin-top: 4px;
    }

    .eff-label-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .eff-label { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }
    .eff-val { font-size: 11px; font-weight: 700; font-family: 'DM Mono', monospace; color: #1E293B; }

    .eff-track {
      height: 5px;
      background: #F1F5F9;
      border-radius: 99px;
      overflow: hidden;
    }

    .eff-fill {
      height: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, #2563EB, #60A5FA);
      transition: width 1.2s cubic-bezier(.4,0,.2,1);
    }

    /* ACTIVITY */
    .activity-list { display: flex; flex-direction: column; }

    .activity-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 0;
      border-bottom: 1px solid #F1F5F9;
    }

    .activity-item:last-child { border-bottom: none; }

    .activity-left { display: flex; align-items: center; gap: 12px; }

    .activity-dot-wrap {
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .activity-dot { width: 8px; height: 8px; border-radius: 50%; }

    .activity-action {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
    }

    .activity-chamber {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 2px;
    }

    .activity-time {
      font-size: 11px;
      color: #CBD5E1;
      font-family: 'DM Mono', monospace;
      white-space: nowrap;
    }

    /* REPORTS */
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .report-card {
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 26px;
      transition: all 0.25s;
      cursor: pointer;
    }

    .report-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(37,99,235,0.1);
      border-color: #BFDBFE;
    }

    .report-icon-wrap {
      width: 48px; height: 48px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      margin-bottom: 16px;
    }

    .report-title {
      font-size: 16px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 6px;
    }

    .report-desc {
      font-size: 13px;
      color: #94A3B8;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .btn-primary {
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
    }

    .btn-blue { background: #2563EB; color: #fff; }
    .btn-blue:hover { background: #1D4ED8; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }

    .btn-green { background: #059669; color: #fff; }
    .btn-green:hover { background: #047857; box-shadow: 0 4px 14px rgba(5,150,105,0.35); }

    .btn-amber { background: #D97706; color: #fff; }
    .btn-amber:hover { background: #B45309; box-shadow: 0 4px 14px rgba(217,119,6,0.35); }

    /* SYSTEM TAB */
    .sys-health-card {
      background: linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%);
      border: 1.5px solid #BFDBFE;
      border-radius: 20px;
      padding: 28px;
      margin-bottom: 20px;
    }

    .health-meter {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .health-circle {
      width: 100px; height: 100px;
      border-radius: 50%;
      background: conic-gradient(#059669 0deg, #059669 calc(3.6deg * 97), #E2E8F0 calc(3.6deg * 97));
      display: flex; align-items: center; justify-content: center;
      position: relative;
      flex-shrink: 0;
    }

    .health-circle-inner {
      width: 78px; height: 78px;
      background: #FFFFFF;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column;
    }

    .health-val {
      font-family: 'DM Mono', monospace;
      font-size: 18px;
      font-weight: 500;
      color: #059669;
    }

    .health-lbl { font-size: 9px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }

    .health-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      flex: 1;
    }

    .health-stat {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 14px;
      border: 1.5px solid #E2E8F0;
    }

    .health-stat-val {
      font-family: 'DM Mono', monospace;
      font-size: 20px;
      font-weight: 500;
      color: #1E293B;
    }

    .health-stat-lbl {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 3px;
    }

    /* MODAL */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(15,23,42,0.4);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: #FFFFFF;
      border-radius: 20px;
      padding: 32px;
      width: 440px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.15);
      border: 1.5px solid #E2E8F0;
    }

    .modal-title {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 24px;
    }

    .form-group { margin-bottom: 16px; }

    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 7px;
    }

    .form-select {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid #E2E8F0;
      border-radius: 11px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: #1E293B;
      background: #F8FAFC;
      outline: none;
      transition: border-color 0.2s;
      appearance: none;
    }

    .form-select:focus { border-color: #2563EB; background: #FFFFFF; }

    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 24px;
    }

    .btn-ghost {
      flex: 1;
      padding: 11px;
      border-radius: 11px;
      border: 1.5px solid #E2E8F0;
      background: #F8FAFC;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #64748B;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-ghost:hover { background: #F1F5F9; color: #1E293B; }

    .btn-confirm {
      flex: 1.5;
      padding: 11px;
      border-radius: 11px;
      border: none;
      background: #2563EB;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-confirm:hover { background: #1D4ED8; box-shadow: 0 4px 14px rgba(37,99,235,0.35); }

    /* DIVIDER */
    .divider {
      height: 1.5px;
      background: linear-gradient(90deg, transparent, #E2E8F0 20%, #E2E8F0 80%, transparent);
      margin: 4px 0 20px;
    }

    @media (max-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .chambers-grid { grid-template-columns: repeat(2, 1fr); }
      .health-stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 720px) {
      .main-content { padding: 16px; }
      .charts-row { grid-template-columns: 1fr; }
      .reports-grid { grid-template-columns: 1fr; }
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .top-header { padding: 0 16px; }
    }
  `;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{css}</style>
      <div className="fishgo-root">

        {/* TOP HEADER */}
        <header className="top-header">
          <div className="logo-area">
            <div className="logo-icon">🐟</div>
           
          </div>

          <nav className="header-nav">
            {[
              { id: 'overview', label: 'Overview', icon: '◈' },
              { id: 'reports', label: 'Reports', icon: '▤' },
              { id: 'system', label: 'System', icon: '⚙' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <div className={`health-badge ${pulseActive ? 'pulse' : ''}`}>
              <div className="health-dot" />
              {systemHealth.toFixed(1)}% Health
            </div>
            <button className="icon-btn" title="Refresh">↻</button>
            <button className="icon-btn" title="Export" onClick={() => setShowExportModal(true)}>↓</button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="main-content">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
            

              {/* KPIs */}
              
              <div className="kpi-grid">
                {kpis.map((k, i) => (
                  <div className="kpi-card" key={i} style={{ '--accent': k.color }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: k.color, borderRadius: '18px 18px 0 0'
                    }} />
                    <div className="kpi-top">
                      <div className="kpi-icon-wrap" style={{ background: k.bg }}>{k.icon}</div>
                      <div className="kpi-delta" style={{
                        background: k.up ? '#ECFDF5' : '#FEF2F2',
                        color: k.up ? '#059669' : '#DC2626'
                      }}>
                        {k.up ? '↑' : '↓'} {k.delta}
                      </div>
                    </div>
                    <div className="kpi-value">{k.value}</div>
                    <div className="kpi-label">{k.label} {k.unit && <span style={{ color: '#CBD5E1', fontSize: 10, fontFamily: 'DM Mono' }}>{k.unit}</span>}</div>
                    <div className="kpi-corner-deco" style={{ background: k.color }} />
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="section-label">Analytics</div>
              <div className="charts-row">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Production Trends</span>
                    <div className="card-actions">
                      <span className="chip active">24h</span>
                      <span className="chip">7d</span>
                      <span className="chip">30d</span>
                    </div>
                  </div>
                  <ProductionChart data={productionData} />
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Quality Metrics</span>
                    <span className="chip">⬇ Export</span>
                  </div>
                  <QualityGauge data={qualityMetrics} />
                </div>
              </div>

              {/* Chambers */}
              <div className="section-label">Chamber Status</div>
              <div className="chambers-grid">
                {chamberData.map(ch => (
                  <div className="chamber-card" key={ch.id}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                      background: statusColors[ch.status], borderRadius: '16px 0 0 16px'
                    }} />
                    <div className="chamber-top" style={{ paddingLeft: 8 }}>
                      <span className="chamber-name">{ch.name}</span>
                      <span className="status-pill" style={{
                        background: statusBg[ch.status],
                        color: statusText[ch.status]
                      }}>{ch.status}</span>
                    </div>
                    <div className="chamber-metrics" style={{ paddingLeft: 8 }}>
                      <div className="metric-item">
                        <div className="metric-val">{ch.temp}°C</div>
                        <div className="metric-lbl">Temperature</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-val">{ch.humidity}%</div>
                        <div className="metric-lbl">Humidity</div>
                      </div>
                    </div>
                    <div style={{ paddingLeft: 8 }}>
                      <div className="efficiency-bar-wrap">
                        <div className="eff-label-row">
                          <span className="eff-label">Efficiency</span>
                          <span className="eff-val">{ch.efficiency}%</span>
                        </div>
                        <div className="eff-track">
                          <div className="eff-fill" style={{ width: `${ch.efficiency}%` }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 8 }}>
                        Op: <span style={{ color: '#94A3B8', fontWeight: 500 }}>{ch.operator}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── REPORTS TAB ── */}
          {activeTab === 'reports' && (
            <>
      
              <div className="divider" />

              <div className="section-label">Report Templates</div>
              <div className="reports-grid">
                {[
                  { icon: '📊', title: 'Production Report', desc: 'Comprehensive production metrics, throughput analysis, and output trends across all chambers.', btnClass: 'btn-blue', bg: '#EFF6FF' },
                  { icon: '✅', title: 'Quality Report', desc: 'Quality control scores, compliance metrics, and parameter deviation tracking.', btnClass: 'btn-green', bg: '#ECFDF5' },
                  { icon: '⚡', title: 'Energy Report', desc: 'Energy consumption patterns, peak usage analysis, and efficiency benchmarks.', btnClass: 'btn-amber', bg: '#FFFBEB' },
                ].map((r, i) => (
                  <div className="report-card" key={i}>
                    <div className="report-icon-wrap" style={{ background: r.bg }}>{r.icon}</div>
                    <div className="report-title">{r.title}</div>
                    <div className="report-desc">{r.desc}</div>
                    <button className={`btn-primary ${r.btnClass}`}>Generate Report</button>
                  </div>
                ))}
              </div>

              {/* Recent Reports */}
              <div style={{ marginTop: 28 }}>
                <div className="section-label">Recent Activity</div>
                <div className="card">
                  <div className="activity-list">
                    {recentActivities.map(a => (
                      <div className="activity-item" key={a.id}>
                        <div className="activity-left">
                          <div className="activity-dot-wrap" style={{
                            background: a.severity === 'success' ? '#ECFDF5' :
                              a.severity === 'warning' ? '#FFFBEB' : '#EFF6FF'
                          }}>
                            <div className="activity-dot" style={{
                              background: a.severity === 'success' ? '#059669' :
                                a.severity === 'warning' ? '#D97706' : '#2563EB'
                            }} />
                          </div>
                          <div>
                            <div className="activity-action">{a.action}</div>
                            <div className="activity-chamber">{a.chamber}</div>
                          </div>
                        </div>
                        <span className="activity-time">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── SYSTEM TAB ── */}
          {activeTab === 'system' && (
            <>
              <div className="page-header">
              
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-primary btn-blue" style={{ width: 'auto', padding: '10px 18px' }}>🔧 Maintenance</button>
                  <button className="btn-primary btn-green" style={{ width: 'auto', padding: '10px 18px', background: '#059669' }}>📊 Diagnostics</button>
                </div>
              </div>
              <div className="divider" />

              {/* Health Overview */}
              <div className="sys-health-card">
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1E293B', marginBottom: 18 }}>Overall System Status</div>
                <div className="health-meter">
                  <div className="health-circle" style={{
                    background: `conic-gradient(#059669 0deg, #059669 ${3.6 * systemHealth}deg, #E2E8F0 ${3.6 * systemHealth}deg)`
                  }}>
                    <div className="health-circle-inner">
                      <div className="health-val">{systemHealth.toFixed(0)}%</div>
                      <div className="health-lbl">Health</div>
                    </div>
                  </div>
                  <div className="health-stats-grid">
                    {[
                      { val: '4/4', lbl: 'Chambers Online', color: '#059669' },
                      { val: '342kW', lbl: 'Power Draw', color: '#D97706' },
                      { val: '0', lbl: 'Critical Alerts', color: '#2563EB' },
                      { val: '18d', lbl: 'Uptime', color: '#7C3AED' },
                    ].map((s, i) => (
                      <div className="health-stat" key={i}>
                        <div className="health-stat-val" style={{ color: s.color }}>{s.val}</div>
                        <div className="health-stat-lbl">{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chamber Health Grid */}
              <div className="section-label">Chamber Health</div>
              <div className="chambers-grid" style={{ marginBottom: 24 }}>
                {chamberData.map(ch => (
                  <div className="chamber-card" key={ch.id}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: statusColors[ch.status], borderRadius: '16px 16px 0 0'
                    }} />
                    <div className="chamber-top">
                      <span className="chamber-name">{ch.name}</span>
                      <span className="status-pill" style={{
                        background: statusBg[ch.status], color: statusText[ch.status]
                      }}>{ch.status}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { lbl: 'Temperature', val: `${ch.temp}°C`, pct: (ch.temp / 5) * 100 },
                        { lbl: 'Humidity', val: `${ch.humidity}%`, pct: ch.humidity },
                        { lbl: 'Efficiency', val: `${ch.efficiency}%`, pct: ch.efficiency },
                      ].map((m, j) => (
                        <div key={j}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.lbl}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#1E293B' }}>{m.val}</span>
                          </div>
                          <div className="eff-track">
                            <div className="eff-fill" style={{ width: `${Math.min(m.pct, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Activity Log */}
              <div className="section-label">Activity Log</div>
              <div className="card">
                <div className="activity-list">
                  {recentActivities.map(a => (
                    <div className="activity-item" key={a.id}>
                      <div className="activity-left">
                        <div className="activity-dot-wrap" style={{
                          background: a.severity === 'success' ? '#ECFDF5' : a.severity === 'warning' ? '#FFFBEB' : '#EFF6FF'
                        }}>
                          <div className="activity-dot" style={{
                            background: a.severity === 'success' ? '#059669' : a.severity === 'warning' ? '#D97706' : '#2563EB'
                          }} />
                        </div>
                        <div>
                          <div className="activity-action">{a.action}</div>
                          <div className="activity-chamber">{a.chamber}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="status-pill" style={{
                          background: a.severity === 'success' ? '#ECFDF5' : a.severity === 'warning' ? '#FFFBEB' : '#EFF6FF',
                          color: a.severity === 'success' ? '#059669' : a.severity === 'warning' ? '#D97706' : '#2563EB'
                        }}>{a.severity}</span>
                        <span className="activity-time">{a.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* EXPORT MODAL */}
        {showExportModal && (
          <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-title">Export Report</div>
              <div className="form-group">
                <label className="form-label">Date Range</label>
                <select className="form-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Export Format</label>
                <select className="form-select" value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                  <option value="csv">CSV Spreadsheet</option>
                  <option value="json">JSON Data</option>
                  <option value="excel">Excel Workbook</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowExportModal(false)}>Cancel</button>
                <button className="btn-confirm" onClick={() => setShowExportModal(false)}>Export Data ↓</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
