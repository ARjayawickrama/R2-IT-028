import React, { useState, useEffect, useCallback } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────
const PAGES = [
  {
    id: 1,
    title: "AI Fish Detection System",
    subtitle:
      "The FishGo smart processing unit uses computer vision and automated controls to identify, count, and sterilise fish with zero manual intervention.",
      image: "/anju.jpg",
    fallback:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&h=420&fit=crop",
    features: [
      {
        icon: "camera",
        label: "Camera",
        title: "AI fish detection",
        desc: "Identify and count fish automatically",
        color: "#3B9EFF",
      },
      {
        icon: "water",
        label: "Boiling water",
        title: "100 °C",
        desc: "Keep water boiling for sterilisation",
        color: "#FF6B35",
      },
      {
        icon: "snowflake",
        label: "Auto heating",
        title: "Maintain boiling temperature",
        desc: "Precision thermal control 24 / 7",
        color: "#00C6FF",
      },
    ],
  },
  {
    id: 2,
    title: "Quality Grading Standards",
    subtitle:
      "Every batch is graded in real time by the AI vision module. Four quality tiers — Premium, Good, Processing, and Reject — ensure full traceability from intake to dispatch.",
    image: "/anju.jpg",
    fallback:
      "https://images.unsplash.com/photo-1543168268-1e3b5ed6d4b8?w=900&h=420&fit=crop",
    features: [
      {
        icon: "star",
        label: "Premium grade",
        title: "Top 20 % of catch",
        desc: "Bright eyes, firm flesh, fresh scent",
        color: "#FFD700",
      },
      {
        icon: "check",
        label: "Good grade",
        title: "Standard market quality",
        desc: "Minor scale loss, pink gills acceptable",
        color: "#4CAF50",
      },
      {
        icon: "alert",
        label: "Processing grade",
        title: "For secondary products",
        desc: "Soft texture, slight odour present",
        color: "#FF9800",
      },
    ],
  },
  {
    id: 3,
    title: "Processing Workflow",
    subtitle:
      "Five sequential steps take fish from intake weighing through cleaning, temperature logging, and packaging into certified cold storage — all logged automatically.",
    image: "/anju.jpg",
    fallback:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&h=420&fit=crop",
    features: [
      {
        icon: "scale",
        label: "Receipt & weigh",
        title: "Step 1 — 5 to 10 min",
        desc: "Calibrated scales, supplier logged",
        color: "#3B9EFF",
      },
      {
        icon: "thermometer",
        label: "Temp logging",
        title: "Step 4 — critical",
        desc: "≤ 2 °C within 30 min of cleaning",
        color: "#FF6B35",
      },
      {
        icon: "box",
        label: "Packaging",
        title: "Step 5 — 10 to 15 min",
        desc: "Batch ID, grade, date, operator ID",
        color: "#00C6FF",
      },
    ],
  },
  {
    id: 4,
    title: "Maintenance Schedule",
    subtitle:
      "Daily, weekly, and monthly routines keep the FishGo unit running at peak hygiene and mechanical performance. All tasks are logged to the maintenance register.",
      image: "/anju.jpg",
    fallback:
      "https://images.unsplash.com/photo-1586733432416-e936eff5dc85?w=900&h=420&fit=crop",
    features: [
      {
        icon: "calendar-day",
        label: "Daily",
        title: "6 hygiene checks",
        desc: "Sanitise surfaces, flush drains, calibrate scales",
        color: "#4CAF50",
      },
      {
        icon: "calendar-week",
        label: "Weekly",
        title: "5 equipment tasks",
        desc: "Deep-clean cold room, inspect bearings",
        color: "#FF9800",
      },
      {
        icon: "calendar-month",
        label: "Monthly",
        title: "3 audits",
        desc: "Full safety audit, replace worn seals",
        color: "#E040FB",
      },
    ],
  },
];

// ─── Icon components ──────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = { width: size, height: size, fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 };
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
    case "calendar-day":
      return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="1.5" fill={color} stroke="none"/></svg>;
    case "calendar-week":
      return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>;
    case "calendar-month":
      return <svg viewBox="0 0 24 24" style={s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="8" y="13" width="8" height="5" rx="1" strokeWidth={1.4}/></svg>;
    case "chevron-left":
      return <svg viewBox="0 0 24 24" style={s}><polyline points="15 18 9 12 15 6"/></svg>;
    case "chevron-right":
      return <svg viewBox="0 0 24 24" style={s}><polyline points="9 18 15 12 9 6"/></svg>;
    case "x":
      return <svg viewBox="0 0 24 24" style={s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    default:
      return null;
  }
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
const FishGoLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#1a73e8,#0d47a1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 12c0-4 3-7 9-7s9 3 9 7-3 7-9 7-9-3-9-7z"/>
        <path d="M2 9l4 3-4 3"/>
        <circle cx="17" cy="12" r="1.5" fill="white" stroke="none"/>
      </svg>
    </div>
    <span style={{ fontFamily: "'Segoe UI',sans-serif", fontWeight: 700, fontSize: 18, color: "#1a73e8", letterSpacing: -0.3 }}>FishGo</span>
  </div>
);

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ src, title, onClose }) => {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", maxWidth: 860, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}>
        {/* header */}
        <div style={{ background: "#f7f8fb", borderBottom: "1px solid #e2e4e9", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{title}</span>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}>
            <Icon name="x" size={16} color="#666" />
          </button>
        </div>
        {/* image */}
        <div style={{ background: "#111", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320, padding: 12 }}>
          <img src={src} alt={title} style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: 4 }} />
        </div>
        {/* footer */}
     
      </div>
    </div>
  );
};

// ─── Shared button styles ─────────────────────────────────────────────────────
const btnStyle = (bg, color, outline = false) => ({
  padding: "6px 14px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  background: outline ? "transparent" : bg,
  color: outline ? bg : color,
  border: `1.5px solid ${bg}`,
  transition: "opacity .15s",
  fontFamily: "inherit",
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function GuidelinesPage({ onClose, onFinish }) {
  const [pageIdx, setPageIdx] = useState(0);
  const [imgErr, setImgErr] = useState({});
  const [lightbox, setLightbox] = useState(null);

  const page = PAGES[pageIdx];
  const isFirst = pageIdx === 0;
  const isLast = pageIdx === PAGES.length - 1;

  const handleBack = useCallback(() => {
    if (!isFirst) setPageIdx((i) => i - 1);
  }, [isFirst]);

  const handleNext = useCallback(() => {
    if (!isLast) setPageIdx((i) => i + 1);
    else onFinish?.();
  }, [isLast, onFinish]);

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") handleBack();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleBack, handleNext, handleCancel]);

  const imgSrc = imgErr[page.id] ? page.fallback : page.image;

  return (
    <>
      {/* ── Lightbox ── */}
      {lightbox && <Lightbox src={lightbox.src} title={lightbox.title} onClose={() => setLightbox(null)} />}

      {/* ── Full Screen Fish Theme Shell ── */}
      <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(26, 115, 232, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(239, 68, 68, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(34, 197, 94, 0.04) 0%, transparent 50%),
          linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)
        `,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}>
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "2px solid rgba(26, 115, 232, 0.1)",
          width: "90vw",
          maxWidth: "1200px",
          height: "90vh",
          maxHeight: "800px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 0 80px rgba(26,115,232,0.05)",
          backdropFilter: "blur(10px)",
          position: "relative"
        }}>
          {/* Animated Fish Background */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.04,
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg%3E%3Cpath d='M40 20C45 20 50 25 50 30C50 35 45 40 40 40C35 40 30 35 30 30C30 25 35 20 40 20Z' fill='%231a73e8'/%3E%3Cpath d='M35 40C30 40 25 45 25 50C25 55 30 60 35 60C40 60 45 55 45 50C45 45 40 40 35 40Z' fill='%231a73e8'/%3E%3Cpath d='M45 30C50 30 55 35 55 40C55 45 50 50 45 50C40 50 35 45 35 40C35 35 40 30 45 30Z' fill='%231a73e8'/%3E%3C/g%3E%3C/svg%3E")
            `,
            backgroundRepeat: "repeat",
            backgroundSize: "160px 160px",
            backgroundPosition: "0 0, 80px 80px",
            pointerEvents: "none",
            animation: "swim 20s linear infinite"
          }} />

          {/* Floating Animated Fish */}
          <div style={{
            position: "absolute",
            top: "10%",
            left: "5%",
            width: "60px",
            height: "30px",
            opacity: 0.06,
            animation: "floatFish1 15s ease-in-out infinite"
          }}>
            <svg width="60" height="30" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="20" cy="15" rx="15" ry="8" fill="#1a73e8"/>
              <polygon points="35,15 50,5 50,25" fill="#1a73e8"/>
              <circle cx="12" cy="12" r="2" fill="#ffffff"/>
            </svg>
          </div>

          <div style={{
            position: "absolute",
            top: "25%",
            right: "10%",
            width: "50px",
            height: "25px",
            opacity: 0.05,
            animation: "floatFish2 18s ease-in-out infinite"
          }}>
            <svg width="50" height="25" viewBox="0 0 50 25" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="18" cy="12" rx="12" ry="6" fill="#1557b0"/>
              <polygon points="30,12 42,3 42,21" fill="#1557b0"/>
              <circle cx="10" cy="10" r="1.5" fill="#ffffff"/>
            </svg>
          </div>

          <div style={{
            position: "absolute",
            bottom: "20%",
            left: "15%",
            width: "70px",
            height: "35px",
            opacity: 0.04,
            animation: "floatFish3 22s ease-in-out infinite"
          }}>
            <svg width="70" height="35" viewBox="0 0 70 35" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="25" cy="17" rx="18" ry="10" fill="#0d47a1"/>
              <polygon points="43,17 60,7 60,27" fill="#0d47a1"/>
              <circle cx="15" cy="14" r="2.5" fill="#ffffff"/>
            </svg>
          </div>

          <div style={{
            position: "absolute",
            top: "60%",
            right: "20%",
            width: "45px",
            height: "22px",
            opacity: 0.05,
            animation: "floatFish4 17s ease-in-out infinite"
          }}>
            <svg width="45" height="22" viewBox="0 0 45 22" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="15" cy="11" rx="10" ry="5" fill="#1976d2"/>
              <polygon points="25,11 35,4 35,18" fill="#1976d2"/>
              <circle cx="8" cy="9" r="1.2" fill="#ffffff"/>
            </svg>
          </div>

          {/* Animation Styles */}
          <style>{`
            @keyframes swim {
              0%, 100% {
                background-position: 0 0, 80px 80px;
              }
              50% {
                background-position: 40px 40px, 120px 120px;
              }
            }
            
            @keyframes floatFish1 {
              0%, 100% {
                transform: translateX(0) translateY(0) rotate(0deg);
                opacity: 0.06;
              }
              25% {
                transform: translateX(30px) translateY(-20px) rotate(5deg);
                opacity: 0.08;
              }
              50% {
                transform: translateX(60px) translateY(10px) rotate(-3deg);
                opacity: 0.05;
              }
              75% {
                transform: translateX(20px) translateY(-15px) rotate(2deg);
                opacity: 0.07;
              }
            }
            
            @keyframes floatFish2 {
              0%, 100% {
                transform: translateX(0) translateY(0) rotate(0deg) scaleX(-1);
                opacity: 0.05;
              }
              33% {
                transform: translateX(-40px) translateY(25px) rotate(-8deg) scaleX(-1);
                opacity: 0.07;
              }
              66% {
                transform: translateX(-20px) translateY(-30px) rotate(6deg) scaleX(-1);
                opacity: 0.04;
              }
            }
            
            @keyframes floatFish3 {
              0%, 100% {
                transform: translateX(0) translateY(0) rotate(0deg);
                opacity: 0.04;
              }
              20% {
                transform: translateX(50px) translateY(20px) rotate(10deg);
                opacity: 0.06;
              }
              40% {
                transform: translateX(-30px) translateY(-25px) rotate(-7deg);
                opacity: 0.05;
              }
              60% {
                transform: translateX(40px) translateY(15px) rotate(5deg);
                opacity: 0.07;
              }
              80% {
                transform: translateX(-20px) translateY(-10px) rotate(-3deg);
                opacity: 0.03;
              }
            }
            
            @keyframes floatFish4 {
              0%, 100% {
                transform: translateX(0) translateY(0) rotate(0deg) scaleX(-1);
                opacity: 0.05;
              }
              30% {
                transform: translateX(-35px) translateY(-20px) rotate(-5deg) scaleX(-1);
                opacity: 0.06;
              }
              60% {
                transform: translateX(-15px) translateY(30px) rotate(8deg) scaleX(-1);
                opacity: 0.04;
              }
            }
          `}</style>

          {/* ── Professional Header ── */}
          <div style={{ 
            padding: "20px 30px 15px", 
            borderBottom: "1px solid rgba(0,0,0,0.08)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)",
            borderRadius: "16px 16px 0 0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ 
                width: "40px", 
                height: "40px", 
                background: "rgba(255,255,255,0.2)", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                backdropFilter: "blur(10px)"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12c0-4 3-7 9-7s9 3 9 7-3 7-9 7-9-3-9-7z"/>
                  <path d="M2 9l4 3-4 3"/>
                  <circle cx="17" cy="12" r="1.5" fill="white" stroke="none"/>
                </svg>
              </div>
              <div>
                <h1 style={{ color: "#ffffff", fontSize: "18px", fontWeight: 700, margin: 0 }}>FishGo System</h1>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", margin: "2px 0 0" }}>Smart Processing Guidelines</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Previous Button */}
              <button
                onClick={handleBack}
                disabled={isFirst}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: isFirst ? "not-allowed" : "pointer",
                  background: isFirst ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)",
                  color: isFirst ? "rgba(255,255,255,0.5)" : "#ffffff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: isFirst ? 0.5 : 1
                }}
                onMouseOver={(e) => !isFirst && (e.target.style.background = "rgba(255,255,255,0.3)")}
                onMouseOut={(e) => !isFirst && (e.target.style.background = "rgba(255,255,255,0.2)")}
              >
                <Icon name="chevron-left" size={12} color={isFirst ? "rgba(255,255,255,0.5)" : "#ffffff"} />
                Previous
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
                onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
                onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
              >
                {isLast ? "Complete" : "Next"}
                {!isLast && <Icon name="chevron-right" size={12} color="#ffffff" />}
              </button>

              {/* Close Button */}
              <button
                onClick={handleCancel}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "rgba(239,68,68,0.2)",
                  color: "#ffffff",
                  border: "1px solid rgba(239,68,68,0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
                onMouseOver={(e) => e.target.style.background = "rgba(239,68,68,0.3)"}
                onMouseOut={(e) => e.target.style.background = "rgba(239,68,68,0.2)"}
              >
                <Icon name="x" size={12} color="#ffffff" />
                Close
              </button>

              {/* Navigation Dots */}
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 12 }}>
                {PAGES.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setPageIdx(i)}
                    title={p.title}
                    style={{
                      width: i === pageIdx ? "24px" : "8px", 
                      height: "8px", 
                      borderRadius: "4px", 
                      border: "none", 
                      cursor: "pointer", 
                      padding: 0,
                      background: i === pageIdx ? "#ffffff" : i < pageIdx ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                      transition: "all 0.3s ease",
                      boxShadow: i === pageIdx ? "0 2px 8px rgba(255,255,255,0.3)" : "none"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Content Area ── */}
          <div style={{ 
            padding: "25px 30px", 
            flex: 1, 
            display: "flex", 
            flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* Title Section */}
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ 
                fontSize: "clamp(20px, 3vw, 28px)", 
                fontWeight: 700, 
                margin: "0 0 8px", 
                color: "#1a1a2e",
                background: "linear-gradient(135deg, #1a73e8, #1557b0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                {page.title}
              </h2>
              <p style={{ 
                fontSize: "clamp(12px, 1.5vw, 14px)", 
                color: "#5f6b7c", 
                margin: 0, 
                lineHeight: 1.6,
                maxWidth: "800px"
              }}>
                {page.subtitle}
              </p>
            </div>

            {/* Hero Image Section */}
            <div style={{ 
              position: "relative", 
              flex: 1, 
              background: "linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 100%)", 
              cursor: "pointer",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              minHeight: "300px"
            }}
              onClick={() => setLightbox({ src: imgSrc, title: page.title })}>
              <img
                src={imgSrc}
                alt={page.title}
                onError={() => setImgErr((prev) => ({ ...prev, [page.id]: true }))}
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover", 
                  display: "block", 
                  opacity: 0.9,
                  transition: "transform 0.3s ease"
                }}
                onMouseOver={(e) => e.target.style.transform = "scale(1.02)"}
                onMouseOut={(e) => e.target.style.transform = "scale(1)"}
              />

              {/* Feature Overlay */}
              <div style={{
                position: "absolute", top: 0, right: 0, bottom: 0,
                width: "clamp(250px, 40%, 400px)", 
                display: "flex", 
                flexDirection: "column",
                justifyContent: "center", 
                gap: "clamp(12px, 2vw, 20px)", 
                padding: "clamp(20px, 3vw, 30px)",
                background: "linear-gradient(to left, rgba(10,14,26,.95) 70%, transparent)",
              }}
                onClick={(e) => e.stopPropagation()}
              >
                {page.features.map((f, index) => (
                  <div key={f.label} 
                       style={{ 
                         display: "flex", 
                         gap: "clamp(10px, 2vw, 15px)", 
                         alignItems: "flex-start",
                         opacity: 0,
                         animation: `slideInRight 0.5s ease ${index * 0.1}s forwards`
                       }}>
                    <div style={{ 
                      width: "clamp(35px, 5vw, 45px)", 
                      height: "clamp(35px, 5vw, 45px)", 
                      borderRadius: "10px", 
                      background: "rgba(255,255,255,.1)", 
                      border: "1px solid rgba(255,255,255,.2)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      flexShrink: 0,
                      backdropFilter: "blur(10px)"
                    }}>
                      <Icon name={f.icon} size={Math.max(16, Math.min(20, window.innerWidth * 0.03))} color={f.color} />
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: "clamp(10px, 1.5vw, 12px)", 
                        fontWeight: 700, 
                        letterSpacing: 1, 
                        color: f.color, 
                        textTransform: "uppercase", 
                        marginBottom: 4 
                      }}>
                        {f.label}
                      </div>
                      <div style={{ 
                        fontSize: "clamp(12px, 2vw, 16px)", 
                        fontWeight: 600, 
                        color: "#fff", 
                        lineHeight: 1.3 
                      }}>
                        {f.title}
                      </div>
                      <div style={{ 
                        fontSize: "clamp(10px, 1.5vw, 12px)", 
                        color: "rgba(255,255,255,.7)", 
                        lineHeight: 1.4, 
                        marginTop: 2 
                      }}>
                        {f.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Indicators */}
              <div style={{
                position: "absolute", top: "20px", left: "20px",
                background: "rgba(26,115,232,0.9)", 
                borderRadius: "20px",
                padding: "8px 16px", 
                fontSize: "12px", 
                color: "#ffffff",
                fontWeight: 600,
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#4caf50",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite"
                }}></span>
                SYSTEM ACTIVE
              </div>

              {/* Page Indicator */}
              <div style={{
                position: "absolute", bottom: "20px", left: "20px",
                background: "rgba(0,0,0,.7)", 
                borderRadius: "25px",
                padding: "10px 20px", 
                fontSize: "14px", 
                color: "rgba(255,255,255,.9)",
                fontWeight: 600,
                backdropFilter: "blur(10px)"
              }}>
                {pageIdx + 1} / {PAGES.length}
              </div>

              {/* Zoom Hint */}
              <div style={{
                position: "absolute", bottom: "20px", right: "20px",
                background: "rgba(255,255,255,.1)", 
                borderRadius: "25px",
                padding: "10px 20px", 
                fontSize: "12px", 
                color: "rgba(255,255,255,.8)",
                fontWeight: 500,
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,.2)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ fontSize: "16px" }}>🔍</span>
                Click to enlarge
              </div>
            </div>
          </div>

          {/* ── Professional Footer ── */}
          <div style={{
            padding: "20px 30px", 
            borderTop: "1px solid rgba(0,0,0,0.08)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            gap: 12,
            background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
            borderRadius: "0 0 16px 16px"
          }}>
            <div style={{
              fontSize: "12px",
              color: "#64748b",
              fontWeight: 500
            }}>
              FishGo™ Smart Processing System
            </div>
            
           
          </div>

        </div>
      </div>
    </>
  );
}
