import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rnd(min, max) { return +(min + Math.random() * (max - min)).toFixed(2); }
function genSeries(len, min, max) {
  const arr = [rnd(min, max)];
  for (let i = 1; i < len; i++) {
    const prev = arr[i - 1];
    const next = prev + (Math.random() - 0.48) * (max - min) * 0.14;
    arr.push(+(Math.min(max, Math.max(min, next)).toFixed(2)));
  }
  return arr;
}

const LABELS = ["09:30","09:40","09:50","10:00","10:10","10:20","10:30"];
const DS_DATA  = genSeries(7, 72, 90);
const SHT_DATA = genSeries(7, 58, 70);
const AMG_DATA = genSeries(7, 45, 62);
const W_DATA   = genSeries(7, 1.8, 3.5);
const SPARK20  = genSeries(20, 130, 165);

function generateThermalGrid() {
  return Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => {
      const dx = c - 3.5, dy = r - 3.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return +(100 - dist * 9 + rnd(-5, 5)).toFixed(1);
    })
  );
}
const GRID = generateThermalGrid();
const GRID_MIN = Math.min(...GRID.flat());
const GRID_MAX = Math.max(...GRID.flat());

function thermalColor(v, min, max) {
  const t = (v - min) / (max - min);
  if (t > 0.85) return "#ffe000";
  if (t > 0.70) return "#ff9000";
  if (t > 0.55) return "#ff4400";
  if (t > 0.40) return "#cc1100";
  if (t > 0.25) return "#aa00cc";
  if (t > 0.10) return "#6600bb";
  return "#3a008a";
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 130, h = 34 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8}
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Multi Line Chart ─────────────────────────────────────────────────────────
function LineChart({ series, labels }) {
  const W = 500, H = 170, pad = { t: 12, r: 12, b: 30, l: 38 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const all = series.flatMap(s => s.data);
  const minV = Math.floor(Math.min(...all) / 25) * 25;
  const maxV = Math.ceil(Math.max(...all) / 25) * 25;
  const xOf = i => pad.l + (i / (labels.length - 1)) * iW;
  const yOf = v => pad.t + iH - ((v - minV) / (maxV - minV)) * iH;
  const gridVs = [];
  for (let v = minV; v <= maxV; v += 25) gridVs.push(v);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {gridVs.map(v => (
        <g key={v}>
          <line x1={pad.l} x2={pad.l+iW} y1={yOf(v)} y2={yOf(v)} stroke="#f0f0f0" strokeWidth={1} />
          <text x={pad.l-4} y={yOf(v)+4} textAnchor="end" fontSize={9} fill="#ccc">{v}</text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={l} x={xOf(i)} y={H-4} textAnchor="middle" fontSize={9} fill="#ccc">{l}</text>
      ))}
      {series.map(s => {
        const pts = s.data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
        return (
          <g key={s.label}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.2}
              strokeLinejoin="round" strokeLinecap="round" />
            {s.data.map((v, i) => (
              <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3.2} fill={s.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Area Chart ───────────────────────────────────────────────────────────────
function AreaChart({ data, labels, color }) {
  const W = 360, H = 130, pad = { t: 10, r: 10, b: 28, l: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const minV = Math.floor(Math.min(...data) * 2) / 2;
  const maxV = Math.ceil(Math.max(...data) * 2) / 2;
  const xOf = i => pad.l + (i / (data.length - 1)) * iW;
  const yOf = v => pad.t + iH - ((v - minV) / (maxV - minV || 1)) * iH;
  const pts = data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
  const area = `${xOf(0)},${pad.t+iH} ${pts} ${xOf(data.length-1)},${pad.t+iH}`;
  const gridVs = [1.0,2.0,3.0,4.0].filter(v => v >= minV && v <= maxV);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {gridVs.map(v => (
        <g key={v}>
          <line x1={pad.l} x2={pad.l+iW} y1={yOf(v)} y2={yOf(v)} stroke="#f0f0f0" strokeWidth={1} />
          <text x={pad.l-4} y={yOf(v)+4} textAnchor="end" fontSize={9} fill="#ccc">{v.toFixed(1)}</text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={l} x={xOf(i)} y={H-4} textAnchor="middle" fontSize={8} fill="#ccc">{l}</text>
      ))}
      <polygon points={area} fill="url(#ag)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
      {data.map((v, i) => <circle key={i} cx={xOf(i)} cy={yOf(v)} r={2.8} fill={color} />)}
    </svg>
  );
}

// ─── Gauge ────────────────────────────────────────────────────────────────────
function Gauge({ value, max = 1000 }) {
  const pct = Math.min(value / max, 1);
  const toRad = d => (d * Math.PI) / 180;
  const cx = 95, cy = 90, r = 72;
  const arcFrom = 220, arcTo = 220 + pct * 280;
  const x1 = cx + r * Math.cos(toRad(arcFrom)), y1 = cy + r * Math.sin(toRad(arcFrom));
  const x2 = cx + r * Math.cos(toRad(arcTo)),   y2 = cy + r * Math.sin(toRad(arcTo));
  const large = pct * 280 > 180 ? 1 : 0;
  const gx1 = cx + r * Math.cos(toRad(220)), gy1 = cy + r * Math.sin(toRad(220));
  const gx2 = cx + r * Math.cos(toRad(500)), gy2 = cy + r * Math.sin(toRad(500));
  const nAngle = arcTo;
  const nx = cx + 58 * Math.cos(toRad(nAngle)), ny = cy + 58 * Math.sin(toRad(nAngle));
  const label = value < 100 ? "Safe" : value < 300 ? "Moderate" : "Dangerous";
  const lColor = value < 100 ? "#22c55e" : value < 300 ? "#f59e0b" : "#ef4444";
  const gColor = value < 100 ? "#22c55e" : value < 300 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={190} height={130} viewBox="0 0 190 130">
      <path d={`M${gx1},${gy1} A${r},${r} 0 1 1 ${gx2},${gy2}`}
        fill="none" stroke="#f0f0f0" strokeWidth={11} strokeLinecap="round" />
      {pct > 0 && (
        <path d={`M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`}
          fill="none" stroke={gColor} strokeWidth={11} strokeLinecap="round" />
      )}
      <circle cx={cx} cy={cy} r={5} fill="#666" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#333" strokeWidth={2.5} strokeLinecap="round" />
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize={28} fontWeight="800" fill="#1a1d2e">{value}</text>
      <text x={cx} y={cy + 42} textAnchor="middle" fontSize={11} fill="#aaa">ppm</text>
      <text x={cx} y={cy + 57} textAnchor="middle" fontSize={12} fontWeight="700" fill={lColor}>{label}</text>
      <text x={cx - 42} y={cy + 16} textAnchor="middle" fontSize={9} fill="#bbb">0</text>
      <text x={cx + 42} y={cy + 16} textAnchor="middle" fontSize={9} fill="#bbb">1000</text>
    </svg>
  );
}

// ─── Card component with Tailwind ─────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.055)] ${className}`}>
      {children}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function EnvironmentalMonitoring() {
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();
  useEffect(() => { const t = setInterval(() => setTick(x => x+1), 1000); return () => clearInterval(t); }, []);
  const now = new Date();
  const timeStr = now.toLocaleTimeString();

  const sensors = [
    { label: "Temperature", sub: "DS18820", val: "78.6", unit: "°C",  delta: "↑2.3°C from last hour",   up: true,  color: "#ef4444", spark: DS_DATA },
    { label: "Humidity",    sub: "SHT31",   val: "62.4", unit: "%RH", delta: "↓1.2% from last hour",    up: false, color: "#8b5cf6", spark: SHT_DATA },
    { label: "Air Quality", sub: "MQ-135",  val: "145",  unit: "ppm", delta: "↑12 ppm from last hour",  up: true,  color: "#f59e0b", spark: SPARK20 },
    { label: "Weight",      sub: "Load Cell",val:"2.35", unit: "kg",  delta: "↑0.05 kg from last hour", up: true,  color: "#22c55e", spark: W_DATA },
    { label: "Heat Index",  sub: "AMG8833", val: "81.2", unit: "°C",  delta: "↑3.1°C from last hour",   up: true,  color: "#f97316", spark: AMG_DATA },
  ];

  return (
    <div className="font-['DM_Sans','Segoe_UI',sans-serif] bg-[#f4f5fb] min-h-screen p-5 box-border">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="m-0 text-xl font-extrabold text-[#1a1d2e]">Environmental Monitor</h1>
          <div className="text-[11px] text-gray-400 mt-0.5">Live sensor data · {timeStr}</div>
        </div>
        <button 
          onClick={() => navigate('/environmental-monitoring/dry-fish')}
          className="px-5 py-2 rounded-lg bg-orange-500 text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:bg-orange-600 hover:-translate-y-px"
        >
          <span className="text-sm">🐟</span> All Dry Fish
        </button>
      </div>

      {/* Row 1 – sensor cards */}
      <div className="grid grid-cols-5 gap-3 mb-3.5">
        {sensors.map(s => (
          <Card key={s.label} className="p-3">
            <div className="text-[10px] text-gray-400 mb-0.5">{s.label} ({s.sub})</div>
            <div className={`text-2xl font-extrabold leading-tight`} style={{ color: s.color }}>
              {s.val} <span className="text-[13px] font-medium">{s.unit}</span>
            </div>
            <div className={`text-[10px] mt-0.5 mb-1.5 ${s.up ? "text-red-500" : "text-blue-500"}`}>
              {s.delta}
            </div>
            <Sparkline data={s.spark} color={s.color} w={130} h={32} />
          </Card>
        ))}
      </div>

      {/* Row 2 – temp line chart + thermal grid */}
      <div className="grid grid-cols-[1fr_340px] gap-3.5 mb-3.5">
        <Card>
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌡️</span>
              <span className="font-bold text-sm text-[#1a1d2e]">Temperature Over Time</span>
            </div>
            <select className="text-[11px] border border-gray-200 rounded-md px-2 py-0.5 text-gray-600 cursor-pointer">
              <option>1 Hour</option><option>6 Hours</option>
            </select>
          </div>
          <LineChart
            series={[
              { label: "DS18820", data: DS_DATA, color: "#ef4444" },
              { label: "SHT31",   data: SHT_DATA, color: "#8b5cf6" },
              { label: "AMG8833", data: AMG_DATA, color: "#3b82f6" },
            ]}
            labels={LABELS}
          />
          <div className="flex gap-4 mt-2">
            {[["DS18820 (Water)","#ef4444"],["SHT31 (Ambient)","#8b5cf6"],["AMG8833 (Avg)","#3b82f6"]].map(([l,c]) => (
              <div key={l} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-sm">🌡️</span>
            <span className="font-bold text-[13px] text-[#1a1d2e]">Thermal View (AMG8833 8x8)</span>
          </div>
          <div className="flex gap-2.5 items-start">
            <div className="grid grid-cols-8 gap-0.5 flex-1">
              {GRID.flat().map((v, i) => (
                <div key={i} title={`${v}°C`} className="aspect-square rounded-md"
                  style={{ background: thermalColor(v, GRID_MIN, GRID_MAX) }} />
              ))}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-gray-500">100°C</span>
              <div className="w-3 h-[155px] rounded-lg bg-gradient-to-b from-[#ffe000] via-[#ff9000] via-[#ff4400] via-[#cc1100] via-[#aa00cc] to-[#3a008a]" />
              <span className="text-[9px] text-gray-500">20°C</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 – gauge + weight area + system status */}
      <div className="grid grid-cols-[210px_1fr_250px] gap-3.5 mb-3.5">
        <Card>
          <div className="flex items-center gap-1.5 mb-2">
            <span>☁️</span>
            <span className="font-bold text-[13px] text-[#1a1d2e]">Air Quality (MQ-135)</span>
          </div>
          <div className="flex justify-center">
            <Gauge value={145} max={1000} />
          </div>
          <div className="text-center text-[10px] text-gray-400 mt-1">
            Safe &lt; 100 ppm &nbsp;|&nbsp; Dangerous &gt; 300 ppm
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <span>⚖️</span>
              <span className="font-bold text-[13px] text-[#1a1d2e]">Weight Over Time</span>
            </div>
            <select className="text-[11px] border border-gray-200 rounded-md px-2 py-0.5 text-gray-600 cursor-pointer">
              <option>1 Hour</option><option>6 Hours</option>
            </select>
          </div>
          <AreaChart data={W_DATA} labels={LABELS} color="#22c55e" />
          <div className="flex justify-center gap-1.5 mt-1.5 text-[11px] text-green-500 items-center">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Weight (kg)
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span>🛡️</span>
            <span className="font-bold text-[13px] text-[#1a1d2e]">System Status</span>
          </div>
          <div className="flex flex-col items-center mb-3.5">
            <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#e0f7fa] to-[#b2ebf2] border-[3px] border-cyan-400 flex items-center justify-center text-3xl">
              🍲
            </div>
            <div className="font-extrabold text-green-500 text-[13px] mt-1.5">BOILING</div>
            <div className="text-[10px] text-gray-400">System Running Normal</div>
          </div>
          {[["All Sensors","Normal"],["Heating Element","ON"],["WiFi Connection","Stable"],["Data Logging","Active"]].map(([l,s]) => (
            <div key={l} className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-[11px] text-green-600 font-bold">✓</div>
              <div>
                <div className="text-xs font-semibold text-[#1a1d2e]">{l}</div>
                <div className="text-[10px] text-green-500">{s}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Row 4 – alerts + quick actions */}
      <div className="grid grid-cols-2 gap-3.5">
        <Card>
          <div className="flex items-center gap-1.5 mb-3">
            <span>🔔</span>
            <span className="font-bold text-[13px] text-[#1a1d2e]">Recent Alerts</span>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 bg-green-50 rounded-lg">
            <span className="text-lg">✅</span>
            <div>
              <div className="text-[13px] font-semibold text-green-600">No critical alerts at the moment</div>
              <div className="text-[11px] text-gray-400">All systems are operating within normal ranges.</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-1.5 mb-3">
            <span>⚡</span>
            <span className="font-bold text-[13px] text-[#1a1d2e]">Quick Actions</span>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Export Data", icon: "📤", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
              { label: "View Logs",   icon: "📋", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
              { label: "Settings",   icon: "⚙️", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
            ].map(b => (
              <button key={b.label} onClick={() => {}} className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[13px] cursor-pointer transition-all hover:scale-105"
                style={{ background: b.bg, border: `1.5px solid ${b.border}`, color: b.color }}>
                <span className="text-[15px]">{b.icon}</span>{b.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}