import { useState, useEffect, useRef } from "react";

const fishSvg = (count, size = 28) => {
  const positions = [
    { x: 30, y: 55 }, { x: 65, y: 35 }, { x: 55, y: 65 },
    { x: 20, y: 30 }, { x: 75, y: 60 }, { x: 45, y: 45 },
  ];
  return positions.slice(0, Math.min(count > 5 ? 5 : count, 6)).map((p, i) => (
    <g key={i} transform={`translate(${p.x}, ${p.y})`}>
      <ellipse cx="0" cy="0" rx={size * 0.45} ry={size * 0.28} fill="#f5c842" stroke="#d4a017" strokeWidth="1" />
      <polygon points={`${-size * 0.45},0 ${-size * 0.65},${-size * 0.2} ${-size * 0.65},${size * 0.2}`} fill="#f5c842" stroke="#d4a017" strokeWidth="1" />
      <circle cx={size * 0.2} cy={-size * 0.05} r={size * 0.07} fill="#333" />
      <line x1={-size * 0.1} y1={-size * 0.1} x2={-size * 0.1} y2={size * 0.1} stroke="#d4a017" strokeWidth="0.8" />
    </g>
  ));
};

const TankCard = ({ label, data, active }) => {
  const thermFill = Math.min(100, ((data.temp - 20) / 30) * 100);
  return (
    <div style={{
      background: active ? "linear-gradient(135deg, #e8f4fd 0%, #d0eaf8 100%)" : "#f0f7fd",
      border: active ? "2.5px solid #3a9bd5" : "1.5px solid #b8d9f0",
      borderRadius: 14,
      padding: "12px 14px 14px",
      minWidth: 170,
      flex: 1,
      boxShadow: active ? "0 4px 18px rgba(58,155,213,0.18)" : "0 2px 8px rgba(0,0,0,0.06)",
      transition: "all 0.3s ease",
      position: "relative",
    }}>
      {/* Label badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #ddd 0%, #bbb 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 16, color: "#555",
          border: "1.5px solid #aaa",
        }}>{label}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#2a6fa8", fontFamily: "'Courier New', monospace" }}>IoT Sensor</div>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "#fff",
            background: "#5bbb6e", borderRadius: 4, padding: "1px 6px", display: "inline-block", letterSpacing: 1,
          }}>READING</div>
        </div>
      </div>

      {/* Tank visualization */}
      <div style={{ position: "relative", height: 100, marginBottom: 10 }}>
        {/* Water */}
        <div style={{
          position: "absolute", left: 16, right: 10, bottom: 2, top: 12,
          background: "linear-gradient(180deg, rgba(100,190,255,0.25) 0%, rgba(60,160,240,0.45) 100%)",
          borderRadius: "4px 4px 8px 8px",
          border: "1.5px solid rgba(58,155,213,0.4)",
          overflow: "hidden",
        }}>
          {/* Wave */}
          <svg viewBox="0 0 100 12" preserveAspectRatio="none" style={{ width: "100%", height: 12, display: "block" }}>
            <path d="M0,6 Q25,0 50,6 T100,6 V0 H0Z" fill="rgba(100,190,255,0.4)" />
          </svg>
          {/* Fish */}
          <svg viewBox="0 0 100 80" style={{ width: "100%", height: "80%" }}>
            {fishSvg(data.fishCount)}
          </svg>
          {/* Bubbles */}
          {[20, 60, 80].map((x, i) => (
            <div key={i} style={{
              position: "absolute", bottom: `${10 + i * 15}%`, left: `${x}%`,
              width: 4, height: 4, borderRadius: "50%",
              background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.8)",
            }} />
          ))}
        </div>
        {/* Thermometer */}
        <div style={{
          position: "absolute", left: 2, top: 8, bottom: 6,
          width: 10, background: "#e8e8e8", borderRadius: 5, border: "1px solid #ccc", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: `${thermFill}%`,
            background: thermFill > 70 ? "#e74c3c" : thermFill > 40 ? "#f39c12" : "#3498db",
            borderRadius: 5,
            transition: "height 0.5s ease",
          }} />
        </div>
      </div>

      {/* Data rows */}
      {[
        { key: "Temperature", val: `${data.temp} °C` },
        { key: "pH", val: data.ph },
        { key: "Fish Count", val: data.fishCount },
      ].map(({ key, val }) => (
        <div key={key} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 12, marginBottom: 4, padding: "2px 0",
          borderBottom: "1px solid rgba(58,155,213,0.12)",
        }}>
          <span style={{ color: "#555", fontFamily: "'Courier New', monospace" }}>{key}</span>
          <span style={{
            background: "rgba(58,155,213,0.12)", border: "1px solid rgba(58,155,213,0.25)",
            borderRadius: 4, padding: "1px 8px", fontWeight: 700, color: "#2a4a6a",
            fontFamily: "'Courier New', monospace", minWidth: 36, textAlign: "center",
          }}>{val}</span>
        </div>
      ))}
    </div>
  );
};

const SparkLine = ({ color, data }) => {
  const w = 120, h = 48;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 0.001)) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 48 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const useSparkData = (base, variance, len = 20) => {
  const [data, setData] = useState(() => Array.from({ length: len }, () => base + (Math.random() - 0.5) * variance));
  useEffect(() => {
    const id = setInterval(() => {
      setData(d => [...d.slice(1), base + (Math.random() - 0.5) * variance]);
    }, 1500);
    return () => clearInterval(id);
  }, [base, variance]);
  return data;
};

export default function WaterSalinityControl() {
  const [doseRatio, setDoseRatio] = useState(0.45);
  const [totalDosage] = useState(5.2);
  const saltData = useSparkData(0.20, 0.08);
  const waterData = useSparkData(1200, 120);
  const [energy] = useState(8.5);
  const [salinity] = useState(12.3);
  const [humidity] = useState(65);
  const [batchStatus] = useState("PROCESSING");

  const tanks = [
    { label: "A", temp: 29, ph: 6.7, fishCount: 18 },
    { label: "B", temp: 38, ph: 7.75, fishCount: 32 },
    { label: "C", temp: 33, ph: 8.3, fishCount: 10 },
  ];

  return (
    <div style={{
      fontFamily: "'Segoe UI', 'Arial', sans-serif",
      background: "#eaf3fb",
      minHeight: "100vh",
      padding: 0,
      fontSize: 13,
    }}>
      {/* Top bar */}
      <div style={{
        background: "linear-gradient(90deg, #f5faff 0%, #e3f1fc 100%)",
        borderBottom: "1.5px solid #c5dff0",
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        gap: 28,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 600, color: "#444", fontSize: 13 }}>Current Batch:</span>
          <span style={{
            background: "#27ae60", color: "#fff",
            borderRadius: 6, padding: "3px 12px",
            fontWeight: 700, fontSize: 12, letterSpacing: 1,
            boxShadow: "0 2px 8px rgba(39,174,96,0.3)",
          }}>{batchStatus}</span>
        </div>
        {[
          { icon: "⚡", label: "Energy Usage:", val: `${energy} kWh`, color: "#f39c12" },
          { icon: "🧂", label: "Salinity Level:", val: `${salinity}%`, color: "#3498db" },
          { icon: "💧", label: "Humidity:", val: `${humidity}%`, color: "#5dade2" },
        ].map(({ icon, label, val, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ color: "#555", fontWeight: 500 }}>{label}</span>
            <span style={{ fontWeight: 800, color, fontSize: 14 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ padding: "16px 20px" }}>
        {/* Back arrow */}
        <div style={{ marginBottom: 10, cursor: "pointer", color: "#3a9bd5", fontSize: 20, userSelect: "none" }}>←</div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Tank pipeline */}
          <div style={{
            flex: 3,
            background: "linear-gradient(135deg, #daeef8 0%, #c8e6f5 100%)",
            border: "2px solid #a0cfe8",
            borderRadius: 16,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 480,
          }}>
            {tanks.map((tank, i) => (
              <div key={tank.label} style={{ display: "flex", alignItems: "center", flex: 1, gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <TankCard label={tank.label} data={tank} active={i === 1} />
                </div>
                {i < tanks.length - 1 && (
                  <div style={{ color: "#3a9bd5", fontSize: 26, fontWeight: 900, flexShrink: 0, marginTop: -20 }}>→</div>
                )}
              </div>
            ))}
          </div>

          {/* Right panel */}
          <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 12, minWidth: 220 }}>
            {/* Salt Distribution */}
            <div style={{
              background: "#fff",
              border: "1.5px solid #c5dff0",
              borderRadius: 12,
              padding: "12px 14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#888", letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                Salt Distribution
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#777", marginBottom: 4 }}>Dose Ratio</div>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={doseRatio}
                    onChange={e => setDoseRatio(+e.target.value)}
                    style={{ width: "100%", accentColor: "#3a9bd5", cursor: "pointer" }}
                  />
                  <div style={{ textAlign: "right", fontWeight: 700, fontSize: 12, color: "#2a6fa8" }}>
                    {doseRatio.toFixed(2)}
                  </div>
                </div>
                {/* Salt shaker icon */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 26 }}>🧂</div>
                  <div style={{
                    background: "#e8f4fd", border: "1.5px solid #a0cfe8",
                    borderRadius: 6, padding: "2px 8px", fontSize: 11,
                    fontWeight: 700, color: "#2a6fa8", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9, color: "#888", marginBottom: 1 }}>TOTAL DOSAGE:</div>
                    [{totalDosage}] kg
                  </div>
                </div>
              </div>
            </div>

            {/* Sensor cards row */}
            <div style={{ display: "flex", gap: 10 }}>
              {/* Salt Sensor */}
              <div style={{
                flex: 1,
                background: "#fff",
                border: "1.5px solid #c5dff0",
                borderRadius: 12,
                padding: "10px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 10, color: "#888", letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" }}>
                  Salt Sensor (3)
                </div>
                <SparkLine color="#f39c12" data={saltData} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: "#888" }}>SALT SEATOS:</span>
                  <span style={{
                    fontWeight: 700, fontSize: 11, color: "#2a4a6a",
                    background: "#fef9e7", border: "1px solid #f39c12",
                    borderRadius: 4, padding: "0 6px",
                  }}>
                    {saltData[saltData.length - 1].toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Water Sensor */}
              <div style={{
                flex: 1,
                background: "#fff",
                border: "1.5px solid #c5dff0",
                borderRadius: 12,
                padding: "10px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <div style={{ fontWeight: 700, fontSize: 10, color: "#888", letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" }}>
                  Water Sensor (4)
                </div>
                <SparkLine color="#3a9bd5" data={waterData} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: "#888" }}>WATESTATUS:</span>
                  <span style={{
                    fontWeight: 700, fontSize: 11, color: "#2a4a6a",
                    background: "#eaf3fb", border: "1px solid #3a9bd5",
                    borderRadius: 4, padding: "0 6px",
                  }}>
                    {Math.round(waterData[waterData.length - 1])}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
