import React, { useState, useEffect, useRef } from "react";

const BACKEND_IP = "http://localhost:8000";

const FONT_DISPLAY = "'Space Grotesk', 'Segoe UI', sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

// ---- Single White / Light Color Theme -----------------------------------
const C = {
  ink: "#F4F7F6",          // Main page background
  panel: "#FFFFFF",        // Primary container background
  panel2: "#F8FAFA",       // Secondary background (cards, gauge container)
  line: "#E2E8F0",        // Subdued border lines
  lineBright: "#CBD5E1",  // Prominent border lines
  foam: "#0F172A",        // Primary text color (dark navy/slate)
  mist: "#475569",        // Secondary text color (medium slate)
  mistDim: "#94A3B8",     // Subtle text / disabled elements
  teal: "#0D9488",        // Primary brand accent color
  tealDim: "#CCFBF1",     // Light teal tint
  amber: "#D97706",        // Secondary accent color (weight/scanning)
  amberDim: "#FEF3C7",    // Light amber tint
  coral: "#E11D48",        // Error state color
  coralDim: "#FFE4E6",    // Light error tint
  overlay: "rgba(15, 23, 42, 0.45)", // Backdrop overlay
};

export default function App() {
  const [thickness, setThickness] = useState(0);
  const [weight, setWeight] = useState(0);
  const [baselineCm, setBaselineCm] = useState(0);
  const [connState, setConnState] = useState("idle");
  const [statusLine, setStatusLine] = useState("Awaiting calibration");
  const [dialog, setDialog] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [pulseTick, setPulseTick] = useState(0);
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const pulseRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      pulseRef.current = setInterval(() => setPulseTick((t) => t + 1), 900);
    } else if (pulseRef.current) {
      clearInterval(pulseRef.current);
    }
    return () => pulseRef.current && clearInterval(pulseRef.current);
  }, [scanning]);

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

  const handleCalibrate = async () => {
    try {
      setConnState("working");
      setStatusLine("Checking container state\u2026");
      const res = await fetch(`${BACKEND_IP}/calibrate`);
      const data = await res.json();

      if (data.ok) {
        setBaselineCm(data.baseline);
        setConnState("ok");
        setStatusLine(`Base set at ${data.baseline.toFixed(1)} cm`);
        setDialog({
          tone: "success",
          title: "Base Calibration Complete",
          en: `Empty baseline distance recorded at ${data.baseline.toFixed(1)} cm.`,
          si: "\u0dc0\u0dd2\u0dc0\u0dd2\u0dad \u0db6\u0dd2\u0db8 \u0dc3\u0dd0\u0da7\u0dc0\u0dd3\u0db8 \u0dc3\u0dcf\u0dbb\u0dca\u0dae\u0d9a \u0dc0\u0dd2\u0dba.",
        });
      } else {
        setConnState("error");
        setStatusLine("Calibration blocked");
        setDialog({
          tone: "error",
          title: "Container Not Empty",
          en: data.message || "Container is not empty. Clear it and try again.",
          si: "\u0db6\u0dbb\u0d9a\u0dca \u0d87\u0dad\u0dd0\u0dba\u0dd2 \u0d89\u0dad\u0dd2\u0db1\u0dca \u0db6\u0dcf\u0da2\u0db1\u0dba \u0dc4\u0dd2\u0dc4\u0dd2\u0dbd \u0d9a\u0dbb\u0dcf \u0db1\u0dd0\u0dc0\u0dad \u0dc3\u0dd0\u0d9a\u0dc3\u0dd6.",
        });
      }
    } catch (err) {
      console.error(err);
      setConnState("error");
      setStatusLine("Cannot reach sensor unit");
      setDialog({
        tone: "error",
        title: "Connection Failed",
        en: "Connection to the sensor failed. Confirm the machine is powered and on the network.",
        si: "\u0dc3\u0dd0\u0db1\u0dca\u0dc3\u0dbb\u0dba \u0dc3\u0db8\u0d9f \u0dc3\u0db8\u0dca\u0db6\u0db1\u0dca\u0da0 \u0dc0\u0dd3\u0db8 \u0dc0\u0dd2\u0dc3\u0dca\u0db8\u0dd2\u0dad\u0dd2\u0dba\u0dd2.",
      });
    }
  };

  const handleStart = async () => {
    if (baselineCm <= 0) {
      setDialog({
        tone: "error",
        title: "Base Calibration Required",
        en: "Set the empty base distance before initiating measurement.",
        si: "\u0db4\u0dc5\u0db8\u0dd4\u0dc0 \u0db7\u0dcf\u0da2\u0db1\u0dba\u0dda \u0dc4\u0dd2\u0dc3\u0dca \u0db6\u0dd2\u0db8 \u0dc3\u0dd0\u0da7\u0dca \u0d9a\u0dbb\u0db1\u0dca\u0db1.",
      });
      return;
    }

    try {
      setScanning(true);
      setConnState("working");
      setStatusLine("Measuring fish profile\u2026");
      const res = await fetch(`${BACKEND_IP}/measure`);
      const data = await res.json();

      const currentDistance = data.distance || 0;
      let calculatedThickness = baselineCm - currentDistance;
      if (calculatedThickness < 0) calculatedThickness = 0;
      const newWeight = data.weight || 0;

      setThickness(calculatedThickness);
      setWeight(newWeight);
      setConnState("ok");
      setStatusLine("Measurement complete");

      setReports((prev) => [
        {
          id: Date.now(),
          thickness: `${calculatedThickness.toFixed(1)} cm`,
          weight: `${newWeight.toFixed(3)} kg`,
          date: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
      setConnState("error");
      setStatusLine("Measurement failed");
      setDialog({
        tone: "error",
        title: "Reading Interrupted",
        en: "The reading did not complete. Check hardware connections and try again.",
        si: "\u0d9a\u0dd2\u0dba\u0dc0\u0dad\u0dca\u0dad\u0d9a\u0dda \u0db8\u0dd2\u0dc0\u0dd3\u0db8 \u0dc3\u0dd2\u0daf\u0dd4 \u0dc0\u0dd3\u0db8\u0dc0\u0dda \u0d87\u0dad\u0dd2. \u0db1\u0dd0\u0dc0\u0dad \u0db4\u0dbb\u0dd3\u0d9a\u0dca\u0dc2\u0dcf \u0d9a\u0dbb\u0db1\u0dca\u0db1.",
      });
    } finally {
      setScanning(false);
    }
  };

  const ratio = baselineCm > 0 ? Math.min(thickness / baselineCm, 1) : 0;
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

          {/* Status indicator */}
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
                {baselineCm > 0 && (
                  <>
                    <rect x="25" y={surfaceY - 7} width="80" height="14" rx="7" fill={C.tealDim} stroke={C.teal} strokeWidth="1.5" />
                    <text x="65" y={surfaceY + 3} fontFamily={FONT_MONO} fontSize="9" fill={C.teal} textAnchor="middle" fontWeight="600">
                      PROFILE
                    </text>
                  </>
                )}
                {baselineCm > 0 && thickness > 0 && (
                  <>
                    <line x1="12" y1={surfaceY} x2="12" y2={gaugeBottom} stroke={C.teal} strokeWidth="1.5" />
                    <line x1="8" y1={surfaceY} x2="16" y2={surfaceY} stroke={C.teal} strokeWidth="1.5" />
                    <line x1="8" y1={gaugeBottom} x2="16" y2={gaugeBottom} stroke={C.teal} strokeWidth="1.5" />
                  </>
                )}
              </svg>
              <div className="mt-3" style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mist }}>
                Baseline: <span style={{ color: C.foam, fontWeight: 600 }}>{baselineCm.toFixed(1)} cm</span>
              </div>
            </div>

            {/* Numerical Readouts & Primary Actions */}
            <div className="sm:col-span-3 flex flex-col justify-between h-full gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: C.mist, fontWeight: 700 }}>THICKNESS</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 38, fontWeight: 600, color: C.teal, lineHeight: 1.1, marginTop: 4 }}>
                    {thickness.toFixed(1)}
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

              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={handleCalibrate}
                  className="aq-btn rounded-xl py-3.5 px-4 text-sm font-semibold tracking-wide"
                  style={{ background: C.panel2, border: `1px solid ${C.lineBright}`, color: C.foam, cursor: "pointer" }}
                >
                  Set Empty Base
                </button>
                <button
                  onClick={handleStart}
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
                  {scanning ? "Measuring\u2026" : "Start Measurement"}
                </button>
              </div>

              <button
                onClick={() => setShowReports(true)}
                className="aq-btn rounded-xl py-3 px-4 text-sm font-medium flex items-center justify-center gap-2.5"
                style={{ background: "transparent", border: `1px dashed ${C.lineBright}`, color: C.mist, cursor: "pointer" }}
              >
                <span>View Session Log</span>
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
                  {dialog.tone === "error" ? "!" : dialog.tone === "success" ? "\u2713" : "i"}
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
              <button
                onClick={() => setShowReports(false)}
                aria-label="Close"
                className="aq-btn rounded-full flex items-center justify-center"
                style={{ width: 32, height: 32, background: C.panel2, color: C.mist, border: `1px solid ${C.line}`, cursor: "pointer" }}
              >
                {"\u2715"}
              </button>
            </div>

            <div className="aq-scroll" style={{ overflowY: "auto" }}>
              <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: C.panel2, zIndex: 1 }}>
                  <tr>
                    {["Thickness", "Weight", "Timestamp"].map((h) => (
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
                      <td colSpan="3" style={{ padding: "48px 24px", textAlign: "center", color: C.mistDim, fontSize: 13 }}>
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