import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RightSideNotificationBar from "./RightSideNotificationBar";
import NotificationBar from "./NotificationBar";
import {
  LayoutDashboard,
  Flame,
  Droplets,
  Activity,
  Settings,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  ShieldCheck,
  Sparkles,
  Layers,
  Cpu,
  HelpCircle,
  FileText,
  Search,
  Radio,
  Sliders,
  Compass,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Wind,
  ChevronLeft,
  Terminal,
  Zap,
  Gauge,
  Maximize2
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   PREMIUM THEMES CONFIGURATION
───────────────────────────────────────────────────────────── */
const THEMES = {
  white: {
    name: "white",
    label: "Executive Light",
    symbol: "☼",
    root: "#F8FAFC",
    menubar: "#FFFFFF",
    menubarBdr: "#E2E8F0",
    statusbar: "#F1F5F9",
    statusBdr: "#E2E8F0",
    topbar: "#FFFFFF",
    topbarBdr: "#E2E8F0",
    sidebar: "#FFFFFF",
    sidebarBdr: "#E2E8F0",
    main: "#F8FAFC",
    navHover: "#F1F5F9",
    navActive: "#EFF6FF",
    navActiveTxt: "#0284C7",
    navActiveBdr: "#0284C7",
    dropBg: "#FFFFFF",
    dropBdr: "#E2E8F0",
    dropTxt: "#334155",
    dropHoverBg: "#F8FAFC",
    dropHoverTxt: "#0284C7",
    menuTxt: "#64748B",
    menuHoverBg: "#F1F5F9",
    menuHoverTxt: "#0F172A",
    statusTxt: "#64748B",
    statusVal: "#0F172A",
    statusGreen: "#10B981",
    clockTxt: "#0284C7",
    logoText: "#0F172A",
    logoAccent: "#0284C7",
    logoBg: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
    logoBdr: "#BAE6FD",
    userNameTxt: "#0F172A",
    userRoleTxt: "#64748B",
    userBadge: "#10B981",
    profileBtnBdr: "#E2E8F0",
    profileBtnHoverBg: "#F8FAFC",
    profileBtnHoverBdr: "#CBD5E1",
    profileLbl: "#334155",
    avatarBg: "#E0F2FE",
    avatarBdr: "#BAE6FD",
    avatarTxt: "#0284C7",
    footerKey: "#94A3B8",
    footerVal: "#475569",
    footerOk: "#10B981",
    navTxt: "#475569",
    navSymbol: "#94A3B8",
    sidebarLbl: "#94A3B8",
    profHdrBg: "#F8FAFC",
    profHdrBdr: "#E2E8F0",
    profNameTxt: "#0F172A",
    profEmailTxt: "#64748B",
    profTierBg: "rgba(2, 132, 199, 0.08)",
    profTierBdr: "rgba(2, 132, 199, 0.2)",
    profTierTxt: "#0284C7",
    profItemTxt: "#475569",
    profItemHoverBg: "#F1F5F9",
    profItemHoverTxt: "#0F172A",
    dangerTxt: "#EF4444",
    dangerHoverBg: "#FEF2F2",
    dangerHoverTxt: "#DC2626",
    scrollThumb: "#CBD5E1",
    scrollThumbHover: "#94A3B8",
    cardBg: "#FFFFFF",
    cardBdr: "#E2E8F0",
    glowColor: "rgba(2, 132, 199, 0.15)",
  },
  midnight: {
    name: "midnight",
    label: "Midnight Navy",
    symbol: "☾",
    root: "#070E1E",
    menubar: "#050A17",
    menubarBdr: "#152238",
    statusbar: "#050A17",
    statusBdr: "#152238",
    topbar: "#070E1E",
    topbarBdr: "#152238",
    sidebar: "#060C1B",
    sidebarBdr: "#152238",
    main: "#070E1E",
    navHover: "#101D36",
    navActive: "rgba(56, 189, 248, 0.12)",
    navActiveTxt: "#38BDF8",
    navActiveBdr: "#38BDF8",
    dropBg: "#0C1730",
    dropBdr: "#1E3156",
    dropTxt: "#CBD5E1",
    dropHoverBg: "#142347",
    dropHoverTxt: "#38BDF8",
    menuTxt: "#94A3B8",
    menuHoverBg: "#101D36",
    menuHoverTxt: "#F8FAFC",
    statusTxt: "#64748B",
    statusVal: "#F8FAFC",
    statusGreen: "#34D399",
    clockTxt: "#38BDF8",
    logoText: "#F8FAFC",
    logoAccent: "#38BDF8",
    logoBg: "linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.1) 100%)",
    logoBdr: "rgba(56, 189, 248, 0.4)",
    userNameTxt: "#F8FAFC",
    userRoleTxt: "#94A3B8",
    userBadge: "#34D399",
    profileBtnBdr: "#152238",
    profileBtnHoverBg: "#101D36",
    profileBtnHoverBdr: "#1E3156",
    profileLbl: "#CBD5E1",
    avatarBg: "rgba(56, 189, 248, 0.2)",
    avatarBdr: "rgba(56, 189, 248, 0.4)",
    avatarTxt: "#38BDF8",
    footerKey: "#64748B",
    footerVal: "#94A3B8",
    footerOk: "#34D399",
    navTxt: "#94A3B8",
    navSymbol: "#64748B",
    sidebarLbl: "#475569",
    profHdrBg: "#050A17",
    profHdrBdr: "#1E3156",
    profNameTxt: "#F8FAFC",
    profEmailTxt: "#64748B",
    profTierBg: "rgba(56, 189, 248, 0.12)",
    profTierBdr: "rgba(56, 189, 248, 0.3)",
    profTierTxt: "#38BDF8",
    profItemTxt: "#94A3B8",
    profItemHoverBg: "#142347",
    profItemHoverTxt: "#F8FAFC",
    dangerTxt: "#F87171",
    dangerHoverBg: "rgba(239, 68, 68, 0.12)",
    dangerHoverTxt: "#EF4444",
    scrollThumb: "#152238",
    scrollThumbHover: "#1E3156",
    cardBg: "#0C1730",
    cardBdr: "#1E3156",
    glowColor: "rgba(56, 189, 248, 0.25)",
  },
  slate: {
    name: "slate",
    label: "Industrial Slate",
    symbol: "◈",
    root: "#0F172A",
    menubar: "#090D18",
    menubarBdr: "#1E293B",
    statusbar: "#090D18",
    statusBdr: "#1E293B",
    topbar: "#0F172A",
    topbarBdr: "#1E293B",
    sidebar: "#0B1120",
    sidebarBdr: "#1E293B",
    main: "#0F172A",
    navHover: "#1E293B",
    navActive: "rgba(14, 165, 233, 0.15)",
    navActiveTxt: "#38BDF8",
    navActiveBdr: "#0284C7",
    dropBg: "#1E293B",
    dropBdr: "#334155",
    dropTxt: "#E2E8F0",
    dropHoverBg: "#334155",
    dropHoverTxt: "#38BDF8",
    menuTxt: "#94A3B8",
    menuHoverBg: "#1E293B",
    menuHoverTxt: "#F8FAFC",
    statusTxt: "#64748B",
    statusVal: "#F1F5F9",
    statusGreen: "#10B981",
    clockTxt: "#38BDF8",
    logoText: "#F8FAFC",
    logoAccent: "#38BDF8",
    logoBg: "linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(2, 132, 199, 0.1) 100%)",
    logoBdr: "rgba(14, 165, 233, 0.4)",
    userNameTxt: "#F8FAFC",
    userRoleTxt: "#94A3B8",
    userBadge: "#10B981",
    profileBtnBdr: "#1E293B",
    profileBtnHoverBg: "#1E293B",
    profileBtnHoverBdr: "#334155",
    profileLbl: "#CBD5E1",
    avatarBg: "rgba(14, 165, 233, 0.2)",
    avatarBdr: "rgba(14, 165, 233, 0.4)",
    avatarTxt: "#38BDF8",
    footerKey: "#64748B",
    footerVal: "#94A3B8",
    footerOk: "#10B981",
    navTxt: "#94A3B8",
    navSymbol: "#64748B",
    sidebarLbl: "#475569",
    profHdrBg: "#0B1120",
    profHdrBdr: "#1E293B",
    profNameTxt: "#F8FAFC",
    profEmailTxt: "#64748B",
    profTierBg: "rgba(14, 165, 233, 0.12)",
    profTierBdr: "rgba(14, 165, 233, 0.3)",
    profTierTxt: "#38BDF8",
    profItemTxt: "#94A3B8",
    profItemHoverBg: "#334155",
    profItemHoverTxt: "#F8FAFC",
    dangerTxt: "#F87171",
    dangerHoverBg: "rgba(239, 68, 68, 0.15)",
    dangerHoverTxt: "#EF4444",
    scrollThumb: "#1E293B",
    scrollThumbHover: "#334155",
    cardBg: "#1E293B",
    cardBdr: "#334155",
    glowColor: "rgba(14, 165, 233, 0.2)",
  },
};

export default function Layout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("fishgo_sidebar_collapsed") === "true";
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem("fishgo_theme") || "white";
  });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const t = THEMES[themeName] || THEMES.white;

  useEffect(() => {
    localStorage.setItem("fishgo_theme", themeName);
  }, [themeName]);

  useEffect(() => {
    localStorage.setItem("fishgo_sidebar_collapsed", isCollapsed ? "true" : "false");
  }, [isCollapsed]);

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

  // Keyboard shortcut: Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchModalOpen(false);
        setActiveDropdown(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDropdown = (k) => setActiveDropdown(activeDropdown === k ? null : k);

  const handleNavigation = (path) => {
    navigate(path);
    setActiveDropdown(null);
    setIsSidebarOpen(false);
    setSearchModalOpen(false);
  };

  /* ─────────────────────────────────────────────────────────────
     MALDIVE FISH STEP-BY-STEP PROCESSING PIPELINE NAVIGATION
  ───────────────────────────────────────────────────────────── */
  const navGroups = [
    {
      label: "COMMAND CENTER",
      items: [
        {
          path: "/dashboard",
          icon: LayoutDashboard,
          label: "Plant Dashboard",
          badge: "LIVE",
          badgeColor: "#0284C7",
          iconColor: "#0284C7",
          iconBg: "rgba(2, 132, 199, 0.12)",
          desc: "Central Operations & Telemetry",
        },
      ],
    },
    {
      label: "FISH PROCESSING PIPELINE",
      items: [
        {
          path: "/raw-fish-quality",
          icon: ShieldCheck,
          label: "Raw fish Freshness",
          badge: "AI VISION",
          badgeColor: "#10B981",
          iconColor: "#10B981",
          iconBg: "rgba(16, 185, 129, 0.12)",
          desc: "Freshness Classification & Grading",
        },
        {
          path: "/boile-control",
          icon: Flame,
          label: "Salt & Boil Optimization",
          badge: "SCADA",
          badgeColor: "#F59E0B",
          iconColor: "#F59E0B",
          iconBg: "rgba(245, 158, 11, 0.12)",
          desc: "Salinity & Boiling Thermal Control",
        },
        {
          path: "/environmental-monitoring/dry-fish",
          icon: Wind,
          label: "Dry Fish Dehydration",
          badge: "AUTO",
          badgeColor: "#06B6D4",
          iconColor: "#06B6D4",
          iconBg: "rgba(6, 182, 212, 0.12)",
          desc: "Chamber Drying & Weight Loss",
        },
        {
          path: "/environmental-monitoring",
          icon: Droplets,
          label: "Environmental & Climate",
          badge: "IOT",
          badgeColor: "#3B82F6",
          iconColor: "#3B82F6",
          iconBg: "rgba(59, 130, 246, 0.12)",
          desc: "Solar Tunnel RH & Ambient Sensors",
        },
        {
          path: "/dried-fish-quality",
          icon: Sparkles,
          label: "Dried Fish Grade QC",
          badge: "AI QC",
          badgeColor: "#8B5CF6",
          iconColor: "#8B5CF6",
          iconBg: "rgba(139, 92, 246, 0.12)",
          desc: "Moisture & Export Grade Verification",
        },
      ],
    },
    {
      label: "CONFIGURATION & HARDWARE",
      items: [
        {
          path: "/system-settings",
          icon: Settings,
          label: "System Calibration & Config",
          badge: "CALIB",
          badgeColor: "#64748B",
          iconColor: "#64748B",
          iconBg: "rgba(100, 116, 139, 0.12)",
          desc: "Sensor Offsets & Hardware Gateway",
        },
      ],
    },
  ];

  const topMenus = [
    {
      key: "toolsMenu",
      label: "Plant Tools",
      items: [
        { icon: ShieldCheck, label: "Raw Catch Freshness Assessment", path: "/raw-fish-quality" },
        { icon: Flame, label: "Salt & Boil Optimization Control", path: "/boile-control" },
        { icon: Wind, label: "Dry Fish Dehydration Cycle", path: "/environmental-monitoring/dry-fish" },
        { icon: Droplets, label: "Environmental & Climate Telemetry", path: "/environmental-monitoring" },
        { icon: Sparkles, label: "Dried Fish Grade QC Analyzer", path: "/dried-fish-quality" },
        null,
        { icon: LayoutDashboard, label: "Plant Operations Dashboard", path: "/dashboard" },
        { icon: Settings, label: "System Calibration & Settings", path: "/system-settings" },
      ],
    },
    {
      key: "reports",
      label: "Audit & Reports",
      items: [
        { icon: FileText, label: "Daily Production Shift Slip", path: "/dashboard" },
        { icon: Activity, label: "Quality Compliance Audit Log", path: "/dashboard" },
        { icon: Cpu, label: "Thermal & Dehydration Efficiency", path: "/dashboard" },
        null,
        { icon: Layers, label: "Batch Salinity Traceability", path: "/dashboard" },
        { icon: ExternalLink, label: "Export HACCP Certification Data", path: "/dashboard" },
      ],
    },
    {
      key: "helpMenu",
      label: "Support & Help",
      items: [
        { icon: HelpCircle, label: "Maldive Fish SOP & Guidelines", path: "/dashboard" },
        { icon: Radio, label: "IoT Sensor & Gateway Diagnostics", path: "/dashboard" },
        { icon: ShieldCheck, label: "Export Quality Standards & Compliance", path: "/dashboard" },
        null,
        { icon: ExternalLink, label: "Engineering Support Desk", path: "/dashboard" },
      ],
    },
  ];

  const allNavItems = navGroups.flatMap((g) => g.items);
  const filteredSearchItems = allNavItems.filter((i) =>
    i.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.desc && i.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .font-mono-code {
          font-family: 'Space Mono', monospace;
        }

        @keyframes fg-dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fg-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.2); }
        }

        @keyframes fg-slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }

        .fg-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .fg-scroll::-webkit-scrollbar-track { background: transparent; }
        .fg-scroll::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 99px; }
        .fg-scroll::-webkit-scrollbar-thumb:hover { background: ${t.scrollThumbHover}; }

        .glass-header {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .nav-link-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 9px 12px;
          cursor: pointer;
          text-align: left;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          color: ${t.navTxt};
        }

        .nav-link-btn:hover {
          background: ${t.navHover};
          color: ${t.dropHoverTxt};
          transform: translateX(2px);
        }

        .nav-link-btn.active {
          background: ${t.navActive};
          color: ${t.navActiveTxt};
          font-weight: 700;
          border-color: ${t.navActiveBdr}25;
          box-shadow: 0 4px 14px ${t.glowColor};
        }

        .nav-link-btn.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 4px;
          border-radius: 0 4px 4px 0;
          background: ${t.navActiveBdr};
          box-shadow: 0 0 10px ${t.navActiveBdr};
        }

        .icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .nav-link-btn:hover .icon-box {
          transform: scale(1.08);
        }
      `}</style>

      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: t.root,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          overflow: "hidden",
          color: t.userNameTxt,
        }}
      >
        {/* ────────────────── TOP COMPACT TOOLBAR / MENU ────────────────── */}
        <div
          style={{
            background: t.menubar,
            borderBottom: `1px solid ${t.menubarBdr}`,
            padding: "0 1.25rem",
            display: "flex",
            alignItems: "center",
            height: 34,
            flexShrink: 0,
            gap: 6,
            fontSize: 12,
          }}
        >
          {topMenus.map((menu) => (
            <div key={menu.key} style={{ position: "relative" }}>
              <button
                onClick={() => toggleDropdown(menu.key)}
                className="dropdown-trigger"
                style={{
                  background: activeDropdown === menu.key ? t.menuHoverBg : "none",
                  border: "none",
                  color: activeDropdown === menu.key ? t.menuHoverTxt : t.menuTxt,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.15s",
                }}
              >
                {menu.label}
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {activeDropdown === menu.key && (
                <div
                  className="dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    background: t.dropBg,
                    border: `1px solid ${t.dropBdr}`,
                    borderRadius: 14,
                    minWidth: 260,
                    zIndex: 1000,
                    overflow: "hidden",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.16)",
                    animation: "fg-dropIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                    padding: "6px 0",
                  }}
                >
                  {menu.items.map((item, i) => {
                    if (item === null) {
                      return <div key={i} style={{ height: 1, background: t.dropBdr, margin: "4px 0" }} />;
                    }
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleNavigation(item.path)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          background: "none",
                          border: "none",
                          color: t.dropTxt,
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 12.5,
                          padding: "8px 14px",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = t.dropHoverBg;
                          e.currentTarget.style.color = t.dropHoverTxt;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "none";
                          e.currentTarget.style.color = t.dropTxt;
                        }}
                      >
                        <Icon size={15} style={{ opacity: 0.75, flexShrink: 0 }} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Quick Search trigger pill */}
          <button
            onClick={() => setSearchModalOpen(true)}
            style={{
              marginLeft: "auto",
              marginRight: "auto",
              background: t.statusbar,
              border: `1px solid ${t.statusBdr}`,
              color: t.menuTxt,
              borderRadius: 8,
              padding: "3px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Search size={12} />
            <span>Search processing modules & tools...</span>
            <kbd
              className="font-mono-code"
              style={{
                fontSize: 9,
                background: t.menubar,
                border: `1px solid ${t.menubarBdr}`,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              Ctrl K
            </kbd>
          </button>

          {/* Theme switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {Object.values(THEMES).map((th) => {
              const active = themeName === th.name;
              return (
                <button
                  key={th.name}
                  onClick={() => setThemeName(th.name)}
                  title={th.label}
                  style={{
                    background: active ? t.menuHoverBg : "none",
                    border: active ? `1px solid ${t.navActiveBdr}40` : "1px solid transparent",
                    color: active ? t.navActiveTxt : t.menuTxt,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <span>{th.symbol}</span>
                  <span className="hidden sm:inline">{th.name.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ────────────────── INDUSTRIAL TELEMETRY STATUS BAR ────────────────── */}
        <div
          style={{
            background: t.statusbar,
            borderBottom: `1px solid ${t.statusBdr}`,
            padding: "0 1.25rem",
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            fontFamily: "'Space Mono', monospace",
            fontSize: 10.5,
            color: t.statusTxt,
            letterSpacing: "0.04em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: t.statusGreen,
                  boxShadow: `0 0 8px ${t.statusGreen}`,
                  animation: "fg-pulse 2s ease-in-out infinite",
                }}
              />
              <span style={{ color: t.statusVal }}>FISHGO COMMAND SUITE · V2.4</span>
            </span>

            {[
              { k: "PLANT", v: "OPERATIONAL" },
              { k: "MQTT", v: "CONNECTED (14ms)" },
              { k: "AI VISION", v: "99.1% ACCURACY" },
              { k: "SOLAR AUX", v: "42 kW ENGAGED" },
            ].map(({ k, v }) => (
              <span key={k} style={{ display: "none", alignItems: "center", gap: 4 }} className="md:inline-flex">
                <span style={{ color: t.statusTxt }}>{k}:</span>
                <span style={{ color: t.statusVal, fontWeight: 700 }}>{v}</span>
              </span>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <span style={{ color: t.clockTxt, fontWeight: 700 }}>
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
            <span style={{ color: t.statusTxt }}>
              {currentTime
                .toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
                .toUpperCase()}
            </span>
          </div>
        </div>

        {/* ────────────────── MAIN APPLICATION HEADER ────────────────── */}
        <div
          className="glass-header"
          style={{
            background: t.topbar,
            borderBottom: `1px solid ${t.topbarBdr}`,
            height: 60,
            display: "flex",
            alignItems: "center",
            padding: "0 1.25rem",
            flexShrink: 0,
            gap: "1rem",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden"
            style={{
              background: "none",
              border: `1px solid ${t.topbarBdr}`,
              borderRadius: 8,
              padding: "6px",
              color: t.navTxt,
              cursor: "pointer",
            }}
          >
            <Menu size={18} />
          </button>

          {/* Logo & Brand Identity */}
          <div
            onClick={() => handleNavigation("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: t.logoBg,
                border: `1.5px solid ${t.logoBdr}`,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                boxShadow: `0 4px 14px ${t.glowColor}`,
              }}
            >
              🐟
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 800,
                  fontSize: 18,
                  color: t.logoText,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                Fish<span style={{ color: t.logoAccent }}>Go</span>
                <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.6, fontWeight: 400 }}>PRO</span>
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: t.userRoleTxt,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Maldive Fish Intelligent Processing
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: t.topbarBdr, flexShrink: 0 }} />

          {/* Live Mini Telemetry Pill */}
          <div
            className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl border text-xs"
            style={{ background: t.statusbar, borderColor: t.statusBdr }}
          >
            <div className="flex items-center gap-1.5 font-bold mono">
              <Flame size={14} className="text-amber-500" />
              <span>Chamber A: 98.6°C</span>
            </div>
            <span style={{ color: t.statusBdr }}>|</span>
            <div className="flex items-center gap-1.5 font-bold mono">
              <Droplets size={14} className="text-blue-500" />
              <span>Humidity: 34% RH</span>
            </div>
            <span style={{ color: t.statusBdr }}>|</span>
            <div className="flex items-center gap-1.5 font-bold mono">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Yield AAA: 96.8%</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Right Header Utilities */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBar />
            <RightSideNotificationBar />

            {/* Profile Dropdown */}
            <div style={{ position: "relative" }} className="dropdown-menu">
              <button
                className="dropdown-trigger"
                onClick={() => toggleDropdown("profile")}
                style={{
                  background: "none",
                  border: `1px solid ${t.profileBtnBdr}`,
                  borderRadius: 10,
                  padding: "5px 12px 5px 6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = t.profileBtnHoverBdr;
                  e.currentTarget.style.background = t.profileBtnHoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = t.profileBtnBdr;
                  e.currentTarget.style.background = "none";
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: t.avatarBg,
                    border: `1px solid ${t.avatarBdr}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    fontWeight: 800,
                    color: t.avatarTxt,
                    flexShrink: 0,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || "O"}
                </div>
                <div style={{ textAlign: "left" }} className="hidden sm:block">
                  <div style={{ fontSize: 12, color: t.profileLbl, fontWeight: 700, lineHeight: 1.1 }}>
                    {user?.name || "Operator"}
                  </div>
                  <div style={{ fontSize: 10, color: t.userRoleTxt, fontFamily: "'Space Mono', monospace" }}>
                    SUPERVISOR
                  </div>
                </div>
                <ChevronDown size={12} style={{ color: t.navSymbol, marginLeft: 2 }} />
              </button>

              {activeDropdown === "profile" && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: t.dropBg,
                    border: `1px solid ${t.dropBdr}`,
                    borderRadius: 14,
                    width: 250,
                    zIndex: 1000,
                    overflow: "hidden",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
                    animation: "fg-dropIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div style={{ padding: "16px", borderBottom: `1px solid ${t.profHdrBdr}`, background: t.profHdrBg }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: t.profNameTxt }}>
                      {user?.name || "Operator"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: t.profEmailTxt,
                        fontFamily: "'Space Mono', monospace",
                        marginTop: 2,
                      }}
                    >
                      {user?.email || "operator@fishgo.io"}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 9.5,
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 700,
                        color: t.profTierTxt,
                        background: t.profTierBg,
                        border: `1px solid ${t.profTierBdr}`,
                        borderRadius: 6,
                        padding: "2px 8px",
                        marginTop: 8,
                        letterSpacing: "0.06em",
                      }}
                    >
                      ◈ CERTIFIED ENGINEER
                    </div>
                  </div>

                  <div style={{ padding: "6px" }}>
                    {[
                      { icon: LayoutDashboard, label: "Plant Overview", path: "/dashboard" },
                      { icon: Settings, label: "System Calibration", path: "/system-settings" },
                      { icon: Activity, label: "Live Diagnostics", path: "/dashboard" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleNavigation(item.path)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            background: "none",
                            border: "none",
                            color: t.profItemTxt,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: 12.5,
                            padding: "9px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = t.profItemHoverBg;
                            e.currentTarget.style.color = t.profItemHoverTxt;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.color = t.profItemTxt;
                          }}
                        >
                          <Icon size={14} style={{ opacity: 0.7 }} />
                          {item.label}
                        </button>
                      );
                    })}

                    <div style={{ height: 1, background: t.profHdrBdr, margin: "4px 0" }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        background: "none",
                        border: "none",
                        color: t.dangerTxt,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 12.5,
                        fontWeight: 600,
                        padding: "9px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = t.dangerHoverBg;
                        e.currentTarget.style.color = t.dangerHoverTxt;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.color = t.dangerTxt;
                      }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ────────────────── MAIN BODY & SIDEBAR ────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          
          {/* Desktop Permanent Sidebar with Collapse Toggle */}
          <aside
            className="hidden md:flex fg-scroll"
            style={{
              width: isCollapsed ? 76 : 265,
              background: t.sidebar,
              borderRight: `1px solid ${t.sidebarBdr}`,
              flexDirection: "column",
              flexShrink: 0,
              overflowY: "auto",
              padding: isCollapsed ? "16px 8px" : "16px 12px",
              transition: "width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Sidebar Collapse Toggle Button */}
            <div style={{ display: "flex", justifyContent: isCollapsed ? "center" : "flex-end", marginBottom: 12 }}>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                style={{
                  background: t.statusbar,
                  border: `1px solid ${t.statusBdr}`,
                  borderRadius: 8,
                  padding: "4px 8px",
                  cursor: "pointer",
                  color: t.menuTxt,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> <span>COLLAPSE</span></>}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {navGroups.map((group, gIdx) => (
                <div key={gIdx}>
                  {!isCollapsed && (
                    <div
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: t.sidebarLbl,
                        padding: "0 10px",
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      {group.label}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigation(item.path)}
                          className={`nav-link-btn ${active ? "active" : ""}`}
                          title={isCollapsed ? `${item.label} (${item.badge || ''})` : item.desc}
                          style={{
                            justifyContent: isCollapsed ? "center" : "flex-start",
                            padding: isCollapsed ? "9px 0" : "9px 12px",
                          }}
                        >
                          <div
                            className="icon-box"
                            style={{
                              background: active ? `${item.iconColor}22` : item.iconBg,
                              color: item.iconColor,
                            }}
                          >
                            <Icon size={17} />
                          </div>

                          {!isCollapsed && (
                            <>
                              <div style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                                {item.desc && (
                                  <div style={{ fontSize: 10, color: t.footerKey, fontWeight: 400, marginTop: 2 }}>
                                    {item.desc}
                                  </div>
                                )}
                              </div>

                              {item.badge && (
                                <span
                                  style={{
                                    fontSize: 8.5,
                                    fontFamily: "'Space Mono', monospace",
                                    fontWeight: 700,
                                    background: active ? `${item.badgeColor}22` : t.statusbar,
                                    color: active ? item.badgeColor : t.sidebarLbl,
                                    border: `1px solid ${active ? `${item.badgeColor}44` : t.statusBdr}`,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                  }}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Bottom Hardware Summary Card */}
            {!isCollapsed && (
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 16,
                  borderTop: `1px solid ${t.sidebarBdr}`,
                }}
              >
                <div
                  style={{
                    background: t.statusbar,
                    border: `1px solid ${t.statusBdr}`,
                    borderRadius: 12,
                    padding: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.userNameTxt }}>System Telemetry</span>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 700,
                        color: t.footerOk,
                        background: `${t.footerOk}15`,
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      98.4%
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, fontFamily: "'Space Mono', monospace" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: t.footerKey }}>CHAMBERS</span>
                      <span style={{ color: t.footerVal, fontWeight: 700 }}>4 / 4 ONLINE</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: t.footerKey }}>MQTT GATE</span>
                      <span style={{ color: t.footerOk, fontWeight: 700 }}>14ms LATENCY</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: t.footerKey }}>AI VISION</span>
                      <span style={{ color: t.footerOk, fontWeight: 700 }}>NOMINAL</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content Viewport */}
          <main
            className="fg-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              background: t.main,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </main>
        </div>

        {/* ────────────────── MOBILE SLIDE-OVER SIDEBAR ────────────────── */}
        {isSidebarOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
            }}
            onClick={() => setIsSidebarOpen(false)}
          >
            <div
              style={{
                width: 290,
                background: t.sidebar,
                borderRight: `1px solid ${t.sidebarBdr}`,
                display: "flex",
                flexDirection: "column",
                padding: "1.25rem",
                animation: "fg-slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      background: t.logoBg,
                      border: `1px solid ${t.logoBdr}`,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    🐟
                  </div>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 800, fontSize: 17, color: t.logoText }}>
                    Fish<span style={{ color: t.logoAccent }}>Go</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: t.navTxt,
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx}>
                    <div
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: t.sidebarLbl,
                        marginBottom: 6,
                        textTransform: "uppercase",
                      }}
                    >
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigation(item.path)}
                          className={`nav-link-btn ${active ? "active" : ""}`}
                          style={{ marginBottom: 3 }}
                        >
                          <div
                            className="icon-box"
                            style={{
                              background: active ? `${item.iconColor}22` : item.iconBg,
                              color: item.iconColor,
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── GLOBAL QUICK SEARCH MODAL (Ctrl + K) ────────────────── */}
        {searchModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(6px)",
              zIndex: 10000,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: "12vh",
            }}
            onClick={() => setSearchModalOpen(false)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 540,
                background: t.cardBg,
                border: `1px solid ${t.cardBdr}`,
                borderRadius: 16,
                boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
                overflow: "hidden",
                animation: "fg-dropIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 20px",
                  borderBottom: `1px solid ${t.cardBdr}`,
                }}
              >
                <Search size={18} style={{ color: t.menuTxt }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type to search processing pipeline modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 14,
                    color: t.userNameTxt,
                  }}
                />
                <kbd
                  className="font-mono-code"
                  style={{
                    fontSize: 10,
                    background: t.statusbar,
                    border: `1px solid ${t.statusBdr}`,
                    padding: "2px 6px",
                    borderRadius: 4,
                    color: t.statusTxt,
                  }}
                >
                  ESC
                </kbd>
              </div>

              <div style={{ maxHeight: 340, overflowY: "auto", padding: "8px" }}>
                {filteredSearchItems.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: t.statusTxt, fontSize: 13 }}>
                    No matching module found.
                  </div>
                ) : (
                  filteredSearchItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          color: t.userNameTxt,
                          fontSize: 13,
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = t.navHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            className="icon-box"
                            style={{ background: item.iconBg, color: item.iconColor }}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.label}</div>
                            {item.desc && (
                              <div style={{ fontSize: 11, color: t.footerKey }}>{item.desc}</div>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: t.statusTxt }} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
