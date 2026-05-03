import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SALT_PER_KG_FISH   = 20;  // g per kg fish
const SALT_PER_LITER_H2O = 10;  // g per liter water

// ─── Salt Calculation ─────────────────────────────────────────────────────────
function calcSalt(fishKg, waterL) {
  const fromFish  = fishKg  * SALT_PER_KG_FISH;
  const fromWater = waterL  * SALT_PER_LITER_H2O;
  return {
    fromFish:  parseFloat(fromFish.toFixed(1)),
    fromWater: parseFloat(fromWater.toFixed(1)),
    total:     parseFloat((fromFish + fromWater).toFixed(1)),
  };
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
    if (tanks.length <= 1) return; // Keep at least one tank
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

  const getSelectedTank = () => tanks.find(t => t.id === selectedTankId);

  // Simulate sensor drift for all boiling tanks
  useEffect(() => {
    const id = setInterval(() => {
      setTanks(prev => prev.map(tank => {
        if (!tank.boiling) return tank;
        return {
          ...tank,
          fishKg: parseFloat((tank.fishKg + (Math.random() - 0.48) * 0.12).toFixed(2)),
          waterL: parseFloat(Math.max(0, tank.waterL - Math.random() * 0.15).toFixed(2)),
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
    getSelectedTank 
  };
}

// ─── Gauge SVG (with theme support) ──────────────────────────────────────────
function ArcGauge({ value, max, label, unit, color, size = 100, theme }) {
  const pct = Math.min(value / max, 1);
  const r   = size * 0.38;
  const cx  = size / 2, cy = size / 2 + 10;
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
  
  const trackColor = theme === 'light' ? "#d1d5db" : "#1e2a1e";
  const textColor = theme === 'light' ? "#374151" : "#4a6a4a";
  const labelColor = theme === 'light' ? "#6b7280" : "#4a6a4a";
  const valueColor = theme === 'light' ? "#1f2937" : "#c8e6b0";
  
  return (
    <svg viewBox={`0 0 ${size} ${size + 4}`} width={size} height={size + 4}>
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke={trackColor} strokeWidth={size * 0.06} strokeLinecap="round" />
      {pct > 0 && (
        <path d={arcPath(startAngle, angle)} fill="none" stroke={color} strokeWidth={size * 0.055} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
      )}
      <circle cx={cx} cy={cy} r={size * 0.06} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x={cx} y={cy - r * 0.28} textAnchor="middle" fill={valueColor} fontSize={size * 0.17} fontWeight="800" fontFamily="'DM Mono', monospace">
        {typeof value === "number" && value % 1 !== 0 ? value.toFixed(1) : value}
      </text>
      <text x={cx} y={cy - r * 0.28 + size * 0.13} textAnchor="middle" fill={textColor} fontSize={size * 0.1} fontFamily="'DM Mono', monospace">{unit}</text>
      <text x={cx} y={cy + r * 0.55} textAnchor="middle" fill={labelColor} fontSize={size * 0.1} fontFamily="'DM Mono', monospace" letterSpacing="1">{label}</text>
    </svg>
  );
}

// ─── Animated Boiler SVG (with theme support) ─────────────────────────────────
function BoilerViz({ phase, tempC, theme }) {
  const waterH = Math.min(68, 20 + (tempC - 20) * 0.6);
  const bubbling = tempC > 85;
  
  const potFill = theme === 'light' ? "#f3f4f6" : "#1a2a1a";
  const potStroke = theme === 'light' ? "#9ca3af" : "#2e4a2e";
  const waterColor = tempC > 85 ? "#1a6b4a" : "#1a4b6a";
  const waveColor = tempC > 85 ? "#22a066" : "#2266a0";
  const rimFill = theme === 'light' ? "#e5e7eb" : "#2a3a2a";
  const rimStroke = theme === 'light' ? "#9ca3af" : "#3a5a3a";
  const handleFill = theme === 'light' ? "#e5e7eb" : "#2a3a2a";
  const lidFill = theme === 'light' ? "#d1d5db" : "#223322";
  const lidStroke = theme === 'light' ? "#9ca3af" : "#2e4a2e";
  
  return (
    <svg viewBox="0 0 180 200" style={{ width: "100%", maxWidth: 200 }}>
      {/* Pot body */}
      <rect x="20" y="60" width="140" height="120" rx="10" fill={potFill} stroke={potStroke} strokeWidth="2" />
      {/* Water */}
      <clipPath id="potClip"><rect x="22" y="62" width="136" height="116" rx="8" /></clipPath>
      <g clipPath="url(#potClip)">
        <rect x="22" y={180 - waterH} width="136" height={waterH} fill={waterColor} style={{ transition: "all 1s ease" }} />
        {/* Wave */}
        <path d={`M22,${180 - waterH} Q55,${180 - waterH - 6} 90,${180 - waterH} T158,${180 - waterH} V180 H22Z`}
          fill={waveColor} style={{ transition: "all 1s ease" }}>
          {bubbling && <animate attributeName="d"
            values={`M22,${180-waterH} Q55,${180-waterH-6} 90,${180-waterH} T158,${180-waterH} V180 H22Z;M22,${180-waterH+4} Q55,${180-waterH-2} 90,${180-waterH+4} T158,${180-waterH+4} V180 H22Z;M22,${180-waterH} Q55,${180-waterH-6} 90,${180-waterH} T158,${180-waterH} V180 H22Z`}
            dur="1.2s" repeatCount="indefinite" />}
        </path>
        {/* Bubbles */}
        {bubbling && [30, 68, 110, 148].map((x, i) => (
          <circle key={i} cx={x} cy={175} r={3 + (i % 2)} fill="rgba(100,255,160,0.35)">
            <animate attributeName="cy" values={`175;${180 - waterH - 8}`} dur={`${0.8 + i * 0.15}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur={`${0.8 + i * 0.15}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      {/* Pot rim */}
      <rect x="10" y="54" width="160" height="12" rx="5" fill={rimFill} stroke={rimStroke} strokeWidth="1.5" />
      {/* Handles */}
      <rect x="0" y="64" width="18" height="30" rx="8" fill={handleFill} stroke={rimStroke} strokeWidth="1.5" />
      <rect x="162" y="64" width="18" height="30" rx="8" fill={handleFill} stroke={rimStroke} strokeWidth="1.5" />
      {/* Lid */}
      <rect x="15" y="42" width="150" height="16" rx="6" fill={lidFill} stroke={lidStroke} strokeWidth="1.5" />
      <circle cx="90" cy="38" r="8" fill={handleFill} stroke={lidStroke} strokeWidth="1.5" />
      {/* Steam */}
      {tempC > 70 && [60, 90, 120].map((x, i) => (
        <path key={i} d={`M${x},36 Q${x + 6},28 ${x},20 Q${x - 6},12 ${x},4`}
          fill="none" stroke="rgba(180,255,200,0.25)" strokeWidth="3" strokeLinecap="round">
          <animate attributeName="opacity" values="0.5;0;0.5" dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" />
          <animate attributeName="d"
            values={`M${x},36 Q${x+6},28 ${x},20 Q${x-6},12 ${x},4;M${x},36 Q${x-6},28 ${x},20 Q${x+6},12 ${x},4;M${x},36 Q${x+6},28 ${x},20 Q${x-6},12 ${x},4`}
            dur={`${1.2 + i * 0.3}s`} repeatCount="indefinite" />
        </path>
      ))}
      {/* Flame */}
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

// ─── Tank Selector Component (with theme) ─────────────────────────────────────
function TankSelector({ tanks, selectedTankId, setSelectedTankId, addTank, removeTank, theme }) {
  const bgColor = theme === 'light' ? "#ffffff" : "#0d1f0d";
  const borderColor = theme === 'light' ? "#e5e7eb" : "#1e3a1e";
  const textColor = theme === 'light' ? "#6b7280" : "#4a6a4a";
  const activeBg = theme === 'light' ? "linear-gradient(135deg,#f3f4f6,#e5e7eb)" : "linear-gradient(135deg,#14532d,#166534)";
  const activeColor = theme === 'light' ? "#059669" : "#86efac";
  const inactiveBg = theme === 'light' ? "#f9fafb" : "#0a120a";
  const inactiveColor = theme === 'light' ? "#9ca3af" : "#4a6a4a";
  
  return (
    <div style={{
      background: bgColor, border: `1px solid ${borderColor}`,
      borderRadius: 12, padding: "12px 16px", marginBottom: 16,
    }}>
      <div style={{ fontSize: 10, color: textColor, letterSpacing: 3, marginBottom: 12 }}>BOILER TANK MANAGEMENT</div>
      
      {/* Tank Selection Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {tanks.map(tank => (
          <button
            key={tank.id}
            onClick={() => setSelectedTankId(tank.id)}
            style={{
              padding: "6px 12px", fontSize: 10, fontWeight: 700, letterSpacing: 1,
              background: selectedTankId === tank.id ? activeBg : inactiveBg,
              color: selectedTankId === tank.id ? activeColor : inactiveColor,
              border: `1px solid ${selectedTankId === tank.id ? "#22c55e55" : borderColor}`,
              borderRadius: 6, cursor: "pointer",
              position: "relative",
            }}
          >
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
        <button
          onClick={addTank}
          style={{
            padding: "6px 10px", fontSize: 10, fontWeight: 700,
            background: theme === 'light' ? "#dbeafe" : "#1a3a5c",
            color: theme === 'light' ? "#2563eb" : "#93c5fd",
            border: `1px solid ${theme === 'light' ? "#60a5fa55" : "#3b82f655"}`,
            borderRadius: 6, cursor: "pointer",
          }}
        >
          + ADD TANK
        </button>
      </div>

      {/* Tank Status Overview */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {tanks.map(tank => {
          const salt = calcSalt(tank.fishKg, tank.waterL);
          const cardBg = selectedTankId === tank.id ? (theme === 'light' ? "#f0fdf4" : "#1a2a0a") : (theme === 'light' ? "#ffffff" : "#0a120a");
          const cardBorder = selectedTankId === tank.id ? (theme === 'light' ? "#86efac" : "#22c55e44") : (theme === 'light' ? "#e5e7eb" : "#1e3a1e");
          return (
            <div
              key={tank.id}
              onClick={() => setSelectedTankId(tank.id)}
              style={{
                flex: "1 1 150px",
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: textColor, letterSpacing: 1 }}>{tank.name}</span>
                {tanks.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTank(tank.id); }}
                    style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: theme === 'light' ? "#fee2e2" : "#450a0a",
                      color: theme === 'light' ? "#ef4444" : "#ef4444",
                      border: `1px solid ${theme === 'light' ? "#ef444433" : "#ef444433"}`,
                      fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 9 }}>
                <div><span style={{ color: textColor }}>Fish:</span> <span style={{ color: theme === 'light' ? "#059669" : "#c8e6b0" }}>{tank.fishKg}kg</span></div>
                <div><span style={{ color: textColor }}>Water:</span> <span style={{ color: theme === 'light' ? "#3b82f6" : "#80c0ff" }}>{tank.waterL}L</span></div>
                <div><span style={{ color: textColor }}>Temp:</span> <span style={{ color: tank.tempC > 95 ? "#ef4444" : tank.tempC > 70 ? "#f97316" : (theme === 'light' ? "#059669" : "#86efac") }}>{tank.tempC}°C</span></div>
                <div><span style={{ color: textColor }}>Salt:</span> <span style={{ color: "#fbbf24" }}>{salt.total}g</span></div>
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: 1,
                  padding: "2px 6px", borderRadius: 3,
                  background: tank.phase === "boiling" ? "#450a0a" : tank.phase === "heating" ? "#431407" : (theme === 'light' ? "#dcfce7" : "#14290a"),
                  color: tank.phase === "boiling" ? "#fca5a5" : tank.phase === "heating" ? "#fdba74" : (theme === 'light' ? "#059669" : "#86efac"),
                }}>
                  {tank.phase.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Log Table (with theme) ───────────────────────────────────────────────────
function LogTable({ logs, theme }) {
  const headerColor = theme === 'light' ? "#6b7280" : "#4a6a4a";
  const borderColor = theme === 'light' ? "#e5e7eb" : "#1e3a1e";
  const textColor = theme === 'light' ? "#374151" : "#6a9a6a";
  const altRowBg = theme === 'light' ? "#f9fafb" : "rgba(30,60,30,0.18)";
  
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
       
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan={9} style={{ padding: "22px 10px", textAlign: "center", color: borderColor }}>— No readings logged yet —</td></tr>
          ) : [...logs].reverse().map((l, i) => (
            <tr key={l.id} style={{ background: i % 2 === 0 ? "transparent" : altRowBg }}>
              <td style={{ padding: "6px 10px", color: headerColor }}>{l.id}</td>
              <td style={{ padding: "6px 10px", color: textColor, whiteSpace: "nowrap" }}>{l.time}</td>
              <td style={{ padding: "6px 10px", color: theme === 'light' ? "#059669" : "#c8e6b0", fontWeight: 700 }}>{l.fishKg}</td>
              <td style={{ padding: "6px 10px", color: theme === 'light' ? "#3b82f6" : "#80c0ff", fontWeight: 700 }}>{l.waterL}</td>
              <td style={{ padding: "6px 10px", color: "#e8c060" }}>{l.fromFish}</td>
              <td style={{ padding: "6px 10px", color: "#e8c060" }}>{l.fromWater}</td>
              <td style={{ padding: "6px 10px" }}>
                <span style={{
                  background: theme === 'light' ? "#fef3c7" : "#1a3a1a",
                  border: `1px solid ${theme === 'light' ? "#fbbf2455" : "#22c55e55"}`,
                  borderRadius: 4, padding: "2px 8px", color: "#fbbf24", fontWeight: 800,
                }}>{l.total} g</span>
              </td>
              <td style={{ padding: "6px 10px", color: l.temp > 95 ? "#ef4444" : l.temp > 70 ? "#f97316" : (theme === 'light' ? "#059669" : "#c8e6b0") }}>
                {l.temp}
              </td>
              <td style={{ padding: "6px 10px" }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1,
                  padding: "2px 6px", borderRadius: 4,
                  background: l.status === "BOILING" ? "#7f1d1d" : l.status === "HEATING" ? "#431407" : (theme === 'light' ? "#dcfce7" : "#14290a"),
                  color: l.status === "BOILING" ? "#fca5a5" : l.status === "HEATING" ? "#fdba74" : (theme === 'light' ? "#059669" : "#86efac"),
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

// ─── AI Prompt Builder & Caller ───────────────────────────────────────────────
async function callAIManager({ fishKg, waterL, tempC, salt, phase, logs }) {
  const recentLogs = logs.slice(-5).map(l =>
    `[${l.time}] Fish:${l.fishKg}kg Water:${l.waterL}L Salt:${l.total}g Temp:${l.temp}°C Status:${l.status}`
  ).join("\n") || "No prior readings.";

  const systemPrompt = `You are an expert automated fish boiling system AI controller. Your role is to:
1. Analyse real-time sensor data (fish weight, water volume, temperature).
2. Calculate and validate salt quantities: ${SALT_PER_KG_FISH}g salt per kg of fish + ${SALT_PER_LITER_H2O}g salt per liter of water.
3. Issue precise, actionable instructions to maintain quality and consistency.
4. Monitor for anomalies (evaporation, temperature spikes, weight drift).
5. Ensure food safety standards are met.

Always respond in this EXACT JSON structure (no markdown, no extra text):
{
  "status": "SAFE|WARNING|CRITICAL",
  "saltInstruction": "precise instruction about salt infusion",
  "systemAction": "current recommended action",
  "qualityCheck": "quality assessment in one sentence",
  "anomalies": ["list", "of", "detected", "anomalies"] or [],
  "nextStep": "next recommended operation step",
  "consistency": "consistency score 0-100"
}`;

  const userPrompt = `LIVE SENSOR READING:
- Fish weight: ${fishKg} kg
- Water volume: ${waterL} L
- Temperature: ${tempC} °C
- System phase: ${phase.toUpperCase()}
- Salt from fish weight: ${salt.fromFish} g (${fishKg} kg × ${SALT_PER_KG_FISH} g/kg)
- Salt from water volume: ${salt.fromWater} g (${waterL} L × ${SALT_PER_LITER_H2O} g/L)
- TOTAL SALT TO INFUSE: ${salt.total} g

RECENT LOG (last 5 readings):
${recentLogs}

Analyse this data and provide operational instructions.`;

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

// ─── Tank Control Functions ─────────────────────────────────────────────────────
function useTankControls(tanks, updateTank, getSelectedTank) {
  const logReading = useCallback(() => {
    const tank = getSelectedTank();
    if (!tank || tank.phase === "idle") return;
    
    const salt = calcSalt(tank.fishKg, tank.waterL);
    const statusMap = { loading: "LOADING", heating: "HEATING", boiling: "BOILING", done: "COMPLETE" };
    
    updateTank(tank.id, "logs", [...(tank.logs || []), {
      id:        logIdCounter++,
      time:      new Date().toLocaleTimeString(),
      fishKg:    tank.fishKg.toFixed(2),
      waterL:    tank.waterL.toFixed(2),
      fromFish:  salt.fromFish,
      fromWater: salt.fromWater,
      total:     salt.total,
      temp:      tank.tempC.toFixed(1),
      status:    statusMap[tank.phase] || "IDLE",
    }]);
  }, [tanks, updateTank, getSelectedTank]);

  const startTankCycle = (tankId) => {
    const tank = tanks.find(t => t.id === tankId);
    if (!tank || tank.fishKg <= 0 || tank.waterL <= 0) return;
    
    updateTank(tankId, "phase", "loading");
    updateTank(tankId, "saltDosed", 0);
    logReading();
    
    setTimeout(() => { 
      updateTank(tankId, "phase", "heating"); 
      updateTank(tankId, "boiling", true); 
    }, 1500);
  };

  const stopTankCycle = (tankId) => {
    updateTank(tankId, "boiling", false);
    updateTank(tankId, "phase", "done");
    logReading();
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
    
    const salt = calcSalt(tank.fishKg, tank.waterL);
    updateTank(tankId, "saltDosed", salt.total);
    logReading();
  };

  return { startTankCycle, stopTankCycle, resetTankCycle, infuseTankSalt, logReading };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FishBoilingSystem() {
  const [theme, setTheme] = useState('light'); // always light theme
  
  const { 
    tanks, 
    selectedTankId, 
    setSelectedTankId, 
    addTank, 
    removeTank, 
    updateTank, 
    getSelectedTank 
  } = useTankManager();
  
  const { startTankCycle, stopTankCycle, resetTankCycle, infuseTankSalt, logReading } = useTankControls(tanks, updateTank, getSelectedTank);
  
  const [aiResult, setAiResult]  = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState("");
  const intervalRef = useRef(null);

  const selectedTank = getSelectedTank();
  const salt = selectedTank ? calcSalt(selectedTank.fishKg, selectedTank.waterL) : { fromFish: 0, fromWater: 0, total: 0 };

  // Phase label
  const phaseLabel = { idle: "STANDBY", loading: "LOADING FISH", heating: "HEATING", boiling: "BOILING", done: "CYCLE DONE" };
  const phaseColor = { idle: "#4a6a4a", loading: "#f59e0b", heating: "#f97316", boiling: "#ef4444", done: "#22c55e" };

  // Light theme colors only
  const colors = {
    bg: "#f9fafb",
    headerBg: "linear-gradient(90deg,#f3f4f6 0%,#ffffff 50%,#f3f4f6 100%)",
    cardBg: "#ffffff",
    border: "#e5e7eb",
    text: "#1f2937",
    textDim: "#6b7280",
    inputBg: "#ffffff",
    inputBorder: "#d1d5db",
    buttonPrimary: "linear-gradient(135deg,#10b981,#059669)",
    buttonDanger: "linear-gradient(135deg,#ef4444,#dc2626)",
  };

  // Auto-log every 5s for active tanks
  useEffect(() => {
    const id = setInterval(() => {
      tanks.forEach(tank => {
        if (tank.phase !== "idle") {
          const salt = calcSalt(tank.fishKg, tank.waterL);
          const statusMap = { loading: "LOADING", heating: "HEATING", boiling: "BOILING", done: "COMPLETE" };
          
          updateTank(tank.id, "logs", [...(tank.logs || []), {
            id:        logIdCounter++,
            time:      new Date().toLocaleTimeString(),
            fishKg:    tank.fishKg.toFixed(2),
            waterL:    tank.waterL.toFixed(2),
            fromFish:  salt.fromFish,
            fromWater: salt.fromWater,
            total:     salt.total,
            temp:      tank.tempC.toFixed(1),
            status:    statusMap[tank.phase] || "IDLE",
          }]);
        }
      });
    }, 5000);
    return () => clearInterval(id);
  }, [tanks, updateTank]);

  const runAI = async () => {
    if (!selectedTank) return;
    
    setAiLoading(true); setAiError("");
    try {
      const result = await callAIManager({ 
        fishKg: selectedTank.fishKg, 
        waterL: selectedTank.waterL, 
        tempC: selectedTank.tempC, 
        salt, 
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
      transition: "all 0.3s ease",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <div style={{
        background: colors.headerBg,
        borderBottom: `1px solid ${colors.border}`,
        padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: "linear-gradient(135deg,#10b981,#059669)",
            border: "1px solid #10b98144",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20,
          }}>🐟</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, color: "#059669" }}>AQUA-SALT CONTROLLER</div>
            <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 3 }}>AI-POWERED FISH BOILING SYSTEM v2.0</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
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
            <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>
              {selectedTank?.logs?.length || 0}
            </div>
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
          tanks={tanks}
          selectedTankId={selectedTankId}
          setSelectedTankId={setSelectedTankId}
          addTank={addTank}
          removeTank={removeTank}
          theme={theme}
        />

        {/* ── Top Row: Input + Boiler + Gauges ── */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

          {/* Input Panel */}
          <div style={{
            flex: "1 1 240px",
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 12, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3, marginBottom: 14 }}>
              SENSOR INPUT - {selectedTank?.name || "No Tank Selected"}
            </div>

            {selectedTank ? [
              { label: "Fish Weight (kg)", val: selectedTank.fishKg, set: (v) => updateTank(selectedTankId, "fishKg", v), min: 0, max: 500, step: 0.5, color: "#86efac" },
              { label: "Water Volume (L)",  val: selectedTank.waterL, set: (v) => updateTank(selectedTankId, "waterL", v), min: 0, max: 1000, step: 1, color: "#60a5fa" },
              { label: "Temperature (°C)", val: selectedTank.tempC,  set: (v) => updateTank(selectedTankId, "tempC", v), min: 0, max: 110, step: 0.5, color: "#f97316" },
            ].map(({ label, val, set, min, max, step, color }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: colors.textDim, marginBottom: 5, letterSpacing: 1 }}>{label}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="range" min={min} max={max} step={step} value={val}
                    onChange={e => set(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: color, cursor: "pointer" }}
                  />
                  <input
                    type="number" min={min} max={max} step={step} value={val}
                    onChange={e => set(parseFloat(e.target.value) || 0)}
                    style={{
                      width: 70, padding: "4px 8px", fontSize: 12, fontWeight: 700,
                      background: colors.inputBg, color, border: `1px solid ${color}44`,
                      borderRadius: 6, fontFamily: "'DM Mono', monospace", textAlign: "right",
                    }}
                  />
                </div>
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: colors.textDim }}>
                Please select a tank to control
              </div>
            )}

            {/* Action buttons */}
            {selectedTank && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                {selectedTank.phase === "idle" || selectedTank.phase === "done" ? (
                  <button onClick={() => startTankCycle(selectedTankId)} disabled={selectedTank.fishKg <= 0 || selectedTank.waterL <= 0} style={{
                    padding: "9px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                    background: selectedTank.fishKg > 0 && selectedTank.waterL > 0 ? colors.buttonPrimary : "#f3f4f6",
                    color: selectedTank.fishKg > 0 && selectedTank.waterL > 0 ? "#ffffff" : colors.textDim,
                    border: `1px solid ${selectedTank.fishKg > 0 && selectedTank.waterL > 0 ? "#10b98155" : colors.border}`,
                    borderRadius: 8, cursor: selectedTank.fishKg > 0 && selectedTank.waterL > 0 ? "pointer" : "not-allowed",
                  }}>▶ START CYCLE</button>
                ) : (
                  <button onClick={() => stopTankCycle(selectedTankId)} style={{
                    padding: "9px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                    background: colors.buttonDanger,
                    color: "#fca5a5", border: "1px solid #ef444455",
                    borderRadius: 8, cursor: "pointer",
                  }}>■ STOP CYCLE</button>
                )}
                <button onClick={() => infuseTankSalt(selectedTankId)} disabled={selectedTank.phase === "idle"} style={{
                  padding: "9px", fontSize: 11, fontWeight: 700, letterSpacing: 2,
                  background: selectedTank.phase !== "idle" ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#f3f4f6",
                  color: selectedTank.phase !== "idle" ? "#ffffff" : colors.textDim,
                  border: `1px solid ${selectedTank.phase !== "idle" ? "#f9731655" : colors.border}`,
                  borderRadius: 8, cursor: selectedTank.phase !== "idle" ? "pointer" : "not-allowed",
                }}>🧂 INFUSE SALT ({salt.total}g)</button>
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
            )}
          </div>

          {/* Boiler Visualization */}
          <div style={{
            flex: "0 0 400px",
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3, marginBottom: 8 }}>
              BOILER STATUS - {selectedTank?.name || "No Tank"}
            </div>
            {selectedTank ? (
              <>
                <BoilerViz phase={selectedTank.phase} tempC={selectedTank.tempC} theme={theme} />
                <div style={{
                  marginTop: 8, fontSize: 20, fontWeight: 800,
                  color: selectedTank.tempC > 95 ? "#ef4444" : selectedTank.tempC > 70 ? "#f97316" : "#059669",
                  textShadow: `0 0 12px ${selectedTank.tempC > 95 ? "#ef4444" : selectedTank.tempC > 70 ? "#f97316" : "#22c55e"}`,
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
              <div style={{ textAlign: "center", padding: "40px 0", color: colors.textDim }}>
                Select a tank to view status
              </div>
            )}
          </div>

          {/* Gauges */}
          <div style={{
            flex: "1 1 260px",
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 12, padding: "16px",
          }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3, marginBottom: 10 }}>
              LIVE SENSORS - {selectedTank?.name || "No Tank"}
            </div>
            {selectedTank ? (
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-around", gap: 8 }}>
                <ArcGauge value={selectedTank.fishKg}  max={500}  label="FISH"  unit="kg"  color="#86efac" size={110} theme={theme} />
                <ArcGauge value={selectedTank.waterL}  max={1000} label="WATER" unit="L"   color="#60a5fa" size={110} theme={theme} />
                <ArcGauge value={selectedTank.tempC}   max={110}  label="TEMP"  unit="°C"  color="#f97316" size={110} theme={theme} />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: colors.textDim }}>
                Select a tank to view sensors
              </div>
            )}
          </div>
        </div>

        {/* ── Salt Calculation Panel ── */}
        <div style={{
          background: colors.cardBg, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3, marginBottom: 14 }}>
            SALT CALCULATION ENGINE - {selectedTank?.name || "No Tank"}
          </div>
          {selectedTank ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                {
                  label: "From Fish Weight",
                  formula: `${selectedTank.fishKg.toFixed(2)} kg × ${SALT_PER_KG_FISH} g/kg`,
                  val: `${salt.fromFish} g`,
                  color: "#86efac", bg: theme === 'light' ? "#f0fdf4" : "#0a1f0a",
                },
                {
                  label: "From Water Volume",
                  formula: `${selectedTank.waterL.toFixed(2)} L × ${SALT_PER_LITER_H2O} g/L`,
                  val: `${salt.fromWater} g`,
                  color: "#60a5fa", bg: theme === 'light' ? "#eff6ff" : "#0a100a",
                },
                {
                  label: "TOTAL SALT TO INFUSE",
                  formula: `${salt.fromFish} + ${salt.fromWater}`,
                  val: `${salt.total} g`,
                  color: "#fbbf24", bg: theme === 'light' ? "#fefce8" : "#1a1500",
                  big: true,
                },
              ].map(({ label, formula, val, color, bg, big }) => (
                <div key={label} style={{
                  flex: big ? "2 1 200px" : "1 1 160px",
                  background: bg, border: `1px solid ${color}33`,
                  borderRadius: 10, padding: "12px 16px",
                }}>
                  <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>{formula}</div>
                  <div style={{ fontSize: big ? 30 : 22, fontWeight: 800, color, textShadow: `0 0 12px ${color}55` }}>{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: colors.textDim }}>
              Select a tank to view salt calculations
            </div>
          )}
        </div>

        {/* ── AI Manager ── */}
        <div style={{
          background: colors.cardBg, border: `1px solid ${colors.border}`,
          borderRadius: 12, padding: "16px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 10, color: colors.textDim, letterSpacing: 3 }}>
              AI SYSTEM MANAGER - {selectedTank?.name || "No Tank"}
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
            <div style={{ background: theme === 'light' ? "#fee2e2" : "#450a0a", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 11, marginBottom: 12 }}>
              ⚠ {aiError}
            </div>
          )}
          {aiResult ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {/* Status badge */}
              <div style={{
                flex: "0 0 auto",
                background: colors.bg, border: `1px solid ${statusColor}44`,
                borderRadius: 10, padding: "12px 16px", textAlign: "center", minWidth: 100,
              }}>
                <div style={{ fontSize: 9, color: colors.textDim, letterSpacing: 2, marginBottom: 6 }}>STATUS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: statusColor, textShadow: `0 0 10px ${statusColor}` }}>
                  {aiResult.status}
                </div>
                <div style={{ fontSize: 9, color: colors.textDim, marginTop: 6 }}>CONSISTENCY</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>{aiResult.consistency}%</div>
              </div>
              {/* Instructions grid */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "SALT INSTRUCTION", val: aiResult.saltInstruction, color: "#fbbf24" },
                  { label: "SYSTEM ACTION",    val: aiResult.systemAction,    color: "#86efac" },
                  { label: "QUALITY CHECK",    val: aiResult.qualityCheck,    color: "#60a5fa" },
                  { label: "NEXT STEP",        val: aiResult.nextStep,        color: "#c084fc" },
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
              {selectedTank ? "Press \"RUN AI ANALYSIS\" to get real-time instructions from the AI controller" : "Select a tank to run AI analysis"}
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
              SENSOR LOG - {selectedTank?.name || "No Tank"}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: colors.textDim }}>
                {selectedTank ? `${selectedTank.logs?.length || 0} entries` : "0 entries"}
              </span>
              {selectedTank && selectedTank.logs?.length > 0 && (
                <button onClick={() => updateTank(selectedTankId, "logs", [])} style={{
                  fontSize: 10, padding: "3px 10px",
                  background: "#fee2e2",
                  border: "1px solid #ef444433",
                  color: "#ef4444", borderRadius: 5, cursor: "pointer",
                }}>CLEAR LOG</button>
              )}
            </div>
          </div>
          <LogTable logs={selectedTank?.logs || []} theme={theme} />
        </div>

      </div>
    </div>
  );
}