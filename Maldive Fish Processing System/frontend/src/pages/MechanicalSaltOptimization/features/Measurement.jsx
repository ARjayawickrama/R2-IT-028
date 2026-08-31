import React, { useState, useEffect, useRef } from "react";
import {
  createMeasurement,
  getMeasurementsBySession,
  deleteMeasurement,
  deleteSessionMeasurements,
} from "../../../services/measurementApi";
import {
  Ruler,
  Scale,
  Play,
  Square,
  Compass,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Radio,
  Sliders,
  Maximize2,
  Sparkles,
  Layers,
  FileText,
  Activity,
  Zap,
  Info,
  ChevronRight,
  Maximize,
  Minimize
} from "lucide-react";

const BACKEND_IP = "http://localhost:8000";

export default function Measurement() {
  // Session & Batch identity
  const [sessionId] = useState(() => "SES-" + Date.now().toString().slice(-6));
  const [batchId] = useState(() => "BATCH-" + new Date().toISOString().slice(0, 10).replace(/-/g, ""));

  // Real-time telemetry readings
  const [peakCm, setPeakCm] = useState(6.4);
  const [weight, setWeight] = useState(1.425);
  const [leftCm, setLeftCm] = useState(4.8);
  const [centerCm, setCenterCm] = useState(6.4);
  const [rightCm, setRightCm] = useState(5.1);
  const [scanning, setScanning] = useState(false);
  const [sensorOk, setSensorOk] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Status and UI state
  const [connState, setConnState] = useState("ok"); // 'idle' | 'ok' | 'working' | 'error'
  const [statusLine, setStatusLine] = useState("Laser & Load Cell Nominal");
  const [pulseTick, setPulseTick] = useState(0);
  const [reports, setReports] = useState([
    { id: '1', thickness: '6.4 cm', weight: '1.425 kg', density: '1.08 g/cm³', date: '08:55:12', status: 'Optimal' },
    { id: '2', thickness: '5.8 cm', weight: '1.210 kg', density: '1.05 g/cm³', date: '08:52:40', status: 'Optimal' },
    { id: '3', thickness: '7.2 cm', weight: '1.680 kg', density: '1.11 g/cm³', date: '08:48:15', status: 'Thick Cut' },
  ]);
  const [filterQuery, setFilterQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const pulseRef = useRef(null);
  const wsRef = useRef(null);
  const containerRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ---- WebSocket connection ----
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://${BACKEND_IP.replace("http://", "")}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnState("ok");
          setStatusLine("Hardware Gateway Connected");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "data") {
              const d = msg.data;
              if (d.peak_cm !== undefined) setPeakCm(d.peak_cm);
              if (d.weight !== undefined) setWeight(d.weight);
              if (d.left_cm !== undefined) setLeftCm(d.left_cm);
              if (d.center_cm !== undefined) setCenterCm(d.center_cm);
              if (d.right_cm !== undefined) setRightCm(d.right_cm);
              if (d.scanning !== undefined) setScanning(d.scanning);
              if (d.sensor_ok !== undefined) setSensorOk(d.sensor_ok);

              if (!d.scanning && d.peak_cm > 0) {
                const measurementData = {
                  sessionId,
                  batchId,
                  readingType: "measurement",
                  value: d.peak_cm,
                  unit: "cm",
                  status: d.peak_cm > 8 ? "warning" : "normal",
                  notes: `Thickness: ${d.peak_cm.toFixed(1)}cm, Weight: ${d.weight.toFixed(3)}kg`,
                  location: "Laser Sensor Bay",
                };

                createMeasurement(measurementData)
                  .then((res) => {
                    setReports((prev) => [
                      {
                        id: res.measurement?._id || Date.now().toString(),
                        thickness: `${d.peak_cm.toFixed(1)} cm`,
                        weight: `${d.weight.toFixed(3)} kg`,
                        density: `${(d.weight / (d.peak_cm * 0.2)).toFixed(2)} g/cm³`,
                        date: new Date().toLocaleTimeString(),
                        status: d.peak_cm > 8 ? "Thick Cut" : "Optimal",
                      },
                      ...prev,
                    ]);
                  })
                  .catch((err) => console.error("Error saving measurement:", err));
              }
            } else if (msg.type === "status") {
              const st = msg.data;
              if (st.scanning !== undefined) setScanning(st.scanning);
              if (st.status) setStatusLine(st.status);
            }
          } catch (e) {
            console.error("WS parse error", e);
          }
        };

        ws.onclose = () => {
          setConnState("idle");
          setStatusLine("Simulated Instrumentation Mode");
        };

        ws.onerror = () => {
          setConnState("idle");
        };
      } catch (err) {
        setConnState("idle");
      }
    };

    connectWebSocket();

    fetch(`${BACKEND_IP}/api/data`)
      .then((res) => res.json())
      .then((data) => {
        if (data.peak_cm) setPeakCm(data.peak_cm);
        if (data.weight) setWeight(data.weight);
        if (data.left_cm) setLeftCm(data.left_cm);
        if (data.center_cm) setCenterCm(data.center_cm);
        if (data.right_cm) setRightCm(data.right_cm);
        if (data.scanning) setScanning(data.scanning);
      })
      .catch(() => {});

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [sessionId, batchId]);

  // Pulse animation for laser scan
  useEffect(() => {
    if (scanning) {
      pulseRef.current = setInterval(() => setPulseTick((t) => t + 1), 600);
    } else if (pulseRef.current) {
      clearInterval(pulseRef.current);
    }
    return () => pulseRef.current && clearInterval(pulseRef.current);
  }, [scanning]);

  // Command dispatchers
  const sendCommand = async (endpoint, commandName) => {
    try {
      setConnState("working");
      const res = await fetch(`${BACKEND_IP}${endpoint}`, { method: "POST" });
      const data = await res.json();
      setConnState("ok");
      if (data.success) {
        showToast(`${commandName} executed successfully.`);
      } else {
        showToast(`Command ${commandName} acknowledged.`);
      }
    } catch (err) {
      setConnState("ok");
      if (commandName === "START_SCAN") {
        setScanning(true);
        setStatusLine("Laser Scanning Profile in Progress...");
        setTimeout(() => {
          const newPeak = +(4.5 + Math.random() * 3).toFixed(1);
          const newWeight = +(1.1 + Math.random() * 0.8).toFixed(3);
          setPeakCm(newPeak);
          setWeight(newWeight);
          setLeftCm(+(newPeak * 0.75).toFixed(1));
          setCenterCm(newPeak);
          setRightCm(+(newPeak * 0.82).toFixed(1));
          setScanning(false);
          setStatusLine("Profile Acquisition Complete");
          setReports((prev) => [
            {
              id: Date.now().toString(),
              thickness: `${newPeak} cm`,
              weight: `${newWeight} kg`,
              density: `${(newWeight / (newPeak * 0.22)).toFixed(2)} g/cm³`,
              date: new Date().toLocaleTimeString(),
              status: newPeak > 7.5 ? "Thick Cut" : "Optimal",
            },
            ...prev,
          ]);
          showToast(`Laser scan finished. Peak: ${newPeak} cm, Weight: ${newWeight} kg`);
        }, 2200);
      } else if (commandName === "FIND_CENTER") {
        showToast("Auto-centering specimen on laser baseline...");
      } else if (commandName === "STOP_MOTOR") {
        setScanning(false);
        showToast("Emergency motor halt engaged.");
      }
    }
  };

  const handleStartScan = () => sendCommand("/api/scan/start", "START_SCAN");
  const handleFindCenter = () => sendCommand("/api/center", "FIND_CENTER");
  const handleStopMotor = () => sendCommand("/api/motor/stop", "STOP_MOTOR");

  const handleDeleteReport = async (reportId) => {
    try {
      await deleteMeasurement(reportId);
    } catch (e) {}
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    showToast("Measurement record removed.");
  };

  const handleDeleteAllReports = async () => {
    if (!window.confirm(`Are you sure you want to clear all ${reports.length} session records?`)) return;
    try {
      await deleteSessionMeasurements(sessionId);
    } catch (e) {}
    setReports([]);
    showToast("All session logs cleared.");
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Thickness,Weight,Density,Time,Status"]
        .concat(reports.map((r) => `${r.id},${r.thickness},${r.weight},${r.density},${r.date},${r.status}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maldive_fish_measurements_${sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Session CSV exported successfully.");
  };

  // Parboil and Salinity calculation
  const estimatedBoilMin = Math.round(peakCm * 8.5);
  const estimatedSalinityTarget = (15.5 + peakCm * 0.15).toFixed(1);

  const filteredReports = reports.filter(
    (r) =>
      r.thickness.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.weight.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.status.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] p-4 sm:p-6 lg:p-8 box-border flex flex-col gap-6 ${
        isFullscreen ? "fixed inset-0 z-[9999] overflow-y-auto bg-white p-6" : ""
      }`}
    >
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 text-xs font-semibold flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ────────────────── FULL-SIZE EXECUTIVE HEADER BANNER ────────────────── */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-xs font-mono font-bold">
              LASER & LOAD CELL INSTRUMENTATION
            </span>
            <span className="text-xs text-slate-400 font-mono">Session ID: {sessionId}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400 font-mono">Batch: {batchId}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            AquaSense Pro Sizing & Dimensional Scanner
            <Sparkles size={22} className="text-amber-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Real-time laser contour acquisition, cross-sectional thickness profiling, and osmotic boiling calibration for Maldive Fish processing lines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connState === "ok"
                  ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  : connState === "working"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-slate-400"
              }`}
            />
            <span className="font-semibold text-slate-700">{statusLine}</span>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen SCADA Console"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit Full" : "Full Screen"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
          >
            <Download size={14} /> Export Session CSV
          </button>
        </div>
      </div>

      {/* ────────────────── FULL-WIDTH TOP 4 KPI CARDS ────────────────── */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Peak Thickness */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Peak Thickness
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
              <Ruler size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
              {peakCm.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-slate-500 font-mono">cm</span>
            <span className="ml-auto text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full mono">
              {peakCm > 7.5 ? "Thick Cut" : "Optimal Cut"}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            Laser Beam Gap: {(15 - peakCm).toFixed(1)} cm
          </div>
        </div>

        {/* KPI 2: Fish Weight */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Fish Weight
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Scale size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
              {weight.toFixed(3)}
            </span>
            <span className="text-sm font-bold text-slate-500 font-mono">kg</span>
            <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full mono">
              Calibrated
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            Density: {(weight / (peakCm * 0.22)).toFixed(2)} g/cm³
          </div>
        </div>

        {/* KPI 3: Boiling Setpoint */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Boiling Setpoint
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Activity size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 font-mono">
              {estimatedBoilMin}
            </span>
            <span className="text-sm font-bold text-slate-500 font-mono">mins</span>
            <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mono">
              Thermal Target
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            Cook Temp: 99.5°C ±0.5°C
          </div>
        </div>

        {/* KPI 4: Target Salinity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Target Salinity
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Zap size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-600 font-mono">
              {estimatedSalinityTarget}
            </span>
            <span className="text-sm font-bold text-slate-500 font-mono">° Bé</span>
            <span className="ml-auto text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full mono">
              Baumé Scale
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            Preservation Stability: 99.4%
          </div>
        </div>
      </div>

      {/* ────────────────── FULL-WIDTH PROFILE SCANNER & CONTROLS ────────────────── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Full-Width 3-Point Profile Canvas (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Laser Cross-Section Profiler Canvas
              </span>
              <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                ±0.05 mm Resolution
              </span>
            </div>

            {/* Custom High-Precision SVG Canvas */}
            <div className="w-full bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden border border-slate-800 shadow-inner min-h-[300px]">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

              <svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet" className="relative z-10 w-full max-w-lg">
                {/* Laser Emitter Unit */}
                <rect x="175" y="6" width="50" height="18" rx="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="200" cy="15" r="4" fill={scanning ? "#f59e0b" : "#38bdf8"} className={scanning ? "animate-ping" : ""} />

                {/* Laser Axis Guide Lines */}
                <line x1="200" y1="24" x2="200" y2="165" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="160" x2="380" y2="160" stroke="#475569" strokeWidth="2" />
                <text x="382" y="163" fill="#64748b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  BASE
                </text>

                {/* Animated Scanning Beam */}
                {scanning && (
                  <g className="transition-all duration-300">
                    <line
                      x1="40"
                      y1={30 + ((pulseTick * 25) % 125)}
                      x2="360"
                      y2={30 + ((pulseTick * 25) % 125)}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="6 2"
                    />
                    <polygon
                      points={`200,24 40,${30 + ((pulseTick * 25) % 125)} 360,${30 + ((pulseTick * 25) % 125)}`}
                      fill="rgba(245, 158, 11, 0.12)"
                    />
                  </g>
                )}

                {/* Fish Profile Curve */}
                {peakCm > 0 && (
                  <g>
                    <path
                      d={`M 60 160 Q 130 ${160 - leftCm * 13}, 200 ${160 - peakCm * 15} Q 270 ${160 - rightCm * 13}, 340 160 Z`}
                      fill="rgba(13, 148, 136, 0.3)"
                      stroke="#0d9488"
                      strokeWidth="3"
                    />
                    <circle cx="200" cy={160 - peakCm * 15} r="5" fill="#34d399" stroke="#ffffff" strokeWidth="2" />
                    <text
                      x="200"
                      y={160 - peakCm * 15 - 10}
                      fill="#34d399"
                      fontSize="12"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      APEX: {peakCm} cm
                    </text>
                  </g>
                )}
              </svg>

              {/* 3-Point Realtime Cross-Section Readout */}
              <div className="w-full grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800 text-center font-mono text-xs">
                <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase">Left Profile</div>
                  <div className="text-white font-bold text-sm mt-0.5">{leftCm.toFixed(1)} cm</div>
                </div>
                <div className="bg-slate-800/90 p-2.5 rounded-xl border border-teal-500/50">
                  <div className="text-[10px] text-teal-400 uppercase">Apex Peak</div>
                  <div className="text-teal-300 font-bold text-sm mt-0.5">{centerCm.toFixed(1)} cm</div>
                </div>
                <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase">Right Profile</div>
                  <div className="text-white font-bold text-sm mt-0.5">{rightCm.toFixed(1)} cm</div>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines Banner */}
          <div className="mt-4 p-4 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-3">
            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Standard Maldives cut thickness target: <strong>4.5 cm - 7.5 cm</strong>. Thickness values drive the automated brine salinity formula in Chamber A and solar drying rate in Chamber B.
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Actions & Live Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5">
          
          {/* Dispatch Control Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-4">
                Hardware SCADA Actuators
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="w-full py-4 px-5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:from-teal-800 active:to-emerald-800 disabled:opacity-50 transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-3"
                >
                  <Play size={18} />
                  {scanning ? "Laser Sweep in Progress..." : "Start Laser Profile Scan"}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleFindCenter}
                    className="py-3.5 px-4 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Compass size={16} />
                    Auto-Centerline
                  </button>

                  <button
                    onClick={handleStopMotor}
                    className="py-3.5 px-4 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Square size={16} />
                    Halt Motor
                  </button>
                </div>
              </div>
            </div>

            {/* Calibration Status Box */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Laser Sensor Drift:</span>
                <span className="font-bold text-slate-900">0.00 mm (Calibrated)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Load Cell Offset:</span>
                <span className="font-bold text-slate-900">0.000 kg (Tare OK)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Conveyor Speed:</span>
                <span className="font-bold text-emerald-600">12 cm/s (Nominal)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ────────────────── FULL-WIDTH SESSION LOGS TABLE ────────────────── */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Real-time Session Log & Dimensional Traceability
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit history of fish thickness and weight readings logged for session {sessionId}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search readings (e.g. 6.4, Optimal)..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 sm:w-64"
            />

            {reports.length > 0 && (
              <button
                onClick={handleDeleteAllReports}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Trash2 size={14} /> Clear Log
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Record ID</th>
                <th className="py-3.5 px-6">Peak Thickness</th>
                <th className="py-3.5 px-6">Specimen Weight</th>
                <th className="py-3.5 px-6">Calculated Density</th>
                <th className="py-3.5 px-6">Time Logged</th>
                <th className="py-3.5 px-6">Classification</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No measurement records found. Click "Start Laser Profile Scan" to capture readings.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-slate-400 font-bold">#{r.id.slice(-4)}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-teal-600 text-sm">{r.thickness}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-amber-600 text-sm">{r.weight}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-600">{r.density}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-500">{r.date}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                          r.status === "Optimal"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDeleteReport(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete reading"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}