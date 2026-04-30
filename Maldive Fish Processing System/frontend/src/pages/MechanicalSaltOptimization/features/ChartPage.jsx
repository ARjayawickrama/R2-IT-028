import { useState, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
  Dot,
} from "recharts";

// ── Raw data ──────────────────────────────────────────────────────────────────
const RAW_DATA = [
  { t: "12PM(T-1)", wl: 251, sal: 35 },
  { t: "1PM(T-1)",  wl: 238, sal: 60 },
  { t: "1AM(T-2)",  wl: 127, sal: 85 },
  { t: "2AM(T-2)",  wl: 152, sal: 20 },
  { t: "3PM(T-3)",  wl: 248, sal: 55 },
  { t: "4PM(T-3)",  wl: 230, sal: 62 },
  { t: "5PM(T-3)",  wl: 218, sal: 58 },
  { t: "6PM(T-3)",  wl: 200, sal: 52 },
  { t: "7PM(T-3)",  wl: 185, sal: 48 },
  { t: "8PM(T-3)",  wl: 172, sal: 44 },
  { t: "9PM(T-2)",  wl: 255, sal: 100, anomaly: 3 }, // salinity spike
  { t: "10PM(T-2)", wl: 258, sal: 88 },
  { t: "11AM(T-2)", wl: 245, sal: 85 },
  { t: "12AM(T-2)", wl: 232, sal: 82 },
  { t: "11AM(T-1)", wl: 218, sal: 78 },
  { t: "12PM(T-1)", wl: 120, sal: 42 },
  { t: "1PM(T-1)",  wl: 135, sal: 45 },
  { t: "12PM(T-3)", wl: 122, sal: 22 },
  { t: "1PM(T-3)",  wl: 135, sal: 55 },
  { t: "2PM(T-4)",  wl: 148, sal: 68 },
  { t: "3PM(T-4)",  wl: 160, sal: 72 },
  { t: "4PM(T-4)",  wl: 175, sal: 70 },
  { t: "5PM(T-5)",  wl: 258, sal: 80 },
  { t: "6PM(T-5)",  wl: 255, sal: 85 },
  { t: "7PM(T-5)",  wl: 248, sal: 82 },
  { t: "8PM(T-5)",  wl: 240, sal: 78 },
  { t: "9PM(T-5)",  wl: 228, sal: 75 },
  { t: "10PM(T-5)", wl: 215, sal: 72 },
  { t: "11PM(T-5)", wl: 200, sal: 68 },
  { t: "12PM(T-5)", wl: 188, sal: 65 },
  { t: "1PM(T-6)",  wl: 258, sal: 68 },
  { t: "2PM(T-6)",  wl: 252, sal: 72 },
  { t: "3PM(T-6)",  wl: 245, sal: 70 },
  { t: "4PM(T-6)",  wl: 238, sal: 68 },
  { t: "5PM(T-6)",  wl: 230, sal: 65 },
  { t: "6PM(T-6)",  wl: 222, sal: 62 },
  { t: "7PM(T-6)",  wl: 215, sal: 60 },
  { t: "8PM(T-6)",  wl: 210, sal: 98, anomaly: 4 }, // salinity spike
  { t: "9PM(T-6)",  wl: 258, sal: 85 },
  { t: "10PM(T-6)", wl: 252, sal: 82 },
  { t: "11PM(T-6)", wl: 245, sal: 78 },
  { t: "12PM(T-7)", wl: 258, sal: 75 },
  { t: "1PM(T-7)",  wl: 255, sal: 72 },
  { t: "2PM(T-7)",  wl: 252, sal: 70 },
  { t: "3PM(T-7)",  wl: 248, sal: 68 },
  { t: "4PM(T-8)",  wl: 252, sal: 65 },
  { t: "5PM(T-8)",  wl: 258, sal: 62 },
  { t: "6PM(T-8)",  wl: 260, sal: 60 },
  { t: "7PM(T-8)",  wl: 255, sal: 62 },
  { t: "8PM(T-8)",  wl: 252, sal: 65 },
  { t: "9PM(T-8)",  wl: 248, sal: 68 },
  { t: "10PM(T-8)", wl: 240, sal: 72 },
  { t: "11PM(T-8)", wl: 235, sal: 75 },
  { t: "12PM(T-9)", wl: 162, sal: 78 },
  { t: "1PM(T-9)",  wl: 165, sal: 75 },
  { t: "2PM(T-9)",  wl: 168, sal: 72 },
  { t: "3PM(T-9)",  wl: 172, sal: 70 },
  { t: "4PM(T-9)",  wl: 178, sal: 68, anomaly: 2 },
  { t: "5PM(T-9)",  wl: 185, sal: 65 },
  { t: "6PM(T-9)",  wl: 192, sal: 62 },
  { t: "7PM(T-9)",  wl: 200, sal: 60 },
  { t: "8PM(T-9)",  wl: 142, sal: 58, anomaly: 3 },
  { t: "9PM(T-9)",  wl: 215, sal: 55 },
  { t: "10PM(T-9)", wl: 222, sal: 52 },
  { t: "11PM(T-9)", wl: 230, sal: 50 },
  { t: "12PM(Today)", wl: 265, sal: 30, anomaly: 1 },
];

// ── Anomaly dot renderer ───────────────────────────────────────────────────────
const AnomalyDot = (props) => {
  const { cx, cy, payload, dataKey } = props;
  if (!payload.anomaly) return null;
  const num = payload.anomaly;
  const r = 10;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#a0aec0" strokeWidth={1.5} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#4a5568" fontWeight="700">
        {num}
      </text>
    </g>
  );
};

// ── Tooltip ────────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)",
      border: "1px solid #c8d8e8",
      borderRadius: 6,
      padding: "8px 12px",
      fontSize: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#2d4a6e" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong> {p.dataKey === "wl" ? "L" : "ppt"}
        </div>
      ))}
    </div>
  );
};

// ── Legend ─────────────────────────────────────────────────────────────────────
const CustomLegend = () => (
  <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 4, fontSize: 13, fontFamily: "'Source Sans 3', sans-serif" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <svg width="30" height="12"><line x1="0" y1="6" x2="30" y2="6" stroke="#1a3a6e" strokeWidth="2.5" /></svg>
      <span style={{ color: "#1a3a6e", fontWeight: 600 }}>Water Level (L)</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <svg width="30" height="12"><line x1="0" y1="6" x2="30" y2="6" stroke="#00bcd4" strokeWidth="2.5" /></svg>
      <span style={{ color: "#00bcd4", fontWeight: 600 }}>Salinity (ppt)</span>
    </div>
  </div>
);

// ── Zoom buttons ───────────────────────────────────────────────────────────────
const ZOOM_OPTIONS = ["All", "Time", "16hr", "8hr", "Day"];

// ── Main component ─────────────────────────────────────────────────────────────
export default function ChartPage() {
  const [activeZoom, setActiveZoom] = useState("Time");
  const [innerZoom, setInnerZoom] = useState("Time");

  return (
    <div style={{
      background: "linear-gradient(135deg, #e8f4fd 0%, #d0e8f8 100%)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      {/* Google font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(90deg, #1e3f7a 0%, #2a5298 100%)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 0.3 }}>
          Water and Salinity AI Analyzer
        </h1>

        {/* Top-right zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#b8d0f0", fontSize: 13, marginRight: 4 }}>Zoom</span>
          {ZOOM_OPTIONS.map((z) => (
            <button
              key={z}
              onClick={() => setActiveZoom(z)}
              style={{
                padding: "4px 11px",
                borderRadius: 4,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: activeZoom === z ? "#4fc3f7" : "rgba(255,255,255,0.15)",
                color: activeZoom === z ? "#fff" : "#c8dff8",
                transition: "all 0.15s",
              }}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart card ── */}
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", gap: 14 }}>
        <div style={{
          flex: 1,
          background: "rgba(255,255,255,0.85)",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(30,63,122,0.12)",
          padding: "16px 8px 12px 4px",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Inner zoom row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 12 }}>
            <span style={{ fontSize: 12, color: "#5a7aa0" }}>Zoom</span>
            <button style={innerBtnStyle(false)}>🔍</button>
            {["Time", "Zoom"].map((z) => (
              <button
                key={z}
                onClick={() => setInnerZoom(z)}
                style={innerBtnStyle(innerZoom === z)}
              >
                {z}
              </button>
            ))}
            <button style={innerBtnStyle(false)}>🔍</button>
          </div>

          <CustomLegend />

          <div style={{ flex: 1, position: "relative", minHeight: 380 }}>
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={RAW_DATA} margin={{ top: 10, right: 180, left: 8, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde8f0" vertical={true} horizontal={true} />

                {/* Water level optimal band: ~200–270 */}
                <ReferenceArea y1={200} y2={270} fill="#4a7fc1" fillOpacity={0.18} />
                {/* Inner tighter band ~220–265 */}
                <ReferenceArea y1={220} y2={265} fill="#4a7fc1" fillOpacity={0.15} />
                {/* Salinity optimal band: ~40–95 */}
                <ReferenceArea y1={40} y2={95} fill="#00bcd4" fillOpacity={0.13} />

                {/* Boundary dashed lines */}
                <ReferenceLine y={270} stroke="#7aaad0" strokeDasharray="6 3" strokeWidth={1.2} />
                <ReferenceLine y={120} stroke="#7aaad0" strokeDasharray="6 3" strokeWidth={1.2} />

                <XAxis
                  dataKey="t"
                  tick={{ fontSize: 9.5, fill: "#4a6a8a", fontFamily: "'Source Sans 3', sans-serif" }}
                  angle={-45}
                  textAnchor="end"
                  interval={2}
                  height={62}
                  label={{ value: "Time (Hours)", position: "insideBottom", offset: -10, fontSize: 12, fill: "#2d4a6e", fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[20, 300]}
                  tick={{ fontSize: 10, fill: "#4a6a8a" }}
                  ticks={[20, 30, 90, 150, 275, 300]}
                  label={{ value: "Water Level (L)", angle: -90, position: "insideLeft", offset: 14, fontSize: 12, fill: "#2d4a6e", fontWeight: 600 }}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Water level line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="wl"
                  name="Water Level"
                  stroke="#1a3a6e"
                  strokeWidth={2.2}
                  dot={<AnomalyDot />}
                  activeDot={{ r: 5, fill: "#1a3a6e" }}
                  isAnimationActive={true}
                />

                {/* Salinity line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sal"
                  name="Salinity"
                  stroke="#00bcd4"
                  strokeWidth={2}
                  dot={<AnomalyDot />}
                  activeDot={{ r: 5, fill: "#00bcd4" }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* ── Side annotation labels ── */}
            <div style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: 168,
              height: "100%",
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              paddingBottom: 60,
              paddingTop: 20,
            }}>
              <AnnotationLabel
                color="#c8ddf5"
                borderColor="#7aaad0"
                text="Anomaly 1: Water Spout Detect"
                top="2%"
              />
              <AnnotationLabel
                color="#c8ddf5"
                borderColor="#7aaad0"
                text="Anomaly 2: Salt Injection Misfeed"
                top="30%"
              />
              <AnnotationLabel
                color="#b2eaf0"
                borderColor="#00bcd4"
                text="Optimal Salinity Range"
                top="62%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function innerBtnStyle(active) {
  return {
    padding: "3px 9px",
    borderRadius: 4,
    border: "1px solid #c8d8e8",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    background: active ? "#4a7fc1" : "#f0f6fb",
    color: active ? "#fff" : "#4a6a8a",
    transition: "all 0.12s",
  };
}

function AnnotationLabel({ color, borderColor, text, top }) {
  return (
    <div style={{
      position: "absolute",
      right: 4,
      top,
      background: color,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 6,
      padding: "5px 8px",
      fontSize: 11,
      fontWeight: 600,
      color: "#2d4a6e",
      maxWidth: 158,
      lineHeight: 1.35,
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      {text}
    </div>
  );
}
