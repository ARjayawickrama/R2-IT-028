import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const DRY_FISH_DATA = [
  { id: 1, name: "Dried Anchovy",      weight: 2.35, moisture: 12.4, temp: 78.6, quality: "Grade A", status: "DRYING",   color: "#f97316", batch: "B-001" },
  { id: 2, name: "Salted Mackerel",    weight: 3.10, moisture: 15.1, temp: 74.2, quality: "Grade A", status: "DRYING",   color: "#ef4444", batch: "B-002" },
  { id: 3, name: "Dried Sardine",      weight: 1.85, moisture: 10.8, temp: 82.1, quality: "Grade B", status: "COMPLETE", color: "#22c55e", batch: "B-003" },
  { id: 4, name: "Smoked Tuna",        weight: 4.20, moisture: 8.3,  temp: 90.5, quality: "Grade A", status: "COMPLETE", color: "#22c55e", batch: "B-004" },
  { id: 5, name: "Dried Squid",        weight: 0.95, moisture: 18.2, temp: 65.3, quality: "Grade C", status: "PENDING",  color: "#8b5cf6", batch: "B-005" },
  { id: 6, name: "Sun-dried Herring",  weight: 2.60, moisture: 14.5, temp: 71.8, quality: "Grade B", status: "DRYING",   color: "#f97316", batch: "B-006" },
];

const STATUS_COLORS = {
  DRYING:   { bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
  COMPLETE: { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  PENDING:  { bg: "#f5f3ff", text: "#6d28d9", dot: "#8b5cf6" },
};

const QUALITY_COLORS = {
  "Grade A": "#22c55e",
  "Grade B": "#f59e0b",
  "Grade C": "#ef4444",
};

function rnd(min, max) { return +(min + Math.random() * (max - min)).toFixed(1); }
function genSpark(len, min, max) {
  const a = [rnd(min, max)];
  for (let i = 1; i < len; i++) {
    const p = a[i-1], n = p + (Math.random()-0.48)*(max-min)*0.15;
    a.push(+(Math.min(max, Math.max(min, n)).toFixed(1)));
  }
  return a;
}

const SPARKS = DRY_FISH_DATA.map(f => genSpark(16, f.moisture - 3, f.moisture + 3));

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 80, h = 28 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6}
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Moisture Bar ─────────────────────────────────────────────────────────────
function MoistureBar({ value, max = 25 }) {
  const pct = Math.min(value / max, 1);
  const color = value < 12 ? "#22c55e" : value < 18 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ width: "100%", height: 6, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s" }} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, unit, color, bg }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.055)", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#9ca3af" }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.2 }}>
          {value} <span style={{ fontSize: 12, fontWeight: 500 }}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DryFish() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const filters = ["All", "DRYING", "COMPLETE", "PENDING"];
  const visible = filter === "All" ? DRY_FISH_DATA : DRY_FISH_DATA.filter(f => f.status === filter);

  const totalWeight = DRY_FISH_DATA.reduce((a, f) => a + f.weight, 0).toFixed(2);
  const avgMoisture = (DRY_FISH_DATA.reduce((a, f) => a + f.moisture, 0) / DRY_FISH_DATA.length).toFixed(1);
  const drying   = DRY_FISH_DATA.filter(f => f.status === "DRYING").length;
  const complete = DRY_FISH_DATA.filter(f => f.status === "COMPLETE").length;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#f4f5fb", minHeight: "100vh", padding: "20px 24px", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1d2e", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>🐟</span> Dry Fish Monitor
          </h1>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Batch drying management · Live status</div>
        </div>
        <button style={{ padding: "9px 20px", borderRadius: 10, background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          <span>📤</span> Export Report
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        <StatCard icon="⚖️"  label="Total Weight"     value={totalWeight} unit="kg"    color="#1a1d2e" bg="#f0f9ff" />
        <StatCard icon="💧"  label="Avg Moisture"     value={avgMoisture} unit="%"     color="#3b82f6" bg="#eff6ff" />
        <StatCard icon="🔥"  label="Currently Drying" value={drying}      unit="batch" color="#f97316" bg="#fff7ed" />
        <StatCard icon="✅"  label="Completed"        value={complete}    unit="batch" color="#22c55e" bg="#f0fdf4" />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {filters.map(f => {
          const active = filter === f;
          const sc = f !== "All" ? STATUS_COLORS[f] : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "7px 18px", borderRadius: 20,
                background: active ? (sc ? sc.bg : "#1a1d2e") : "#fff",
                color: active ? (sc ? sc.text : "#fff") : "#6b7280",
                border: active ? `1.5px solid ${sc ? sc.dot : "#1a1d2e"}` : "1.5px solid #e5e7eb",
                fontWeight: active ? 700 : 500,
                fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {sc && <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? sc.dot : "#ccc", display: "inline-block" }} />}
              {f === "All" ? "🐟 All dry fish" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>
          {visible.length} batch{visible.length !== 1 ? "es" : ""}
        </div>
      </div>

      {/* Fish grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        {visible.map((fish, idx) => {
          const sc = STATUS_COLORS[fish.status];
          const isSelected = selected === fish.id;
          return (
            <div
              key={fish.id}
              onClick={() => setSelected(isSelected ? null : fish.id)}
              style={{
                background: "#fff", borderRadius: 14, padding: "16px 18px",
                boxShadow: isSelected ? `0 0 0 2px ${sc.dot}, 0 4px 16px rgba(0,0,0,0.08)` : "0 1px 8px rgba(0,0,0,0.055)",
                cursor: "pointer", transition: "box-shadow 0.2s",
              }}
            >
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1d2e" }}>{fish.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Batch {fish.batch}</div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: sc.bg, color: sc.text,
                  fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                  {fish.status}
                </span>
              </div>

              {/* Metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Weight", val: `${fish.weight} kg`, color: "#1a1d2e" },
                  { label: "Temp", val: `${fish.temp}°C`, color: "#ef4444" },
                  { label: "Quality", val: fish.quality, color: QUALITY_COLORS[fish.quality] },
                ].map(m => (
                  <div key={m.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "7px 10px" }}>
                    <div style={{ fontSize: 9, color: "#9ca3af" }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Moisture */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280", marginBottom: 4 }}>
                  <span>Moisture Level</span>
                  <span style={{ fontWeight: 700 }}>{fish.moisture}%</span>
                </div>
                <MoistureBar value={fish.moisture} />
              </div>

              {/* Sparkline */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>Moisture trend</div>
                <Sparkline data={SPARKS[fish.id - 1]} color={sc.dot} w={90} h={26} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (() => {
        const fish = DRY_FISH_DATA.find(f => f.id === selected);
        const sc = STATUS_COLORS[fish.status];
        return (
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", boxShadow: "0 1px 8px rgba(0,0,0,0.055)", borderTop: `3px solid ${sc.dot}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1d2e" }}>
                🐟 {fish.name} — Batch {fish.batch}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
              {[
                ["Weight",   `${fish.weight} kg`, "#1a1d2e"],
                ["Temp",     `${fish.temp}°C`,    "#ef4444"],
                ["Moisture", `${fish.moisture}%`, "#3b82f6"],
                ["Quality",  fish.quality,        QUALITY_COLORS[fish.quality]],
                ["Status",   fish.status,         sc.dot],
                ["Batch",    fish.batch,          "#8b5cf6"],
              ].map(([l,v,c]) => (
                <div key={l} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
