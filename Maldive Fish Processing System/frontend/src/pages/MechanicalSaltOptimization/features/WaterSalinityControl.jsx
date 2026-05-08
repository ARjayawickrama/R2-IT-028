import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SALT_PER_KG_FISH     = 20;    // g per kg fish (ONLY basis for salt)
const WATER_PER_KG_FISH    = 3.33; // L per kg fish (auto-calculated)

// ─── NEW Calculation: water auto-derived, salt from fish only ─────────────────
function calcFromFish(fishKg) {
  const waterL  = parseFloat((fishKg * WATER_PER_KG_FISH).toFixed(2));
  const saltG   = parseFloat((fishKg * SALT_PER_KG_FISH).toFixed(1));
  return { waterL, saltG };
}

// ─── Session log store ────────────────────────────────────────────────────────
let logIdCounter = 1;

// ─── Tank Management System ───────────────────────────────────────────────────
function useTankManager() {
  const [tanks, setTanks] = useState([
    {
      id: 1,
      name: "Boiler Tank 1",
      fishKg: 0,
      waterL: 0,
      tempC: 22,
      boiling: false,
      phase: "idle",
      saltDosed: 0,
      logs: []
    }
  ]);
  const [selectedTankId, setSelectedTankId] = useState(1);

  const addTank = () => {
    const newId = Math.max(...tanks.map(t => t.id), 0) + 1;
    setTanks(prev => [...prev, {
      id: newId,
      name: `Boiler Tank ${newId}`,
      fishKg: 0,
      waterL: 0,
      tempC: 22,
      boiling: false,
      phase: "idle",
      saltDosed: 0,
      logs: []
    }]);
  };

  const removeTank = (tankId) => {
    if (tanks.length <= 1) return;
    setTanks(prev => prev.filter(t => t.id !== tankId));
    if (selectedTankId === tankId) {
      setSelectedTankId(tanks.find(t => t.id !== tankId)?.id || 1);
    }
  };

  const updateTank = (tankId, field, value) => {
    setTanks(prev => prev.map(tank =>
      tank.id === tankId ? { ...tank, [field]: value } : tank
    ));
  };

  // When fishKg changes, auto-update waterL
  const setFishKg = (tankId, fishKg) => {
    const { waterL } = calcFromFish(fishKg);
    setTanks(prev => prev.map(tank =>
      tank.id === tankId ? { ...tank, fishKg, waterL } : tank
    ));
  };

  const getSelectedTank = () => tanks.find(t => t.id === selectedTankId);

  // Simulate sensor drift for boiling tanks
  useEffect(() => {
    const id = setInterval(() => {
      setTanks(prev => prev.map(tank => {
        if (!tank.boiling) return tank;
        const newFishKg = parseFloat((tank.fishKg + (Math.random() - 0.48) * 0.12).toFixed(2));
        const { waterL } = calcFromFish(Math.max(0, newFishKg));
        return {
          ...tank,
          fishKg: Math.max(0, newFishKg),
          waterL,
          tempC: parseFloat(Math.min(102, tank.tempC + (Math.random() * 1.2)).toFixed(1))
        };
      }));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return {
    tanks,
    setTanks,
    selectedTankId,
    setSelectedTankId,
    addTank,
    removeTank,
    updateTank,
    setFishKg,
    getSelectedTank
  };
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────
function ArcGauge({ value, max, label, unit, color, size = 100 }) {
  const pct = Math.min(value / max, 1);
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2 + 10;
  const startAngle = -200, endAngle = 20;
  const range = endAngle - startAngle;
  const angle = startAngle + pct * range;
  const toRad = d => (d * Math.PI) / 180;
  const arcPath = (a1, a2) => {
    const x1 = cx + r * Math.cos(toRad(a1));
    const y1 = cy + r * Math.sin(toRad(a1));
    const x2 = cx + r * Math.cos(toRad(a2));
    const y2 = cy + r * Math.sin(toRad(a2));
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <svg viewBox={`0 0 ${size} ${size + 4}`} width={size} height={size + 4}>
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.06} strokeLinecap="round" />
      {pct > 0 && (
        <path d={arcPath(startAngle, angle)} fill="none" stroke={color} strokeWidth={size * 0.055} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
      )}
      <circle cx={cx} cy={cy} r={size * 0.06} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x={cx} y={cy - r * 0.28} textAnchor="middle" fill="#1f2937" fontSize={size * 0.17} fontWeight="800" fontFamily="'DM Mono', monospace">
        {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}
      </text>
      <text x={cx} y={cy - r * 0.28 + size * 0.13} textAnchor="middle" fill="#6b7280" fontSize={size * 0.1} fontFamily="'DM Mono', monospace">{unit}</text>
      <text x={cx} y={cy + r * 0.55} textAnchor="middle" fill="#9ca3af" fontSize={size * 0.1} fontFamily="'DM Mono', monospace" letterSpacing="1">{label}</text>
    </svg>
  );
}

// ─── Animated Boiler SVG ──────────────────────────────────────────────────────
function BoilerViz({ phase, tempC }) {
  const waterH = Math.min(68, 20 + (tempC - 20) * 0.6);
  const bubbling = tempC > 85;

  return (
    <svg viewBox="0 0 180 200" style={{ width: "100%", maxWidth: 200 }}>
      <rect x="20" y="60" width="140" height="120" rx="10" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="2" />
      <clipPath id="potClip"><rect x="22" y="62" width="136" height="116" rx="8" /></clipPath>
      <g clipPath="url(#potClip)">
        <rect x="22" y={180 - waterH} width="136" height={waterH} fill={tempC > 85 ? "#1a6b4a" : "#1a4b6a"} style={{ transition: "all 1s ease" }} />
        <path d={`M22,${180 - waterH} Q55,${180 - waterH - 6} 90,${180 - waterH} T158,${180 - waterH} V180 H22Z`}
          fill={tempC > 85 ? "#22a066" : "#2266a0"} style={{ transition: "all 1s ease" }}>
          {bubbling && <animate attributeName="d"
            values={`M22,${180-waterH} Q55,${180-waterH-6} 90,${180-waterH} T158,${180-waterH} V180 H22Z;M22,${180-waterH+4} Q55,${180-waterH-2} 90,${180-waterH+4} T158,${180-waterH+4} V180 H22Z;M22,${180-waterH} Q55,${180-waterH-6} 90,${180-waterH} T158,${180-waterH} V180 H22Z`}
            dur="1.2s" repeatCount="indefinite" />}
        </path>
        {bubbling && [30, 68, 110, 148].map((x, i) => (
          <circle key={i} cx={x} cy={175} r={3 + (i % 2)} fill="rgba(100,255,160,0.35)">
            <animate attributeName="cy" values={`175;${180 - waterH - 8}`} dur={`${0.8 + i * 0.15}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur={`${0.8 + i * 0.15}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      <rect x="10" y="54" width="160" height="12" rx="5" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
      <rect x="0" y="64" width="18" height="30" rx="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
      <rect x="162" y="64" width="18" height="30" rx="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
      <rect x="15" y="42" width="150" height="16" rx="6" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1.5" />
      <circle cx="90" cy="38" r="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1.5" />
      {tempC > 70 && [60, 90, 120].map((x, i) => (
        <path key={i} d={`M${x},36 Q${x + 6},28 ${x},20 Q${x - 6},12 ${x},4`}
          fill="none" stroke="rgba(100,180,255,0.35)" strokeWidth="3" strokeLinecap="round">
          <animate attributeName="opacity" values="0.5;0;0.5" dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" />
        </path>
      ))}
      {phase !== "idle" && (
        <g>
          {[70, 90, 110].map((x, i) => (
            <ellipse key={i} cx={x} cy={192} rx={i === 1 ? 14 : 9} ry={8} fill={i === 1 ? "#e85c00" : "#f5a800"} opacity="0.85">
              <animate attributeName="ry" values="8;12;8" dur={`${0.4 + i*0.1}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
        </g>
      )}
    </svg>
  );
}

// ─── Tank Selector ─────────────────────────────────────────────────────────────
function TankSelector({ tanks, selectedTankId, setSelectedTankId, addTank, removeTank }) {
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e5e7eb",
      borderRadius: 12, padding: "12px 16px", marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: 3, marginBottom: 12 }}>BOILER TANK MANAGEMENT</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {tanks.map(tank => (
          <button key={tank.id} onClick={() => setSelectedTankId(tank.id)} style={{
            padding: "6px 12px", fontSize: 10, fontWeight: 700, letterSpacing: 1,
            background: selectedTankId === tank.id ? "linear-gradient(135deg,#f3f4f6,#e5e7eb)" : "#f9fafb",
            color: selectedTankId === tank.id ? "#059669" : "#9ca3af",
            border: `1px solid ${selectedTankId === tank.id ? "#22c55e55" : "#e5e7eb"}`,
            borderRadius: 6, cursor: "pointer", position: "relative",
          }}>
            {tank.name}
            {tank.boiling && (
              <div style={{
                position: "absolute", top: 2, right: 2,
                width: 6, height: 6, borderRadius: "50%",
                background: "#ef4444", boxShadow: "0 0 0 2px rgba(239,68,68,0.3)",
              }} />
            )}
          </button>
        ))}
        <button onClick={addTank} style={{
          padding: "6px 10px", fontSize: 10, fontWeight: 700,
          background: "#dbeafe", color: "#2563eb",
          border: "1px solid #60a5fa55", borderRadius: 6, cursor: "pointer",
        }}>+ ADD TANK</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {tanks.map(tank => {
          const { waterL, saltG } = calcFromFish(tank.fishKg);
          return (
            <div key={tank.id} onClick={() => setSelectedTankId(tank.id)} style={{
              flex: "1 1 150px",
              background: selectedTankId === tank.id ? "#f0fdf4" : "#ffffff",
              border: `1px solid ${selectedTankId === tank.id ? "#86efac" : "#e5e7eb"}`,
              borderRadius: 8, padding: "8px 12px", cursor: "pointer", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: "#6b7280", letterSpacing: 1 }}>{tank.name}</span>
                {tanks.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); removeTank(tank.id); }} style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: "#fee2e2", color: "#ef4444",
                    border: "1px solid #ef444433",
                    fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>×</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 9 }}>
                <div><span style={{ color: "#6b7280" }}>Fish:</span> <span style={{ color: "#059669" }}>{tank.fishKg}kg</span></div>
                <div><span style={{ color: "#6b7280" }}>Water:</span> <span style={{ color: "#3b82f6" }}>{waterL}L</span></div>
                <div><span style={{ color: "#6b7280" }}>Temp:</span> <span style={{ color: tank.tempC > 95 ? "#ef4444" : tank.tempC > 70 ? "#f97316" : "#059669" }}>{tank.tempC}°C</span></div>
                <div><span style={{ color: "#6b7280" }}>Salt:</span> <span style={{ color: "#fbbf24" }}>{saltG}g</span></div>
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: 1, padding: "2px 6px", borderRadius: 3,
                  background: tank.phase === "boiling" ? "#450a0a" : tank.phase === "heating" ? "#431407" : "#dcfce7",
                  color: tank.phase === "boiling" ? "#fca5a5" : tank.phase === "heating" ? "#fdba74" : "#059669",
                }}>{tank.phase.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Log Table ────────────────────────────────────────────────────────────────
function LogTable({ logs }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan={8} style={{ padding: "22px 10px", textAlign: "center", color: "#d1d5db" }}>— No readings logged yet —</td></tr>
          ) : [...logs].reverse().map((l, i) => (
            <tr key={l.id} style={{ background: i % 2 === 0 ? "transparent" : "#f9fafb" }}>
              <td style={{ padding: "6px 10px", color: "#9ca3af" }}>{l.id}</td>
              <td style={{ padding: "6px 10px", color: "#374151", whiteSpace: "nowrap" }}>{l.time}</td>
              <td style={{ padding: "6px 10px", color: "#059669", fontWeight: 700 }}>{l.fishKg} kg</td>
              <td style={{ padding: "6px 10px", color: "#3b82f6", fontWeight: 700 }}>{l.waterL} L <span style={{ fontSize: 9, color: "#9ca3af" }}>(auto)</span></td>
              <td style={{ padding: "6px 10px" }}>
                <span style={{
                  background: "#fef3c7", border: "1px solid #fbbf2455",
                  borderRadius: 4, padding: "2px 8px", color: "#fbbf24", fontWeight: 800,
                }}>{l.saltG} g</span>
              </td>
              <td style={{ padding: "6px 10px", color: l.temp > 95 ? "#ef4444" : l.temp > 70 ? "#f97316" : "#059669" }}>{l.temp}°C</td>
              <td style={{ padding: "6px 10px" }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "2px 6px", borderRadius: 4,
                  background: l.status === "BOILING" ? "#7f1d1d" : l.status === "HEATING" ? "#431407" : "#dcfce7",
                  color: l.status === "BOILING" ? "#fca5a5" : l.status === "HEATING" ? "#fdba74" : "#059669",
                  border: `1px solid ${l.status === "BOILING" ? "#ef444455" : l.status === "HEATING" ? "#f9731655" : "#22c55e55"}`,
                }}>{l.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── AI Prompt Builder (NEW formula) ─────────────────────────────────────────
async function callAIManager({ fishKg, waterL, saltG, tempC, phase, logs }) {
  const recentLogs = logs.slice(-5).map(l =>
    `[${l.time}] Fish:${l.fishKg}kg | AutoWater:${l.waterL}L | Salt:${l.saltG}g | Temp:${l.temp}°C | Status:${l.status}`
  ).join("\n") || "No prior readings.";

  const systemPrompt = `You are an expert automated fish boiling system AI controller.

Your job:
1. Monitor fish weight input.
2. Water volume is AUTO-CALCULATED from fish: waterL = fishKg × ${WATER_PER_KG_FISH} (you do NOT accept external water input).
3. Calculate salt using ONLY fish weight: salt = fishKg × ${SALT_PER_KG_FISH}g (ignore any external salt inputs).
4. Ensure heating process safety and stability.
5. Detect anomalies in temperature or process flow.
6. Give short, precise industrial control instructions.

Always respond in this EXACT JSON structure (no markdown, no extra text):
{
  "status": "SAFE|WARNING|CRITICAL",
  "saltInstruction": "precise salt dosing instruction based on fish weight only",
  "systemAction": "current recommended action",
  "qualityCheck": "quality assessment in one sentence",
  "anomalies": ["list", "of", "detected", "anomalies"] or [],
  "nextStep": "next recommended operation step",
  "consistency": "consistency score 0-100"
}`;

  const userPrompt = `LIVE SENSOR READING:
- Fish weight: ${fishKg} kg
- Auto-calculated water: ${waterL} L  (formula: ${fishKg} × ${WATER_PER_KG_FISH})
- Auto-calculated salt: ${saltG} g  (formula: ${fishKg} × ${SALT_PER_KG_FISH} g/kg)
- Temperature: ${tempC} °C
- System phase: ${phase.toUpperCase()}

RECENT LOG (last 5 readings):
${recentLogs}

Analyse this data and provide short, precise industrial control instructions.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await resp.json();
  const text = data.content?.map(c => c.text || "").join("") || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { status: "WARNING", saltInstruction: text, systemAction: "Manual review needed", qualityCheck: "Parse error", anomalies: [], nextStep: "Retry", consistency: 50 };
  }
}

// ─── Tank Controls ────────────────────────────────────────────────────────────
function useTankControls(tanks, updateTank, getSelectedTank) {
  const addLog = useCallback((tank) => {
    if (!tank || tank.phase === "idle") return;
    const { waterL, saltG } = calcFromFish(tank.fishKg);
    const statusMap = { loading: "LOADING", heating: "HEATING", boiling: "BOILING", done: "COMPLETE" };
    const newLog = {
      id: logIdCounter++,
      time: new Date().toLocaleTimeString(),
      fishKg: tank.fishKg.toFixed(2),
      waterL: waterL.toFixed(2),
      saltG,
      temp: tank.tempC.toFixed(1),
      status: statusMap[tank.phase] || "IDLE",
    };
    updateTank(tank.id, "logs", [...(tank.logs || []), newLog]);
  }, [tanks, updateTank]);

  const logReading = useCallback(() => {
    const tank = getSelectedTank();
    addLog(tank);
  }, [getSelectedTank, addLog]);

  const startTankCycle = (tankId) => {
    const tank = tanks.find(t => t.id === tankId);
    if (!tank || tank.fishKg <= 0) return;
    updateTank(tankId, "phase", "loading");
    updateTank(tankId, "saltDosed", 0);
    setTimeout(() => {
      updateTank(tankId, "phase", "heating");
      updateTank(tankId, "boiling", true);
    }, 1500);
  };

  const stopTankCycle = (tankId) => {
    updateTank(tankId, "boiling", false);
    updateTank(tankId, "phase", "done");
    const tank = tanks.find(t => t.id === tankId);
    addLog({ ...tank, phase: "done" });
  };

  const resetTankCycle = (tankId) => {
    updateTank(tankId, "boiling", false);
    updateTank(tankId, "phase", "idle");
    updateTank(tankId, "fishKg", 0);
    updateTank(tankId, "waterL", 0);
    updateTank(tankId, "tempC", 22);
    updateTank(tankId, "saltDosed", 0);
    updateTank(tankId, "logs", []);
  };

  const infuseTankSalt = (tankId) => {
    const tank = tanks.find(t => t.id === tankId);
    if (!tank) return;
    const { saltG } = calcFromFish(tank.fishKg);
    updateTank(tankId, "saltDosed", saltG);
    addLog(tank);
  };

  return { startTankCycle, stopTankCycle, resetTankCycle, infuseTankSalt, logReading, addLog };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FishBoilingSystem() {
  const {
    tanks,
    selectedTankId,
    setSelectedTankId,
    addTank,
    removeTank,
    updateTank,
    setFishKg,
    getSelectedTank
  } = useTankManager();

  const { startTankCycle, stopTankCycle, resetTankCycle, infuseTankSalt, logReading, addLog } = useTankControls(tanks, updateTank, getSelectedTank);

  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const selectedTank = getSelectedTank();
  const derived = selectedTank ? calcFromFish(selectedTank.fishKg) : { waterL: 0, saltG: 0 };

  const phaseLabel = { idle: "STANDBY", loading: "LOADING FISH", heating: "HEATING", boiling: "BOILING", done: "CYCLE DONE" };
  const phaseColor = { idle: "#4a6a4a", loading: "#f59e0b", heating: "#f97316", boiling: "#ef4444", done: "#22c55e" };

  const colors = {
    bg: "#f9fafb",
    headerBg: "linear-gradient(90deg,#f3f4f6 0%,#ffffff 50%,#f3f4f6 100%)",
    cardBg: "#ffffff",
    border: "#e5e7eb",
    text: "#1f2937",
    textDim: "#6b7280",
    inputBg: "#ffffff",
    buttonPrimary: "linear-gradient(135deg,#10b981,#059669)",
    buttonDanger: "linear-gradient(135deg,#ef4444,#dc2626)",
  };

  // Auto-log every 5s for active tanks
  useEffect(() => {
    const id = setInterval(() => {
      tanks.forEach(tank => {
        if (tank.phase !== "idle") addLog(tank);
      });
    }, 5000);
    return () => clearInterval(id);
  }, [tanks, addLog]);

  const runAI = async () => {
    if (!selectedTank) return;
    setAiLoading(true); setAiError("");
    try {
      const result = await callAIManager({
        fishKg: selectedTank.fishKg,
        waterL: derived.waterL,
        saltG: derived.saltG,
        tempC: selectedTank.tempC,
        phase: selectedTank.phase,
        logs: selectedTank.logs || []
      });
      setAiResult(result);
      logReading();
    } catch (e) {
      setAiError("AI call failed: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const statusColor = aiResult?.status === "CRITICAL" ? "#ef4444" : aiResult?.status === "WARNING" ? "#f97316" : "#22c55e";

  return (
    <div style={{
      fontFamily: "'DM Mono', 'Courier New', monospace",
      background: colors.bg,
      minHeight: "100vh",
      color: colors.text,
      padding: "0 0 40px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{
        background: colors.headerBg, borderBottom: `1px solid ${colors.border}`,
        padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: "linear-gradient(135deg,#10b981,#059669)",
            border: "1px solid #10b98144",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>🐟</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, color: "#059669" }}>AQUA-SALT CONTROLLER</div>
            <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 3 }}>AI-POWERED FISH BOILING SYSTEM v2.1 · AUTO-CALC MODE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Formula badge */}
          <div style={{
            background: "#fef3c7", border: "1px solid #fbbf2444", borderRadius: 8,
            padding: "4px 12px", fontSize: 9, color: "#d97706", letterSpacing: 1,
          }}>
            SALT = Fish × {SALT_PER_KG_FISH}g/kg · WATER = Fish × {WATER_PER_KG_FISH}L/kg
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2 }}>PHASE</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: phaseColor[selectedTank?.phase] || colors.textDim, letterSpacing: 2 }}>
              {phaseLabel[selectedTank?.phase] || "N/A"}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2 }}>TEMPERATURE</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: selectedTank?.tempC > 95 ? "#ef4444" : selectedTank?.tempC > 70 ? "#f97316" : "#059669" }}>
              {(selectedTank?.tempC || 0).toFixed(1)} °C
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2 }}>LOG ENTRIES</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>{selectedTank?.logs?.length || 0}</div>
          </div>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: selectedTank?.phase === "idle" ? colors.textDim : "#22c55e",
            boxShadow: selectedTank?.phase !== "idle" ? "0 0 0 4px rgba(34,197,94,0.2)" : "none",
          }} />
        </div>
      </div>

      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Tank Management ── */}
        <TankSelector
          tanks={tanks} selectedTankId={selectedTankId}
          setSelectedTankId={setSelectedTankId}
          addTank={addTank} removeTank={removeTank}
        />

        {/* ── Top Row ── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

          {/* Input Panel — fish only */}
          <div style={{
            flex: "1 1 240px",
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 12, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3, marginBottom: 14 }}>
              INPUT — {selectedTank?.name || "No Tank Selected"}
            </div>

            {selectedTank ? (
              <>
                {/* Fish Weight slider (only manual input) */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: colors.textDim, marginBottom: 5, letterSpacing: 1 }}>Fish Weight (kg)</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="range" min={0} max={500} step={0.5} value={selectedTank.fishKg}
                      onChange={e => setFishKg(selectedTankId, parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: "#86efac", cursor: "pointer" }}
                    />
                    <input
                      type="number" min={0} max={500} step={0.5} value={selectedTank.fishKg}
                      onChange={e => setFishKg(selectedTankId, parseFloat(e.target.value) || 0)}
                      style={{
                        width: 70, padding: "4px 8px", fontSize: 12, fontWeight: 700,
                        background: colors.inputBg, color: "#86efac", border: "1px solid #86efac44",
                        borderRadius: 6, fontFamily: "'DM Mono', monospace", textAlign: "right",
                      }}
                    />
                  </div>
                </div>

                {/* Auto-derived values (read-only display) */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {[
                    { label: "Auto Water (L)", val: derived.waterL.toFixed(2), color: "#60a5fa", formula: `× ${WATER_PER_KG_FISH}` },
                    { label: "Auto Salt (g)", val: derived.saltG, color: "#fbbf24", formula: `× ${SALT_PER_KG_FISH}` },
                  ].map(({ label, val, color, formula }) => (
                    <div key={label} style={{
                      flex: 1, background: "#f9fafb", border: `1px solid ${color}33`,
                      borderRadius: 8, padding: "8px 10px", position: "relative",
                    }}>
                      <div style={{ fontSize: 8, color: colors.textDim, letterSpacing: 1, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 8, color: "#d1d5db", position: "absolute", top: 6, right: 8 }}>{formula}</div>
                      <div style={{ fontSize: 7, color: "#d1d5db", marginTop: 2 }}>AUTO-CALC</div>
                    </div>
                  ))}
                </div>

                {/* Temperature slider */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: colors.textDim, marginBottom: 5, letterSpacing: 1 }}>Temperature (°C)</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="range" min={0} max={110} step={0.5} value={selectedTank.tempC}
                      onChange={e => updateTank(selectedTankId, "tempC", parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: "#f97316", cursor: "pointer" }}
                    />
                    <input
                      type="number" min={0} max={110} step={0.5} value={selectedTank.tempC}
                      onChange={e => updateTank(selectedTankId, "tempC", parseFloat(e.target.value) || 0)}
                      style={{
                        width: 70, padding: "4px 8px", fontSize: 12, fontWeight: 700,
                        background: colors.inputBg, color: "#f97316", border: "1px solid #f9731644",
                        borderRadius: 6, fontFamily: "'DM Mono', monospace", textAlign: "right",
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  {selectedTank.phase === "idle" || selectedTank.phase === "done" ? (
                    <button onClick={() => startTankCycle(selectedTankId)} disabled={selectedTank.fishKg <= 0} style={{
                      padding: "9px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                      background: selectedTank.fishKg > 0 ? colors.buttonPrimary : "#f3f4f6",
                      color: selectedTank.fishKg > 0 ? "#ffffff" : colors.textDim,
                      border: `1px solid ${selectedTank.fishKg > 0 ? "#10b98155" : colors.border}`,
                      borderRadius: 8, cursor: selectedTank.fishKg > 0 ? "pointer" : "not-allowed",
                    }}>▶ START CYCLE</button>
                  ) : (
                    <button onClick={() => stopTankCycle(selectedTankId)} style={{
                      padding: "9px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                      background: colors.buttonDanger, color: "#fca5a5",
                      border: "1px solid #ef444455", borderRadius: 8, cursor: "pointer",
                    }}>■ STOP CYCLE</button>
                  )}
                  <button onClick={() => infuseTankSalt(selectedTankId)} disabled={selectedTank.phase === "idle"} style={{
                    padding: "9px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                    background: selectedTank.phase !== "idle" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#f3f4f6",
                    color: selectedTank.phase !== "idle" ? "#ffffff" : colors.textDim,
                    border: `1px solid ${selectedTank.phase !== "idle" ? "#f9731655" : colors.border}`,
                    borderRadius: 8, cursor: selectedTank.phase !== "idle" ? "pointer" : "not-allowed",
                  }}>🧂 INFUSE SALT ({derived.saltG}g)</button>
                  <button onClick={logReading} disabled={selectedTank.phase === "idle"} style={{
                    padding: "9px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                    background: selectedTank.phase !== "idle" ? colors.cardBg : colors.bg,
                    color: selectedTank.phase !== "idle" ? "#3b82f6" : colors.textDim,
                    border: `1px solid ${selectedTank.phase !== "idle" ? "#60a5fa44" : colors.border}`,
                    borderRadius: 8, cursor: selectedTank.phase !== "idle" ? "pointer" : "not-allowed",
                  }}>📋 LOG READING</button>
                  <button onClick={() => resetTankCycle(selectedTankId)} style={{
                    padding: "9px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                    background: colors.bg, color: colors.textDim,
                    border: `1px solid ${colors.border}`, borderRadius: 8, cursor: "pointer",
                  }}>⟳ RESET</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: colors.textDim }}>Please select a tank</div>
            )}
          </div>

          {/* Boiler Visualization */}
          <div style={{
            flex: "0 0 400px",
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3, marginBottom: 8 }}>
              BOILER STATUS — {selectedTank?.name || "No Tank"}
            </div>
            {selectedTank ? (
              <>
                <BoilerViz phase={selectedTank.phase} tempC={selectedTank.tempC} />
                <div style={{
                  marginTop: 8, fontSize: 20, fontWeight: 800,
                  color: selectedTank.tempC > 95 ? "#ef4444" : selectedTank.tempC > 70 ? "#f97316" : "#059669",
                }}>{selectedTank.tempC.toFixed(1)}°C</div>
                <div style={{ fontSize: 9, color: phaseColor[selectedTank.phase], letterSpacing: 2, marginTop: 4 }}>
                  {phaseLabel[selectedTank.phase]}
                </div>
                {selectedTank.saltDosed > 0 && (
                  <div style={{
                    marginTop: 10, background: "#fef3c7", border: "1px solid #fbbf2455",
                    borderRadius: 6, padding: "5px 10px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9, color: colors.textDim }}>SALT DOSED</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fdba74" }}>{selectedTank.saltDosed} g</div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: colors.textDim }}>Select a tank</div>
            )}
          </div>

          {/* Gauges */}
          <div style={{
            flex: "1 1 260px",
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 12, padding: "16px",
          }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3, marginBottom: 10 }}>
              LIVE SENSORS — {selectedTank?.name || "No Tank"}
            </div>
            {selectedTank ? (
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: 8 }}>
                <ArcGauge value={selectedTank.fishKg} max={500} label="FISH" unit="kg" color="#86efac" size={110} />
                <ArcGauge value={derived.waterL} max={1665} label="WATER" unit="L" color="#60a5fa" size={110} />
                <ArcGauge value={selectedTank.tempC} max={110} label="TEMP" unit="°C" color="#f97316" size={110} />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: colors.textDim }}>Select a tank</div>
            )}
          </div>
        </div>

        {/* ── Calculation Panel ── */}
        <div style={{
          background: colors.cardBg, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3, marginBottom: 14 }}>
            AUTO-CALCULATION ENGINE — {selectedTank?.name || "No Tank"}
          </div>
          {selectedTank ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                {
                  label: "Fish Weight (INPUT)",
                  formula: "Manual sensor reading",
                  val: `${selectedTank.fishKg.toFixed(2)} kg`,
                  color: "#86efac", bg: "#f0fdf4",
                },
                {
                  label: "Auto Water Volume",
                  formula: `${selectedTank.fishKg.toFixed(2)} kg × ${WATER_PER_KG_FISH} L/kg`,
                  val: `${derived.waterL} L`,
                  color: "#60a5fa", bg: "#eff6ff",
                  badge: "AUTO",
                },
                {
                  label: "TOTAL SALT TO INFUSE",
                  formula: `${selectedTank.fishKg.toFixed(2)} kg × ${SALT_PER_KG_FISH} g/kg`,
                  val: `${derived.saltG} g`,
                  color: "#fbbf24", bg: "#fefce8",
                  big: true, badge: "AUTO",
                },
              ].map(({ label, formula, val, color, bg, big, badge }) => (
                <div key={label} style={{
                  flex: big ? "2 1 200px" : "1 1 160px",
                  background: bg, border: `1px solid ${color}33`,
                  borderRadius: 10, padding: "12px 16px", position: "relative",
                }}>
                  {badge && (
                    <span style={{
                      position: "absolute", top: 8, right: 10,
                      fontSize: 7, fontWeight: 700, letterSpacing: 1,
                      background: color + "22", color, border: `1px solid ${color}44`,
                      borderRadius: 3, padding: "1px 5px",
                    }}>{badge}</span>
                  )}
                  <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>{formula}</div>
                  <div style={{ fontSize: big ? 30 : 22, fontWeight: 800, color, textShadow: `0 0 12px ${color}55` }}>{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: colors.textDim }}>Select a tank</div>
          )}
        </div>

        {/* ── AI Manager ── */}
        <div style={{
          background: colors.cardBg, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3 }}>
              AI SYSTEM MANAGER — {selectedTank?.name || "No Tank"}
            </div>
            <button onClick={runAI} disabled={aiLoading || !selectedTank} style={{
              padding: "8px 18px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
              background: aiLoading || !selectedTank ? "#f3f4f6" : "linear-gradient(135deg,#3b82f6,#2563eb)",
              color: aiLoading || !selectedTank ? colors.textDim : "#ffffff",
              border: `1px solid ${aiLoading || !selectedTank ? colors.border : "#3b82f655"}`,
              borderRadius: 8, cursor: aiLoading || !selectedTank ? "not-allowed" : "pointer",
            }}>
              {aiLoading ? "⟳ ANALYSING..." : "🤖 RUN AI ANALYSIS"}
            </button>
          </div>
          {aiError && (
            <div style={{ background: "#fee2e2", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 11, marginBottom: 12 }}>
              ⚠ {aiError}
            </div>
          )}
          {aiResult ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{
                flex: "0 0 auto",
                background: colors.bg, border: `1px solid ${statusColor}44`,
                borderRadius: 10, padding: "12px 16px", textAlign: "center", minWidth: 100,
              }}>
                <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2, marginBottom: 6 }}>STATUS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: statusColor }}>{aiResult.status}</div>
                <div style={{ fontSize: 9, color: colors.textDim, marginTop: 6 }}>CONSISTENCY</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>{aiResult.consistency}%</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "SALT INSTRUCTION", val: aiResult.saltInstruction, color: "#fbbf24" },
                  { label: "SYSTEM ACTION", val: aiResult.systemAction, color: "#86efac" },
                  { label: "QUALITY CHECK", val: aiResult.qualityCheck, color: "#60a5fa" },
                  { label: "NEXT STEP", val: aiResult.nextStep, color: "#c084fc" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{
                    background: colors.bg, border: `1px solid ${color}22`,
                    borderRadius: 8, padding: "8px 12px",
                  }}>
                    <span style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2 }}>{label}: </span>
                    <span style={{ fontSize: 11, color }}>{val}</span>
                  </div>
                ))}
                {aiResult.anomalies?.length > 0 && (
                  <div style={{ background: "#fef2f2", border: "1px solid #ef444422", borderRadius: 8, padding: "8px 12px" }}>
                    <div style={{ fontSize: 9, color: "#ef4444", letterSpacing: 2, marginBottom: 4 }}>ANOMALIES DETECTED</div>
                    {aiResult.anomalies.map((a, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#dc2626" }}>• {a}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "22px 0", color: colors.textDim, fontSize: 11 }}>
              {selectedTank ? 'Press "RUN AI ANALYSIS" to get real-time instructions from the AI controller' : "Select a tank to run AI analysis"}
            </div>
          )}
        </div>

        {/* ── Log Table ── */}
        <div style={{
          background: colors.cardBg, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3 }}>
              SENSOR LOG — {selectedTank?.name || "No Tank"}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: colors.textDim }}>{selectedTank?.logs?.length || 0} entries</span>
              {selectedTank && selectedTank.logs?.length > 0 && (
                <button onClick={() => updateTank(selectedTankId, "logs", [])} style={{
                  fontSize: 10, padding: "3px 10px", background: "#fee2e2",
                  border: "1px solid #ef444433", color: "#ef4444", borderRadius: 5, cursor: "pointer",
                }}>CLEAR LOG</button>
              )}
            </div>
          </div>
          <LogTable logs={selectedTank?.logs || []} />
        </div>

      </div>
    </div>
  );
}
