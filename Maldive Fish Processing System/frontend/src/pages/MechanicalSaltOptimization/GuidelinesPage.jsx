import React, { useState, useEffect, useCallback, useRef } from "react";

// Add this to your global CSS or index.html for best font experience:
// @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

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
      { icon: "camera", label: "AI Vision", title: "Automated fish detection", desc: "Identifies species, size, and freshness in real time", color: "#00E5FF" },
      { icon: "scale", label: "Intake Weighing", title: "Calibrated at entry", desc: "Each batch weighed and logged with supplier ID", color: "#06D6A0" },
      { icon: "check", label: "Species Check", title: "99 % accuracy rate", desc: "Vision model trained on 40 + local fish species", color: "#A78BFA" },
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
      { icon: "water", label: "Boiling Chamber", title: "100 °C maintained", desc: "Pressurised tank ensures consistent full boil", color: "#FF6B35" },
      { icon: "thermometer", label: "Thermal Logging", title: "Logged every 30 sec", desc: "Auto-alert if temperature drops below threshold", color: "#FFD166" },
      { icon: "snowflake", label: "Salt Bath Option", title: "Brine concentration", desc: "Optional 8 – 12 % salt solution for Maldive fish prep", color: "#A78BFA" },
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
      { icon: "thermometer", label: "Drying Oven", title: "55 – 65 °C airflow", desc: "Forced hot-air circulation for uniform drying", color: "#FFD166" },
      { icon: "calendar-week", label: "Drying Duration", title: "6 – 8 hours per batch", desc: "Duration adjusted by fish size and moisture sensor", color: "#FF9A3C" },
      { icon: "box", label: "Moisture Target", title: "< 20 % moisture", desc: "Sensor confirms safe moisture before packaging", color: "#06D6A0" },
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
      { icon: "star", label: "Premium Grade", title: "Top 20 % of batch", desc: "Firm texture, deep colour, full shape intact", color: "#06D6A0" },
      { icon: "check", label: "Good Grade", title: "Standard export quality", desc: "Minor surface cracks acceptable, no soft spots", color: "#FFD166" },
      { icon: "alert", label: "Processing Grade", title: "Secondary use", desc: "Broken pieces redirected to powder / paste line", color: "#FF6B35" },
    ],
  },
];

const STATS = [
  { label: "Fish / hr", val: "2400", suffix: "+" },
  { label: "Accuracy", val: "99", suffix: "%" },
  { label: "Temp precision", val: "±0.2", suffix: "°C" },
  { label: "Uptime", val: "99.7", suffix: "%" },
];

const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = {
    width: size,
    height: size,
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    flexShrink: 0,
  };
  switch (name) {
    case "camera":
      return <svg viewBox="0 0 24 24" style={s}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>;
    case "water":
      return <svg viewBox="0 0 24 24" style={s}><path d="M12 2C6 9 4 13.5 4 16a8 8 0 0016 0c0-2.5-2-7-8-14z"/></svg>;
    case "snowflake":
      return <svg viewBox="0 0 24 24" style={s}><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4"/></svg>;
    case "star":
      return <svg viewBox="0 0 24 24" style={s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" style={s}><polyline points="20 6 9 17 4 12"/></svg>;
    case "alert":
      return <svg viewBox="0 0 24 24" style={s}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case "scale":
      return <svg viewBox="0 0 24 24" style={s}><path d="M12 3v18M3 9l9-6 9 6M3 15l9 6 9-6"/></svg>;
    case "thermometer":
      return <svg viewBox="0 0 24 24" style={s}><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>;
    case "box":
      return <svg viewBox="0 0 24 24" style={s}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
    case "calendar-week":
      return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>;
    case "chevron-left":
      return <svg viewBox="0 0 24 24" style={s}><polyline points="15 18 9 12 15 6"/></svg>;
    case "chevron-right":
      return <svg viewBox="0 0 24 24" style={s}><polyline points="9 18 15 12 9 6"/></svg>;
    case "x":
      return <svg viewBox="0 0 24 24" style={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case "fish":
      return <svg viewBox="0 0 24 24" style={s}><path d="M6 12c0-4 3-7 9-7s9 3 9 7-3 7-9 7-9-3-9-7z"/><path d="M2 9l4 3-4 3"/><circle cx="17" cy="12" r="1.5" fill={color} stroke="none"/></svg>;
    default:
      return null;
  }
};

const Lightbox = ({ src, title, accent, onClose }) => {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div onClick={onClose} className="lightbox-overlay">
      <div onClick={(e) => e.stopPropagation()} className="lightbox-content" style={{ boxShadow: `0 0 0 1px ${accent}33, 0 30px 60px rgba(0,0,0,.2)` }}>
        <div className="lightbox-header" style={{ borderBottomColor: `${accent}22` }}>
          <div className="lightbox-title">
            <div className="lightbox-accent-dot" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="lightbox-close">
            <Icon name="x" size={16} color="#64748b" />
          </button>
        </div>
        <div className="lightbox-body">
          <img src={src} alt={title} />
        </div>
      </div>
    </div>
  );
};

const Scanlines = () => <div className="scanlines" />;
const Noise = () => <div className="noise" />;

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
        <div
          key={i}
          className={`particle-fish fish-${i % 3}`}
          style={{
            top: f.top,
            left: f.left,
            right: f.right,
            width: f.size,
            height: f.size * 0.5,
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
            transform: f.dir === -1 ? "scaleX(-1)" : "none",
          }}
        >
          <svg width={f.size} height={f.size * 0.5} viewBox="0 0 80 40">
            <ellipse cx="28" cy="20" rx="20" ry="11" fill={accent} />
            <polygon points="48,20 72,6 72,34" fill={accent} />
            <circle cx="17" cy="15" r="3.5" fill="#ffffff" />
            <circle cx="16" cy="14.5" r="1.5" fill="#000000" opacity=".5" />
            <path d="M22 24 Q32 29 42 24" stroke={accent} strokeWidth="1.5" fill="none" opacity=".6" />
          </svg>
        </div>
      ))}
    </>
  );
};

const StatsBar = ({ accent }) => (
  <div className="stats-bar">
    
  </div>
);

const PipelineSteps = ({ currentIdx, accent }) => (
  <div className="pipeline-steps">
    {PAGES.map((p, i) => (
      <React.Fragment key={p.id}>
        <div className="pipeline-step">
          <div
            className={`step-circle ${i < currentIdx ? "completed" : i === currentIdx ? "active" : ""}`}
            style={{
              background: i < currentIdx ? accent : i === currentIdx ? accent : "#e2e8f0",
              borderColor: i <= currentIdx ? accent : "#cbd5e1",
              boxShadow: i === currentIdx ? `0 0 10px ${accent}60` : "none",
            }}
          >
            {i < currentIdx ? "✓" : i + 1}
          </div>
          <div
            className="step-label"
            style={{ color: i === currentIdx ? accent : i < currentIdx ? "#64748b" : "#cbd5e1" }}
          >
            {p.tag.split("—")[1]?.trim() || p.tag}
          </div>
        </div>
        {i < PAGES.length - 1 && (
          <div
            className="step-connector"
            style={{
              background: i < currentIdx
                ? `linear-gradient(90deg, ${accent}, ${accent})`
                : `linear-gradient(90deg, ${i === currentIdx ? accent : "#e2e8f0"}, #e2e8f0)`,
            }}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const FeatureCard = ({ f, idx }) => (
  <div className="feature-card" style={{ borderLeftColor: f.color, animationDelay: `${idx * 0.08 + 0.1}s` }}>
    <div className="feature-icon" style={{ background: `${f.color}10`, borderColor: `${f.color}30` }}>
      <Icon name={f.icon} size={18} color={f.color} />
    </div>
    <div className="feature-content">
      <div className="feature-label" style={{ color: f.color }}>{f.label}</div>
      <div className="feature-title">{f.title}</div>
      <div className="feature-desc">{f.desc}</div>
    </div>
  </div>
);

export default function GuidelinesPage({ onClose, onFinish }) {
  const [pageIdx, setPageIdx] = useState(0);
  const [imgErr, setImgErr] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const page = PAGES[pageIdx];
  const isFirst = pageIdx === 0;
  const isLast = pageIdx === PAGES.length - 1;
  const imgSrc = imgErr[page.id] ? page.fallback : page.image;

  const goTo = useCallback((idx) => {
    if (idx === pageIdx || transitioning) return;
    setTransitioning(true);
    setImgLoaded(false);
    setTimeout(() => {
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
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        @keyframes lbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lbSlide {
          from { transform: scale(0.94) translateY(20px); }
          to { transform: scale(1) translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes scanH {
          0% { top: -100%; }
          100% { top: 110%; }
        }
        @keyframes fish0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(40px, -20px) rotate(4deg); }
          50% { transform: translate(80px, 15px) rotate(-3deg); }
          75% { transform: translate(30px, -10px) rotate(2deg); }
        }
        @keyframes fish1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scaleX(-1); }
          33% { transform: translate(-50px, 30px) rotate(-6deg) scaleX(-1); }
          66% { transform: translate(-20px, -40px) rotate(5deg) scaleX(-1); }
        }
        @keyframes fish2 {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(30px, 20px) rotate(8deg); }
          40% { transform: translate(-20px, -30px) rotate(-5deg); }
          60% { transform: translate(50px, 10px); }
          80% { transform: translate(-10px, -15px); }
        }

        .particle-fish {
          position: absolute;
          opacity: 0.08;
          pointer-events: none;
        }
        .fish-0 { animation: fish0 ease-in-out infinite; }
        .fish-1 { animation: fish1 ease-in-out infinite; }
        .fish-2 { animation: fish2 ease-in-out infinite; }

        .scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 3;
          background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.02) 2px, rgba(0,0,0,.02) 4px);
          border-radius: inherit;
        }

        .noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 120px 120px;
        }

        .lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.85);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          backdrop-filter: blur(8px);
          animation: lbFadeIn 0.2s ease;
        }
        .lightbox-content {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          max-width: 900px;
          width: 100%;
          animation: lbSlide 0.25s cubic-bezier(0.2, 0.8, 0.3, 1);
        }
        .lightbox-header {
          background: #fafcff;
          border-bottom: 1px solid;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lightbox-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #1a202c;
          font-family: 'Syne', sans-serif;
        }
        .lightbox-accent-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .lightbox-close {
          border: none;
          background: rgba(0,0,0,.05);
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 8px;
          display: flex;
          transition: all 0.15s;
        }
        .lightbox-close:hover { background: rgba(0,0,0,.1); }
        .lightbox-body {
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          min-height: 340px;
        }
        .lightbox-body img {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 8px;
        }

        .stats-bar {
          display: flex;
          gap: 0;
          border-top: 1px solid rgba(0,0,0,.08);
          background: #f8fafc;
        }
        .stat-item {
          flex: 1;
          padding: 14px 0;
          text-align: center;
          border-right: 1px solid rgba(0,0,0,.06);
        }
        .stat-item:last-child { border-right: none; }
        .stat-value {
          font-size: 18px;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          line-height: 1;
        }
        .stat-label {
          font-size: 10px;
          color: #4b5563;
          margin-top: 4px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .pipeline-steps {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 10px 24px 0;
        }
        .pipeline-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
        }
        .step-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          color: #0f172a;
          transition: all 0.4s ease;
        }
        .step-circle.completed { color: #0f172a; }
        .step-circle.active { color: #0f172a; }
        .step-circle:not(.completed):not(.active) { background: #e2e8f0; color: #94a3b8; }
        .step-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.3;
          max-width: 60px;
          transition: color 0.4s ease;
        }
        .step-connector {
          flex: 2;
          height: 2px;
          margin-bottom: 18px;
          transition: background 0.4s ease;
        }

        .feature-card {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 16px 20px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,.08);
          border-left-width: 3px;
          border-radius: 12px;
          transition: background 0.2s, transform 0.2s;
          animation: cardIn 0.4s cubic-bezier(0.2, 0.8, 0.3, 1) both;
          cursor: default;
          box-shadow: 0 1px 2px rgba(0,0,0,.02);
        }
        .feature-card:hover {
          background: #f9f9ff;
          transform: translateX(4px);
        }
        .feature-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .feature-content { flex: 1; }
        .feature-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .feature-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
          font-family: 'Syne', sans-serif;
        }
        .feature-desc {
          font-size: 11px;
          color: #5b6b8c;
          line-height: 1.5;
          margin-top: 4px;
        }

        .page-wrap {
          opacity: 1;
          transition: opacity 0.22s ease, transform 0.22s ease;
        }
        .page-wrap.out {
          opacity: 0;
          transform: translateX(-16px);
        }

        .guidelines-container {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          font-family: 'DM Sans', sans-serif;
        }
        .guidelines-backdrop {
          position: absolute;
          inset: 0;
          pointer-events: none;
          transition: background 1s ease;
        }
        .guidelines-card {
          width: 96vw;
          max-width: 1180px;
          height: 92vh;
          max-height: 840px;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid;
          overflow: hidden;
          position: relative;
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }
        .scanning-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          z-index: 10;
          animation: scanH 6s linear infinite;
          pointer-events: none;
        }
        .guidelines-header {
          padding: 0 28px;
          border-bottom: 1px solid;
          background: #fefefe;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-shrink: 0;
          min-height: 64px;
          z-index: 4;
        }
        .logo-area { display: flex; align-items: center; gap: 12px; }
        .logo-icon {
          width: 36px;
          height: 36px;
          border: 1px solid;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-text { font-size: 14px; font-weight: 800; color: #0f172a; font-family: 'Syne', sans-serif; letter-spacing: -0.3px; }
        .logo-sub { font-size: 9px; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; }
        .page-dots { display: flex; gap: 10px; align-items: center; }
        .page-dot {
          height: 8px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.35s cubic-bezier(0.2, 0.8, 0.3, 1);
        }
        .nav-buttons { display: flex; gap: 8px; align-items: center; }
        .nav-btn {
          padding: 7px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          background: #f1f5f9;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'Syne', sans-serif;
        }
        .nav-btn.back.disabled { opacity: 0.5; cursor: not-allowed; }
        .nav-btn.next { color: #0f172a; }
        .nav-btn.close { padding: 6px 10px; background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
        .nav-btn:hover:not(.disabled) { filter: brightness(1.02); transform: scale(1.02); }
        .progress-bar-bg { height: 2px; background: #eef2ff; flex-shrink: 0; }
        .progress-bar-fill { height: 100%; transition: width 0.5s cubic-bezier(0.2, 0.8, 0.3, 1), background 0.6s ease; }
        .pipeline-wrapper { background: #fafcff; border-bottom: 1px solid; flex-shrink: 0; z-index: 4; }
        .guidelines-body { flex: 1; display: flex; gap: 0; overflow: hidden; position: relative; z-index: 4; }
        .image-panel { flex: 1.1; position: relative; overflow: hidden; }
        .main-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          cursor: zoom-in;
          filter: brightness(0.95) saturate(1.05);
          transition: opacity 0.4s ease, transform 0.4s ease;
          opacity: 0;
          transform: scale(1.02);
        }
        .main-image.loaded { opacity: 1; transform: scale(1); }
        .image-gradient-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, transparent 40%, #ffffff 100%);
        }
        .image-gradient-top {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(to top, #ffffff 0%, transparent 40%);
        }
        .step-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background: #ffffffcc;
          border: 1px solid;
          border-radius: 40px;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(8px);
          box-shadow: 0 1px 2px rgba(0,0,0,.05);
        }
        .step-badge-dot { width: 6px; height: 6px; border-radius: 50%; animation: pulse 2s infinite; }
        .zoom-hint {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255,255,255,.85);
          border: 1px solid rgba(0,0,0,.1);
          border-radius: 40px;
          padding: 6px 14px;
          font-size: 11px;
          color: #334155;
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .page-counter {
          position: absolute;
          bottom: 20px;
          right: 28px;
          font-size: 11px;
          color: #94a3b8;
          font-family: 'Syne', sans-serif;
        }
        .info-panel {
          width: 360px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          border-left: 1px solid;
          overflow: hidden;
          background: #ffffff;
        }
        .info-title-area { padding: 28px 24px 20px; flex-shrink: 0; }
        .info-tag { font-size: 9px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 10px; font-family: 'Syne', sans-serif; }
        .info-heading { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 12px; font-family: 'Syne', sans-serif; }
        .info-subtitle { font-size: 12.5px; color: #475569; line-height: 1.7; }
        .info-divider { height: 1px; margin-left: 24px; margin-right: 24px; }
        .features-list { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; overflow-y: auto; }
        .guidelines-footer {
          padding: 10px 28px;
          border-top: 1px solid;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fefefe;
          flex-shrink: 0;
        }
        .footer-brand { font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; }
        .footer-badges { display: flex; gap: 6px; }
        .footer-badges span {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #64748b;
          padding: 3px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          text-transform: uppercase;
          background: #f8fafc;
        }
      `}</style>

      {lightbox && (
        <Lightbox src={lightbox.src} title={lightbox.title} accent={page.accent} onClose={() => setLightbox(null)} />
      )}

      <div className="guidelines-container">
        <ParticleFish accent={page.accent} />
        <div className="guidelines-backdrop" style={{ background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${page.accent}08 0%, transparent 80%)` }} />

        <div className="guidelines-card" style={{ borderColor: `${page.accent}30`, boxShadow: `0 20px 40px -12px rgba(0,0,0,.1), 0 0 0 1px ${page.accent}08, 0 0 0 3px rgba(255,255,255,.8)` }}>
          <Noise />
          <Scanlines />
          <div className="scanning-line" style={{ background: `linear-gradient(90deg, transparent, ${page.accent}80, transparent)` }} />

          <div className="guidelines-header" style={{ borderBottomColor: `${page.accent}20` }}>
            <div className="logo-area">
              <div className="logo-icon" style={{ background: `linear-gradient(135deg, ${page.accent}20, ${page.accent}05)`, borderColor: `${page.accent}40`, boxShadow: `0 2px 6px ${page.accent}10` }}>
                <Icon name="fish" size={18} color={page.accent} />
              </div>
              <div>
                <div className="logo-text">FishGo</div>
                <div className="logo-sub">Smart Processing</div>
              </div>
            </div>

            <div className="page-dots">
              {PAGES.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => goTo(i)}
                  className="page-dot"
                  style={{
                    width: i === pageIdx ? 28 : 8,
                    background: i === pageIdx ? page.accent : i < pageIdx ? `${page.accent}70` : "rgba(0,0,0,.15)",
                    boxShadow: i === pageIdx ? `0 0 6px ${page.accent}80` : "none",
                  }}
                  title={p.title}
                />
              ))}
            </div>

            <div className="nav-buttons">
              <button onClick={handleBack} disabled={isFirst} className={`nav-btn back ${isFirst ? "disabled" : ""}`}>
                <Icon name="chevron-left" size={12} color="currentColor" />
                Back
              </button>
              <button onClick={handleNext} className="nav-btn next" style={{ background: page.accent, borderColor: page.accent }}>
                {isLast ? "Finish" : "Next"}
                {!isLast && <Icon name="chevron-right" size={12} color="currentColor" />}
              </button>
              <button onClick={handleCancel} className="nav-btn close">✕</button>
            </div>
          </div>

          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${page.accent}aa, ${page.accent})`, boxShadow: `0 0 6px ${page.accent}80` }} />
          </div>

          <div className="pipeline-wrapper" style={{ borderBottomColor: `${page.accent}15` }}>
            <PipelineSteps currentIdx={pageIdx} accent={page.accent} />
          </div>

          <div className={`page-wrap${transitioning ? " out" : ""} guidelines-body`}>
            <div className="image-panel">
              <img
                src={imgSrc}
                alt={page.title}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgErr(p => ({ ...p, [page.id]: true }))}
                onClick={() => setLightbox({ src: imgSrc, title: page.title })}
                className={`main-image ${imgLoaded ? "loaded" : ""}`}
              />
              <div className="image-gradient-overlay" />
              <div className="image-gradient-top" />
              <div className="step-badge" style={{ borderColor: `${page.accent}50` }}>
                <div className="step-badge-dot" style={{ background: page.accent, boxShadow: `0 0 4px ${page.accent}` }} />
                <span style={{ color: page.accent }}>{page.tag}</span>
              </div>
              <div className="zoom-hint">🔍 Click to enlarge</div>
              <div className="page-counter">
                {String(pageIdx + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
              </div>
            </div>

            <div className="info-panel" style={{ borderLeftColor: `${page.accent}20` }}>
              <div className="info-title-area">
                <div className="info-tag" style={{ color: page.accent }}>{page.tag}</div>
                <h2 className="info-heading">{page.title}</h2>
                <p className="info-subtitle">{page.subtitle}</p>
              </div>
              <div className="info-divider" style={{ background: `linear-gradient(90deg, ${page.accent}30, transparent)` }} />
              <div className="features-list">
                {page.features.map((f, i) => (
                  <FeatureCard key={f.label} f={f} idx={i} />
                ))}
              </div>
              <StatsBar accent={page.accent} />
            </div>
          </div>

          <div className="guidelines-footer" style={{ borderTopColor: `${page.accent}15` }}>
            <span className="footer-brand">FishGo™ Smart Processing System</span>
            <div className="footer-badges">
              <span>HACCP</span>
              <span>ISO 22000</span>
              <span>CE Marked</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}