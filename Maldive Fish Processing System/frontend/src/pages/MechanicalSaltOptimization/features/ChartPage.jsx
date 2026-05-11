import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ReferenceLine, ResponsiveContainer
} from "recharts";

// ── Raw Data ────────────────────────────────────────────────────────────────
const INITIAL_DATA = [
  { t: "12PM", wl: 251, sal: 35 },
  { t: "4PM", wl: 230, sal: 62 },
  { t: "8PM", wl: 172, sal: 44, anomaly: 2 },
  { t: "12AM", wl: 232, sal: 82 },
  { t: "4AM", wl: 175, sal: 70 },
  { t: "8AM", wl: 240, sal: 78 },
  { t: "12PM(Now)", wl: 265, sal: 30, anomaly: 1 },
];

// ── Custom Components ───────────────────────────────────────────────────────
const AnomalyDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.anomaly) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="white" stroke="#e53e3e" strokeWidth={2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="#e53e3e" fontWeight="bold">{payload.anomaly}</text>
    </g>
  );
};

const StatCard = ({ label, value, unit, color, icon }) => (
  <div style={{ background: "white", padding: "20px", borderRadius: "12px", borderLeft: `5px solid ${color}`, boxShadow: "0 4px 6px rgba(0,0,0,0.05)", flex: 1 }}>
    <div style={{ color: "#718096", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "5px" }}>
      <span style={{ fontSize: "28px", fontWeight: "bold", color: "#2d3748" }}>{value}</span>
      <span style={{ fontSize: "14px", color: "#a0aec0" }}>{unit}</span>
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
export default function WaterSalinityControl() {
  const [data, setData] = useState(INITIAL_DATA);
  const [isAIActive, setIsAIActive] = useState(true);
  const [wlValue, setWlValue] = useState(265);
  const [salValue, setSalValue] = useState(30);

  // Simulation logic
  useEffect(() => {
    if (!isAIActive) return;
    const interval = setInterval(() => {
      // AI Adjustments: targets WL 240, SAL 60
      setWlValue(prev => prev < 240 ? prev + 0.5 : prev - 0.3);
      setSalValue(prev => prev < 60 ? prev + 0.2 : prev - 0.1);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAIActive]);

  return (
    <div style={{ background: "#f4f7fa", minHeight: "100vh", padding: "25px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <div>
          <h1 style={{ margin: 0, color: "#1a3a6e", fontSize: "24px" }}>Water & Salinity AI Analyzer</h1>
          <p style={{ margin: 0, color: "#718096", fontSize: "14px" }}>Real-time monitoring and autonomous control system</p>
        </div>
        <div style={{ display: "flex", background: "white", padding: "5px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <button 
            onClick={() => setIsAIActive(true)}
            style={{ padding: "8px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", background: isAIActive ? "#1a3a6e" : "transparent", color: isAIActive ? "white" : "#718096" }}
          >AI CONTROL</button>
          <button 
            onClick={() => setIsAIActive(false)}
            style={{ padding: "8px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", background: !isAIActive ? "#1a3a6e" : "transparent", color: !isAIActive ? "white" : "#718096" }}
          >MANUAL</button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "25px" }}>
        <StatCard label="Current Water Level" value={wlValue.toFixed(1)} unit="Liters" color="#1a3a6e" />
        <StatCard label="Salinity Density" value={salValue.toFixed(1)} unit="ppt" color="#00bcd4" />
        <StatCard label="AI Confidence" value={isAIActive ? "98.2" : "0.0"} unit="%" color="#667eea" />
        <StatCard label="System Status" value={isAIActive ? "OPTIMIZING" : "IDLE"} unit="" color={isAIActive ? "#48bb78" : "#ecc94b"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px" }}>
        
        {/* Main Chart Card */}
        <div style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 10px 15px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0, color: "#2d3748", fontSize: "16px" }}>Historical Data Analysis</h3>
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                <ReferenceArea y1={200} y2={270} fill="#1a3a6e" fillOpacity={0.05} />
                <ReferenceArea y1={40} y2={95} fill="#00bcd4" fillOpacity={0.05} />
                <XAxis dataKey="t" tick={{fontSize: 12, fill: "#718096"}} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 300]} tick={{fontSize: 12, fill: "#718096"}} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="wl" stroke="#1a3a6e" strokeWidth={3} dot={<AnomalyDot />} />
                <Line type="monotone" dataKey="sal" stroke="#00bcd4" strokeWidth={3} dot={<AnomalyDot />} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Control Panel Card */}
        <div style={{ background: "#ffffff", padding: "25px", borderRadius: "15px", boxShadow: "0 10px 15px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ marginTop: 0, color: "#2d3748", fontSize: "16px" }}>System Controls</h3>
          
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#718096", marginBottom: "10px" }}>WATER INTAKE ADJUSTMENT</label>
            <input 
              type="range" min="0" max="300" 
              disabled={isAIActive}
              value={wlValue} 
              onChange={(e) => setWlValue(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#1a3a6e" }} 
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "5px", color: "#a0aec0" }}>
              <span>Min (0L)</span>
              <span>Max (300L)</span>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#718096", marginBottom: "10px" }}>SALT INJECTION INTENSITY</label>
            <input 
              type="range" min="0" max="100" 
              disabled={isAIActive}
              value={salValue} 
              onChange={(e) => setSalValue(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#00bcd4" }} 
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "5px", color: "#a0aec0" }}>
              <span>Low (0ppt)</span>
              <span>High (100ppt)</span>
            </div>
          </div>

        
        </div>

      </div>
    </div>
  );
}