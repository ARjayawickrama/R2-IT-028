import React, { useState, useEffect, useCallback, useRef } from "react";

/* ─── Google Fonts ─────────────────────────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  `}</style>
);

/* ─── Data ────────────────────────────────────────────────────────────────── */
const PAGES = [
  {
    id: 1,
    title: "Fish Identification",
    tag: "STEP 1 — IDENTIFY",
    subtitle:
      "Incoming fish are scanned by the AI vision module at the intake conveyor. Each fish is identified by species, size, and freshness grade before entering the processing line.",
    image: "/conveyorbelt.png",
    fallback:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&h=420&fit=crop",
    accent: "#00E5FF",
    accentDark: "#006070",
    features: [
      {
        icon: "camera",
        label: "AI Vision",
        title: "Automated fish detection",
        desc: "Identifies species, size, and freshness in real time",
        color: "#00E5FF",
      },
      {
        icon: "scale",
        label: "Intake Weighing",
        title: "Calibrated at entry",
        desc: "Each batch weighed and logged with supplier ID",
        color: "#06D6A0",
      },
      {
        icon: "check",
        label: "Species Check",
        title: "99 % accuracy rate",
        desc: "Vision model trained on 40 + local fish species",
        color: "#A78BFA",
      },
    ],
  },
  {
    id: 2,
    title: "Boiling System",
    tag: "STEP 2 — BOIL",
    subtitle:
      "Identified fish are transferred into the pressurised boiling chamber. Water is maintained at 100 °C with precision thermal controls to ensure full sterilisation and coagulation before drying.",
    image: "/WaterSalinityControl.png",
    fallback:
      "https://images.unsplash.com/photo-1543168268-1e3b5ed6d4b8?w=900&h=420&fit=crop",
    accent: "#FF6B35",
    accentDark: "#7a2200",
    features: [
      {
        icon: "water",
        label: "Boiling Chamber",
        title: "100 °C maintained",
        desc: "Pressurised tank ensures consistent full boil",
        color: "#FF6B35",
      },
      {
        icon: "thermometer",
        label: "Thermal Logging",
        title: "Logged every 30 sec",
        desc: "Auto-alert if temperature drops below threshold",
        color: "#FFD166",
      },
      {
        icon: "snowflake",
        label: "Salt Bath Option",
        title: "Brine concentration",
        desc: "Optional 8 – 12 % salt solution for Maldive fish prep",
        color: "#A78BFA",
      },
    ],
  },
  {
    id: 3,
    title: "Maldive Fish Drying",
    tag: "STEP 3 — DRY",
    subtitle:
      "After boiling, fish are transferred to the drying oven. Controlled airflow and temperature gradually reduce moisture content to below 20 %, producing firm, shelf-stable Maldive fish (umbalakada).",
    image: "/dryingoven.png",
    fallback:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&h=420&fit=crop",
    accent: "#FFD166",
    accentDark: "#6a5200",
    features: [
      {
        icon: "thermometer",
        label: "Drying Oven",
        title: "55 – 65 °C airflow",
        desc: "Forced hot-air circulation for uniform drying",
        color: "#FFD166",
      },
      {
        icon: "calendar-week",
        label: "Drying Duration",
        title: "6 – 8 hours per batch",
        desc: "Duration adjusted by fish size and moisture sensor",
        color: "#FF9A3C",
      },
      {
        icon: "box",
        label: "Moisture Target",
        title: "< 20 % moisture",
        desc: "Sensor confirms safe moisture before packaging",
        color: "#06D6A0",
      },
    ],
  },
  {
    id: 4,
    title: "Quality Checking",
    tag: "STEP 4 — QC",
    subtitle:
      "Dried Maldive fish pass through a final AI vision and manual inspection station. Each unit is graded — Premium, Good, or Processing — and batch-labelled before entering cold storage.",
    image: "/Quality.png",
    fallback:
      "https://images.unsplash.com/photo-1586733432416-e936eff5dc85?w=900&h=420&fit=crop",
    accent: "#06D6A0",
    accentDark: "#024d38",
    features: [
      {
        icon: "star",
        label: "Premium Grade",
        title: "Top 20 % of batch",
        desc: "Firm texture, deep colour, full shape intact",
        color: "#06D6A0",
      },
      {
        icon: "check",
        label: "Good Grade",
        title: "Standard export quality",
        desc: "Minor surface cracks acceptable, no soft spots",
        color: "#FFD166",
      },
      {
        icon: "alert",
        label: "Processing Grade",
        title: "Secondary use",
        desc: "Broken pieces redirected to powder / paste line",
        color: "#FF6B35",
      },
    ],
  },
];

/* ─── Icons ───────────────────────────────────────────────────────────────── */
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = {
    width: size, height: size, fill: "none", stroke: color,
    strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0,
  };
  switch (name) {
    case "camera": return <svg viewBox="0 0 24 24" style={s}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
    case "water": return <svg viewBox="0 0 24 24" style={s}><path d="M12 2C6 9 4 13.5 4 16a8 8 0 0016 0c0-2.5-2-7-8-14z"/></svg>;
    case "snowflake": return <svg viewBox="0 0 24 24" style={s}><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4"/></svg>;
    case "star": return <svg viewBox="0 0 24 24" style={s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "check": return <svg viewBox="0 0 24 24" style={s}><polyline points="20 6 9 17 4 12"/></svg>;
    case "alert": return <svg viewBox="0 0 24 24" style={s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "scale": return <svg viewBox="0 0 24 24" style={s}><path d="M12 3v18M3 9l9-6 9 6M3 15l9 6 9-6"/></svg>;
    case "thermometer": return <svg viewBox="0 0 24 24" style={s}><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>;
    case "box": return <svg viewBox="0 0 24 24" style={s}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
    case "calendar-day": return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="1.5" fill={color} stroke="none"/></svg>;
    case "calendar-week": return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>;
    case "calendar-month": return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="8" y="13" width="8" height="5" rx="1" strokeWidth={1.4}/></svg>;
    case "chevron-left": return <svg viewBox="0 0 24 24" style={s}><polyline points="15 18 9 12 15 6"/></svg>;
    case "chevron-right": return <svg viewBox="0 0 24 24" style={s}><polyline points="9 18 15 12 9 6"/></svg>;
    case "x": return <svg viewBox="0 0 24 24" style={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "fish": return <svg viewBox="0 0 24 24" style={s}><path d="M6 12c0-4 3-7 9-7s9 3 9 7-3 7-9 7-9-3-9-7z"/><path d="M2 9l4 3-4 3"/><circle cx="17" cy="12" r="1.5" fill={color} stroke="none"/></svg>;
    default: return null;
  }
};

/* ─── Animated number counter ─────────────────────────────────────────────── */
const Counter = ({ value, suffix = "" }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end)) return;
    const duration = 1200;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}{suffix}</span>;
};

/* ─── Lightbox ────────────────────────────────────────────────────────────── */
const Lightbox = ({ src, title, accent, onClose }) => {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      backdropFilter: "blur(8px)", animation: "lbFadeIn .2s ease"
    }}>
      <style>{`@keyframes lbFadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#ffffff", borderRadius: 16, overflow: "hidden",
        maxWidth: 900, width: "100%",
        boxShadow: `0 0 0 1px ${accent}33, 0 30px 60px rgba(0,0,0,.2)`,
        animation: "lbSlide .25s cubic-bezier(.2,.8,.3,1)"
      }}>
        <style>{`@keyframes lbSlide{from{transform:scale(.94) translateY(20px)}to{transform:scale(1) translateY(0)}}`}</style>
        <div style={{
          background: `#fafcff`,
          borderBottom: `1px solid ${accent}22`,
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 6px ${accent}` }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1a202c", fontFamily: "'Syne', sans-serif" }}>{title}</span>
          </div>
          <button onClick={onClose} style={{
            border: "none", background: "rgba(0,0,0,.05)", cursor: "pointer",
            padding: "6px 8px", borderRadius: 8, display: "flex", color: "#64748b",
            transition: "all .15s"
          }}>
            <Icon name="x" size={16} color="#64748b" />
          </button>
        </div>
        <div style={{ background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, minHeight: 340 }}>
          <img src={src} alt={title} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
};

/* ─── Scanline overlay ────────────────────────────────────────────────────── */
const Scanlines = () => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3,
    backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.02) 2px,rgba(0,0,0,.02) 4px)",
    borderRadius: "inherit"
  }} />
);

/* ─── Noise texture ───────────────────────────────────────────────────────── */
const Noise = () => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, opacity: .02,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
    backgroundSize: "120px 120px"
  }} />
);

/* ─── Floating particle fish ──────────────────────────────────────────────── */
const ParticleFish = ({ accent }) => {
  const fish = [
    { top: "12%", left: "8%", size: 52, delay: 0, dur: 18, dir: 1 },
    { top: "68%", right: "12%", size: 38, delay: 3, dur: 22, dir: -1 },
    { top: "38%", left: "3%", size: 28, delay: 6, dur: 16, dir: 1 },
    { top: "82%", left: "18%", size: 64, delay: 1, dur: 26, dir: 1 },
    { top: "22%", right: "8%", size: 44, delay: 5, dur: 20, dir: -1 },
    { top: "55%", right: "5%", size: 32, delay: 2, dur: 14, dir: -1 },
  ];
  return (
    <>
      {fish.map((f, i) => (
        <div key={i} style={{
          position: "absolute",
          top: f.top, left: f.left, right: f.right,
          width: f.size, height: f.size * 0.5,
          opacity: 0.08,
          animation: `fish${i % 3} ${f.dur}s ease-in-out ${f.delay}s infinite`,
          transform: f.dir === -1 ? "scaleX(-1)" : "none",
          pointerEvents: "none"
        }}>
          <svg width={f.size} height={f.size * 0.5} viewBox="0 0 80 40">
            <ellipse cx="28" cy="20" rx="20" ry="11" fill={accent} />
            <polygon points="48,20 72,6 72,34" fill={accent} />
            <circle cx="17" cy="15" r="3.5" fill="#ffffff" />
            <circle cx="16" cy="14.5" r="1.5" fill="#000000" opacity=".5" />
            <path d="M22 24 Q32 29 42 24" stroke={accent} strokeWidth="1.5" fill="none" opacity=".6" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes fish0{0%,100%{transform:translate(0,0) rotate(0deg)}25%{transform:translate(40px,-20px) rotate(4deg)}50%{transform:translate(80px,15px) rotate(-3deg)}75%{transform:translate(30px,-10px) rotate(2deg)}}
        @keyframes fish1{0%,100%{transform:translate(0,0) rotate(0deg) scaleX(-1)}33%{transform:translate(-50px,30px) rotate(-6deg) scaleX(-1)}66%{transform:translate(-20px,-40px) rotate(5deg) scaleX(-1)}}
        @keyframes fish2{0%,100%{transform:translate(0,0)}20%{transform:translate(30px,20px) rotate(8deg)}40%{transform:translate(-20px,-30px) rotate(-5deg)}60%{transform:translate(50px,10px)}80%{transform:translate(-10px,-15px)}}
      `}</style>
    </>
  );
};

/* ─── Stats bar ───────────────────────────────────────────────────────────── */
const STATS = [
  { label: "Fish / hr", val: "2400", suffix: "+" },
  { label: "Accuracy", val: "99", suffix: "%" },
  { label: "Temp precision", val: "±0.2", suffix: "°C" },
  { label: "Uptime", val: "99.7", suffix: "%" },
];

const StatsBar = ({ accent }) => (
  <div style={{
    display: "flex", gap: 0,
    borderTop: "1px solid rgba(0,0,0,.08)",
    background: "#f8fafc"
  }}>
    {STATS.map((s, i) => (
      <div key={i} style={{
        flex: 1, padding: "14px 0", textAlign: "center",
        borderRight: i < STATS.length - 1 ? "1px solid rgba(0,0,0,.06)" : "none"
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: accent, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
          {s.val}{s.suffix}
        </div>
        <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>
          {s.label}
        </div>
      </div>
    ))}
  </div>
);

/* ─── Step pipeline indicator ─────────────────────────────────────────────── */
const PipelineSteps = ({ currentIdx, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "10px 24px 0" }}>
    {PAGES.map((p, i) => (
      <React.Fragment key={p.id}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: i < currentIdx ? accent : i === currentIdx ? accent : "#e2e8f0",
            border: `2px solid ${i <= currentIdx ? accent : "#cbd5e1"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800,
            color: i <= currentIdx ? "#0f172a" : "#94a3b8",
            fontFamily: "'Syne', sans-serif",
            transition: "all .4s ease",
            boxShadow: i === currentIdx ? `0 0 10px ${accent}60` : "none"
          }}>
            {i < currentIdx ? "✓" : i + 1}
          </div>
          <div style={{
            fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
            color: i === currentIdx ? accent : i < currentIdx ? "#64748b" : "#cbd5e1",
            textAlign: "center", lineHeight: 1.3, maxWidth: 60,
            transition: "color .4s ease"
          }}>
            {p.tag.split("—")[1]?.trim() || p.tag}
          </div>
        </div>
        {i < PAGES.length - 1 && (
          <div style={{
            flex: 2, height: 2, marginBottom: 18,
            background: i < currentIdx
              ? `linear-gradient(90deg, ${accent}, ${accent})`
              : `linear-gradient(90deg, ${i === currentIdx ? accent : "#e2e8f0"}, #e2e8f0)`,
            transition: "background .4s ease"
          }} />
        )}
      </React.Fragment>
    ))}
  </div>
);

/* ─── Feature card ────────────────────────────────────────────────────────── */
const FeatureCard = ({ f, idx }) => (
  <div style={{
    display: "flex", gap: 14, alignItems: "flex-start",
    padding: "16px 20px",
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,.08)",
    borderLeft: `3px solid ${f.color}`,
    borderRadius: 12,
    transition: "background .2s, transform .2s",
    animation: `cardIn .4s cubic-bezier(.2,.8,.3,1) ${idx * 0.08 + 0.1}s both`,
    cursor: "default",
    boxShadow: "0 1px 2px rgba(0,0,0,.02)"
  }}
    onMouseEnter={e => {
      e.currentTarget.style.background = "#f9f9ff";
      e.currentTarget.style.transform = "translateX(4px)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = "#ffffff";
      e.currentTarget.style.transform = "translateX(0)";
    }}
  >
    <div style={{
      width: 42, height: 42, borderRadius: 10,
      background: `${f.color}10`,
      border: `1px solid ${f.color}30`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>
      <Icon name={f.icon} size={18} color={f.color} />
    </div>
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: f.color, textTransform: "uppercase", marginBottom: 4 }}>
        {f.label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", lineHeight: 1.2, fontFamily: "'Syne', sans-serif" }}>
        {f.title}
      </div>
      <div style={{ fontSize: 11, color: "#5b6b8c", lineHeight: 1.5, marginTop: 4 }}>
        {f.desc}
      </div>
    </div>
  </div>
);

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function GuidelinesPage({ onClose, onFinish }) {
  const [pageIdx, setPageIdx] = useState(0);
  const [imgErr, setImgErr] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prevIdx = useRef(pageIdx);

  const page = PAGES[pageIdx];
  const isFirst = pageIdx === 0;
  const isLast = pageIdx === PAGES.length - 1;
  const imgSrc = imgErr[page.id] ? page.fallback : page.image;

  const goTo = useCallback((idx) => {
    if (idx === pageIdx || transitioning) return;
    setTransitioning(true);
    setImgLoaded(false);
    setTimeout(() => {
      prevIdx.current = idx;
      setPageIdx(idx);
      setTransitioning(false);
    }, 220);
  }, [pageIdx, transitioning]);

  const handleBack = useCallback(() => { if (!isFirst) goTo(pageIdx - 1); }, [isFirst, goTo, pageIdx]);
  const handleNext = useCallback(() => {
    if (!isLast) goTo(pageIdx + 1);
    else onFinish?.();
  }, [isLast, goTo, pageIdx, onFinish]);
  const handleCancel = useCallback(() => onClose?.(), [onClose]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowLeft") handleBack();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleBack, handleNext, handleCancel]);

  const progress = ((pageIdx + 1) / PAGES.length) * 100;

  return (
    <>
      <FontLink />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes cardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px var(--ac)33}50%{box-shadow:0 0 40px var(--ac)55}}
        @keyframes scanH{0%{top:-100%}100%{top:110%}}
        .page-wrap{opacity:1;transition:opacity .22s ease,transform .22s ease}
        .page-wrap.out{opacity:0;transform:translateX(-16px)}
        .nb:hover{filter:brightness(1.02);transform:scale(1.02)!important}
      `}</style>

      {lightbox && (
        <Lightbox src={lightbox.src} title={lightbox.title} accent={page.accent} onClose={() => setLightbox(null)} />
      )}

      {/* ── Full screen shell ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f1f5f9",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <ParticleFish accent={page.accent} />

        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${page.accent}08 0%, transparent 80%)`,
          transition: "background 1s ease"
        }} />

        {/* ── Card ── */}
        <div style={{
          "--ac": page.accent,
          width: "96vw", maxWidth: 1180,
          height: "92vh", maxHeight: 840,
          display: "flex", flexDirection: "column",
          background: "#ffffff",
          borderRadius: 24,
          border: `1px solid ${page.accent}30`,
          overflow: "hidden",
          boxShadow: `0 20px 40px -12px rgba(0,0,0,.1), 0 0 0 1px ${page.accent}08, 0 0 0 3px rgba(255,255,255,.8)`,
          position: "relative",
          transition: "border-color .4s ease, box-shadow .4s ease"
        }}>
          <Noise />
          <Scanlines />

          {/* Scanning line */}
          <div style={{
            position: "absolute", left: 0, right: 0, height: 2, zIndex: 10,
            background: `linear-gradient(90deg, transparent, ${page.accent}80, transparent)`,
            animation: "scanH 6s linear infinite",
            pointerEvents: "none"
          }} />

          {/* ── Header ── */}
          <div style={{
            padding: "0 28px",
            borderBottom: `1px solid ${page.accent}20`,
            background: "#fefefe",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16, flexShrink: 0, minHeight: 64, position: "relative", zIndex: 4
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36,
                background: `linear-gradient(135deg, ${page.accent}20, ${page.accent}05)`,
                border: `1px solid ${page.accent}40`,
                borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 2px 6px ${page.accent}10`
              }}>
                <Icon name="fish" size={18} color={page.accent} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", fontFamily: "'Syne', sans-serif", letterSpacing: -.3 }}>
                  FishGo
                </div>
                <div style={{ fontSize: 9, color: "#6b7280", letterSpacing: 2, textTransform: "uppercase" }}>
                  Smart Processing
                </div>
              </div>
            </div>

            {/* Center: page dots */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {PAGES.map((p, i) => (
                <button key={p.id} onClick={() => goTo(i)} style={{
                  width: i === pageIdx ? 28 : 8, height: 8, borderRadius: 4, border: "none",
                  cursor: "pointer", padding: 0, transition: "all .35s cubic-bezier(.2,.8,.3,1)",
                  background: i === pageIdx ? page.accent : i < pageIdx ? `${page.accent}70` : "rgba(0,0,0,.15)",
                  boxShadow: i === pageIdx ? `0 0 6px ${page.accent}80` : "none"
                }} title={p.title} />
              ))}
            </div>

            {/* Nav buttons */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {[
                { label: "Back", icon: "chevron-left", action: handleBack, disabled: isFirst },
                { label: isLast ? "Finish" : "Next", icon: isLast ? null : "chevron-right", action: handleNext, disabled: false, primary: true },
                { label: "✕", action: handleCancel, disabled: false, close: true },
              ].map((b, i) => (
                <button key={i} onClick={b.action} disabled={b.disabled} className={b.disabled ? "" : "nb"} style={{
                  padding: b.close ? "6px 10px" : "7px 16px",
                  borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: b.disabled ? "not-allowed" : "pointer",
                  background: b.primary ? page.accent : b.close ? "#fee2e2" : "#f1f5f9",
                  color: b.primary ? "#0f172a" : b.close ? "#b91c1c" : b.disabled ? "#cbd5e1" : "#1e293b",
                  border: `1px solid ${b.primary ? page.accent : b.close ? "#fecaca" : "#e2e8f0"}`,
                  transition: "all .2s",
                  display: "flex", alignItems: "center", gap: 4,
                  opacity: b.disabled ? 0.5 : 1,
                  fontFamily: "'Syne', sans-serif"
                }}>
                  {b.icon === "chevron-left" && <Icon name="chevron-left" size={12} color="currentColor" />}
                  {b.label}
                  {b.icon === "chevron-right" && <Icon name="chevron-right" size={12} color="currentColor" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div style={{ height: 2, background: "#eef2ff", flexShrink: 0, position: "relative", zIndex: 4 }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: `linear-gradient(90deg, ${page.accent}aa, ${page.accent})`,
              transition: "width .5s cubic-bezier(.2,.8,.3,1), background .6s ease",
              boxShadow: `0 0 6px ${page.accent}80`
            }} />
          </div>

          {/* ── Pipeline step indicator ── */}
          <div style={{ background: "#fafcff", borderBottom: `1px solid ${page.accent}15`, flexShrink: 0, zIndex: 4, position: "relative" }}>
            <PipelineSteps currentIdx={pageIdx} accent={page.accent} />
            <div style={{ height: 12 }} />
          </div>

          {/* ── Body ── */}
          <div className={`page-wrap${transitioning ? " out" : ""}`} style={{
            flex: 1, display: "flex", gap: 0, overflow: "hidden", position: "relative", zIndex: 4
          }}>
            {/* Left: image */}
            <div style={{ flex: "1.1", position: "relative", overflow: "hidden" }}>
              <img
                src={imgSrc}
                alt={page.title}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgErr(p => ({ ...p, [page.id]: true }))}
                onClick={() => setLightbox({ src: imgSrc, title: page.title })}
                style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  cursor: "zoom-in",
                  filter: "brightness(0.95) saturate(1.05)",
                  transition: "opacity .4s ease, transform .4s ease",
                  opacity: imgLoaded ? 1 : 0,
                  transform: imgLoaded ? "scale(1)" : "scale(1.02)"
                }}
              />

              {/* Gradient fades */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(90deg, transparent 40%, #ffffff 100%)"
              }} />
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(to top, #ffffff 0%, transparent 40%)"
              }} />

              {/* Step badge */}
              <div style={{
                position: "absolute", top: 20, left: 20,
                background: "#ffffffcc",
                border: `1px solid ${page.accent}50`,
                borderRadius: 40,
                padding: "6px 14px",
                display: "flex", alignItems: "center", gap: 8,
                backdropFilter: "blur(8px)",
                boxShadow: "0 1px 2px rgba(0,0,0,.05)"
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: page.accent,
                  boxShadow: `0 0 4px ${page.accent}`,
                  animation: "pulse 2s infinite"
                }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: page.accent, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Syne', sans-serif" }}>
                  {page.tag}
                </span>
              </div>

              {/* Zoom hint */}
              <div style={{
                position: "absolute", bottom: 20, left: 20,
                background: "rgba(255,255,255,.85)", border: "1px solid rgba(0,0,0,.1)",
                borderRadius: 40, padding: "6px 14px",
                fontSize: 11, color: "#334155",
                backdropFilter: "blur(8px)",
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 1px 2px rgba(0,0,0,.05)"
              }}>
                🔍 Click to enlarge
              </div>

              {/* Page counter */}
              <div style={{
                position: "absolute", bottom: 20, right: 28,
                fontSize: 11, color: "#94a3b8",
                fontFamily: "'Syne', sans-serif"
              }}>
                {String(pageIdx + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
              </div>
            </div>

            {/* Right: info panel */}
            <div style={{
              width: 360, flexShrink: 0, display: "flex", flexDirection: "column",
              borderLeft: `1px solid ${page.accent}20`,
              overflow: "hidden",
              background: "#ffffff"
            }}>
              {/* Title area */}
              <div style={{ padding: "28px 24px 20px", flexShrink: 0 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 2.5, color: page.accent,
                  textTransform: "uppercase", marginBottom: 10, fontFamily: "'Syne', sans-serif"
                }}>
                  {page.tag}
                </div>
                <h2 style={{
                  fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.2,
                  marginBottom: 12, fontFamily: "'Syne', sans-serif"
                }}>
                  {page.title}
                </h2>
                <p style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>
                  {page.subtitle}
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: `linear-gradient(90deg, ${page.accent}30, transparent)`, marginLeft: 24, marginRight: 24 }} />

              {/* Features list */}
              <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
                {page.features.map((f, i) => (
                  <FeatureCard key={f.label} f={f} idx={i} />
                ))}
              </div>

              {/* Stats bar */}
              <div style={{ flexShrink: 0 }}>
                <StatsBar accent={page.accent} />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: "10px 28px",
            borderTop: `1px solid ${page.accent}15`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#fefefe", flexShrink: 0, position: "relative", zIndex: 4
          }}>
            <span style={{ fontSize: 10, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase" }}>
              FishGo™ Smart Processing System
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {["HACCP", "ISO 22000", "CE Marked"].map(tag => (
                <span key={tag} style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1,
                  color: "#64748b", padding: "3px 8px",
                  border: "1px solid #e2e8f0", borderRadius: 6,
                  textTransform: "uppercase", background: "#f8fafc"
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
