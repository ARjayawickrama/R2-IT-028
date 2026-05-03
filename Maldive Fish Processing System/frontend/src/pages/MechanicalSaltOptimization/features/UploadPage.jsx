import React, { useRef, useState, useEffect } from "react";

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
  const [dragOver, setDragOver] = useState(false);

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
    const saved = localStorage.getItem("fishDetSettings");
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
    } catch { setError("Cannot connect to backend · localhost:8000"); }
    finally { setLoading(false); }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) { setSelectedFile(f); setFileName(f.name); setResults(null); setError(""); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) { setSelectedFile(f); setFileName(f.name); setResults(null); setError(""); }
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
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const f = new File([blob], `${isAuto ? "auto" : "manual"}_${ts}.jpg`, { type: "image/jpeg" });
      setFileName(f.name);
      processImage(f);
    });
  };

  const renderChart = (data) => {
    if (!data?.detections || !chartRef.current) return;
    const labels = data.detections.map((d, i) => `${d.label} ${i + 1}`);
    const values = data.detections.map(d => +(d.confidence * 100).toFixed(1));
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Confidence %",
          data: values,
          backgroundColor: values.map(v => v >= 70 ? "rgba(16,185,129,0.15)" : v >= 40 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)"),
          borderColor: values.map(v => v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444"),
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#94a3b8", font: { size: 9, family: "monospace" } }, grid: { color: "rgba(0,0,0,0.04)" } },
          y: { ticks: { color: "#94a3b8", font: { size: 9 } }, grid: { color: "rgba(0,0,0,0.04)" }, min: 0, max: 100 },
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
    const a = document.createElement("a");
    a.href = `data:image/jpeg;base64,${c.image}`;
    a.download = `fish_det_${c.id}.jpg`;
    a.click();
  };

  const getBadge = (conf) => {
    if (conf >= 0.7) return { text: "HIGH", cls: "bg-emerald-50 text-emerald-600 border border-emerald-200" };
    if (conf >= 0.4) return { text: "MID", cls: "bg-amber-50 text-amber-600 border border-amber-200" };
    return { text: "LOW", cls: "bg-red-50 text-red-500 border border-red-200" };
  };

  const getBarColor = (conf) => conf >= 0.7 ? "#10b981" : conf >= 0.4 ? "#f59e0b" : "#ef4444";

  return (
    <>
      {/* Load Chart.js from CDN */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js" />

      <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">

        {/* ── Title Bar ── */}
        <div className="h-11 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 14 14" fill="none">
                <path d="M1 7C1 7 3 3 7 3C11 3 13 7 13 7C13 7 11 11 7 11C3 11 1 7 1 7Z" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="7" cy="7" r="2" fill="currentColor"/>
              </svg>
            </div>
            <span className="font-mono text-[11px] tracking-widest text-slate-700 font-semibold uppercase">AquaVision · Fish Detection</span>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-300"/>
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase">Backend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase">Model</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">{clock}</span>
          </div>
        </div>

        {/* ── Menu Bar ── */}
        <div className="h-10 bg-white border-b border-slate-100 flex items-center px-4 gap-2 shrink-0">
          <button
            onClick={handleDetect}
            disabled={!selectedFile && mode === "upload"}
            className="h-7 px-3.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 bg-sky-500 text-white hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0L9.33 7.5H0.67L5 0Z"/></svg>
            Run Detect
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"/>
          <button onClick={handleCapture} disabled={!results} className="h-7 px-3 rounded-md text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="6" cy="6" r="4"/><circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none"/></svg>
            Capture
          </button>
          <button onClick={() => setShowSettings(true)} className="h-7 px-3 rounded-md text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="6" cy="6" r="2"/><path d="M6 1v1M6 10v1M1 6h1M10 6h1M2.46 2.46l.7.7M8.84 8.84l.7.7M2.46 9.54l.7-.7M8.84 3.16l.7-.7"/></svg>
            Settings
          </button>
          <button onClick={() => setShowHelp(true)} className="h-7 px-3 rounded-md text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="6" cy="6" r="5"/><path d="M4.5 4.5C4.5 3.67 5.17 3 6 3s1.5.67 1.5 1.5c0 1-1.5 1.5-1.5 2.5"/><circle cx="6" cy="8.5" r=".5" fill="currentColor" stroke="none"/></svg>
            Help
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"/>
          <button
            onClick={() => webcamActive && setAutoDetectMode(v => !v)}
            disabled={!webcamActive}
            className={`h-7 px-3 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed
              ${autoDetectMode ? "bg-red-50 text-red-500 hover:bg-red-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoDetectMode ? "bg-red-500 animate-pulse" : "bg-slate-300"}`}/>
            {autoDetectMode ? "Stop Auto-Detect" : "Auto-Detect"}
          </button>
          <div className="flex-1"/>
          {autoDetectMode && (
            <span className="text-[9px] font-mono tracking-widest text-emerald-500 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded uppercase">● Live</span>
          )}
          {captureHistory.length > 0 && (
            <span className="text-[9px] font-mono text-slate-400 tracking-wider">{captureHistory.length} captures</span>
          )}
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left Sidebar ── */}
          <div className="w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-hidden shadow-sm">

            {/* Source Toggle */}
            <div className="p-4 border-b border-slate-100">
              <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mb-3">Input Source</p>
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                <button
                  onClick={() => { setMode("upload"); stopWebcam(); }}
                  className={`flex-1 h-7 rounded-md text-xs font-semibold transition-all ${mode === "upload" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >Upload</button>
                <button
                  onClick={() => setMode("webcam")}
                  className={`flex-1 h-7 rounded-md text-xs font-semibold transition-all ${mode === "webcam" ? "bg-white text-slate-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >Webcam</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* Upload Zone */}
              {mode === "upload" && (
                <div className="p-4 border-b border-slate-100">
                  <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mb-3">Image File</p>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
                      ${dragOver ? "border-sky-400 bg-sky-50" : "border-slate-200 hover:border-sky-300 hover:bg-sky-50/50"}`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" onClick={e => e.stopPropagation()}/>
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-sky-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 3v8M5 6l3-3 3 3"/><path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-sky-500">Click to upload</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">or drag & drop · JPG, PNG</p>
                  </div>
                  {fileName && (
                    <div className="mt-2.5 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <svg className="w-3 h-3 text-slate-400 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="1" y="0.5" width="8" height="11" rx="1.5"/><path d="M3.5 4h4M3.5 6.5h3"/>
                      </svg>
                      <span className="text-[11px] text-slate-600 truncate font-medium">{fileName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Webcam Controls */}
              {mode === "webcam" && (
                <div className="p-4 border-b border-slate-100">
                  <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mb-3">Camera</p>
                  <div className="flex flex-col gap-2">
                    {!webcamActive ? (
                      <button onClick={startWebcam} className="h-9 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-white/70"/>Start Camera
                      </button>
                    ) : (
                      <>
                        <button onClick={() => captureFrame(false)} className="h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 text-xs font-semibold hover:bg-sky-100 transition-colors flex items-center justify-center gap-2">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><circle cx="7" cy="7" r="2" fill="currentColor" stroke="none"/></svg>
                          Capture Frame
                        </button>
                        <button onClick={stopWebcam} className="h-9 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                          <span className="w-2.5 h-2.5 rounded bg-red-400"/>Stop Camera
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Thresholds */}
              <div className="p-4 border-b border-slate-100">
                <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mb-4">Thresholds</p>
                <div className="flex flex-col gap-4">
                  {[{ key: "confidence", label: "Confidence" }, { key: "overlap", label: "Overlap" }, { key: "opacity", label: "Opacity" }].map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-slate-600">{label}</span>
                        <span className="font-mono text-[10px] text-sky-500 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">
                          {(thresholds[key] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="relative h-1.5 bg-slate-100 rounded-full">
                        <div
                          className="absolute left-0 top-0 h-full bg-sky-400 rounded-full transition-all"
                          style={{ width: `${thresholds[key] * 100}%` }}
                        />
                        <input
                          type="range" min="0" max="100" step="1"
                          value={thresholds[key] * 100}
                          onChange={e => setThresholds(p => ({ ...p, [key]: +e.target.value / 100 }))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-sky-400 rounded-full shadow-md pointer-events-none transition-all"
                          style={{ left: `calc(${thresholds[key] * 100}% - 7px)` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div className="p-4">
                <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mb-3">Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Default", v: { confidence: 0.6, overlap: 0.5, opacity: 0.8 } },
                    { label: "Precise", v: { confidence: 0.8, overlap: 0.3, opacity: 0.9 } },
                    { label: "Sensitive", v: { confidence: 0.4, overlap: 0.7, opacity: 0.6 } },
                    { label: "Strict", v: { confidence: 0.9, overlap: 0.2, opacity: 0.95 } },
                  ].map(({ label, v }) => (
                    <button
                      key={label}
                      onClick={() => setThresholds(v)}
                      className="h-8 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-all"
                    >{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Center Viewport ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            <div className="h-9 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0">
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">Preview</span>
              {fileName && <span className="text-[11px] text-slate-500">· {fileName}</span>}
            </div>
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
              {/* Subtle grid background */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
                backgroundSize: "32px 32px"
              }}/>

              {/* Corner decorators */}
              {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((cls, i) => (
                <div key={i} className={`absolute w-5 h-5 ${cls} border-sky-300`}/>
              ))}

              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-10 h-10 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin"/>
                  <span className="font-mono text-[10px] tracking-widest text-sky-500 uppercase animate-pulse">Analyzing...</span>
                </div>
              )}

              {mode === "webcam" ? (
                <video ref={videoRef} autoPlay className="max-w-full max-h-full object-contain"/>
              ) : results ? (
                <img src={`data:image/jpeg;base64,${results.annotated_image_base64}`} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" alt="Detection result"/>
              ) : (
                <div className="text-center select-none relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg className="w-8 h-8 text-slate-300" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M2 16C2 16 7 7 16 7C25 7 30 16 30 16C30 16 25 25 16 25C7 25 2 16 2 16Z"/>
                      <circle cx="16" cy="16" r="4"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-400">No Preview</p>
                  <p className="text-xs text-slate-300 mt-1">Upload an image or start the webcam</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Results Panel ── */}
          <div className="w-64 shrink-0 bg-white border-l border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <div className="h-9 border-b border-slate-100 flex items-center justify-between px-4 shrink-0">
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">Results</span>
              {results && <span className="text-[10px] font-mono text-sky-500 font-semibold">{results.detections?.length || 0} found</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-3">

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3">
                  <svg className="w-3.5 h-3.5 text-red-400 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="6"/><path d="M7 4v3.5M7 9.5v.5"/></svg>
                  <span className="text-[11px] text-red-500">{error}</span>
                </div>
              )}

              {results && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wide mb-1">Detected</p>
                      <p className="font-mono text-xl font-bold text-sky-500">{results.detections?.length || 0}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wide mb-1">Avg Conf</p>
                      <p className="font-mono text-xl font-bold text-emerald-500">
                        {results.detections?.length
                          ? (results.detections.reduce((a, d) => a + d.confidence, 0) / results.detections.length * 100).toFixed(0) + "%"
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    {results.detections?.map((d, i) => {
                      const badge = getBadge(d.confidence);
                      return (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 hover:border-sky-200 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-700">{d.label}</span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${badge.cls}`}>{badge.text}</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${d.confidence * 100}%`, background: getBarColor(d.confidence) }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[10px] text-slate-400">{(d.confidence * 100).toFixed(1)}%</span>
                            {d.bbox && <span className="font-mono text-[9px] text-slate-300">[{d.bbox[0]},{d.bbox[1]}]</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {results.detections?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mb-2">Confidence Chart</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                        <canvas ref={chartRef}/>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!results && !error && (
                <div className="text-center py-10">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-slate-300" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="10" cy="10" r="7"/><path d="M10 7v4M10 13v.5"/>
                    </svg>
                  </div>
                  <p className="font-mono text-[9px] tracking-widest text-slate-300 uppercase">Awaiting input</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Status Bar ── */}
        <div className="h-7 bg-white border-t border-slate-100 flex items-center px-4 gap-5 shrink-0">
          <div className={`flex items-center gap-1.5 font-mono text-[9px] tracking-wider uppercase ${loading ? "text-sky-500" : "text-slate-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-sky-400 animate-pulse" : "bg-amber-300"}`}/>
            {loading ? "Processing" : "Ready"}
          </div>
          <span className="font-mono text-[9px] tracking-wider text-slate-300 uppercase">Mode: {mode}</span>
          {autoDetectMode && <span className="font-mono text-[9px] tracking-wider text-amber-400 uppercase">Auto-Detect · 3s</span>}
          <div className="flex-1"/>
          <span className="font-mono text-[9px] text-slate-300">CONF: {(thresholds.confidence * 100).toFixed(0)}%</span>
          <span className="font-mono text-[9px] text-slate-300">OVR: {(thresholds.overlap * 100).toFixed(0)}%</span>
          <span className="font-mono text-[9px] text-slate-300">OPA: {(thresholds.opacity * 100).toFixed(0)}%</span>
        </div>

        {/* ── Capture History Float ── */}
        {captureHistory.length > 0 && (
          <div className="fixed right-72 top-32 w-52 bg-white border border-slate-200 rounded-xl overflow-hidden z-50 shadow-lg">
            <div className="h-8 border-b border-slate-100 flex items-center px-3">
              <span className="font-mono text-[9px] tracking-widest text-slate-400 uppercase">Captures ({captureHistory.length})</span>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {captureHistory.slice(0, 5).map(c => (
                <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-2">
                  <p className="font-mono text-[9px] text-slate-400">{c.timestamp}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5 mb-2">{c.detections?.length || 0} detections</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleExport(c)} className="flex-1 h-6 text-[9px] font-mono border border-slate-200 rounded bg-white text-slate-500 hover:text-sky-500 hover:border-sky-200 transition-all">EXPORT</button>
                    <button onClick={() => setCaptureHistory(p => p.filter(x => x.id !== c.id))} className="flex-1 h-6 text-[9px] font-mono border border-slate-200 rounded bg-white text-slate-500 hover:text-red-400 hover:border-red-200 transition-all">DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Settings Modal ── */}
        {showSettings && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
            <div className="w-96 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="h-12 border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
                <span className="font-mono text-[11px] tracking-widest text-slate-700 uppercase font-semibold">System Settings</span>
                <button onClick={() => setShowSettings(false)} className="w-6 h-6 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-sm flex items-center justify-center">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <p className="font-mono text-[9px] tracking-widest text-sky-500 uppercase mb-4">Detection Thresholds</p>
                <div className="flex flex-col gap-5 mb-6">
                  {[{ key: "confidence", label: "Confidence" }, { key: "overlap", label: "Overlap" }, { key: "opacity", label: "Opacity" }].map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-medium text-slate-600">{label}</span>
                        <span className="font-mono text-[10px] text-sky-500">{(thresholds[key] * 100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={thresholds[key] * 100}
                        onChange={e => setThresholds(p => ({ ...p, [key]: +e.target.value / 100 }))}
                        className="w-full h-1.5 rounded-full cursor-pointer accent-sky-500"/>
                    </div>
                  ))}
                </div>
                <p className="font-mono text-[9px] tracking-widest text-sky-500 uppercase mb-3">Capture History</p>
                <p className="text-xs text-slate-500 mb-3">Stored: {captureHistory.length} / 10</p>
                <button onClick={() => setCaptureHistory([])} className="h-8 px-4 rounded-lg bg-red-50 border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors">
                  Clear All Captures
                </button>
              </div>
              <div className="h-14 border-t border-slate-100 flex items-center justify-end gap-2 px-5 shrink-0">
                <button onClick={() => setThresholds({ confidence: 0.6, overlap: 0.5, opacity: 0.8 })} className="h-8 px-4 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">Reset</button>
                <button onClick={() => setShowSettings(false)} className="h-8 px-4 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={() => { localStorage.setItem("fishDetSettings", JSON.stringify(thresholds)); setShowSettings(false); }} className="h-8 px-4 rounded-lg bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 transition-colors shadow-sm">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Help Modal ── */}
        {showHelp && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
            <div className="w-96 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
              <div className="h-12 border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
                <span className="font-mono text-[11px] tracking-widest text-slate-700 uppercase font-semibold">Help & Reference</span>
                <button onClick={() => setShowHelp(false)} className="w-6 h-6 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-sm flex items-center justify-center">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {[
                  { title: "Getting Started", items: ["Upload an image via the sidebar or enable Webcam mode", "Adjust confidence threshold to control detection sensitivity", "Click Run Detect to analyze the image", "Review annotations in the preview and results panel"] },
                  { title: "Threshold Guide", items: ["Confidence — minimum detection score (higher = fewer, more certain)", "Overlap — NMS suppression threshold (lower = fewer duplicate boxes)", "Opacity — bounding box annotation transparency"] },
                  { title: "Presets", items: ["Default — balanced for general use", "Precise — high accuracy, fewer false positives", "Sensitive — detects more, may include noise", "Strict — only very high confidence detections"] },
                  { title: "Tips", items: ["Well-lit images produce significantly better results", "Use Capture to save annotated frames for documentation", "Settings are saved to browser storage automatically", "Auto-Detect runs every 3s in webcam mode"] },
                ].map(({ title, items }) => (
                  <div key={title} className="mb-5">
                    <p className="font-mono text-[9px] tracking-widest text-sky-500 uppercase mb-2.5">{title}</p>
                    <ul className="flex flex-col gap-1.5">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-slate-500 pl-3 relative before:absolute before:left-0 before:content-['›'] before:text-slate-300">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="h-14 border-t border-slate-100 flex items-center justify-end px-5 shrink-0">
                <button onClick={() => setShowHelp(false)} className="h-8 px-5 rounded-lg bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 transition-colors shadow-sm">Got it</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
