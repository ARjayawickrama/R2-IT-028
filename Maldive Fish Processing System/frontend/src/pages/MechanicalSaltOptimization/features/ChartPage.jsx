import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

// ── Custom Components ───────────────────────────────────────────────────────
const AnomalyDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.anomaly) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="white" stroke="#e53e3e" strokeWidth={2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="#e53e3e" fontWeight="bold">!</text>
    </g>
  );
};

const StatCard = ({ label, value, unit, color, statusColor, subtext }) => (
  <div style={{ background: "white", padding: "20px", borderRadius: "12px", borderLeft: `5px solid ${color}`, boxShadow: "0 4px 6px rgba(0,0,0,0.05)", flex: 1, minWidth: "180px" }}>
    <div style={{ color: "#718096", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "6px" }}>
      <span style={{ fontSize: "24px", fontWeight: "bold", color: statusColor || "#2d3748" }}>{value}</span>
      {unit && <span style={{ fontSize: "13px", color: "#a0aec0" }}>{unit}</span>}
    </div>
    {subtext && <div style={{ fontSize: "11px", color: "#a0aec0", marginTop: "4px" }}>{subtext}</div>}
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
export default function WaterSalinityControl() {
  const [data, setData] = useState([
    { t: "12:00", wl: 4.5, saltStatus: 0 },
    { t: "12:01", wl: 4.5, saltStatus: 0 },
    { t: "12:02", wl: 4.2, saltStatus: 1 },
    { t: "12:03", wl: 4.0, saltStatus: 1 },
    { t: "12:04", wl: 3.8, saltStatus: 1 },
  ]);

  const [isAIActive, setIsAIActive] = useState(true);
  const [wlValue, setWlValue] = useState(4.5);
  const [isSaltPresent, setIsSaltPresent] = useState(false);
  const [isMqttConnected, setIsMqttConnected] = useState(false);

  // ESP32 MQTT හරහා Live TDS සහ Temperature කියවා ගැනීම
  useEffect(() => {
    const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");

    client.on("connect", () => {
      setIsMqttConnected(true);
      client.subscribe("aquasense/water/tds");
      client.subscribe("aquasense/water/temperature");
    });

    client.on("message", (topic, payload) => {
      const msg = payload.toString();

      if (topic === "aquasense/water/tds") {
        const tdsVal = parseFloat(msg);
        // TDS අගය 250 ppm ට වඩා වැඩි නම් ලුණු ඇති බව හඳුනා ගනී (Binary State)
        const saltDetected = !isNaN(tdsVal) && tdsVal > 250;
        setIsSaltPresent(saltDetected);

        // Live Data එක History Chart එකට එක් කිරීම
        const now = new Date();
        const timeStr = `${now.getHours()}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`;

        setData((prevData) => {
          const updated = [
            ...prevData.slice(-9), // උපරිම ලකුණු 10 ක් තබා ගනී
            { t: timeStr, wl: wlValue, saltStatus: saltDetected ? 1 : 0 }
          ];
          return updated;
        });
      }
    });

    client.on("error", () => setIsMqttConnected(false));
    client.on("close", () => setIsMqttConnected(false));

    return () => {
      if (client) client.end();
    };
  }, [wlValue]);

  return (
    <div style={{ background: "#f4f7fa", minHeight: "100vh", padding: "25px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, color: "#1a3a6e", fontSize: "24px" }}>TDS Salt & Water Monitoring System</h1>
          <p style={{ margin: 0, color: "#718096", fontSize: "14px" }}>
            Hardware Link: <strong style={{ color: isMqttConnected ? "#16a34a" : "#dc2626" }}>{isMqttConnected ? "ESP32 ONLINE" : "ESP32 OFFLINE"}</strong>
          </p>
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
      <div style={{ display: "flex", gap: "20px", marginBottom: "25px", flexWrap: "wrap" }}>
        <StatCard label="Current Water Level" value={wlValue.toFixed(1)} unit="Liters" color="#1a3a6e" />
        
        {/* ලුණු ඇති/නැති බව පෙන්වන Stat Card එක (Values පෙන්වන්නේ නැත) */}
        <StatCard 
          label="TDS Salt Status (Pin 34)" 
          value={isSaltPresent ? "DETECTED" : "NO SALT"} 
          statusColor={isSaltPresent ? "#16a34a" : "#d97706"}
          color={isSaltPresent ? "#16a34a" : "#d97706"}
          subtext={isSaltPresent ? "Salt mixture present in water" : "Fresh water / Insufficient salt"}
        />
        
        <StatCard label="AI Confidence" value={isAIActive ? "98.2" : "0.0"} unit="%" color="#667eea" />
        <StatCard label="System Status" value={isAIActive ? "RUNNING" : "IDLE"} unit="" color={isAIActive ? "#48bb78" : "#ecc94b"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px" }}>
        
        {/* Main Chart Card */}
        <div style={{ background: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 10px 15px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, color: "#2d3748", fontSize: "16px" }}>Real-Time Sensor Telemetry</h3>
            <span style={{ fontSize: "12px", color: "#718096" }}>TDS Binary State (0: No Salt, 1: Present)</span>
          </div>
          
          <div style={{ width: "100%", height: 380 }}>
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                <XAxis dataKey="t" tick={{fontSize: 12, fill: "#718096"}} axisLine={false} tickLine={false} />
                
                {/* Water Level Y-Axis */}
                <YAxis 
                  yAxisId="left" 
                  domain={[0, 10]} 
                  tick={{fontSize: 12, fill: "#1a3a6e"}} 
                  axisLine={false} 
                  tickLine={false} 
                  unit="L"
                />

                {/* Salt State Y-Axis (0 හෝ 1 පමණි) */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 1]} 
                  ticks={[0, 1]}
                  tickFormatter={(val) => (val === 1 ? "Present" : "None")}
                  tick={{fontSize: 12, fill: isSaltPresent ? "#16a34a" : "#d97706"}} 
                  axisLine={false} 
                  tickLine={false} 
                />

                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "TDS Salt State") return [value === 1 ? "Salt Present" : "No Salt", name];
                    return [`${value} L`, name];
                  }}
                />
                
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="wl" 
                  name="Water Level" 
                  stroke="#1a3a6e" 
                  strokeWidth={3} 
                  dot={<AnomalyDot />} 
                />

                <Line 
                  yAxisId="right" 
                  type="stepAfter" 
                  dataKey="saltStatus" 
                  name="TDS Salt State" 
                  stroke={isSaltPresent ? "#16a34a" : "#d97706"} 
                  strokeWidth={3} 
                  dot={true} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Control Panel Card */}
        <div style={{ background: "#ffffff", padding: "25px", borderRadius: "15px", boxShadow: "0 10px 15px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ marginTop: 0, color: "#2d3748", fontSize: "16px" }}>Hardware Status & Controls</h3>
          
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#718096", marginBottom: "10px" }}>WATER INTAKE TARGET</label>
            <input 
              type="range" min="0" max="10" step="0.1"
              disabled={isAIActive}
              value={wlValue} 
              onChange={(e) => setWlValue(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#1a3a6e" }} 
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "5px", color: "#a0aec0" }}>
              <span>0 L</span>
              <span>10 L</span>
            </div>
          </div>

          {/* TDS Live Notification Box */}
          <div style={{
            padding: "16px",
            borderRadius: "10px",
            background: isSaltPresent ? "#DCFCE7" : "#FEF3C7",
            border: `1px solid ${isSaltPresent ? "#86EFAC" : "#FDE68A"}`
          }}>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: isSaltPresent ? "#166534" : "#92400E", textTransform: "uppercase" }}>
              Live TDS Sensor (Pin 34)
            </div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: isSaltPresent ? "#15803D" : "#B45309", marginTop: "4px" }}>
              {isSaltPresent ? "✓ Salt Detected in Tank" : "⚠ No Salt Detected"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>
              {isSaltPresent ? "Brine solution is ready for boiling." : "Add required salt mixture to continue."}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}