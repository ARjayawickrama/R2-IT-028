// MechanicalPage.jsx
// Mechanical system controls for Fish Processing System
// Location: src/pages/MechanicalSaltOptimization/features/MechanicalPage.jsx

import React, { useState, useEffect, useRef } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-primary: #F5F6F8;
    --bg-secondary: #FFFFFF;
    --bg-panel: #FAFBFC;
    --bg-inset: #EEF0F4;
    --border-light: #E2E6EC;
    --border-medium: #CDD3DC;
    --border-strong: #A8B2C1;
    --text-primary: #0F1923;
    --text-secondary: #3D4F63;
    --text-muted: #7A8FA6;
    --text-label: #5A6E84;
    --accent-blue: #0B6CF6;
    --accent-blue-light: #3D8BFD;
    --accent-blue-dim: rgba(11,108,246,0.08);
    --accent-green: #0BA870;
    --accent-green-dim: rgba(11,168,112,0.1);
    --accent-amber: #D97706;
    --accent-amber-dim: rgba(217,119,6,0.1);
    --accent-red: #DC2626;
    --accent-red-dim: rgba(220,38,38,0.08);
    --accent-teal: #0891B2;
    --shadow-sm: 0 1px 3px rgba(15,25,35,0.06), 0 1px 2px rgba(15,25,35,0.04);
    --shadow-md: 0 4px 12px rgba(15,25,35,0.08), 0 2px 4px rgba(15,25,35,0.05);
    --shadow-lg: 0 12px 32px rgba(15,25,35,0.1), 0 4px 8px rgba(15,25,35,0.06);
    --shadow-inset: inset 0 1px 3px rgba(15,25,35,0.08);
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 20px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .mech-root {
    background: var(--bg-primary);
    min-height: 100vh;
    font-family: 'Exo 2', sans-serif;
    color: var(--text-primary);
    padding: 28px;
  }

  /* ─── TOP HEADER ──────────────────────────────────────── */
  .mech-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 20px;
  }

  .mech-header-left {
  display: flex;
  align-items: center;
  gap: 18px;
  position: absolute;
  left: 20px;
}
  .mech-logo-box {
    width: 56px;
    height: 56px;
    background: var(--text-primary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    flex-shrink: 0;
    overflow: hidden;
  }

  .mech-logo-box::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
  }

  .mech-logo-svg {
    width: 30px;
    height: 30px;
    fill: none;
    stroke: white;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: gearSpin 8s linear infinite;
  }

  @keyframes gearSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .mech-header-text h1 {
    font-family: 'Rajdhani', sans-serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--text-primary);
    line-height: 1.1;
  }

  .mech-header-text p {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 3px;
    letter-spacing: 0.2px;
  }

  .mech-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .mech-timestamp {
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg-inset);
    border: 1px solid var(--border-light);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    letter-spacing: 0.5px;
  }

  .mech-toggle-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-medium);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-family: 'Exo 2', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mech-toggle-btn:hover {
    border-color: var(--accent-blue);
    color: var(--accent-blue);
    background: var(--accent-blue-dim);
  }

  .mech-toggle-btn.active {
    background: var(--text-primary);
    border-color: var(--text-primary);
    color: white;
  }

  .toggle-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent-green);
  }

  .mech-toggle-btn.active .toggle-dot {
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74,222,128,0.6);
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* ─── OVERVIEW BAND ───────────────────────────────────── */
  .mech-overview {
    display: grid;
    grid-template-columns: repeat(4, 1fr) 2fr;
    gap: 14px;
    margin-bottom: 28px;
    align-items: stretch;
  }

  .overview-kpi {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }

  .overview-kpi:hover {
    box-shadow: var(--shadow-md);
  }

  .overview-kpi::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--kpi-color, var(--accent-blue));
  }

  .kpi-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .kpi-value {
    font-family: 'Rajdhani', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }

  .kpi-sub {
    font-size: 11px;
    color: var(--text-muted);
  }

  .kpi-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 20px;
    margin-top: 2px;
    width: fit-content;
  }

  .kpi-badge.ok { background: var(--accent-green-dim); color: var(--accent-green); }
  .kpi-badge.warn { background: var(--accent-amber-dim); color: var(--accent-amber); }
  .kpi-badge.err { background: var(--accent-red-dim); color: var(--accent-red); }

  /* Efficiency gauge card */
  .overview-gauge-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: 18px 24px;
    display: flex;
    align-items: center;
    gap: 24px;
    box-shadow: var(--shadow-sm);
  }

  .gauge-wrap {
    position: relative;
    flex-shrink: 0;
    width: 90px;
    height: 90px;
  }

  .gauge-svg { width: 90px; height: 90px; }

  .gauge-text {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
  }

  .gauge-pct {
    font-family: 'Rajdhani', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
  }

  .gauge-pct-label {
    font-size: 9px;
    color: var(--text-muted);
    letter-spacing: 0.5px;
  }

  .gauge-info {
    flex: 1;
  }

  .gauge-info-title {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .gauge-bar-row {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .gauge-bar-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .gauge-bar-name {
    font-size: 11px;
    color: var(--text-secondary);
    width: 55px;
    flex-shrink: 0;
  }

  .gauge-bar-track {
    flex: 1;
    height: 5px;
    background: var(--bg-inset);
    border-radius: 3px;
    overflow: hidden;
  }

  .gauge-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.8s ease;
  }

  .gauge-bar-val {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: var(--text-secondary);
    width: 36px;
    text-align: right;
  }

  /* ─── SYSTEMS GRID ────────────────────────────────────── */
  .mech-systems-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 20px;
    margin-bottom: 28px;
  }

  .sys-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s, transform 0.2s;
  }

  .sys-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .sys-card-header {
    padding: 18px 20px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-light);
    background: var(--bg-panel);
    position: relative;
    overflow: hidden;
  }

  .sys-card-header::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--sys-accent, var(--accent-blue));
  }

  .sys-card-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sys-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    background: var(--bg-inset);
    border: 1px solid var(--border-light);
  }

  .sys-name {
    font-family: 'Rajdhani', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--text-primary);
  }

  .sys-id {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 0.5px;
    margin-top: 1px;
  }

  .sys-status-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .sys-status-pill.online { background: var(--accent-green-dim); color: var(--accent-green); }
  .sys-status-pill.warning { background: var(--accent-amber-dim); color: var(--accent-amber); }
  .sys-status-pill.error { background: var(--accent-red-dim); color: var(--accent-red); }
  .sys-status-pill.offline { background: var(--bg-inset); color: var(--text-muted); }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .status-dot.pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }

  /* metrics inside card */
  .sys-card-body {
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sys-metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .sys-metric {
    background: var(--bg-inset);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-sm);
    padding: 12px;
    position: relative;
    overflow: hidden;
    transition: background 0.2s;
  }

  .sys-metric:hover {
    background: #E8ECF2;
  }

  .sys-metric-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .sys-metric-val-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .sys-metric-val {
    font-family: 'Share Tech Mono', monospace;
    font-size: 20px;
    font-weight: 400;
    color: var(--text-primary);
    transition: color 0.3s;
  }

  .sys-metric-unit {
    font-size: 11px;
    color: var(--text-muted);
  }

  .sys-metric-bar {
    height: 3px;
    background: var(--border-light);
    border-radius: 2px;
    margin-top: 8px;
    overflow: hidden;
  }

  .sys-metric-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.8s ease;
  }

  /* trend sparkline mini */
  .sys-metric-trend {
    font-size: 10px;
    margin-top: 3px;
  }

  .trend-up { color: var(--accent-green); }
  .trend-down { color: var(--accent-red); }
  .trend-flat { color: var(--text-muted); }

  /* controls row */
  .sys-card-controls {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 14px 20px 18px;
    border-top: 1px solid var(--border-light);
    background: var(--bg-panel);
  }

  .ctrl-btn {
    padding: 9px 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
    font-family: 'Exo 2', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .ctrl-btn svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }

  .ctrl-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .ctrl-btn.start:hover { border-color: var(--accent-blue); color: var(--accent-blue); background: var(--accent-blue-dim); }
  .ctrl-btn.pause:hover { border-color: var(--accent-amber); color: var(--accent-amber); background: var(--accent-amber-dim); }
  .ctrl-btn.stop:hover { border-color: var(--accent-red); color: var(--accent-red); background: var(--accent-red-dim); }
  .ctrl-btn.reset:hover { border-color: var(--accent-green); color: var(--accent-green); background: var(--accent-green-dim); }
  .ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ─── BOTTOM ROW ──────────────────────────────────────── */
  .mech-bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .mech-perf-card, .mech-alerts-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .card-section-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-panel);
  }

  .card-section-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-section-title svg {
    width: 16px;
    height: 16px;
    stroke: var(--text-muted);
    stroke-width: 1.8;
    fill: none;
  }

  .card-section-badge {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: var(--text-muted);
    background: var(--bg-inset);
    border: 1px solid var(--border-light);
    padding: 3px 8px;
    border-radius: 20px;
  }

  .perf-metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0;
  }

  .perf-metric-cell {
    padding: 20px;
    text-align: center;
    border-right: 1px solid var(--border-light);
    border-bottom: 1px solid var(--border-light);
    transition: background 0.2s;
  }

  .perf-metric-cell:hover { background: var(--bg-panel); }
  .perf-metric-cell:nth-child(2n) { border-right: none; }
  .perf-metric-cell:nth-child(n+3) { border-bottom: none; }

  .perf-val {
    font-family: 'Rajdhani', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 4px;
  }

  .perf-unit {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 400;
  }

  .perf-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
  }

  /* alerts */
  .alerts-list {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .alert-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-light);
    background: var(--bg-panel);
    transition: box-shadow 0.15s;
    cursor: default;
  }

  .alert-row:hover { box-shadow: var(--shadow-sm); }

  .alert-icon-box {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  .alert-icon-box.warn { background: var(--accent-amber-dim); }
  .alert-icon-box.med { background: var(--accent-blue-dim); }
  .alert-icon-box.ok { background: var(--accent-green-dim); }

  .alert-text { flex: 1; }

  .alert-msg {
    font-size: 13px;
    color: var(--text-primary);
    font-weight: 500;
    margin-bottom: 2px;
  }

  .alert-time-stamp {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: var(--text-muted);
  }

  .alert-chip {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .alert-chip.critical { background: var(--accent-red-dim); color: var(--accent-red); }
  .alert-chip.high { background: var(--accent-amber-dim); color: var(--accent-amber); }
  .alert-chip.medium { background: var(--accent-blue-dim); color: var(--accent-blue); }
  .alert-chip.low { background: var(--accent-green-dim); color: var(--accent-green); }

  /* ─── RESPONSIVE ─────────────────────────────────────── */
  @media (max-width: 1100px) {
    .mech-overview {
      grid-template-columns: repeat(2, 1fr);
    }
    .overview-gauge-card {
      grid-column: 1 / -1;
    }
    .mech-bottom {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    .mech-root { padding: 16px; }
    .mech-header { flex-direction: column; }
    .mech-overview { grid-template-columns: repeat(2, 1fr); }
    .sys-card-controls { grid-template-columns: repeat(2, 1fr); }
  }
`;

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconPlay  = () => <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconPause = () => <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const IconStop  = () => <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
const IconReset = () => <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconGear  = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

// ── Gauge SVG ──────────────────────────────────────────────────────────────────
function ArcGauge({ pct, color }) {
  const r = 35, cx = 45, cy = 45;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const fill = arc * (pct / 100);
  const rot  = -225;
  return (
    <svg className="gauge-svg" viewBox="0 0 90 90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-light)" strokeWidth="7"
        strokeDasharray={`${arc} ${circ - arc}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        transform={`rotate(${rot} ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  );
}

// ── System config ──────────────────────────────────────────────────────────────
const SYS_CONFIG = {
  boilingSystem:    { icon: '🔥', label: 'Boiling System',    id: 'SYS-001', accent: 'var(--accent-red)',   barColor: '#ef4444' },
  conveyorSystem:   { icon: '⚡', label: 'Conveyor System',   id: 'SYS-002', accent: 'var(--accent-blue)',  barColor: '#3d8bfd' },
  coolingSystem:    { icon: '❄️', label: 'Cooling System',    id: 'SYS-003', accent: 'var(--accent-teal)',  barColor: '#0891b2' },
  filtrationSystem: { icon: '🌊', label: 'Filtration System', id: 'SYS-004', accent: 'var(--accent-green)', barColor: '#0ba870' },
};

const METRIC_META = {
  temperature: { unit: '°C',    max: 120 },
  pressure:    { unit: ' bar',  max: 20  },
  flowRate:    { unit: ' L/m',  max: 100 },
  speed:       { unit: ' m/s',  max: 5   },
  load:        { unit: '%',     max: 100 },
  power:       { unit: '%',     max: 100 },
  efficiency:  { unit: '%',     max: 100 },
  turbidity:   { unit: ' NTU',  max: 10  },
};

function metaFor(key) {
  for (const [k, v] of Object.entries(METRIC_META)) {
    if (key.toLowerCase().includes(k)) return v;
  }
  return { unit: '', max: 100 };
}

function friendlyKey(key) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MechanicalPage() {
  const [autoRefresh, setAutoRefresh]   = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [controllerData, setControllerData] = useState(null);
  const [time, setTime] = useState(new Date());
  const prevData = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setControllerData({
      boilingSystem:    { status:'online',  temperature:85.2, pressure:12.5, flowRate:45.8, efficiency:92.3 },
      conveyorSystem:   { status:'online',  speed:2.8, load:75.4, temperature:42.1, power:85.7 },
      coolingSystem:    { status:'warning', temperature:4.2, pressure:8.3, flowRate:23.5, efficiency:78.9 },
      filtrationSystem: { status:'online',  pressure:15.2, flowRate:67.8, turbidity:2.3, efficiency:88.4 },
    });
  }, []);

  useEffect(() => {
    if (!autoRefresh || !controllerData) return;
    const iv = setInterval(() => {
      prevData.current = controllerData;
      setControllerData(prev => ({
        ...prev,
        boilingSystem: { ...prev.boilingSystem,
          temperature: clamp(prev.boilingSystem.temperature + rand(), 70, 100),
          efficiency:  clamp(prev.boilingSystem.efficiency  + rand(),  80, 100),
        },
        conveyorSystem: { ...prev.conveyorSystem,
          speed: clamp(prev.conveyorSystem.speed + rand() * 0.3, 1, 5),
          load:  clamp(prev.conveyorSystem.load  + rand() * 3, 50, 100),
        },
        coolingSystem: { ...prev.coolingSystem,
          temperature: clamp(prev.coolingSystem.temperature + rand() * 0.5, 2, 10),
          efficiency:  clamp(prev.coolingSystem.efficiency  + rand() * 2, 70, 100),
        },
      }));
    }, 2500);
    return () => clearInterval(iv);
  }, [autoRefresh, controllerData]);

  if (!controllerData) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Share Tech Mono, monospace', color:'#7A8FA6', fontSize:13, letterSpacing:1 }}>
      INITIALIZING SYSTEMS...
    </div>
  );

  const systems = Object.values(controllerData);
  const online  = systems.filter(s => s.status === 'online').length;
  const warning = systems.filter(s => s.status === 'warning').length;
  const avgEff  = systems.reduce((a, s) => a + (s.efficiency || 0), 0) / systems.length;

  const barItems = Object.entries(controllerData).map(([k, v]) => ({
    name: SYS_CONFIG[k].label.split(' ')[0],
    color: SYS_CONFIG[k].barColor,
    val: v.efficiency ?? v.load ?? v.power ?? 80,
  }));

  return (
    <>
      <style>{STYLES}</style>
      <div className="mech-root">

        {/* ── Header ── */}
        <div className="mech-header">
          <div className="mech-header-left">
            {/* <div className="mech-logo-box">
              <IconGear />
            </div> */}
            {/* <div className="mech-header-text">
              <h1>Mechanical System Controllers</h1>
              <p>Fish Processing Plant · Real-time Monitoring & Control</p>
            </div> */}
          </div>
         <div className="mech-header-right-main">
           <div className="mech-header-right">
            <div className="mech-timestamp">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <button className={`mech-toggle-btn ${autoRefresh ? 'active' : ''}`} onClick={() => setAutoRefresh(x => !x)}>
              <span className="toggle-dot" />
              Auto Refresh
            </button>
            <button className={`mech-toggle-btn ${realTimeMode ? 'active' : ''}`} onClick={() => setRealTimeMode(x => !x)}>
              <span className="toggle-dot" />
              Real-time
            </button>
          </div>
         </div>
        </div>

        {/* ── Overview KPIs ── */}
        <div className="mech-overview">
          <div className="overview-kpi" style={{'--kpi-color':'var(--accent-blue)'}}>
            <div className="kpi-label">Total Systems</div>
            <div className="kpi-value">{Object.keys(controllerData).length}</div>
            <div className="kpi-badge ok">● All Tracked</div>
          </div>
          <div className="overview-kpi" style={{'--kpi-color':'var(--accent-green)'}}>
            <div className="kpi-label">Online</div>
            <div className="kpi-value">{online}</div>
            <div className="kpi-badge ok">● Operational</div>
          </div>
          <div className="overview-kpi" style={{'--kpi-color':'var(--accent-amber)'}}>
            <div className="kpi-label">Warnings</div>
            <div className="kpi-value">{warning}</div>
            <div className="kpi-badge warn">⚠ Attention</div>
          </div>
          <div className="overview-kpi" style={{'--kpi-color':'var(--accent-teal)'}}>
            <div className="kpi-label">Uptime</div>
            <div className="kpi-value">98<span style={{fontSize:18}}>.2%</span></div>
            <div className="kpi-badge ok">● Stable</div>
          </div>
          <div className="overview-gauge-card">
            <div className="gauge-wrap">
              <ArcGauge pct={avgEff} color="#0B6CF6" />
              <div className="gauge-text">
                <div className="gauge-pct">{avgEff.toFixed(0)}</div>
                <div className="gauge-pct-label">%</div>
              </div>
            </div>
            <div className="gauge-info">
              <div className="gauge-info-title">System Efficiency</div>
              <div className="gauge-bar-row">
                {barItems.map(b => (
                  <div className="gauge-bar-item" key={b.name}>
                    <div className="gauge-bar-name">{b.name}</div>
                    <div className="gauge-bar-track">
                      <div className="gauge-bar-fill" style={{ width: `${b.val}%`, background: b.color }} />
                    </div>
                    <div className="gauge-bar-val">{b.val.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── System Cards ── */}
        <div className="mech-systems-grid">
          {Object.entries(controllerData).map(([name, ctrl]) => {
            const cfg = SYS_CONFIG[name] || { icon:'⚙️', label:name, id:'SYS-X', accent:'var(--accent-blue)', barColor:'#3d8bfd' };
            const metrics = Object.entries(ctrl).filter(([k]) => k !== 'status');
            return (
              <div className="sys-card" key={name}>
                <div className="sys-card-header" style={{'--sys-accent': cfg.accent}}>
                  <div className="sys-card-header-left">
                    <div className="sys-icon-box">{cfg.icon}</div>
                    <div>
                      <div className="sys-name">{cfg.label}</div>
                      <div className="sys-id">{cfg.id}</div>
                    </div>
                  </div>
                  <div className={`sys-status-pill ${ctrl.status}`}>
                    <div className={`status-dot ${ctrl.status === 'online' ? 'pulse' : ''}`} />
                    {ctrl.status.toUpperCase()}
                  </div>
                </div>

                <div className="sys-card-body">
                  <div className="sys-metrics-grid">
                    {metrics.map(([key, val]) => {
                      const meta = metaFor(key);
                      const pct  = Math.min(100, (val / meta.max) * 100);
                      const isHot = key.includes('temperature') && val > 80;
                      return (
                        <div className="sys-metric" key={key}>
                          <div className="sys-metric-label">{friendlyKey(key)}</div>
                          <div className="sys-metric-val-row">
                            <div className="sys-metric-val" style={{ color: isHot ? 'var(--accent-red)' : undefined }}>
                              {val.toFixed(1)}
                            </div>
                            <div className="sys-metric-unit">{meta.unit}</div>
                          </div>
                          <div className="sys-metric-bar">
                            <div className="sys-metric-bar-fill" style={{ width:`${pct}%`, background: cfg.barColor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="sys-card-controls">
                  <button className="ctrl-btn start"><IconPlay /><span>Start</span></button>
                  <button className="ctrl-btn pause"><IconPause /><span>Pause</span></button>
                  <button className="ctrl-btn stop"><IconStop /><span>Stop</span></button>
                  <button className="ctrl-btn reset"><IconReset /><span>Reset</span></button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottom Row ── */}
        <div className="mech-bottom">

          {/* Performance */}
          <div className="mech-perf-card">
            <div className="card-section-header">
              <div className="card-section-title">
                <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Performance Metrics
              </div>
              <div className="card-section-badge">LIVE</div>
            </div>
            <div className="perf-metrics-grid">
              {[
                { val:'98.2', unit:'%', label:'System Uptime' },
                { val:'1,247', unit:'', label:'Total Cycles' },
                { val:'45.3', unit:'s', label:'Avg Cycle Time' },
                { val:'12', unit:'', label:'Active Alerts' },
              ].map(m => (
                <div className="perf-metric-cell" key={m.label}>
                  <div className="perf-val">{m.val}<span className="perf-unit">{m.unit}</span></div>
                  <div className="perf-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="mech-alerts-card">
            <div className="card-section-header">
              <div className="card-section-title">
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                System Alerts
              </div>
              <div className="card-section-badge">3 Active</div>
            </div>
            <div className="alerts-list">
              {[
                { icon:'⚠️', cls:'warn', msg:'Cooling system efficiency below optimal range', time:'5 min ago', chip:'high' },
                { icon:'🔧', cls:'med',  msg:'Scheduled maintenance for conveyor system',    time:'2 hrs ago', chip:'medium' },
                { icon:'✅', cls:'ok',   msg:'Boiling system calibration completed',          time:'4 hrs ago', chip:'low' },
              ].map((a, i) => (
                <div className="alert-row" key={i}>
                  <div className={`alert-icon-box ${a.cls}`}>{a.icon}</div>
                  <div className="alert-text">
                    <div className="alert-msg">{a.msg}</div>
                    <div className="alert-time-stamp">{a.time}</div>
                  </div>
                  <div className={`alert-chip ${a.chip}`}>{a.chip.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const rand  = () => (Math.random() - 0.5) * 2;
