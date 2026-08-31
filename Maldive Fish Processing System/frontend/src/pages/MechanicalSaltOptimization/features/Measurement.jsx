import React, { useState, useEffect, useRef } from "react";
import {
  Ruler,
  Scale,
  Play,
  Square,
  Compass,
  RotateCcw,
  Trash2,
  Download,
  CheckCircle2,
  Sparkles,
  FileText,
  Activity,
  Zap,
  Maximize,
  Minimize,
  Database,
  X,
} from "lucide-react";

const BACKEND_IP = "http://localhost:8000";

export default function Measurement() {
  const [peakCm, setPeakCm] = useState(0.0);
  const [weight, setWeight] = useState(0.0);
  const [leftCm, setLeftCm] = useState(0.0);
  const [centerCm, setCenterCm] = useState(0.0);
  const [rightCm, setRightCm] = useState(0.0);
  const [scanning, setScanning] = useState(false);
  const [sensorOk, setSensorOk] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [connState, setConnState] = useState("idle");
  const [statusLine, setStatusLine] = useState("Connecting to Gateway...");
  const [pulseTick, setPulseTick] = useState(0);
  const [reports, setReports] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const prevScanningRef = useRef(false);
  const pulseRef = useRef(null);
  const wsRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const sanitizeThickness = (val) => {
    const num = Number(val);
    return num >= 1.0 ? num : 0.0;
  };

  // 1. Fetch records safely from MongoDB
  const loadDatabaseRecords = async () => {
    try {
      const res = await fetch(`${BACKEND_IP}/api/measurements`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error("Database fetch failed", err);
      setReports([]);
    }
  };

  useEffect(() => {
    loadDatabaseRecords();
  }, []);

  // 2. WebSocket Connection & Real-time Auto-Save
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let isUnmounted = false;

    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://${BACKEND_IP.replace(/^https?:\/\//, "")}/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isUnmounted) {
            setConnState("ok");
            setStatusLine("ESP32 Online & Database Connected");
          }
        };

        ws.onmessage = async (event) => {
          if (isUnmounted) return;
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "data") {
              const d = msg.data;
              const cleanPeak = sanitizeThickness(d.peak_cm);
              const cleanLeft = sanitizeThickness(d.left_cm);
              const cleanCenter = sanitizeThickness(d.center_cm);
              const cleanRight = sanitizeThickness(d.right_cm);

              setPeakCm(cleanPeak);
              setLeftCm(cleanLeft);
              setCenterCm(cleanCenter);
              setRightCm(cleanRight);

              if (d.weight !== undefined) setWeight(Number(d.weight));
              if (d.sensor_ok !== undefined) setSensorOk(Boolean(d.sensor_ok));

              if (d.scanning !== undefined) {
                if (prevScanningRef.current === true && d.scanning === false && cleanPeak >= 1.0) {
                  try {
                    const res = await fetch(`${BACKEND_IP}/api/measurements`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        fish_thickness: cleanPeak,
                        fish_weight: Number(d.weight || 0),
                      }),
                    });
                    if (res.ok) {
                      const savedRecord = await res.json();
                      setReports((prev) => (Array.isArray(prev) ? [savedRecord, ...prev] : [savedRecord]));
                      showToast(`${savedRecord.fish_no} Saved to Database!`);
                    }
                  } catch (err) {
                    console.error("Auto-save failed", err);
                  }
                }
                prevScanningRef.current = d.scanning;
                setScanning(d.scanning);
              }
            } else if (msg.type === "status") {
              const st = msg.data;
              if (st.scanning !== undefined) setScanning(st.scanning);
              if (st.status) setStatusLine(st.status);
            }
          } catch (e) {
            console.error("WS parsing error", e);
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setConnState("idle");
            setStatusLine("Gateway Disconnected. Retrying...");
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (err) {
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // Pulse animation during scan
  useEffect(() => {
    if (scanning) {
      pulseRef.current = setInterval(() => setPulseTick((t) => t + 1), 500);
    } else if (pulseRef.current) {
      clearInterval(pulseRef.current);
    }
    return () => pulseRef.current && clearInterval(pulseRef.current);
  }, [scanning]);

  // Command dispatcher
  const sendCommand = async (endpoint, commandName) => {
    try {
      setConnState("working");
      const res = await fetch(`${BACKEND_IP}${endpoint}`, { method: "POST" });
      await res.json();
      setConnState("ok");
      showToast(`${commandName} executed.`);
    } catch (err) {
      setConnState("error");
      showToast(`Command ${commandName} failed.`);
    }
  };

  const handleStartScan = () => {
    setLeftCm(0.0);
    setCenterCm(0.0);
    setRightCm(0.0);
    setPeakCm(0.0);
    sendCommand("/api/scan/start", "START_SCAN");
  };

  const handleZeroReset = () => {
    setLeftCm(0.0);
    setCenterCm(0.0);
    setRightCm(0.0);
    setPeakCm(0.0);
    setWeight(0.0);
    sendCommand("/api/zero", "RESET_ZERO");
  };

  const handleDeleteReport = async (recordId) => {
    try {
      const res = await fetch(`${BACKEND_IP}/api/measurements/${recordId}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== recordId) : []));
        showToast("Record deleted from Database.");
      }
    } catch (err) {
      showToast("Failed to delete record.");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all database records?")) return;
    try {
      const res = await fetch(`${BACKEND_IP}/api/measurements`, { method: "DELETE" });
      if (res.ok) {
        setReports([]);
        showToast("All records cleared.");
      }
    } catch (err) {
      showToast("Failed to clear database.");
    }
  };

  const handleExportCSV = () => {
    if (!Array.isArray(reports) || reports.length === 0) {
      showToast("No records to export.");
      return;
    }
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Fish No,Fish Thickness,Fish Weight,Date"]
        .concat(reports.map((r) => `${r.fish_no},${r.fish_thickness},${r.fish_weight},${r.date}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fish_Measurements_Database.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Database exported as CSV.");
  };

  const filteredReports = Array.isArray(reports)
    ? reports.filter(
        (r) =>
          (r.fish_no && r.fish_no.toLowerCase().includes(filterQuery.toLowerCase())) ||
          (r.fish_thickness && r.fish_thickness.toLowerCase().includes(filterQuery.toLowerCase())) ||
          (r.fish_weight && r.fish_weight.toLowerCase().includes(filterQuery.toLowerCase())) ||
          (r.date && r.date.toLowerCase().includes(filterQuery.toLowerCase()))
      )
    : [];

  return (
    <div
      className={`w-full min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 lg:p-8 box-border flex flex-col gap-6 ${
        isFullscreen ? "fixed inset-0 z-[9999] overflow-y-auto bg-white p-6" : ""
      }`}
    >
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-xs font-mono font-bold">
              DATABASE & HARDWARE GATEWAY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            AquaSense Fish Thickness & Weight Analyzer
            <Sparkles size={22} className="text-amber-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Real-time Laser Sizing, Weight Inspection, and Automatic MongoDB Database Storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connState === "ok"
                  ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                  : connState === "working"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span className="font-semibold text-slate-700">{statusLine}</span>
          </div>

          <button
            onClick={() => {
              loadDatabaseRecords();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20"
          >
            <Database size={15} /> View Database Records ({reports.length})
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit Full" : "Full Screen"}</span>
          </button>
        </div>
      </div>

      {/* Live Measurement Cards & SCADA Controls */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Laser Cross-Section Contour
              </span>
              <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                ±0.05 mm Resolution
              </span>
            </div>

            <div className="w-full bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden border border-slate-800 min-h-[260px]">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

              <svg width="100%" height="180" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid meet" className="relative z-10 w-full max-w-lg">
                <rect x="175" y="6" width="50" height="18" rx="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="200" cy="15" r="4" fill={scanning ? "#f59e0b" : "#38bdf8"} className={scanning ? "animate-ping" : ""} />

                <line x1="200" y1="24" x2="200" y2="155" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="150" x2="380" y2="150" stroke="#475569" strokeWidth="2" />
                <text x="382" y="153" fill="#64748b" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  BASE
                </text>

                {scanning && (
                  <g className="transition-all duration-300">
                    <line
                      x1="40"
                      y1={30 + ((pulseTick * 25) % 115)}
                      x2="360"
                      y2={30 + ((pulseTick * 25) % 115)}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="6 2"
                    />
                    <polygon
                      points={`200,24 40,${30 + ((pulseTick * 25) % 115)} 360,${30 + ((pulseTick * 25) % 115)}`}
                      fill="rgba(245, 158, 11, 0.12)"
                    />
                  </g>
                )}

                {peakCm >= 1.0 && (
                  <g>
                    <path
                      d={`M 60 150 Q 130 ${150 - leftCm * 13}, 200 ${150 - peakCm * 15} Q 270 ${150 - rightCm * 13}, 340 150 Z`}
                      fill="rgba(13, 148, 136, 0.3)"
                      stroke="#0d9488"
                      strokeWidth="3"
                    />
                    <circle cx="200" cy={150 - peakCm * 15} r="5" fill="#34d399" stroke="#ffffff" strokeWidth="2" />
                    <text
                      x="200"
                      y={150 - peakCm * 15 - 10}
                      fill="#34d399"
                      fontSize="12"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      MAX THICKNESS: {peakCm.toFixed(1)} cm
                    </text>
                  </g>
                )}
              </svg>

              <div className="w-full grid grid-cols-3 gap-3 mt-2 pt-3 border-t border-slate-800 text-center font-mono text-xs">
                <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase">Left Profile</div>
                  <div className="text-white font-bold text-sm">{leftCm.toFixed(1)} cm</div>
                </div>
                <div className="bg-slate-800/90 p-2 rounded-xl border border-teal-500/50">
                  <div className="text-[10px] text-teal-400 uppercase">Apex Peak</div>
                  <div className="text-teal-300 font-bold text-sm">{centerCm.toFixed(1)} cm</div>
                </div>
                <div className="bg-slate-800/90 p-2 rounded-xl border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase">Right Profile</div>
                  <div className="text-white font-bold text-sm">{rightCm.toFixed(1)} cm</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hardware Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-4">
                Hardware SCADA Actuators
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="w-full py-4 px-5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-3"
                >
                  <Play size={18} />
                  {scanning ? "Laser Sweep in Progress..." : "Start Laser Profile Scan"}
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => sendCommand("/api/center", "FIND_CENTER")}
                    disabled={scanning}
                    className="py-3 px-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Compass size={15} /> Centerline
                  </button>

                  <button
                    onClick={handleZeroReset}
                    disabled={scanning}
                    className="py-3 px-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={15} /> Zero / Tare
                  </button>

                  <button
                    onClick={() => sendCommand("/api/motor/stop", "STOP_MOTOR")}
                    className="py-3 px-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Square size={15} /> Halt Motor
                  </button>
                </div>
              </div>
            </div>

            {/* Live Readout Badges */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 font-mono">
              <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-100">
                <span className="text-[10px] text-teal-600 uppercase font-bold">Peak Thickness</span>
                <div className="text-xl font-extrabold text-teal-700 mt-0.5">{peakCm.toFixed(1)} cm</div>
              </div>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                <span className="text-[10px] text-amber-600 uppercase font-bold">Fish Weight</span>
                <div className="text-xl font-extrabold text-amber-700 mt-0.5">{weight.toFixed(3)} kg</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── POP-UP MODAL (DATABASE RECORDS) ────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText size={20} className="text-teal-600" />
                  Fish Quality Inspection Database
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanently saved records of fish max thickness and weights with action logs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Download size={14} /> Export CSV
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Search & Filter Bar */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
              <input
                type="text"
                placeholder="Search by Fish No or Date..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-64"
              />

              {Array.isArray(reports) && reports.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 size={14} /> Clear All Records
                </button>
              )}
            </div>

            {/* Modal Table Content */}
            <div className="overflow-y-auto flex-1 w-full">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr className="border-b border-slate-200 text-slate-500 font-mono font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Fish No</th>
                    <th className="py-3.5 px-6">Fish Thickness</th>
                    <th className="py-3.5 px-6">Fish Weight</th>
                    <th className="py-3.5 px-6">Date & Time</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No records found in database. Place fish and trigger "Start Laser Profile Scan".
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-blue-600">{r.fish_no}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-teal-600 text-sm">{r.fish_thickness}</td>
                        <td className="py-3.5 px-6 font-mono font-bold text-amber-600 text-sm">{r.fish_weight}</td>
                        <td className="py-3.5 px-6 font-mono text-slate-500">{r.date}</td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete record from database"
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

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500 font-mono">
              <span>Total Logged Records: {filteredReports.length}</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}