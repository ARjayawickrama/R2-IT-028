import React, { useRef, useState, useEffect } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-void: #eef2f7;
    --bg-deep: #ffffff;
    --bg-panel: #f5f7fa;
    --bg-card: #ffffff;
    --bg-hover: #e8eef5;
    --accent-cyan: #0077cc;
    --accent-cyan-dim: rgba(0,119,204,0.08);
    --accent-cyan-glow: rgba(0,119,204,0.2);
    --accent-green: #00a86b;
    --accent-green-dim: rgba(0,168,107,0.1);
    --accent-amber: #d97706;
    --accent-red: #dc2626;
    --accent-red-dim: rgba(220,38,38,0.08);
    --text-primary: #0d1b2a;
    --text-secondary: #3d5a73;
    --text-muted: #90a8be;
    --border: rgba(0,0,0,0.09);
    --border-accent: rgba(0,119,204,0.35);
    --font-display: 'Space Mono', monospace;
    --font-body: 'DM Sans', sans-serif;
  }

  body { background: var(--bg-void); font-family: var(--font-body); color: var(--text-primary); }

  .app-shell {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-void);
    overflow: hidden;
  }

  /* ── Title Bar ── */
  .title-bar {
    height: 44px;
    background: var(--bg-deep);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    flex-shrink: 0;
  }
  .title-bar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .app-logo {
    width: 26px; height: 26px;
    background: var(--accent-cyan);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .app-logo svg { width: 14px; height: 14px; }
  .app-title {
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: 0.15em;
    color: var(--text-primary);
    text-transform: uppercase;
  }
  .title-bar-right {
    display: flex; align-items: center; gap: 20px;
  }
  .sys-indicator {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font-display);
    font-size: 10px;
    color: var(--text-secondary);
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; }
  .dot-green { background: var(--accent-green); box-shadow: 0 0 5px rgba(0,168,107,0.5); animation: pulse 2s infinite; }
  .dot-amber { background: var(--accent-amber); }
  .dot-red { background: var(--accent-red); }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }

  /* ── Menu Bar ── */
  .menu-bar {
    height: 38px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 4px;
    flex-shrink: 0;
  }
  .menu-btn {
    height: 26px;
    padding: 0 12px;
    border-radius: 4px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
    letter-spacing: 0.01em;
  }
  .menu-btn:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border); }
  .menu-btn.primary { background: var(--accent-cyan-dim); color: var(--accent-cyan); border-color: var(--border-accent); }
  .menu-btn.primary:hover { background: rgba(0,212,255,0.2); }
  .menu-btn.danger { background: var(--accent-red-dim); color: var(--accent-red); border-color: rgba(255,69,96,0.3); }
  .menu-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .menu-separator { width: 1px; height: 16px; background: var(--border); margin: 0 6px; }
  .menu-spacer { flex: 1; }
  .badge-live {
    background: var(--accent-green-dim);
    color: var(--accent-green);
    border: 1px solid rgba(0,255,157,0.25);
    font-size: 9px;
    font-family: var(--font-display);
    letter-spacing: 0.12em;
    padding: 2px 7px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  /* ── Main Layout ── */
  .main-layout {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* ── Left Sidebar ── */
  .sidebar {
    width: 260px;
    flex-shrink: 0;
    background: var(--bg-panel);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 2px 0 8px rgba(0,0,0,0.04);
  }
  .sidebar-section {
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  .section-label {
    font-family: var(--font-display);
    font-size: 9px;
    letter-spacing: 0.2em;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  /* Mode Toggle */
  .mode-toggle {
    display: flex;
    background: var(--bg-void);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 3px;
    gap: 2px;
  }
  .mode-btn {
    flex: 1;
    height: 28px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .mode-btn.active { background: var(--bg-card); color: var(--text-primary); }

  /* Upload Zone */
  .upload-zone {
    border: 1px dashed var(--border-accent);
    border-radius: 8px;
    padding: 20px 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--accent-cyan-dim);
    position: relative;
    overflow: hidden;
  }
  .upload-zone:hover { background: rgba(0,212,255,0.18); border-color: var(--accent-cyan); }
  .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .upload-icon { font-size: 22px; margin-bottom: 6px; }
  .upload-text { font-size: 12px; color: var(--accent-cyan); font-weight: 500; }
  .upload-hint { font-size: 10px; color: var(--text-muted); margin-top: 3px; }
  .file-chip {
    margin-top: 8px;
    padding: 6px 10px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 5px;
    font-size: 11px;
    color: var(--text-secondary);
    display: flex; align-items: center; gap: 6px;
    overflow: hidden;
  }
  .file-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Sliders */
  .slider-group { display: flex; flex-direction: column; gap: 14px; }
  .slider-row {}
  .slider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .slider-name { font-size: 11px; color: var(--text-secondary); font-weight: 500; }
  .slider-val {
    font-family: var(--font-display);
    font-size: 11px;
    color: var(--accent-cyan);
    background: var(--accent-cyan-dim);
    border: 1px solid var(--border-accent);
    padding: 1px 6px;
    border-radius: 3px;
    min-width: 38px; text-align: center;
  }
  input[type=range] {
    -webkit-appearance: none;
    width: 100%; height: 3px;
    background: var(--bg-void);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    border: 1px solid var(--border);
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 13px; height: 13px;
    background: var(--accent-cyan);
    border-radius: 50%;
    border: 2px solid var(--bg-panel);
    box-shadow: 0 0 8px var(--accent-cyan-glow);
    cursor: pointer;
  }
  input[type=range]::-moz-range-thumb {
    width: 13px; height: 13px;
    background: var(--accent-cyan);
    border-radius: 50%;
    border: 2px solid var(--bg-panel);
    cursor: pointer;
  }

  /* Presets */
  .preset-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .preset-btn {
    height: 28px;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--font-body);
  }
  .preset-btn:hover { border-color: var(--border-accent); color: var(--accent-cyan); background: var(--accent-cyan-dim); }

  /* Webcam controls */
  .cam-btns { display: flex; flex-direction: column; gap: 6px; }
  .cam-btn {
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--font-body);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .cam-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .cam-btn.active { background: var(--accent-red-dim); color: var(--accent-red); border-color: rgba(255,69,96,0.3); }
  .cam-btn.go { background: var(--accent-cyan-dim); color: var(--accent-cyan); border-color: var(--border-accent); }
  .cam-btn.go:hover { background: rgba(0,212,255,0.2); }

  .sidebar-scroll { flex: 1; overflow-y: auto; }
  .sidebar-scroll::-webkit-scrollbar { width: 4px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* ── Center Viewport ── */
  .viewport {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg-void);
    overflow: hidden;
    position: relative;
  }
  .viewport-header {
    height: 36px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center;
    padding: 0 16px;
    gap: 12px;
    flex-shrink: 0;
  }
  .viewport-label {
    font-family: var(--font-display);
    font-size: 9px;
    letter-spacing: 0.18em;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .viewport-filename { font-size: 11px; color: var(--text-secondary); }
  .viewport-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .empty-state {
    text-align: center;
    user-select: none;
  }
  .empty-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(0,119,204,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,119,204,0.06) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  .empty-crosshair {
    width: 80px; height: 80px;
    position: relative;
    margin: 0 auto 16px;
  }
  .empty-crosshair::before, .empty-crosshair::after {
    content: '';
    position: absolute;
    background: var(--text-muted);
  }
  .empty-crosshair::before { width: 1px; height: 100%; left: 50%; }
  .empty-crosshair::after { height: 1px; width: 100%; top: 50%; }
  .empty-ring {
    position: absolute; inset: 15px;
    border: 1px solid var(--text-muted);
    border-radius: 50%;
  }
  .empty-title { font-size: 13px; color: var(--text-muted); font-weight: 500; }
  .empty-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; opacity: 0.6; }

  .preview-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
  }
  video.preview-video {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  /* Corner decorators */
  .corner { position: absolute; width: 20px; height: 20px; }
  .corner-tl { top: 12px; left: 12px; border-top: 1px solid var(--accent-cyan); border-left: 1px solid var(--accent-cyan); }
  .corner-tr { top: 12px; right: 12px; border-top: 1px solid var(--accent-cyan); border-right: 1px solid var(--accent-cyan); }
  .corner-bl { bottom: 12px; left: 12px; border-bottom: 1px solid var(--accent-cyan); border-left: 1px solid var(--accent-cyan); }
  .corner-br { bottom: 12px; right: 12px; border-bottom: 1px solid var(--accent-cyan); border-right: 1px solid var(--accent-cyan); }

  /* Loading overlay */
  .loading-overlay {
    position: absolute; inset: 0;
    background: rgba(238,242,247,0.75);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px;
    backdrop-filter: blur(2px);
    z-index: 10;
  }
  .loading-ring {
    width: 40px; height: 40px;
    border: 2px solid var(--border);
    border-top-color: var(--accent-cyan);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text {
    font-family: var(--font-display);
    font-size: 10px;
    letter-spacing: 0.15em;
    color: var(--accent-cyan);
    text-transform: uppercase;
    animation: blink 1s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* ── Right Panel ── */
  .results-panel {
    width: 256px;
    flex-shrink: 0;
    background: var(--bg-panel);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: -2px 0 8px rgba(0,0,0,0.04);
  }
  .results-header {
    height: 36px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px;
    flex-shrink: 0;
  }
  .results-scroll {
    flex: 1; overflow-y: auto; padding: 12px;
  }
  .results-scroll::-webkit-scrollbar { width: 4px; }
  .results-scroll::-webkit-scrollbar-track { background: transparent; }
  .results-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 14px; }
  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 10px 8px;
  }
  .stat-label { font-size: 9px; color: var(--text-muted); font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 3px; }
  .stat-value { font-family: var(--font-display); font-size: 18px; color: var(--text-primary); line-height: 1; }
  .stat-value.cyan { color: var(--accent-cyan); }
  .stat-value.green { color: var(--accent-green); }

  /* Detection items */
  .detection-item {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 6px;
    transition: border-color 0.15s;
  }
  .detection-item:hover { border-color: var(--border-accent); }
  .det-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .det-label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  .det-badge {
    font-family: var(--font-display);
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .det-badge.high { background: var(--accent-green-dim); color: var(--accent-green); border: 1px solid rgba(0,255,157,0.25); }
  .det-badge.mid { background: rgba(255,184,0,0.1); color: var(--accent-amber); border: 1px solid rgba(255,184,0,0.25); }
  .det-badge.low { background: var(--accent-red-dim); color: var(--accent-red); border: 1px solid rgba(255,69,96,0.25); }
  .conf-bar { height: 3px; background: var(--bg-void); border-radius: 2px; overflow: hidden; }
  .conf-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
  .det-coords { font-family: var(--font-display); font-size: 9px; color: var(--text-muted); margin-top: 5px; }

  /* Chart area */
  .chart-section { margin-top: 14px; }
  .chart-label {
    font-family: var(--font-display);
    font-size: 9px;
    letter-spacing: 0.18em;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  canvas { width: 100% !important; }

  /* Error banner */
  .error-banner {
    display: flex; align-items: center; gap: 8px;
    background: var(--accent-red-dim);
    border: 1px solid rgba(255,69,96,0.3);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 11px;
    color: var(--accent-red);
    margin-bottom: 10px;
  }

  /* ── Status Bar ── */
  .status-bar {
    height: 26px;
    background: var(--bg-deep);
    border-top: 1px solid var(--border);
    display: flex; align-items: center;
    padding: 0 16px;
    gap: 20px;
    flex-shrink: 0;
  }
  .status-item {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font-display);
    font-size: 9px;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }
  .status-item.active { color: var(--accent-cyan); }
  .status-item.warn { color: var(--accent-amber); }
  .status-spacer { flex: 1; }

  /* ── Modal ── */
  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(13,27,42,0.35);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }
  .modal {
    width: 420px;
    max-height: 80vh;
    background: var(--bg-deep);
    border: 1px solid var(--border-accent);
    border-radius: 10px;
    overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  }
  .modal-header {
    height: 46px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 18px;
    flex-shrink: 0;
  }
  .modal-title { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.15em; color: var(--text-primary); text-transform: uppercase; }
  .modal-close {
    width: 24px; height: 24px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 14px;
    display: flex; align-items: center; justify-content: center;
  }
  .modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }
  .modal-body { flex: 1; overflow-y: auto; padding: 18px; }
  .modal-body::-webkit-scrollbar { width: 4px; }
  .modal-body::-webkit-scrollbar-track { background: transparent; }
  .modal-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .modal-footer {
    height: 52px;
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: flex-end;
    padding: 0 18px; gap: 8px;
    flex-shrink: 0;
  }
  .modal-btn {
    height: 30px; padding: 0 16px;
    border-radius: 5px;
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 12px; font-weight: 500;
    cursor: pointer; font-family: var(--font-body);
    transition: all 0.15s;
  }
  .modal-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .modal-btn.primary { background: var(--accent-cyan-dim); color: var(--accent-cyan); border-color: var(--border-accent); }
  .modal-btn.primary:hover { background: rgba(0,212,255,0.2); }

  .help-section { margin-bottom: 20px; }
  .help-section-title { font-family: var(--font-display); font-size: 10px; letter-spacing: 0.15em; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 8px; }
  .help-list { list-style: none; display: flex; flex-direction: column; gap: 5px; }
  .help-list li { font-size: 12px; color: var(--text-secondary); padding-left: 12px; position: relative; }
  .help-list li::before { content: '›'; position: absolute; left: 0; color: var(--text-muted); }
  .help-list li strong { color: var(--text-primary); }

  /* History sidebar */
  .history-float {
    position: fixed; right: 272px; top: 130px;
    width: 200px;
    background: var(--bg-panel);
    border: 1px solid var(--border-accent);
    border-radius: 8px;
    overflow: hidden;
    z-index: 50;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  }
  .history-header {
    height: 32px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center;
    padding: 0 12px;
  }
  .history-list { max-height: 280px; overflow-y: auto; padding: 8px; }
  .history-item {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 7px 9px;
    margin-bottom: 5px;
  }
  .history-time { font-size: 9px; color: var(--text-muted); font-family: var(--font-display); }
  .history-count { font-size: 11px; color: var(--text-primary); font-weight: 500; margin: 2px 0 5px; }
  .history-actions { display: flex; gap: 4px; }
  .hist-btn {
    flex: 1; height: 20px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: transparent;
    color: var(--text-muted);
    font-size: 9px;
    cursor: pointer; font-family: var(--font-display);
    letter-spacing: 0.05em;
    transition: all 0.1s;
  }
  .hist-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
  .hist-btn.del:hover { color: var(--accent-red); border-color: rgba(255,69,96,0.3); }
`;

export default function FishDetectionApp() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("upload");
  const [stream, setStream] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [thresholds, setThresholds] = useState({ confidence: 0.6, overlap: 0.5, opacity: 0.8 });
  const [autoDetectMode, setAutoDetectMode] = useState(false);
  const [autoDetectInterval, setAutoDetectInterval] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  const API_URL = "http://localhost:8000/predict";

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => () => { stopWebcam(); }, []);

  useEffect(() => {
    if (autoDetectMode && webcamActive) {
      const iv = setInterval(() => captureFrame(true), 3000);
      setAutoDetectInterval(iv);
      return () => clearInterval(iv);
    } else {
      if (autoDetectInterval) { clearInterval(autoDetectInterval); setAutoDetectInterval(null); }
    }
  }, [autoDetectMode, webcamActive]);

  useEffect(() => {
    const saved = localStorage.getItem('fishDetSettings');
    if (saved) { try { setThresholds(JSON.parse(saved)); } catch {} }
  }, []);

  const processImage = async (file) => {
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("confidence_threshold", thresholds.confidence);
      fd.append("overlap_threshold", thresholds.overlap);
      fd.append("opacity_threshold", thresholds.opacity);
      const res = await fetch(API_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data);
      setTimeout(() => renderChart(data), 200);
    } catch { setError("Cannot connect to backend  ·  localhost:8000"); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) { setSelectedFile(f); setFileName(f.name); setResults(null); setError(""); }
  };

  const handleDetect = () => {
    if (!selectedFile) { setError("No image selected"); return; }
    processImage(selectedFile);
  };

  const startWebcam = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = ms;
      setStream(ms); setWebcamActive(true);
    } catch { setError("Webcam access denied"); }
  };

  const stopWebcam = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null); setWebcamActive(false); setAutoDetectMode(false);
  };

  const captureFrame = (isAuto = false) => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const f = new File([blob], `${isAuto ? 'auto' : 'manual'}_${ts}.jpg`, { type: "image/jpeg" });
      setFileName(f.name);
      processImage(f);
    });
  };

  const renderChart = (data) => {
    if (!data?.detections || !chartRef.current) return;
    const labels = data.detections.map((d, i) => `${d.label} ${i+1}`);
    const values = data.detections.map(d => +(d.confidence * 100).toFixed(1));
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new (window.Chart || require('chart.js/auto'))(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Confidence %",
          data: values,
          backgroundColor: values.map(v => v >= 70 ? 'rgba(0,168,107,0.2)' : v >= 40 ? 'rgba(217,119,6,0.18)' : 'rgba(220,38,38,0.15)'),
          borderColor: values.map(v => v >= 70 ? '#00a86b' : v >= 40 ? '#d97706' : '#dc2626'),
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#3d5a73', font: { size: 9, family: 'Space Mono' } }, grid: { color: 'rgba(0,0,0,0.05)' } },
          y: {
            ticks: { color: '#3d5a73', font: { size: 9, family: 'Space Mono' } },
            grid: { color: 'rgba(0,0,0,0.05)' },
            min: 0, max: 100
          },
        },
      },
    });
  };

  const handleCapture = () => {
    if (!results) return;
    const c = { id: Date.now(), timestamp: new Date().toLocaleString(), image: results.annotated_image_base64, detections: results.detections };
    setCaptureHistory(prev => [c, ...prev].slice(0, 10));
  };

  const handleExport = (c) => {
    const a = document.createElement('a');
    a.href = `data:image/jpeg;base64,${c.image}`;
    a.download = `fish_det_${c.id}.jpg`;
    a.click();
  };

  const getBadgeClass = (conf) => conf >= 0.7 ? 'high' : conf >= 0.4 ? 'mid' : 'low';
  const getBarColor = (conf) => conf >= 0.7 ? '#00a86b' : conf >= 0.4 ? '#d97706' : '#dc2626';

  return (
    <>
      <style>{FONTS}{CSS}</style>
      <div className="app-shell">

        {/* Title Bar */}
        <div className="title-bar">
          <div className="title-bar-left">
            <div className="app-logo">
              <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 7C1 7 3 3 7 3C11 3 13 7 13 7C13 7 11 11 7 11C3 11 1 7 1 7Z" stroke="#ffffff" strokeWidth="1.2"/>
                <circle cx="7" cy="7" r="2" fill="#ffffff"/>
              </svg>
            </div>
            <span className="app-title">AquaVision · Fish Detection System</span>
          </div>
          <div className="title-bar-right">
            <div className="sys-indicator"><div className="dot dot-green"/>BACKEND</div>
            <div className="sys-indicator"><div className="dot dot-amber"/>MODEL</div>
            <div className="sys-indicator" style={{fontFamily:'Space Mono', fontSize:10, color:'#3d5a73'}}>{clock}</div>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="menu-bar">
          <button className="menu-btn primary" onClick={handleDetect} disabled={!selectedFile && mode === 'upload'}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0L9.33 7.5H0.67L5 0Z"/></svg>
            RUN DETECT
          </button>
          <div className="menu-separator"/>
          <button className="menu-btn" onClick={handleCapture} disabled={!results}>
            ◎ Capture
          </button>
          <button className="menu-btn" onClick={() => setShowSettings(true)}>
            ⚙ Settings
          </button>
          <button className="menu-btn" onClick={() => setShowHelp(true)}>
            ? Help
          </button>
          <div className="menu-separator"/>
          <button
            className={`menu-btn ${autoDetectMode ? 'danger' : ''}`}
            onClick={() => webcamActive && setAutoDetectMode(v => !v)}
            disabled={!webcamActive}
            title={!webcamActive ? 'Switch to Webcam mode and start camera to enable Auto-Detect' : autoDetectMode ? 'Stop automatic detection' : 'Start automatic detection every 3s'}
            style={!webcamActive ? {opacity:0.35, cursor:'not-allowed'} : {}}
          >
            {autoDetectMode ? '◼ Stop Auto-Detect' : '◉ Auto-Detect'}
          </button>
          <div className="menu-spacer"/>
          {autoDetectMode && <span className="badge-live">● LIVE</span>}
          {captureHistory.length > 0 && (
            <span style={{fontFamily:'Space Mono', fontSize:9, color:'#90a8be', letterSpacing:'0.08em'}}>
              {captureHistory.length} CAPTURES
            </span>
          )}
        </div>

        {/* Main */}
        <div className="main-layout">

          {/* Left Sidebar */}
          <div className="sidebar">
            <div className="sidebar-section">
              <div className="section-label">Input Source</div>
              <div className="mode-toggle">
                <button className={`mode-btn ${mode==='upload'?'active':''}`} onClick={() => { setMode('upload'); stopWebcam(); }}>Upload</button>
                <button className={`mode-btn ${mode==='webcam'?'active':''}`} onClick={() => setMode('webcam')}>Webcam</button>
              </div>
            </div>

            <div className="sidebar-scroll">
              {mode === 'upload' && (
                <div className="sidebar-section">
                  <div className="section-label">Image File</div>
                  <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} onClick={e => e.stopPropagation()} />
                    <div className="upload-icon">⊕</div>
                    <div className="upload-text">Click to upload</div>
                    <div className="upload-hint">JPG, PNG · Max 20MB</div>
                  </div>
                  {fileName && (
                    <div className="file-chip">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="#7a8fa6"><rect x="1" y="0" width="6" height="8" rx="1" stroke="#7a8fa6" strokeWidth="1" fill="none"/><path d="M3 3h4M3 5h3" stroke="#7a8fa6" strokeWidth="0.8"/></svg>
                      <span>{fileName}</span>
                    </div>
                  )}
                </div>
              )}

              {mode === 'webcam' && (
                <div className="sidebar-section">
                  <div className="section-label">Camera</div>
                  <div className="cam-btns">
                    {!webcamActive ? (
                      <button className="cam-btn go" onClick={startWebcam}>◉ Start Camera</button>
                    ) : (
                      <>
                        <button className="cam-btn go" onClick={() => captureFrame(false)}>⊙ Capture Frame</button>
                        <button className="cam-btn active" onClick={stopWebcam}>◼ Stop Camera</button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="sidebar-section">
                <div className="section-label">Thresholds</div>
                <div className="slider-group">
                  {[
                    { key: 'confidence', label: 'Confidence' },
                    { key: 'overlap', label: 'Overlap' },
                    { key: 'opacity', label: 'Opacity' },
                  ].map(({ key, label }) => (
                    <div className="slider-row" key={key}>
                      <div className="slider-header">
                        <span className="slider-name">{label}</span>
                        <span className="slider-val">{(thresholds[key] * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100" step="1"
                        value={thresholds[key] * 100}
                        onChange={e => setThresholds(p => ({ ...p, [key]: +e.target.value / 100 }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <div className="section-label">Presets</div>
                <div className="preset-grid">
                  {[
                    { label: 'Default', v: { confidence: 0.6, overlap: 0.5, opacity: 0.8 } },
                    { label: 'Precise', v: { confidence: 0.8, overlap: 0.3, opacity: 0.9 } },
                    { label: 'Sensitive', v: { confidence: 0.4, overlap: 0.7, opacity: 0.6 } },
                    { label: 'Strict', v: { confidence: 0.9, overlap: 0.2, opacity: 0.95 } },
                  ].map(({ label, v }) => (
                    <button key={label} className="preset-btn" onClick={() => setThresholds(v)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Viewport */}
          <div className="viewport">
            <div className="viewport-header">
              <span className="viewport-label">Preview</span>
              {fileName && <span className="viewport-filename">· {fileName}</span>}
            </div>
            <div className="viewport-body">
              <div className="empty-grid"/>
              <div className="corner corner-tl"/><div className="corner corner-tr"/>
              <div className="corner corner-bl"/><div className="corner corner-br"/>

              {loading && (
                <div className="loading-overlay">
                  <div className="loading-ring"/>
                  <div className="loading-text">Analyzing...</div>
                </div>
              )}

              {mode === 'webcam' ? (
                <video ref={videoRef} autoPlay className="preview-video"/>
              ) : results ? (
                <img src={`data:image/jpeg;base64,${results.annotated_image_base64}`} className="preview-img" alt="Detection result"/>
              ) : (
                <div className="empty-state">
                  <div className="empty-crosshair"><div className="empty-ring"/></div>
                  <div className="empty-title">No Preview</div>
                  <div className="empty-sub">Upload an image or start webcam</div>
                </div>
              )}
            </div>
          </div>

          {/* Results Panel */}
          <div className="results-panel">
            <div className="results-header">
              <span style={{fontFamily:'Space Mono', fontSize:9, letterSpacing:'0.18em', color:'#90a8be', textTransform:'uppercase'}}>Detection Results</span>
              {results && <span style={{fontFamily:'Space Mono', fontSize:9, color:'#0077cc'}}>{results.detections?.length || 0} found</span>}
            </div>
            <div className="results-scroll">
              {error && <div className="error-banner">⚠ {error}</div>}

              {results && (
                <>
                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-label">Detected</div>
                      <div className="stat-value cyan">{results.detections?.length || 0}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Avg Conf</div>
                      <div className="stat-value green">
                        {results.detections?.length
                          ? (results.detections.reduce((a,d) => a + d.confidence, 0) / results.detections.length * 100).toFixed(0) + '%'
                          : '—'}
                      </div>
                    </div>
                  </div>

                  {results.detections?.map((d, i) => (
                    <div className="detection-item" key={i}>
                      <div className="det-row">
                        <span className="det-label">{d.label}</span>
                        <span className={`det-badge ${getBadgeClass(d.confidence)}`}>
                          {(d.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="conf-bar">
                        <div className="conf-fill" style={{ width: `${d.confidence*100}%`, background: getBarColor(d.confidence) }}/>
                      </div>
                      {d.bbox && (
                        <div className="det-coords">
                          [{d.bbox[0]}, {d.bbox[1]}] → [{d.bbox[2]}, {d.bbox[3]}]
                        </div>
                      )}
                    </div>
                  ))}

                  {results.detections?.length > 0 && (
                    <div className="chart-section">
                      <div className="chart-label">Confidence Chart</div>
                      <canvas ref={chartRef}/>
                    </div>
                  )}
                </>
              )}

              {!results && !error && (
                <div style={{textAlign:'center', padding:'30px 0'}}>
                  <div style={{fontFamily:'Space Mono', fontSize:9, color:'#90a8be', letterSpacing:'0.15em', textTransform:'uppercase'}}>Awaiting input</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className={`status-item ${loading ? 'active' : ''}`}>
            <div className={`dot ${loading ? 'dot-green' : 'dot-amber'}`}/>
            {loading ? 'PROCESSING' : 'READY'}
          </div>
          <div className="status-item">MODE: {mode.toUpperCase()}</div>
          {autoDetectMode && <div className="status-item warn">AUTO-DETECT · 3s</div>}
          <div className="status-spacer"/>
          <div className="status-item">CONF: {(thresholds.confidence*100).toFixed(0)}%</div>
          <div className="status-item">OVR: {(thresholds.overlap*100).toFixed(0)}%</div>
          <div className="status-item">OPA: {(thresholds.opacity*100).toFixed(0)}%</div>
        </div>

        {/* Capture History Float */}
        {captureHistory.length > 0 && (
          <div className="history-float">
            <div className="history-header">
              <span style={{fontFamily:'Space Mono', fontSize:9, color:'#90a8be', letterSpacing:'0.15em', textTransform:'uppercase'}}>Captures ({captureHistory.length})</span>
            </div>
            <div className="history-list">
              {captureHistory.slice(0, 5).map(c => (
                <div className="history-item" key={c.id}>
                  <div className="history-time">{c.timestamp}</div>
                  <div className="history-count">{c.detections?.length || 0} detections</div>
                  <div className="history-actions">
                    <button className="hist-btn" onClick={() => handleExport(c)}>EXPORT</button>
                    <button className="hist-btn del" onClick={() => setCaptureHistory(p => p.filter(x => x.id !== c.id))}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">System Settings</span>
                <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:'Space Mono', fontSize:9, letterSpacing:'0.18em', color:'#0077cc', textTransform:'uppercase', marginBottom:14}}>Detection Thresholds</div>
                  <div className="slider-group">
                    {[{key:'confidence',label:'Confidence'},{key:'overlap',label:'Overlap'},{key:'opacity',label:'Opacity'}].map(({key,label}) => (
                      <div className="slider-row" key={key}>
                        <div className="slider-header">
                          <span className="slider-name">{label}</span>
                          <span className="slider-val">{(thresholds[key]*100).toFixed(0)}%</span>
                        </div>
                        <input type="range" min="0" max="100" step="1" value={thresholds[key]*100}
                          onChange={e => setThresholds(p => ({...p, [key]: +e.target.value/100}))}/>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontFamily:'Space Mono', fontSize:9, letterSpacing:'0.18em', color:'#0077cc', textTransform:'uppercase', marginBottom:10}}>Capture History</div>
                  <div style={{fontSize:12, color:'#3d5a73', marginBottom:8}}>Total stored: {captureHistory.length} / 10</div>
                  <button style={{height:26, padding:'0 12px', background:'rgba(255,69,96,0.1)', border:'1px solid rgba(255,69,96,0.3)', borderRadius:4, color:'#ff4560', fontSize:11, cursor:'pointer', fontFamily:'DM Sans'}}
                    onClick={() => setCaptureHistory([])}>Clear All Captures</button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-btn" onClick={() => setThresholds({confidence:0.6,overlap:0.5,opacity:0.8})}>Reset</button>
                <button className="modal-btn" onClick={() => setShowSettings(false)}>Cancel</button>
                <button className="modal-btn primary" onClick={() => { localStorage.setItem('fishDetSettings', JSON.stringify(thresholds)); setShowSettings(false); }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Help & Reference</span>
                <button className="modal-close" onClick={() => setShowHelp(false)}>×</button>
              </div>
              <div className="modal-body">
                {[
                  { title: 'Getting Started', items: ['Upload an image via the sidebar or enable Webcam mode','Adjust confidence threshold to control detection sensitivity','Click Run Detect or press the toolbar button','Review annotations in the preview and results panel'] },
                  { title: 'Threshold Guide', items: ['<strong>Confidence</strong> — minimum detection score (higher = fewer, more certain detections)','<strong>Overlap</strong> — NMS suppression threshold (lower = fewer duplicate boxes)','<strong>Opacity</strong> — bounding box annotation transparency'] },
                  { title: 'Presets', items: ['<strong>Default</strong> — balanced for general use','<strong>Precise</strong> — high accuracy, fewer false positives','<strong>Sensitive</strong> — detects more, may include noise','<strong>Strict</strong> — only very high confidence detections'] },
                  { title: 'Tips', items: ['Well-lit images produce significantly better results','Use Capture to save annotated frames for documentation','Settings are saved automatically to browser storage','Auto-Detect runs every 3s in webcam mode'] },
                ].map(({ title, items }) => (
                  <div className="help-section" key={title}>
                    <div className="help-section-title">{title}</div>
                    <ul className="help-list">
                      {items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{__html: item}}/>)}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="modal-btn primary" onClick={() => setShowHelp(false)}>Got it</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
