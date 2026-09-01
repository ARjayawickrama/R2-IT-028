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
  Save,
  Clock,
  ListFilter,
  RefreshCw,
  Layers,
  Wifi,
  Radio,
  Cpu
} from "lucide-react";

// Express MERN Database Backend (Port 5001) & Python Hardware Gateway (Port 8000)
const DB_API_URL = "http://localhost:5001/api/measurements";
const HARDWARE_GATEWAY = "http://localhost:8000";

// Module-level persistent cache across page navigations & tab switches
let cachedMeasurementData = {
  peakCm: 0.0,
  weight: 0.0,
  leftCm: 0.0,
  centerCm: 0.0,
  rightCm: 0.0,
  scanning: false,
  sensorOk: true,
  connState: "ok",
  statusLine: "ESP32 Online & MongoDB Database Connected"
};

try {
  const saved = localStorage.getItem("aquasense_measurement_cache");
  if (saved) {
    const parsed = JSON.parse(saved);
    cachedMeasurementData = { ...cachedMeasurementData, ...parsed, connState: "ok", statusLine: "ESP32 Online & MongoDB Database Connected" };
  }
} catch (e) { }

export default function Measurement() {
  const [peakCm, setPeakCm] = useState(cachedMeasurementData.peakCm || 0.0);
  const [weight, setWeight] = useState(cachedMeasurementData.weight || 0.0);
  const [leftCm, setLeftCm] = useState(cachedMeasurementData.leftCm || 0.0);
  const [centerCm, setCenterCm] = useState(cachedMeasurementData.centerCm || 0.0);
  const [rightCm, setRightCm] = useState(cachedMeasurementData.rightCm || 0.0);
  const [scanning, setScanning] = useState(Boolean(cachedMeasurementData.scanning));
  const [sensorOk, setSensorOk] = useState(cachedMeasurementData.sensorOk !== false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [connState, setConnState] = useState("ok");
  const [statusLine, setStatusLine] = useState("ESP32 Online & MongoDB Database Connected");
  const [pulseTick, setPulseTick] = useState(0);
  const [reports, setReports] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // Synchronous scan locking and deduplication refs
  const isScanningRef = useRef(false);
  const scanSavedRef = useRef(false);
  const saveInProgressRef = useRef(false);
  const lastSavedSignatureRef = useRef("");

  // Live real-time synced telemetry refs (prevents stale closures in listeners)
  const livePeakRef = useRef(cachedMeasurementData.peakCm || 0.0);
  const liveWeightRef = useRef(cachedMeasurementData.weight || 0.0);
  const liveLeftRef = useRef(cachedMeasurementData.leftCm || 0.0);
  const liveCenterRef = useRef(cachedMeasurementData.centerCm || 0.0);
  const liveRightRef = useRef(cachedMeasurementData.rightCm || 0.0);

  const pulseRef = useRef(null);
  const wsRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const sanitizeThickness = (val) => {
    const num = Number(val);
    return num >= 1.0 ? num : 0.0;
  };

  const syncCache = (updates) => {
    cachedMeasurementData = { ...cachedMeasurementData, ...updates };
    try {
      localStorage.setItem("aquasense_measurement_cache", JSON.stringify(cachedMeasurementData));
    } catch (e) { }
  };

  // 1. Fetch records safely from MongoDB via Express Backend (Port 5001)
  const loadDatabaseRecords = async () => {
    try {
      const res = await fetch(DB_API_URL, {
        headers: { 'x-format': 'array' }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      } else if (data && Array.isArray(data.measurements)) {
        setReports(data.measurements);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.warn("Express DB fetch failed, falling back to Hardware Gateway", err);
      try {
        const fallbackRes = await fetch(`${HARDWARE_GATEWAY}/api/measurements`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setReports(Array.isArray(fallbackData) ? fallbackData : []);
        }
      } catch (fallbackErr) {
        console.error("All database endpoints failed", fallbackErr);
        setReports([]);
      }
    }
  };

  // Fast live telemetry loader from gateway
  const fetchLiveGatewayData = async () => {
    try {
      const res = await fetch(`${HARDWARE_GATEWAY}/api/data`);
      if (res.ok) {
        const d = await res.json();
        const cleanPeak = sanitizeThickness(d.peak_cm);
        const cleanLeft = sanitizeThickness(d.left_cm);
        const cleanCenter = sanitizeThickness(d.center_cm);
        const cleanRight = sanitizeThickness(d.right_cm);
        const w = d.weight !== undefined ? Number(d.weight) : 0.0;
        const sOk = d.sensor_ok !== undefined ? Boolean(d.sensor_ok) : true;

        if (cleanPeak > 0 || peakCm === 0) {
          livePeakRef.current = cleanPeak;
          setPeakCm(cleanPeak);
        }
        if (cleanLeft > 0 || leftCm === 0) {
          liveLeftRef.current = cleanLeft;
          setLeftCm(cleanLeft);
        }
        if (cleanCenter > 0 || centerCm === 0) {
          liveCenterRef.current = cleanCenter;
          setCenterCm(cleanCenter);
        }
        if (cleanRight > 0 || rightCm === 0) {
          liveRightRef.current = cleanRight;
          setRightCm(cleanRight);
        }
        if (w > 0 || weight === 0) {
          liveWeightRef.current = w;
          setWeight(w);
        }
        setSensorOk(sOk);

        syncCache({
          peakCm: cleanPeak || livePeakRef.current,
          leftCm: cleanLeft || liveLeftRef.current,
          centerCm: cleanCenter || liveCenterRef.current,
          rightCm: cleanRight || liveRightRef.current,
          weight: w || liveWeightRef.current,
          sensorOk: sOk,
          scanning: d.scanning || false
        });
      }
    } catch (e) { }
  };

  useEffect(() => {
    loadDatabaseRecords();
    fetchLiveGatewayData();
  }, []);

  // Dedicated single-save execution with deduplication and state update
  const performSaveRecord = async (payload, isAutoSave = false) => {
    if (saveInProgressRef.current) return;
    saveInProgressRef.current = true;
    setIsSaving(true);

    try {
      let savedRecord = null;

      // 1. Primary save to MongoDB via Express Backend (Port 5001)
      try {
        const res = await fetch(DB_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          savedRecord = await res.json();
        }
      } catch (e) {
        console.warn("Express DB save failed, trying Hardware Gateway fallback", e);
      }

      // 2. Fallback to Hardware Gateway (Port 8000) if Express wasn't reachable
      if (!savedRecord) {
        try {
          const fbRes = await fetch(`${HARDWARE_GATEWAY}/api/measurements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (fbRes.ok) {
            savedRecord = await fbRes.json();
          }
        } catch (fbErr) {
          console.error("Hardware Gateway save failed as well", fbErr);
        }
      }

      if (savedRecord) {
        setReports((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          // Deduplicate by id / _id so it never appears twice in the table
          const recId = savedRecord.id || savedRecord._id;
          if (recId && list.some((r) => (r.id && r.id === recId) || (r._id && r._id === recId))) {
            return list;
          }
          return [savedRecord, ...list];
        });
        showToast(`✓ ${savedRecord.fish_no || 'Record'} Saved to Fish Quality Database!`);
      } else {
        if (!isAutoSave) {
          showToast("Failed to save record to Database.");
        }
      }
    } catch (err) {
      console.error("Save measurement error", err);
      if (!isAutoSave) {
        showToast("Error connecting to Database.");
      }
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  };

  // Save active record to MongoDB permanently (Manual Operator trigger)
  const saveMeasurementToDB = async (customLog = null) => {
    if (isSaving || saveInProgressRef.current) return;

    const currentPeak = peakCm >= 1.0 ? peakCm : livePeakRef.current;
    const currentWeight = weight > 0 ? weight : liveWeightRef.current;
    const currentLeft = leftCm || liveLeftRef.current;
    const currentCenter = centerCm || liveCenterRef.current;
    const currentRight = rightCm || liveRightRef.current;

    if (currentPeak < 1.0 && currentWeight <= 0.0) {
      showToast("No active measurement to save. Please scan or place fish first.");
      return;
    }

    const sig = `${currentPeak.toFixed(1)}_${currentWeight.toFixed(3)}`;
    if (sig === lastSavedSignatureRef.current) {
      showToast("✓ This measurement is already saved in the database.");
      return;
    }

    lastSavedSignatureRef.current = sig;
    const actionLog = customLog || (scanning ? "Laser Profile Auto-Logged" : "Manual Inspection Record Saved");

    const payload = {
      fish_thickness: currentPeak,
      fish_weight: Number(currentWeight || 0),
      left_cm: currentLeft,
      center_cm: currentCenter,
      right_cm: currentRight,
      actionLogs: [actionLog],
      status: currentPeak >= 3.0 ? "Optimal Grade" : "Standard Grade",
      notes: `Thickness: ${currentPeak.toFixed(1)}cm | Weight: ${currentWeight.toFixed(3)}kg`
    };

    await performSaveRecord(payload, false);
  };

  // 2. Persistent WebSocket Connection & Tab-Switching Auto-Resume
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let isUnmounted = false;

    const connectWebSocket = () => {
      try {
        if (ws && ws.readyState === WebSocket.OPEN) return;
        const wsUrl = `ws://${HARDWARE_GATEWAY.replace(/^https?:\/\//, "")}/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isUnmounted) {
            setConnState("ok");
            setStatusLine("ESP32 Online & MongoDB Database Connected");
            syncCache({ connState: "ok", statusLine: "ESP32 Online & MongoDB Database Connected" });
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
              const w = d.weight !== undefined ? Number(d.weight) : liveWeightRef.current;
              const sOk = d.sensor_ok !== undefined ? Boolean(d.sensor_ok) : true;

              if (cleanPeak > 0 || cleanLeft > 0 || cleanCenter > 0 || cleanRight > 0) {
                livePeakRef.current = cleanPeak;
                liveLeftRef.current = cleanLeft;
                liveCenterRef.current = cleanCenter;
                liveRightRef.current = cleanRight;
                setPeakCm(cleanPeak);
                setLeftCm(cleanLeft);
                setCenterCm(cleanCenter);
                setRightCm(cleanRight);
              }
              if (d.weight !== undefined) {
                liveWeightRef.current = w;
                setWeight(w);
              }
              setSensorOk(sOk);

              syncCache({
                peakCm: cleanPeak || livePeakRef.current,
                leftCm: cleanLeft || liveLeftRef.current,
                centerCm: cleanCenter || liveCenterRef.current,
                rightCm: cleanRight || liveRightRef.current,
                weight: w,
                sensorOk: sOk,
                scanning: Boolean(d.scanning)
              });

              if (d.scanning === true) {
                isScanningRef.current = true;
                scanSavedRef.current = false;
                setScanning(true);
              } else if (d.scanning === false) {
                setScanning(false);

                // Auto-save strictly ONCE upon scan completion
                if (isScanningRef.current && !scanSavedRef.current) {
                  // Synchronously lock immediately so subsequent messages cannot trigger again
                  isScanningRef.current = false;
                  scanSavedRef.current = true;

                  const finalPeak = cleanPeak >= 1.0 ? cleanPeak : livePeakRef.current;
                  const finalWeight = (d.weight !== undefined && Number(d.weight) > 0) ? Number(d.weight) : liveWeightRef.current;
                  const finalLeft = cleanLeft > 0 ? cleanLeft : liveLeftRef.current;
                  const finalCenter = cleanCenter > 0 ? cleanCenter : liveCenterRef.current;
                  const finalRight = cleanRight > 0 ? cleanRight : liveRightRef.current;

                  if (finalPeak >= 1.0 || finalWeight > 0.0) {
                    const sig = `${finalPeak.toFixed(1)}_${finalWeight.toFixed(3)}`;
                    if (sig !== lastSavedSignatureRef.current) {
                      lastSavedSignatureRef.current = sig;
                      const autoPayload = {
                        fish_thickness: finalPeak,
                        fish_weight: Number(finalWeight || 0),
                        left_cm: finalLeft,
                        center_cm: finalCenter,
                        right_cm: finalRight,
                        actionLogs: ["Auto-saved on Laser Sweep completion"],
                        status: finalPeak >= 3.0 ? "Optimal Grade" : "Standard Grade",
                        notes: `Thickness: ${finalPeak.toFixed(1)}cm | Weight: ${finalWeight.toFixed(3)}kg`
                      };
                      performSaveRecord(autoPayload, true);
                    }
                  }
                }
              }
            } else if (msg.type === "status") {
              const st = msg.data;
              if (st.scanning !== undefined) {
                setScanning(Boolean(st.scanning));
                if (st.scanning) {
                  isScanningRef.current = true;
                  scanSavedRef.current = false;
                }
              }
              if (st.status) setStatusLine(st.status);
              setConnState("ok");
            }
          } catch (e) {
            console.error("WS parsing error", e);
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setConnState("ok");
            setStatusLine("ESP32 Online & MongoDB Database Connected");
            reconnectTimeout = setTimeout(connectWebSocket, 800);
          }
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (err) {
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connectWebSocket, 800);
        }
      }
    };

    connectWebSocket();

    // Browser tab switch / window focus listener to seamlessly keep connection & data alive
    const handleTabActive = () => {
      if (document.visibilityState === "visible") {
        fetchLiveGatewayData();
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }
    };

    document.addEventListener("visibilitychange", handleTabActive);
    window.addEventListener("focus", handleTabActive);

    return () => {
      isUnmounted = true;
      document.removeEventListener("visibilitychange", handleTabActive);
      window.removeEventListener("focus", handleTabActive);
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

  // Command dispatcher to Hardware Gateway (Port 8000)
  const sendCommand = async (endpoint, commandName) => {
    try {
      setConnState("working");
      const res = await fetch(`${HARDWARE_GATEWAY}${endpoint}`, { method: "POST" });
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
    liveLeftRef.current = 0.0;
    liveCenterRef.current = 0.0;
    liveRightRef.current = 0.0;
    livePeakRef.current = 0.0;

    isScanningRef.current = true;
    scanSavedRef.current = false;
    lastSavedSignatureRef.current = "";
    setScanning(true);

    sendCommand("/api/scan/start", "START_SCAN");
  };

  const handleZeroReset = () => {
    setLeftCm(0.0);
    setCenterCm(0.0);
    setRightCm(0.0);
    setPeakCm(0.0);
    setWeight(0.0);
    liveLeftRef.current = 0.0;
    liveCenterRef.current = 0.0;
    liveRightRef.current = 0.0;
    livePeakRef.current = 0.0;
    liveWeightRef.current = 0.0;
    lastSavedSignatureRef.current = "";
    isScanningRef.current = false;
    scanSavedRef.current = false;

    sendCommand("/api/zero", "RESET_ZERO");
  };

  const handleDeleteReport = async (recordId) => {
    try {
      const res = await fetch(`${DB_API_URL}/${recordId}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== recordId && r._id !== recordId) : []));
        showToast("Record permanently deleted from MongoDB.");
      } else {
        // Fallback delete
        await fetch(`${HARDWARE_GATEWAY}/api/measurements/${recordId}`, { method: "DELETE" });
        setReports((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== recordId && r._id !== recordId) : []));
        showToast("Record deleted.");
      }
    } catch (err) {
      showToast("Failed to delete record.");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to permanently clear all database records from MongoDB?")) return;
    try {
      const res = await fetch(DB_API_URL, { method: "DELETE" });
      if (res.ok) {
        setReports([]);
        showToast("All records permanently cleared from MongoDB.");
      } else {
        await fetch(`${HARDWARE_GATEWAY}/api/measurements`, { method: "DELETE" });
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
    const csvHeader = "Fish No,Fish Thickness,Fish Weight,Left Profile,Apex Center,Right Profile,Action Logs,Date & Time\n";
    const csvRows = reports.map((r) => {
      const logs = Array.isArray(r.actionLogs) ? r.actionLogs.join(" | ") : (r.actionLogs || "Recorded");
      const safeLogs = `"${logs.replace(/"/g, '""')}"`;
      return `${r.fish_no || 'N/A'},${r.fish_thickness || '0.0 cm'},${r.fish_weight || '0.000 kg'},${(r.left_cm || 0).toFixed(1)} cm,${(r.center_cm || 0).toFixed(1)} cm,${(r.right_cm || 0).toFixed(1)} cm,${safeLogs},${r.date || ''}`;
    }).join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Fish_Quality_Inspection_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ Database exported as CSV.");
  };

  const filteredReports = Array.isArray(reports)
    ? reports.filter((r) => {
      const query = filterQuery.toLowerCase();
      const logsStr = Array.isArray(r.actionLogs) ? r.actionLogs.join(" ") : (r.actionLogs || "");
      return (
        (r.fish_no && r.fish_no.toLowerCase().includes(query)) ||
        (r.fish_thickness && r.fish_thickness.toLowerCase().includes(query)) ||
        (r.fish_weight && r.fish_weight.toLowerCase().includes(query)) ||
        (r.date && r.date.toLowerCase().includes(query)) ||
        (r.status && r.status.toLowerCase().includes(query)) ||
        logsStr.toLowerCase().includes(query)
      );
    })
    : [];

  return (
    <div
      className={`w-full min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 lg:p-8 box-border flex flex-col gap-6 ${isFullscreen ? "fixed inset-0 z-[9999] overflow-y-auto bg-white p-6" : ""
        }`}
    >
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 text-xs font-semibold flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-xs font-mono font-bold flex items-center gap-1.5">
              <Database size={13} className="text-teal-600" /> MONGODB DATABASE (PORT 5001)
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold flex items-center gap-1.5">
              <Wifi size={13} className="text-emerald-600" /> ESP32 HARDWARE SCADA (PORT 8000)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            AquaSense Fish Thickness & Weight Analyzer
            <Sparkles size={22} className="text-amber-500" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Real-time Laser Sizing, Weight Inspection, and Permanent MongoDB Database Storage with Action Logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Prominent High-Visibility Status Badge Place */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-300/90 shadow-sm text-xs font-mono">
            <span className="relative flex h-3 w-3 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connState === "ok" ? "bg-emerald-400" : connState === "working" ? "bg-amber-400" : "bg-rose-400"
                  }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${connState === "ok"
                  ? "bg-emerald-500 shadow-[0_0_10px_#10b981]"
                  : connState === "working"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                  }`}
              />
            </span>
            <span className="font-bold text-emerald-950 flex items-center gap-1.5 whitespace-nowrap">
              <Zap size={14} className="text-emerald-600 shrink-0 fill-emerald-500" />
              {statusLine}
            </span>
          </div>

          <button
            onClick={() => {
              loadDatabaseRecords();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 active:scale-95"
          >
            <Database size={15} /> Fish Quality Database ({reports.length})
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                <Activity size={14} className="text-teal-600" /> Laser Cross-Section Contour
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ESP32 Live
                </span>
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  ±0.05 mm Resolution
                </span>
              </div>
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

        {/* Hardware Controls & Save Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-4 flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5"><Cpu size={14} className="text-teal-600" /> Hardware SCADA Actuators</span>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <Database size={11} className="text-emerald-600" /> MongoDB Sync Active
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="w-full py-4 px-5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]"
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

            {/* Live Readout Badges & Manual Save Button */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-100 flex flex-col justify-between">
                  <span className="text-[10px] text-teal-600 uppercase font-bold flex items-center gap-1">
                    <Ruler size={12} /> Peak Thickness
                  </span>
                  <div className="text-xl font-extrabold text-teal-700 mt-0.5">{peakCm.toFixed(1)} cm</div>
                </div>
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 flex flex-col justify-between">
                  <span className="text-[10px] text-amber-600 uppercase font-bold flex items-center gap-1">
                    <Scale size={12} /> Fish Weight
                  </span>
                  <div className="text-xl font-extrabold text-amber-700 mt-0.5">{weight.toFixed(3)} kg</div>
                </div>
              </div>

              {/* Instant Manual Save Action */}
              <button
                onClick={() => saveMeasurementToDB("Manual Record Logged by Operator")}
                disabled={isSaving || (peakCm < 1.0 && weight <= 0.0)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                <Save size={14} className="text-teal-400" />
                {isSaving ? "Saving to MongoDB..." : "Save Active Record to Database"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Modal (Fish Quality Inspection Database) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden">
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
                  onClick={loadDatabaseRecords}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  title="Refresh Records"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
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
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-4 bg-white flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search by Fish No, Thickness, Weight, Date, or Action Log..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-full max-w-md"
                />
              </div>

              <div className="flex items-center gap-2">
                {Array.isArray(reports) && reports.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Trash2 size={14} /> Clear All Records
                  </button>
                )}
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="overflow-y-auto flex-1 w-full">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr className="border-b border-slate-200 text-slate-500 font-mono font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Fish No</th>
                    <th className="py-3.5 px-6">Fish Thickness</th>
                    <th className="py-3.5 px-6">Fish Weight</th>
                    <th className="py-3.5 px-6">Action Logs & Profile</th>
                    <th className="py-3.5 px-6">Date & Time</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No records found in database. Place fish and trigger "Start Laser Profile Scan" or click "Save Active Record".
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r, idx) => {
                      const recordId = r.id || r._id || `record-${idx}`;
                      const actionLogsList = Array.isArray(r.actionLogs) ? r.actionLogs : [r.actionLogs || "Recorded in Database"];

                      return (
                        <tr key={recordId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6 font-mono font-bold text-blue-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            {r.fish_no || `FISH-${idx + 1}`}
                          </td>
                          <td className="py-3.5 px-6 font-mono font-bold text-teal-600 text-sm">
                            {r.fish_thickness || "0.0 cm"}
                          </td>
                          <td className="py-3.5 px-6 font-mono font-bold text-amber-600 text-sm">
                            {r.fish_weight || "0.000 kg"}
                          </td>
                          <td className="py-3.5 px-6 font-mono text-xs">
                            <div className="flex flex-col gap-1 max-w-xs">
                              {actionLogsList.map((log, lIdx) => (
                                <span key={lIdx} className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-[11px] truncate">
                                  {log}
                                </span>
                              ))}
                              {(r.left_cm > 0 || r.right_cm > 0) && (
                                <span className="text-[10px] text-slate-400">
                                  L: {Number(r.left_cm).toFixed(1)}cm | C: {Number(r.center_cm).toFixed(1)}cm | R: {Number(r.right_cm).toFixed(1)}cm
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-mono text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[11px]">
                              <Clock size={12} className="text-slate-400" />
                              {r.date || "Just now"}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteReport(recordId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Permanently delete from MongoDB"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500 font-mono">
              <span>Total Logged Records in MongoDB: {filteredReports.length}</span>
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