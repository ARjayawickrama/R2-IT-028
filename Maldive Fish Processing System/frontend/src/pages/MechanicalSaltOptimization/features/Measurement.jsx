import React, { useState, useEffect, useRef } from "react";
import {
  createMeasurement,
  getMeasurementsBySession,
  deleteMeasurement,
  deleteSessionMeasurements,
} from "../../../services/measurementApi";

const BACKEND_IP = "http://localhost:8000";

const FONT_DISPLAY = "'Space Grotesk', 'Segoe UI', sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

// ---- Single White / Light Color Theme -----------------------------------
const C = {
  ink: "#F4F7F6",
  panel: "#FFFFFF",
  panel2: "#F8FAFA",
  line: "#E2E8F0",
  lineBright: "#CBD5E1",
  foam: "#0F172A",
  mist: "#475569",
  mistDim: "#94A3B8",
  teal: "#0D9488",
  tealDim: "#CCFBF1",
  amber: "#D97706",
  amberDim: "#FEF3C7",
  coral: "#E11D48",
  coralDim: "#FFE4E6",
  overlay: "rgba(15, 23, 42, 0.45)",
};

export default function App() {
  // Session management
  const [sessionId] = useState("session_" + Date.now());
  const [batchId] = useState("batch_" + new Date().toISOString().slice(0, 10));

  // State for data from backend
  const [peakCm, setPeakCm] = useState(0);
  const [weight, setWeight] = useState(0);
  const [leftCm, setLeftCm] = useState(0);
  const [centerCm, setCenterCm] = useState(0);
  const [rightCm, setRightCm] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [sensorOk, setSensorOk] = useState(false);

  // Status and UI state
  const [connState, setConnState] = useState("idle");
  const [statusLine, setStatusLine] = useState("Waiting for data...");
  const [dialog, setDialog] = useState(null);
  const [pulseTick, setPulseTick] = useState(0);
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const pulseRef = useRef(null);
  const wsRef = useRef(null);

  // ---- WebSocket connection ----
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://${BACKEND_IP.replace("http://", "")}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnState("ok");
        setStatusLine("Connected to server");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "data") {
            const d = msg.data;
            setPeakCm(d.peak_cm || 0);
            setWeight(d.weight || 0);
            setLeftCm(d.left_cm || 0);
            setCenterCm(d.center_cm || 0);
            setRightCm(d.right_cm || 0);
            setScanning(d.scanning || false);
            setSensorOk(d.sensor_ok || false);
            
            // Save completed reading to MongoDB
            if (!d.scanning && d.peak_cm > 0) {
              const measurementData = {
                sessionId,
                batchId,
                readingType: "measurement",
                value: d.peak_cm,
                unit: "cm",
                status: d.peak_cm > 10 ? "warning" : "normal",
                notes: `Thickness: ${d.peak_cm.toFixed(1)}cm, Weight: ${d.weight.toFixed(3)}kg`,
                location: "Sensor Bay",
              };

              createMeasurement(measurementData)
                .then((res) => {
                  // Add to local reports for display
                  setReports((prev) => [
                    {
                      id: res.measurement._id,
                      thickness: `${d.peak_cm.toFixed(1)} cm`,
                      weight: `${d.weight.toFixed(3)} kg`,
                      date: new Date().toLocaleTimeString(),
                    },
                    ...prev,
                  ]);
                })
                .catch((err) => console.error("Error saving measurement:", err));
            }
          } else if (msg.type === "status") {
            const st = msg.data;
            setScanning(st.scanning || false);
            setStatusLine(st.status || "Unknown");
          }
        } catch (e) {
          console.error("WS parse error", e);
        }
      };

      ws.onclose = () => {
        setConnState("error");
        setStatusLine("WebSocket disconnected");
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws.close();
      };
    };

    connectWebSocket();

    // Initial REST sync
    fetch(`${BACKEND_IP}/api/data`)
      .then((res) => res.json())
      .then((data) => {
        setPeakCm(data.peak_cm || 0);
        setWeight(data.weight || 0);
        setLeftCm(data.left_cm || 0);
        setCenterCm(data.center_cm || 0);
        setRightCm(data.right_cm || 0);
        setScanning(data.scanning || false);
        setSensorOk(data.sensor_ok || false);
      })
      .catch(() => setConnState("error"));

    fetch(`${BACKEND_IP}/api/status`)
      .then((res) => res.json())
      .then((data) => {
        setStatusLine(data.status || "Unknown");
        setScanning(data.scanning || false);
      })
      .catch(() => {});

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // ---- Pulse animation for scanning ----
  useEffect(() => {
    if (scanning) {
      pulseRef.current = setInterval(() => setPulseTick((t) => t + 1), 900);
    } else if (pulseRef.current) {
      clearInterval(pulseRef.current);
    }
    return () => pulseRef.current && clearInterval(pulseRef.current);
  }, [scanning]);

  // ---- Keyboard shortcut: ESC to close modals ----
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDialog(null);
        setShowReports(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- API call wrappers ----
  const sendCommand = async (endpoint, commandName) => {
    try {
      const res = await fetch(`${BACKEND_IP}${endpoint}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDialog({
          tone: "success",
          title: "Command Sent",
          en: `${commandName} command was sent successfully.`,
          si: "විධානය සාර්ථකව යවන ලදී.",
        });
      } else {
        setDialog({
          tone: "error",
          title: "Command Failed",
          en: `Failed to send ${commandName}. Check connection.`,
          si: "විධානය අසාර්ථක විය.",
        });
      }
    } catch (err) {
      setDialog({
        tone: "error",
        title: "Network Error",
        en: `Could not reach the backend.`,
        si: "බැක්එන්ඩ් එකට සම්බන්ධ විය නොහැක.",
      });
    }
  };

  const handleStartScan = () => sendCommand("/api/scan/start", "START_SCAN");
  const handleFindCenter = () => sendCommand("/api/center", "FIND_CENTER");
  const handleStopMotor = () => sendCommand("/api/motor/stop", "STOP_MOTOR");

  // Load session measurements from MongoDB
  const loadSessionReports = async () => {
    setLoadingReports(true);
    try {
      const response = await getMeasurementsBySession(sessionId);
      const formattedReports = (response.measurements || []).map((m) => ({
        id: m._id,
        thickness: `${m.value.toFixed(1)} ${m.unit}`,
        weight: m.notes ? m.notes.split("Weight: ")[1]?.split(",")[0] || "N/A" : "N/A",
        date: new Date(m.timestamp).toLocaleTimeString(),
      }));
      setReports(formattedReports);
    } catch (error) {
      console.error("Error loading reports:", error);
      setDialog({
        tone: "error",
        title: "Load Failed",
        en: "Failed to load session reports",
        si: "සැසිය නාvancetreports පූරණය කළ නොහැක",
      });
    } finally {
      setLoadingReports(false);
    }
  };

  // Delete a single report
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Delete this reading?")) return;

    try {
      await deleteMeasurement(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setDialog({
        tone: "success",
        title: "Deleted",
        en: "Reading deleted successfully",
        si: "කියවුම සාර්ථකව මකා දැමුවා",
      });
    } catch (error) {
      console.error("Error deleting report:", error);
      setDialog({
        tone: "error",
        title: "Delete Failed",
        en: "Failed to delete reading",
        si: "කියවුම මකා දැමීම අසාර්ථක විය",
      });
    }
  };

  // Delete all session reports
  const handleDeleteAllReports = async () => {
    if (!window.confirm(`Delete all ${reports.length} readings?`)) return;

    try {
      await deleteSessionMeasurements(sessionId);
      setReports([]);
      setDialog({
        tone: "success",
        title: "Cleared",
        en: "All readings deleted successfully",
        si: "සියලු කියවීම් සාර්ථකව මකා දැමුවා",
      });
    } catch (error) {
      console.error("Error deleting all reports:", error);
      setDialog({
        tone: "error",
        title: "Clear Failed",
        en: "Failed to delete all readings",
        si: "සියලු කියවීම් මකා දැමීම අසාර්ථක විය",
      });
    }
  };

  const maxDisplay = 15;
  const ratio = Math.min(peakCm / maxDisplay, 1);
  const gaugeTop = 26;
  const gaugeBottom = 210;
  const gaugeSpan = gaugeBottom - gaugeTop;
  const surfaceY = gaugeBottom - ratio * gaugeSpan;

  const statusColor =
    connState === "error" ? C.coral : connState === "ok" ? C.teal : connState === "working" ? C.amber : C.mistDim;

  const toneColor = (tone) => (tone === "error" ? C.coral : tone === "success" ? C.teal : C.amber);
  const toneBg = (tone) => (tone === "error" ? C.coralDim : tone === "success" ? C.tealDim : C.amberDim);

  return (
    <div
      style={{
        background: C.ink,
        minHeight: "100vh",
        width: "100%",
        fontFamily: FONT_DISPLAY,
        color: C.foam,
      }}
      className="p-4 sm:p-6 lg:p-10"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes sweep { 0% { opacity: .2; } 50% { opacity: .9; } 100% { opacity: .2; } }
        @keyframes rise { from { transform: translateY(6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .aq-pulse-line { animation: sweep 0.9s ease-in-out infinite; }
        .aq-row-in { animation: rise 0.25s ease-out; }
        .aq-overlay { animation: fadeIn 0.15s ease-out; }
        .aq-dialog { animation: popIn 0.18s cubic-bezier(.2,.9,.3,1.1); }
        .aq-sheet { animation: slideUp 0.22s cubic-bezier(.2,.9,.3,1.1); }
        .aq-btn { transition: transform .12s ease, filter .12s ease, background .12s ease, border-color .12s ease; }
        .aq-btn:active { transform: scale(0.98); }
        .aq-btn:hover { filter: brightness(0.96); }
        .aq-scroll::-webkit-scrollbar { width: 6px; }
        .aq-scroll::-webkit-scrollbar-thumb { background: ${C.lineBright}; border-radius: 999px; }
      `}</style>

      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div>
            <div style={{ color: C.mist, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2.5, fontWeight: 600 }}>
              PRECISION MARINE INSTRUMENTATION
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginTop: 2, color: C.foam }}>AquaSense Pro</h1>
          </div>

          <div
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full"
            style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: statusColor,
                boxShadow: connState === "working" ? `0 0 8px ${statusColor}` : "none",
              }}
              className={connState === "working" ? "aq-pulse-line" : ""}
            />
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mist, fontWeight: 500 }}>{statusLine}</span>
          </div>
        </div>

        {/* Main Interface Panel */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-6 w-full shadow-sm"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <div className="grid sm:grid-cols-5 gap-8 items-center">
            {/* Visual Depth Gauge */}
            <div className="sm:col-span-2 flex flex-col items-center justify-center p-4 rounded-xl" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.mist, letterSpacing: 2, marginBottom: 12, fontWeight: 600 }}>
                PROFILE VISUALIZER
              </div>
              <svg width="130" height="236" viewBox="0 0 130 236" style={{ maxWidth: "100%", height: "auto" }}>
                <rect x="50" y="2" width="30" height="18" rx="4" fill={C.panel} stroke={C.lineBright} strokeWidth="1.5" />
                <circle cx="65" cy="11" r="3.5" fill={scanning ? C.amber : C.mistDim} />
                <line x1="65" y1="20" x2="65" y2="222" stroke={C.lineBright} strokeWidth="2" strokeDasharray="2 2" />
                <line x1="20" y1={gaugeBottom} x2="110" y2={gaugeBottom} stroke={C.mist} strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="112" y={gaugeBottom + 3} fontFamily={FONT_MONO} fontSize="8" fill={C.mist} fontWeight="600">
                  BASE
                </text>
                {scanning && (
                  <line
                    x1="25"
                    y1={gaugeTop + ((pulseTick * 23) % gaugeSpan)}
                    x2="105"
                    y2={gaugeTop + ((pulseTick * 23) % gaugeSpan)}
                    stroke={C.amber}
                    strokeWidth="2.5"
                    className="aq-pulse-line"
                  />
                )}
                {peakCm > 0 && (
                  <>
                    <rect x="25" y={surfaceY - 7} width="80" height="14" rx="7" fill={C.tealDim} stroke={C.teal} strokeWidth="1.5" />
                    <text x="65" y={surfaceY + 3} fontFamily={FONT_MONO} fontSize="9" fill={C.teal} textAnchor="middle" fontWeight="600">
                      PROFILE
                    </text>
                  </>
                )}
              </svg>
              <div className="mt-3 flex gap-4 text-xs" style={{ fontFamily: FONT_MONO, color: C.mist }}>
                <span>Left: <strong style={{ color: C.foam }}>{leftCm.toFixed(1)} cm</strong></span>
                <span>Center: <strong style={{ color: C.foam }}>{centerCm.toFixed(1)} cm</strong></span>
                <span>Right: <strong style={{ color: C.foam }}>{rightCm.toFixed(1)} cm</strong></span>
              </div>
            </div>

            {/* Numerical Readouts & Primary Actions */}
            <div className="sm:col-span-3 flex flex-col justify-between h-full gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: C.mist, fontWeight: 700 }}>PEAK THICKNESS</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 38, fontWeight: 600, color: C.teal, lineHeight: 1.1, marginTop: 4 }}>
                    {peakCm.toFixed(1)}
                    <span style={{ fontSize: 14, color: C.mist, marginLeft: 4, fontWeight: 400 }}>cm</span>
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: C.mist, fontWeight: 700 }}>WEIGHT</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 38, fontWeight: 600, color: C.amber, lineHeight: 1.1, marginTop: 4 }}>
                    {weight.toFixed(3)}
                    <span style={{ fontSize: 14, color: C.mist, marginLeft: 4, fontWeight: 400 }}>kg</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <button
                  onClick={handleStartScan}
                  disabled={scanning}
                  className="aq-btn rounded-xl py-3.5 px-4 text-sm font-bold tracking-wide"
                  style={{
                    background: scanning ? C.mistDim : C.teal,
                    color: "#FFFFFF",
                    opacity: scanning ? 0.8 : 1,
                    cursor: scanning ? "wait" : "pointer",
                    boxShadow: scanning ? "none" : `0 4px 12px ${C.teal}40`,
                  }}
                >
                  {scanning ? "Scanning…" : "Start Scan"}
                </button>
                <button
                  onClick={handleFindCenter}
                  className="aq-btn rounded-xl py-3.5 px-4 text-sm font-semibold"
                  style={{ background: C.panel2, border: `1px solid ${C.lineBright}`, color: C.foam, cursor: "pointer" }}
                >
                  Find Center
                </button>
                <button
                  onClick={handleStopMotor}
                  className="aq-btn rounded-xl py-3.5 px-4 text-sm font-semibold"
                  style={{ background: C.coralDim, border: `1px solid ${C.coral}`, color: C.coral, cursor: "pointer" }}
                >
                  Stop Motor
                </button>
              </div>

              <button
                onClick={() => {
                  loadSessionReports();
                  setShowReports(true);
                }}
                className="aq-btn rounded-xl py-3 px-4 text-sm font-medium flex items-center justify-center gap-2.5"
                style={{ background: "transparent", border: `1px dashed ${C.lineBright}`, color: C.mist, cursor: "pointer" }}
              >
                <span>{loadingReports ? "Loading..." : "View Session Log"}</span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    fontWeight: 600,
                    background: C.panel2,
                    color: C.foam,
                    padding: "2px 8px",
                    borderRadius: 999,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  {reports.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Dialog Overlay */}
      {dialog && (
        <div
          className="aq-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: C.overlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setDialog(null)}
        >
          <div
            className="aq-dialog w-full"
            style={{
              maxWidth: 440,
              background: C.panel,
              border: `1px solid ${C.lineBright}`,
              borderRadius: 16,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ height: 4, background: toneColor(dialog.tone) }} />
            <div className="p-6">
              <div className="flex items-start gap-3.5 mb-4">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: toneBg(dialog.tone),
                    color: toneColor(dialog.tone),
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {dialog.tone === "error" ? "!" : dialog.tone === "success" ? "✓" : "i"}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.foam }}>{dialog.title}</div>
                  <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: C.mist, letterSpacing: 1, marginTop: 2 }}>
                    SYSTEM NOTIFICATION
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.foam, lineHeight: 1.5, margin: 0 }}>{dialog.en}</p>
              <p style={{ fontSize: 13, color: C.mist, lineHeight: 1.5, marginTop: 8 }}>{dialog.si}</p>
              <button
                onClick={() => setDialog(null)}
                className="aq-btn w-full rounded-xl py-2.5 text-sm font-semibold mt-6"
                style={{ background: toneColor(dialog.tone), color: "#FFFFFF", cursor: "pointer" }}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Log Modal */}
      {showReports && (
        <div
          className="aq-overlay flex items-end sm:items-center justify-center"
          style={{
            position: "fixed",
            inset: 0,
            background: C.overlay,
            zIndex: 40,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowReports(false)}
        >
          <div
            className="aq-sheet w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{
              background: C.panel,
              border: `1px solid ${C.lineBright}`,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mist, letterSpacing: 2, fontWeight: 600 }}>
                  LOGGED READINGS
                </div>
                <div style={{ fontSize: 12, color: C.mistDim, marginTop: 2 }}>{reports.length} records captured during this session</div>
              </div>
              <div className="flex items-center gap-2">
                {reports.length > 0 && (
                  <button
                    onClick={handleDeleteAllReports}
                    className="aq-btn rounded-full flex items-center justify-center px-3 py-2 text-xs"
                    style={{ background: C.coralDim, color: C.coral, border: `1px solid ${C.coral}`, cursor: "pointer", fontWeight: 600 }}
                    title="Delete all readings"
                  >
                    🗑️ Delete All
                  </button>
                )}
                <button
                  onClick={() => setShowReports(false)}
                  aria-label="Close"
                  className="aq-btn rounded-full flex items-center justify-center"
                  style={{ width: 32, height: 32, background: C.panel2, color: C.mist, border: `1px solid ${C.line}`, cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="aq-scroll" style={{ overflowY: "auto" }}>
              <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: C.panel2, zIndex: 1 }}>
                  <tr>
                    {["Thickness", "Weight", "Timestamp", "Action"].map((h) => (
                      <th
                        key={h}
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 10,
                          letterSpacing: 1.5,
                          color: C.mist,
                          padding: "12px 24px",
                          borderBottom: `1px solid ${C.line}`,
                          fontWeight: 600,
                        }}
                      >
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: "48px 24px", textAlign: "center", color: C.mistDim, fontSize: 13 }}>
                        No readings recorded yet. Perform a measurement to display logs here.
                      </td>
                    </tr>
                  ) : (
                    reports.map((r) => (
                      <tr key={r.id} className="aq-row-in" style={{ borderBottom: `1px solid ${C.line}` }}>
                        <td style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.teal, padding: "12px 24px", fontWeight: 600 }}>
                          {r.thickness}
                        </td>
                        <td style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.amber, padding: "12px 24px", fontWeight: 600 }}>
                          {r.weight}
                        </td>
                        <td style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.mist, padding: "12px 24px" }}>
                          {r.date}
                        </td>
                        <td style={{ padding: "12px 24px" }}>
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="aq-btn rounded px-2 py-1 text-xs"
                            style={{ background: C.coralDim, color: C.coral, border: `1px solid ${C.coral}`, cursor: "pointer", fontWeight: 600 }}
                            title="Delete this reading"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4" style={{ borderTop: `1px solid ${C.line}` }}>
              <button
                onClick={() => setShowReports(false)}
                className="aq-btn w-full rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: C.panel2, border: `1px solid ${C.lineBright}`, color: C.foam, cursor: "pointer" }}
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