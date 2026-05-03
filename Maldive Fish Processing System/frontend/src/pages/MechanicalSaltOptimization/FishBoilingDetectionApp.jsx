// fish_detection_frontend.jsx
// Frontend component for Fish Processing Quality Detection System
// Location: src/components/FishBoilingDetectionApp.jsx

import React, { useRef, useState, useEffect } from "react";
import Chart from "chart.js/auto";
import { 
  UploadPage, 
  ChartPage, 
  SensorPage, 
  MechanicalPage,
  WaterSalinityControl
} from "./features";

/* ─────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS & GLOBAL STYLES - LIGHT THEME
   ───────────────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f8f9fa;
    --surface:  #ffffff;
    --surface2: #f1f3f5;
    --border:   #dee2e6;
    --border2:  #e9ecef;
    --text:     #212529;
    --muted:    #6c757d;
    --accent:   #0d6efd;
    --green:    #198754;
    --amber:    #fd7e14;
    --red:      #dc3545;
    --gold:     #ffc107;
    --teal:     #20c997;
    --purple:   #6f42c1;
    --font:     'IBM Plex Sans', sans-serif;
    --mono:     'IBM Plex Mono', monospace;
    --radius:   8px;
    --radius-lg:12px;
    --shadow:   0 1px 3px rgba(0,0,0,.08);
    --shadow-lg:0 4px 12px rgba(0,0,0,.12);
  }

  body { 
    font-family: var(--font); 
    background: var(--bg); 
    color: var(--text);
    font-size: 13px; 
    overflow: hidden; 
    height: 100vh; 
  }

  .app { display: flex; flex-direction: column; height: 100vh; }

  /* ── Titlebar ── */
  .titlebar { 
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    padding: 0 20px; 
    height: 48px; 
    background: var(--surface);
    border-bottom: 1px solid var(--border); 
    flex-shrink: 0; 
    box-shadow: var(--shadow);
  }
  
  .titlebar-left { display: flex; align-items: center; gap: 16px; }
  
  .logo { 
    display: flex; 
    align-items: center; 
    gap: 10px;
    font-size: 14px; 
    font-weight: 600; 
    letter-spacing: .3px; 
    color: var(--accent);
  }
  
  .logo-icon { 
    width: 28px; 
    height: 28px; 
    background: var(--accent);
    border-radius: 8px; 
    display: flex; 
    align-items: center;
    justify-content: center; 
    font-size: 14px; 
    color: white; 
    font-weight: 700; 
  }
  
  .pill { 
    padding: 3px 10px; 
    border-radius: 20px; 
    font-size: 10px;
    font-family: var(--mono); 
    letter-spacing: .5px; 
    font-weight: 500; 
  }
  
  .pill-green  { background: #d1e7dd; color: var(--green); border: 1px solid #badbcc; }
  .pill-amber  { background: #ffe5d0; color: var(--amber); border: 1px solid #ffd8b5; }
  .pill-red    { background: #f8d7da; color: var(--red); border: 1px solid #f5c2c7; }
  .pill-blue   { background: #cfe2ff; color: var(--accent); border: 1px solid #b6d4fe; }
  .pill-gold   { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
  .pill-purple { background: #e2d9f3; color: var(--purple); border: 1px solid #d4c5f0; }
  
  .clock { font-family: var(--mono); font-size: 11px; color: var(--muted); }

  /* ── Menu Bar / Tab bar ── */
  .menubar { 
    display: flex; 
    align-items: center; 
    gap: 4px;
    padding: 0 20px; 
    height: 40px; 
    background: var(--surface);
    border-bottom: 1px solid var(--border); 
    flex-shrink: 0; 
  }
  
  .menu-btn { 
    padding: 0 14px; 
    height: 34px; 
    border-radius: var(--radius) var(--radius) 0 0;
    cursor: pointer; 
    font-size: 12px; 
    font-weight: 500;
    display: flex; 
    align-items: center; 
    gap: 8px;
    border: 1px solid transparent; 
    transition: all .15s; 
    color: var(--muted);
    background: transparent;
  }
  
  .menu-btn.active { 
    background: var(--bg); 
    border-color: var(--border);
    border-bottom-color: var(--bg); 
    color: var(--accent); 
  }
  
  .menu-btn:hover:not(.active) { 
    color: var(--text); 
    background: rgba(0,0,0,.04); 
  }
  
  .menu-dot { width: 7px; height: 7px; border-radius: 50%; }
  .dot-green { background: var(--green); }
  .dot-amber { background: var(--amber); }
  .dot-red   { background: var(--red);   }
  .dot-blue  { background: var(--accent); }

  /* ── Toolbar ── */
  .toolbar {
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    padding: 8px 20px;
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }

  /* ── Main layout ── */
  .main { display: flex; flex: 1; overflow: hidden; }
  .main-content { flex: 1; overflow: auto; }

  /* ── Left Panel ── */
  .left-panel { 
    width: 280px; 
    background: var(--surface); 
    border-right: 1px solid var(--border);
    display: flex; 
    flex-direction: column; 
    overflow-y: auto; 
    flex-shrink: 0; 
  }
  
  .panel-section { 
    padding: 16px; 
    border-bottom: 1px solid var(--border2); 
  }
  
  .panel-title { 
    font-size: 11px; 
    font-weight: 600; 
    text-transform: uppercase;
    letter-spacing: 1px; 
    color: var(--muted); 
    margin-bottom: 12px; 
  }

  /* ── Center Panel ── */
  .center-panel { 
    flex: 1; 
    display: flex; 
    flex-direction: column; 
    overflow: hidden; 
    background: var(--bg);
  }
  
  .preview-area { 
    flex: 1; 
    display: flex; 
    align-items: center; 
    justify-content: center;
    background: #f1f3f5; 
    position: relative; 
    overflow: hidden; 
  }
  
  .preview-area img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .preview-area video { max-width: 100%; max-height: 100%; object-fit: contain; }
  
  .no-preview { 
    color: var(--muted); 
    font-size: 13px; 
    text-align: center; 
  }
  
  .no-preview .icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }

  /* ── Right Panel ── */
  .right-panel { 
    width: 300px; 
    background: var(--surface); 
    border-left: 1px solid var(--border);
    display: flex; 
    flex-direction: column; 
    overflow-y: auto; 
    flex-shrink: 0; 
  }
  
  .right-section { 
    padding: 16px; 
    border-bottom: 1px solid var(--border2); 
  }

  /* ── Status Bar ── */
  .statusbar { 
    height: 28px; 
    background: var(--surface2); 
    border-top: 1px solid var(--border);
    display: flex; 
    align-items: center; 
    padding: 0 20px; 
    gap: 20px; 
    flex-shrink: 0; 
    font-size: 11px;
  }
  
  .statusbar span { 
    font-size: 10px; 
    color: var(--muted); 
    font-family: var(--mono); 
  }
  
  .statusbar .dot { 
    width: 7px; 
    height: 7px; 
    border-radius: 50%; 
    display: inline-block; 
    margin-right: 6px; 
  }

  /* ── Inputs & controls ── */
  input[type=file] { 
    font-size: 12px; 
    color: var(--muted); 
    cursor: pointer; 
    width: 100%; 
  }
  
  input[type=file]::file-selector-button {
    background: var(--surface2); 
    color: var(--text); 
    border: 1px solid var(--border);
    border-radius: 6px; 
    padding: 5px 10px; 
    font-size: 11px; 
    cursor: pointer;
    margin-right: 10px; 
    font-family: var(--font);
    transition: all .15s;
  }
  
  input[type=file]::file-selector-button:hover { 
    background: var(--border2); 
  }

  .slider-wrap { margin-bottom: 14px; }
  .slider-label { 
    display: flex; 
    justify-content: space-between;
    font-size: 11px; 
    color: var(--muted); 
    margin-bottom: 6px; 
  }
  .slider-label span:last-child { 
    color: var(--accent); 
    font-family: var(--mono); 
    font-size: 10px; 
    font-weight: 600;
  }
  
  input[type=range] {
    width: 100%; 
    height: 4px; 
    background: var(--border2); 
    border-radius: 4px;
    appearance: none; 
    cursor: pointer; 
    outline: none;
  }
  
  input[type=range]::-webkit-slider-thumb {
    appearance: none; 
    width: 14px; 
    height: 14px;
    background: var(--accent); 
    border-radius: 50%;
    border: 2px solid white; 
    box-shadow: 0 1px 3px rgba(0,0,0,.2);
    cursor: pointer;
  }
  
  input[type=range]::-webkit-slider-thumb:hover { 
    background: #0b5ed7; 
    transform: scale(1.1);
  }
  
  input[type=range]::-moz-range-thumb {
    width: 14px; 
    height: 14px;
    background: var(--accent); 
    border-radius: 50%;
    border: 2px solid white; 
    box-shadow: 0 1px 3px rgba(0,0,0,.2);
    cursor: pointer;
  }
  
  input[type=range]::-moz-range-thumb:hover {
    background: #0b5ed7;
    transform: scale(1.1);
  }

  /* ── Buttons ── */
  .btn { 
    border: 1px solid var(--border); 
    border-radius: var(--radius);
    padding: 7px 16px; 
    font-size: 12px; 
    font-family: var(--font);
    cursor: pointer; 
    transition: all .15s; 
    font-weight: 500; 
  }
  
  .btn-primary { 
    background: var(--accent); 
    border-color: var(--accent); 
    color: white; 
  }
  
  .btn-primary:hover { 
    background: #0b5ed7; 
    border-color: #0b5ed7;
  }
  .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
  
  .btn-secondary { 
    background: var(--surface); 
    color: var(--text); 
    border-color: var(--border);
  }
  .btn-secondary:hover { 
    background: var(--surface2); 
    border-color: var(--border2);
  }
  
  .btn-danger { 
    background: #fff5f5; 
    border-color: #f5c2c7;
    color: var(--red); 
  }
  .btn-danger:hover { background: #f8d7da; }
  
  .btn-sm { padding: 5px 12px; font-size: 11px; }

  /* ── Presets row ── */
  .presets { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 8px; 
    margin-top: 12px; 
  }
  
  .preset-btn { 
    background: var(--surface2); 
    border: 1px solid var(--border);
    border-radius: 6px; 
    padding: 6px 8px; 
    font-size: 10px; 
    font-family: var(--font);
    cursor: pointer; 
    color: var(--muted); 
    transition: all .15s; 
    font-weight: 500; 
  }
  
  .preset-btn:hover { 
    color: var(--accent); 
    border-color: var(--accent); 
    background: #cfe2ff; 
  }

  /* ── Detection card ── */
  .det-card { 
    border: 1px solid var(--border2); 
    border-radius: var(--radius);
    padding: 10px 12px; 
    margin-bottom: 8px; 
    background: var(--surface2); 
    transition: all .15s;
  }
  
  .det-card:hover {
    border-color: var(--border);
    box-shadow: var(--shadow);
  }
  
  .det-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 5px; 
  }
  
  .det-label { font-size: 12px; font-weight: 600; color: var(--text); }
  .det-conf { font-family: var(--mono); font-size: 10px; color: var(--muted); }
  .det-meta { font-size: 10px; color: var(--muted); margin-top: 4px; }

  /* ── Capture History Sidebar ── */
  .capture-sidebar {
    position: fixed;
    right: 20px;
    top: 80px;
    width: 300px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    z-index: 40;
  }
  
  .capture-sidebar h3 {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    margin: 0;
    background: var(--surface2);
  }
  
  .capture-item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border2);
  }
  
  .capture-item:last-child { border-bottom: none; }
  
  .capture-time {
    font-size: 10px;
    color: var(--muted);
    font-family: var(--mono);
    margin-bottom: 6px;
  }
  
  .capture-stats {
    font-size: 11px;
    margin-bottom: 10px;
    font-weight: 500;
  }
  
  .capture-actions {
    display: flex;
    gap: 10px;
  }

  /* ── Modal ── */
  .modal-bg { 
    position: fixed; 
    inset: 0; 
    background: rgba(0,0,0,.5);
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 100; 
  }
  
  .modal { 
    background: var(--surface); 
    border: 1px solid var(--border);
    border-radius: var(--radius-lg); 
    padding: 24px; 
    width: 450px;
    max-height: 85vh; 
    overflow-y: auto; 
    box-shadow: var(--shadow-lg);
  }
  
  .modal h2 { 
    font-size: 16px; 
    font-weight: 600; 
    margin-bottom: 16px; 
    color: var(--text);
  }
  
  .modal h3 {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    margin: 20px 0 10px 0;
  }
  
  .modal-footer { 
    display: flex; 
    justify-content: flex-end; 
    gap: 10px; 
    margin-top: 24px; 
  }
  
  .modal ol, .modal ul {
    padding-left: 22px;
    margin: 10px 0;
  }
  
  .modal li {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 6px;
  }

  /* ── Chart container ── */
  .chart-wrap { 
    position: relative; 
    height: 160px; 
    margin-top: 12px;
  }

  /* ── Loading overlay ── */
  .loading-overlay { 
    position: absolute; 
    inset: 0; 
    background: rgba(248,249,250,.9);
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    gap: 12px; 
  }
  
  .spinner { 
    width: 36px; 
    height: 36px; 
    border: 3px solid var(--border);
    border-top-color: var(--accent); 
    border-radius: 50%; 
    animation: spin .7s linear infinite; 
  }
  
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface2); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--muted); }
  
  /* ── Utility classes ── */
  .gap-6 { display: flex; flex-direction: column; gap: 6px; }
  .space-y-4 > * + * { margin-top: 16px; }
`;

export default function FishBoilingDetectionApp() {
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

  const [thresholds, setThresholds] = useState({
    confidence: 0.6,
    overlap: 0.5,
    opacity: 0.8,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  const API_URL = "http://localhost:8000/predict";

  // Clock effect
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    return () => stopWebcam();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setResults(null);
    }
  };

  const processImage = async (file) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confidence_threshold", thresholds.confidence);
      formData.append("overlap_threshold", thresholds.overlap);
      formData.append("opacity_threshold", thresholds.opacity);

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Backend error");

      const data = await res.json();
      setResults(data);

      setTimeout(() => renderChart(data), 200);
    } catch (err) {
      setError("Failed to connect to backend. Make sure the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = () => {
    if (!selectedFile && mode === "upload") {
      setError("Select an image first");
      return;
    }
    if (selectedFile) {
      processImage(selectedFile);
    }
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setWebcamActive(true);
      setResults(null);
    } catch {
      setError("Webcam access denied");
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setWebcamActive(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      setFileName("webcam_capture.jpg");
      processImage(file);
    });
  };

  const renderChart = (data) => {
    if (!data?.detections) return;

    const labels = data.detections.map((d, i) => `${d.label || "Fish"} ${i + 1}`);
    const values = data.detections.map((d) => (d.confidence * 100).toFixed(1));

    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Confidence %",
            data: values,
            backgroundColor: "rgba(13,110,253,0.7)",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { ticks: { color: "#6c757d", font: { size: 10 } }, grid: { color: "#e9ecef" } },
          y: { ticks: { color: "#6c757d", font: { size: 10 } }, grid: { color: "#e9ecef" }, min: 0, max: 100 },
        },
      },
    });
  };

  const handleCapture = () => {
    if (results) {
      const capture = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        image: results.annotated_image_base64,
        detections: results.detections,
        thresholds: { ...thresholds },
        fileName: fileName || 'captured_image'
      };
      setCaptureHistory(prev => [capture, ...prev].slice(0, 10));
    }
  };

  const handleExportCapture = (capture) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${capture.image}`;
    link.download = `fish_detection_${capture.id}.jpg`;
    link.click();
  };

  const handleDeleteCapture = (captureId) => {
    setCaptureHistory(prev => prev.filter(c => c.id !== captureId));
  };

  const handleSettingsSave = () => {
    localStorage.setItem('fishDetectionSettings', JSON.stringify(thresholds));
    setShowSettings(false);
  };

  const handleSettingsReset = () => {
    setThresholds({ confidence: 0.6, overlap: 0.5, opacity: 0.8 });
  };

  const handleLoadSettings = () => {
    const saved = localStorage.getItem('fishDetectionSettings');
    if (saved) {
      setThresholds(JSON.parse(saved));
    }
  };

  useEffect(() => {
    handleLoadSettings();
  }, []);

  const qualityPillClass = (quality) => {
    if (quality === "PREMIUM") return "pill-gold";
    if (quality === "GOOD") return "pill-green";
    if (quality === "SPLIT" || quality === "DAMAGED") return "pill-red";
    return "pill-blue";
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">

        {/* Title Bar */}
        <div className="titlebar">
          <div className="titlebar-left">
            <div className="logo">
              <div className="logo-icon">🐟</div>
              Smart Maldive Fish Processing System
            </div>
            <span className="pill pill-green">● OPERATIONAL</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="clock">{clock}</span>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="menubar">
          <button className={`menu-btn ${mode === "upload" ? "active" : ""}`} onClick={() => { setMode("upload"); stopWebcam(); setResults(null); }}>
            <span className="menu-dot dot-blue" />
            Upload Image
          </button>
                    <button className={`menu-btn ${mode === "chart" ? "active" : ""}`} onClick={() => { setMode("chart"); setResults(null); }}>
            <span className="menu-dot dot-blue" />
            Chart
          </button>
          <button className={`menu-btn ${mode === "sensors" ? "active" : ""}`} onClick={() => { setMode("sensors"); setResults(null); }}>
            <span className="menu-dot dot-orange" />
            Sensor Data
          </button>
          <button className={`menu-btn ${mode === "mechanical" ? "active" : ""}`} onClick={() => { setMode("mechanical"); setResults(null); }}>
            <span className="menu-dot dot-purple" />
            Mechanical System Controllers
          </button>
            <button className={`menu-btn ${mode === "Water" ? "active" : ""}`} onClick={() => { setMode("Water"); setResults(null); }}>
            <span className="menu-dot dot-purple" />
           Water Salinity Control
          </button>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {mode === "upload" && (
            <UploadPage 
              onFileSelect={handleFileChange}
              selectedFile={selectedFile}
              onRemoveFile={() => setSelectedFile(null)}
            />
          )}
                    {mode === "chart" && <ChartPage />}
          {mode === "sensors" && <SensorPage />}
          {mode === "mechanical" && <MechanicalPage />}
          {mode === "Water" && <WaterSalinityControl />}
        </div>

        {/* Status Bar */}
        <div className="statusbar">
          <span><span className="dot dot-green"></span>System: {loading ? "Processing" : "Ready"}</span>
          <span>Mode: {mode === "upload" ? "Image Upload" : mode === "Water" ? "Water Salinity Control" : mode === "chart" ? "Chart Analytics" : mode === "sensors" ? "Sensor Data" : mode === "mechanical" ? "Mechanical Controls" : "Unknown"}</span>
          {results && <span>Last inference: {results.inference_time_ms}ms</span>}
          {captureHistory.length > 0 && <span>Saved results: {captureHistory.length}</span>}
          <span>AI Model: YOLOv8 | Multi-sensor enabled</span>
        </div>

        {/* Capture History Sidebar */}
        {captureHistory.length > 0 && (
          <div className="capture-sidebar">
            <h3>📸 Saved Results ({captureHistory.length})</h3>
            {captureHistory.slice(0, 5).map(capture => (
              <div key={capture.id} className="capture-item">
                <div className="capture-time">🕐 {capture.timestamp}</div>
                <div className="capture-stats">🐟 {capture.detections?.length || 0} detections</div>
                <div className="capture-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleExportCapture(capture)}>
                    📥 Export
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCapture(capture.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-bg">
            <div className="modal">
              <h2>⚙️ Detection Threshold Settings</h2>
              
              <h3>Confidence Threshold</h3>
              <div className="slider-wrap">
                <div className="slider-label">
                  <span>Minimum confidence for detection</span>
                  <span>{(thresholds.confidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={thresholds.confidence * 100}
                  onChange={(e) => setThresholds(prev => ({
                    ...prev,
                    confidence: parseFloat(e.target.value) / 100
                  }))}
                />
              </div>
              
              <h3>Overlap Threshold (NMS)</h3>
              <div className="slider-wrap">
                <div className="slider-label">
                  <span>Maximum allowed overlap</span>
                  <span>{(thresholds.overlap * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={thresholds.overlap * 100}
                  onChange={(e) => setThresholds(prev => ({
                    ...prev,
                    overlap: parseFloat(e.target.value) / 100
                  }))}
                />
              </div>

              <h3>📸 Capture History</h3>
              <p style={{ fontSize: 11, color: "var(--muted)" }}>Total saved results: {captureHistory.length}</p>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setCaptureHistory([])}
                style={{ marginTop: 8 }}
              >
                🗑️ Clear All Results
              </button>

              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={handleSettingsReset}>
                  Reset to Default
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSettingsSave}>
                  💾 Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="modal-bg">
            <div className="modal">
              <h2>❓ System Help & Documentation</h2>
              
              <h3>📖 How to Use</h3>
              <ol>
                <li>Upload a fish image or use live camera for real-time inspection</li>
                <li>Adjust confidence thresholds using the sliders for optimal detection</li>
                <li>Click "Detect & Analyze" to run AI-powered quality assessment</li>
                <li>Review quality results in the right panel</li>
                <li>Save important results for quality documentation</li>
              </ol>

              <h3>⚙️ Quality Levels</h3>
              <ul>
                <li><strong>PREMIUM (Gold):</strong> Excellent color, texture, and shape - export quality</li>
                <li><strong>GOOD (Green):</strong> Acceptable quality for local market</li>
                <li><strong>PROCESSING (Blue):</strong> Still in processing stage</li>
                <li><strong>SPLIT/DAMAGED (Red):</strong> Quality issues detected</li>
                <li><strong>REJECTED (Gray):</strong> Non-fish objects or severely damaged</li>
              </ul>

              <h3>🎯 AI Features</h3>
              <ul>
                <li>Advanced color analysis in HSV/LAB color spaces</li>
                <li>Shape validation for fish-like characteristics</li>
                <li>Texture anomaly detection (split, cracks, damage)</li>
                <li>Hierarchical quality classification</li>
                <li>Multi-sensor data fusion ready</li>
              </ul>

              <h3>💡 Best Practices</h3>
              <ul>
                <li>Use well-lit images for best detection accuracy</li>
                <li>Adjust confidence threshold based on your quality standards</li>
                <li>Use presets for common use cases</li>
                <li>Settings are automatically saved locally</li>
              </ul>

              <div className="modal-footer">
                <button className="btn btn-primary btn-sm" onClick={() => setShowHelp(false)}>
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}