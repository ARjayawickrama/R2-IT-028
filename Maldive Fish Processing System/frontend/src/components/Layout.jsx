import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RightSideNotificationBar from "./RightSideNotificationBar";
import NotificationBar from "./NotificationBar";

/* ─────────────────────────────────────────────
   THEME TOKENS
───────────────────────────────────────────── */
const THEMES = {

  white: {
    name: "white", label: "White", symbol: "◎",
    root: "#f8f9fb", menubar: "#ffffff", menubarBdr: "#e4e8ef",
    statusbar: "#f0f2f5", statusBdr: "#e4e8ef",
    topbar: "#ffffff", topbarBdr: "#e4e8ef",
    sidebar: "#fafbfc", sidebarBdr: "#e4e8ef",
    main: "#f3f5f8",
    navHover: "#eef1f6", navActive: "#e8f0fb",
    navActiveTxt: "#185fa5", navActiveBdr: "#185fa5",
    dropBg: "#ffffff", dropBdr: "#dde2ea",
    dropTxt: "#4a5568", dropHoverBg: "#f3f6fb", dropHoverTxt: "#185fa5",
    menuTxt: "#6b7280", menuHoverBg: "#f3f6fb", menuHoverTxt: "#185fa5",
    statusTxt: "#9ca3af", statusVal: "#374151", statusGreen: "#16a34a",
    clockTxt: "#185fa5",
    logoText: "#111827", logoAccent: "#185fa5", logoBg: "#dbeafe", logoBdr: "#bfdbfe",
    userNameTxt: "#111827", userBadge: "#16a34a",
    profileBtnBdr: "#dde2ea", profileBtnHoverBg: "#f3f6fb", profileBtnHoverBdr: "#bfdbfe",
    profileLbl: "#6b7280",
    avatarBg: "#dbeafe", avatarBdr: "#bfdbfe", avatarTxt: "#185fa5",
    footerKey: "#9ca3af", footerVal: "#6b7280", footerOk: "#16a34a",
    navTxt: "#6b7280", navSymbol: "#9ca3af", sidebarLbl: "#9ca3af",
    profHdrBg: "#f8f9fb", profHdrBdr: "#e4e8ef",
    profNameTxt: "#111827", profEmailTxt: "#9ca3af",
    profTierBg: "rgba(24,95,165,0.07)", profTierBdr: "rgba(24,95,165,0.18)", profTierTxt: "#185fa5",
    profItemTxt: "#6b7280", profItemHoverBg: "#f3f6fb", profItemHoverTxt: "#111827",
    dangerTxt: "#dc2626", dangerHoverBg: "#fff5f5", dangerHoverTxt: "#dc2626",
    scrollThumb: "#cbd5e1", scrollThumbHover: "#94a3b8",
    scanline: false,
  },
  
};

/* ─────────────────────────────────────────────
   LAYOUT COMPONENT
───────────────────────────────────────────── */
const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePath, setActivePath] = useState("/dashboard");
  const [themeName, setThemeName] = useState("white");

  const t = THEMES[themeName];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".dropdown-menu") && !e.target.closest(".dropdown-trigger")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };
  const toggleDropdown = (k) => setActiveDropdown(activeDropdown === k ? null : k);
  const handleNavigation = (path) => { navigate(path); setActivePath(path); setActiveDropdown(null); };

  const navItems = [
    { path: "/dashboard",                icon: "⬡", label: "Dashboard" },
    { path: "/raw-fish-quality",         icon: "◎", label: "Raw Fish Quality" },
    { path: "/boile-control",            icon: "⬟", label: "Salt Control" },
    { path: "/environmental-monitoring", icon: "◉", label: "Environment" },
    { path: "/dried-fish-quality",       icon: "◈", label: "Dried Fish Quality" },
    { path: "/inventory",                icon: "▤", label: "Inventory & Batches" },
    { path: "/system-settings",          icon: "⬡", label: "System Settings" },
  ];

  const topMenus = [
    {
      key: "toolsMenu", label: "Tools",
      items: [
        { icon: "▤", label: "Inventory Management", path: "/inventory" },
        { icon: "◈", label: "Fish Detection", path: "/boile-control" },
        { icon: "◉", label: "Quality Analysis", path: "/dashboard" },
        { icon: "⬟", label: "Energy Monitor", path: "/dashboard" },
        null,
        { icon: "⬡", label: "Data Analytics", path: "/dashboard" },
        { icon: "◎", label: "Performance Monitor", path: "/dashboard" },
        null,
        { icon: "◈", label: "System Tools", path: "/dashboard" },
        { icon: "◉", label: "Maintenance", path: "/dashboard" },
      ],
    },
    {
      key: "reports", label: "Reports",
      items: [
        { icon: "◈", label: "Production Report", path: "/dashboard" },
        { icon: "◉", label: "Quality Report", path: "/dashboard" },
        { icon: "⬟", label: "Energy Report", path: "/dashboard" },
        null,
        { icon: "⬡", label: "Daily Summary", path: "/dashboard" },
        { icon: "◎", label: "Weekly Analysis", path: "/dashboard" },
        { icon: "◈", label: "Monthly Report", path: "/dashboard" },
        null,
        { icon: "◉", label: "Export Reports", path: "/dashboard" },
        { icon: "⬡", label: "Report Templates", path: "/dashboard" },
      ],
    },
    {
      key: "helpMenu", label: "Help",
      items: [
        { icon: "◈", label: "User Guide", path: "/dashboard" },
        { icon: "◉", label: "Search Help", path: "/dashboard" },
        { icon: "⬟", label: "Video Tutorials", path: "/dashboard" },
        null,
        { icon: "⬡", label: "Contact Support", path: "/dashboard" },
        { icon: "◎", label: "Send Feedback", path: "/dashboard" },
        null,
        { icon: "◈", label: "About", path: "/dashboard" },
        { icon: "◉", label: "Check Updates", path: "/dashboard" },
      ],
    },
  ];

  /* ── helpers ── */
  const menuBtn = (key) => ({
    background: activeDropdown === key ? t.menuHoverBg : "none",
    border: "none",
    color: activeDropdown === key ? t.menuHoverTxt : t.menuTxt,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12, fontWeight: 500,
    padding: "4px 10px", borderRadius: 3,
    cursor: "pointer", letterSpacing: "0.04em",
    textTransform: "uppercase", transition: "all 0.15s",
  });

  const dropStyle = {
    position: "absolute", top: "calc(100% + 2px)", left: 0,
    background: t.dropBg, border: `1px solid ${t.dropBdr}`,
    borderRadius: 4, minWidth: 200, zIndex: 1000,
    overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    animation: "fg-dropIn 0.12s ease",
  };

  const navBtn = (path) => ({
    display: "flex", alignItems: "center", gap: 10,
    width: "100%",
    background: activePath === path ? t.navActive : "none",
    border: "none", borderRadius: 5, padding: "8px 10px",
    cursor: "pointer", textAlign: "left",
    color: activePath === path ? t.navActiveTxt : t.navTxt,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    fontWeight: activePath === path ? 500 : 400,
    transition: "all 0.15s", position: "relative",
    letterSpacing: "0.01em",
  });

  const hover = (base, hoverBg, hoverTxt, baseTxt) => ({
    onMouseEnter: (e) => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverTxt; },
    onMouseLeave: (e) => { e.currentTarget.style.background = base || "none"; e.currentTarget.style.color = baseTxt; },
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fg-dropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fg-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes fg-slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .fg-hamburger {
          display: none !important;
          background: none;
          border-radius: 4px;
          padding: 5px 8px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .fg-scroll::-webkit-scrollbar { width: 6px; }
        .fg-scroll::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 768px) {
          .fg-sidebar-desk { display: none !important; }
          .fg-hamburger { display: flex !important; }
        }
      `}</style>

      {t.scanline && (
        <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)", pointerEvents: "none", zIndex: 9999 }} />
      )}

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: t.root, fontFamily: "'DM Sans', sans-serif", overflow: "hidden", color: t.userNameTxt }}>

        {/* ── MENU BAR ─────────────────────────── */}
        <div style={{ background: t.menubar, borderBottom: `1px solid ${t.menubarBdr}`, padding: "0 1rem", display: "flex", alignItems: "center", height: 32, flexShrink: 0, gap: 2 }}>
          {topMenus.map((menu) => (
            <div key={menu.key} style={{ position: "relative" }}>
              <button
                onClick={() => toggleDropdown(menu.key)}
                style={menuBtn(menu.key)}
                className="dropdown-trigger"
                onMouseEnter={(e) => { e.currentTarget.style.background = t.menuHoverBg; e.currentTarget.style.color = t.menuHoverTxt; }}
                onMouseLeave={(e) => { if (activeDropdown !== menu.key) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = t.menuTxt; } }}
              >
                {menu.label}
              </button>
              {activeDropdown === menu.key && (
                <div style={dropStyle} className="dropdown-menu">
                  {menu.items.map((item, i) =>
                    item === null ? (
                      <div key={i} style={{ height: 1, background: t.dropBdr, margin: "2px 0" }} />
                    ) : (
                      <button
                        key={i}
                        onClick={() => handleNavigation(item.path)}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", color: t.dropTxt, fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, padding: "7px 14px", cursor: "pointer", textAlign: "left", letterSpacing: "0.01em" }}
                        {...hover("none", t.dropHoverBg, t.dropHoverTxt, t.dropTxt)}
                      >
                        <span style={{ fontSize: 10, opacity: 0.45, flexShrink: 0 }}>{item.icon}</span>
                        {item.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Theme switcher */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
            {Object.values(THEMES).map((th) => {
              const active = themeName === th.name;
              return (
                <button
                  key={th.name}
                  onClick={() => setThemeName(th.name)}
                  title={th.label}
                  style={{ background: active ? t.menuHoverBg : "none", border: active ? `1px solid ${t.menuHoverTxt}55` : "1px solid transparent", color: active ? t.menuHoverTxt : t.menuTxt, fontFamily: "'Space Mono', monospace", fontSize: 10, padding: "2px 8px", borderRadius: 3, cursor: "pointer", letterSpacing: "0.06em", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.menuHoverBg; e.currentTarget.style.color = t.menuHoverTxt; }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = t.menuTxt; } }}
                >
                  {th.symbol} {th.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STATUS BAR ───────────────────────── */}
        <div style={{ background: t.statusbar, borderBottom: `1px solid ${t.statusBdr}`, padding: "0 1.25rem", height: 26, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, fontFamily: "'Space Mono', monospace", fontSize: 10.5, color: t.statusTxt, letterSpacing: "0.05em" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <span>
              <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: t.statusGreen, boxShadow: `0 0 5px ${t.statusGreen}`, marginRight: 5, animation: "fg-pulse 2s ease-in-out infinite", verticalAlign: "middle" }} />
              <span style={{ color: t.statusTxt }}>FISHGO PRO</span>
            </span>
            {[{ k: "SYS", v: "OPERATIONAL" }, { k: "CPU", v: "45%" }, { k: "RAM", v: "2.1 GB" }, { k: "NET", v: "Connected" }].map(({ k, v }) => (
              <span key={k}><span style={{ color: t.statusTxt }}>{k} </span><span style={{ color: t.statusVal }}>{v}</span></span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <span style={{ color: t.clockTxt, fontSize: 11 }}>
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </span>
            <span style={{ color: t.statusTxt }}>
              {currentTime.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
            </span>
          </div>
        </div>

        {/* ── TOP HEADER ───────────────────────── */}
        <div style={{ background: t.topbar, borderBottom: `1px solid ${t.topbarBdr}`, height: 56, display: "flex", alignItems: "center", padding: "0 1.25rem", flexShrink: 0, gap: "1rem" }}>
          <button
            className="fg-hamburger dropdown-trigger"
            onClick={() => setIsSidebarOpen(true)}
            style={{ border: `1px solid ${t.topbarBdr}`, color: t.navTxt }}
          >☰</button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, background: t.logoBg, border: `1px solid ${t.logoBdr}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐟</div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 17, color: t.logoText, letterSpacing: "-0.02em" }}>
              Fish<span style={{ color: t.logoAccent }}>Go</span>
            </span>
          </div>

          <div style={{ width: 1, height: 28, background: t.topbarBdr, flexShrink: 0 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.userNameTxt, letterSpacing: "0.01em" }}>
              {user?.name?.split(" ")[0] || "Operator"}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'Space Mono', monospace", fontSize: 9, color: t.userBadge, letterSpacing: "0.08em" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: t.userBadge, boxShadow: `0 0 5px ${t.userBadge}`, display: "inline-block", animation: "fg-pulse 2s ease-in-out infinite" }} />
              OPERATIONAL
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <NotificationBar />
            <RightSideNotificationBar />
          </div>

          {/* Profile */}
          <div style={{ position: "relative" }} className="dropdown-menu">
            <button
              className="dropdown-trigger"
              onClick={() => toggleDropdown("profile")}
              style={{ background: "none", border: `1px solid ${t.profileBtnBdr}`, borderRadius: 6, padding: "4px 10px 4px 4px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.profileBtnHoverBdr; e.currentTarget.style.background = t.profileBtnHoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.profileBtnBdr; e.currentTarget.style.background = "none"; }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 5, background: t.avatarBg, border: `1px solid ${t.avatarBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: t.avatarTxt, flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span style={{ fontSize: 12, color: t.profileLbl, fontWeight: 500 }}>{user?.name || "User"}</span>
              <span style={{ fontSize: 10, color: t.navSymbol, marginLeft: 2 }}>▾</span>
            </button>

            {activeDropdown === "profile" && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: t.dropBg, border: `1px solid ${t.dropBdr}`, borderRadius: 6, width: 240, zIndex: 1000, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.12)", animation: "fg-dropIn 0.12s ease" }}>
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.profHdrBdr}`, background: t.profHdrBg }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.profNameTxt, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: t.avatarBg, border: `1px solid ${t.avatarBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: t.avatarTxt }}>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    {user?.name || "User"}
                  </div>
                  <div style={{ fontSize: 11, color: t.profEmailTxt, fontFamily: "'Space Mono', monospace", marginTop: 3 }}>{user?.email || "user@fishgo.io"}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "'Space Mono', monospace", color: t.profTierTxt, background: t.profTierBg, border: `1px solid ${t.profTierBdr}`, borderRadius: 3, padding: "2px 7px", marginTop: 6, letterSpacing: "0.08em" }}>
                    ◈ PROFESSIONAL
                  </div>
                </div>
                <div style={{ padding: "4px 0" }}>
                  {[
                    { icon: "◉", label: "My Profile", path: "/dashboard" },
                    { icon: "⬡", label: "Account Settings", path: "/dashboard" },
                    { icon: "◈", label: "Notifications", path: "/dashboard" },
                    { icon: "◎", label: "Security", path: "/dashboard" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavigation(item.path)}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", color: t.profItemTxt, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "9px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}
                      {...hover("none", t.profItemHoverBg, t.profItemHoverTxt, t.profItemTxt)}
                    >
                      <span style={{ fontSize: 12, opacity: 0.6 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                  <div style={{ height: 1, background: t.profHdrBdr }} />
                  <button
                    onClick={() => handleNavigation("/dashboard")}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", color: t.profItemTxt, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "9px 16px", cursor: "pointer", textAlign: "left" }}
                    {...hover("none", t.profItemHoverBg, t.profItemHoverTxt, t.profItemTxt)}
                  >
                    <span style={{ fontSize: 12, opacity: 0.6 }}>◉</span>Help &amp; Support
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", color: t.dangerTxt, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "9px 16px", cursor: "pointer", textAlign: "left" }}
                    {...hover("none", t.dangerHoverBg, t.dangerHoverTxt, t.dangerTxt)}
                  >
                    <span style={{ fontSize: 12, opacity: 0.7 }}>⬟</span>Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ─────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Sidebar */}
          <div className="fg-sidebar-desk" style={{ width: 220, background: t.sidebar, borderRight: `1px solid ${t.sidebarBdr}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "10px 10px 4px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: t.sidebarLbl, padding: "0 6px", marginBottom: 6, textTransform: "uppercase" }}>
                Navigation
              </div>
              {navItems.map((item) => {
                const active = activePath === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    style={navBtn(item.path)}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = t.navHover; e.currentTarget.style.color = t.dropHoverTxt; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = t.navTxt; } }}
                  >
                    {active && (
                      <span style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 2, borderRadius: "0 2px 2px 0", background: t.navActiveBdr, boxShadow: `0 0 6px ${t.navActiveBdr}66` }} />
                    )}
                    <span style={{ fontSize: 10, flexShrink: 0, color: active ? t.navActiveTxt : t.navSymbol }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: "auto", borderTop: `1px solid ${t.sidebarBdr}`, padding: "12px 16px" }}>
              {[{ k: "Version", v: "v2.1.0", ok: false }, { k: "License", v: "Pro", ok: false }, { k: "Server", v: "Online", ok: true }].map((row) => (
                <div key={row.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9.5, color: t.footerKey, letterSpacing: "0.05em", textTransform: "uppercase" }}>{row.k}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9.5, color: row.ok ? t.footerOk : t.footerVal }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <main
            className="fg-scroll"
            style={{ flex: 1, overflow: "auto", background: t.main, scrollbarColor: `${t.scrollThumb} transparent` }}
          >
            <style>{`.fg-scroll::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 3px; } .fg-scroll::-webkit-scrollbar-thumb:hover { background: ${t.scrollThumbHover}; }`}</style>
            {children}
          </main>
        </div>

        {/* ── MOBILE SIDEBAR ───────────────────── */}
        {isSidebarOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex" }} onClick={() => setIsSidebarOpen(false)}>
            <div style={{ width: 260, background: t.sidebar, borderRight: `1px solid ${t.sidebarBdr}`, display: "flex", flexDirection: "column", padding: "1rem", animation: "fg-slideIn 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: "none", border: "none", color: t.navTxt, cursor: "pointer", fontSize: 18, alignSelf: "flex-end", padding: 4, lineHeight: 1, marginBottom: "1rem" }}>✕</button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
                <div style={{ width: 32, height: 32, background: t.logoBg, border: `1px solid ${t.logoBdr}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🐟</div>
                <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 17, color: t.logoText }}>Fish<span style={{ color: t.logoAccent }}>Go</span></span>
              </div>
              {navItems.map((item) => {
                const active = activePath === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { handleNavigation(item.path); setIsSidebarOpen(false); }}
                    style={{ ...navBtn(item.path), marginBottom: 2 }}
                  >
                    {active && <span style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 2, borderRadius: "0 2px 2px 0", background: t.navActiveBdr }} />}
                    <span style={{ fontSize: 10, flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Layout;
