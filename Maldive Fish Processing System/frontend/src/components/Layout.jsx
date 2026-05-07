 import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RightSideNotificationBar from "./RightSideNotificationBar";
import NotificationBar from "./NotificationBar";

const navItems = [
   {
    path: "/dashboard",
    icon: "📊",
    label: "Dashboard Overview",
    color: "from-slate-600 to-slate-800",
    accent: "slate",
  },
  {
    path: "/dried-fish-quality",
    icon: "🐟",
    label: "Dried Fish Quality",
    color: "from-slate-600 to-slate-800",
    accent: "slate",
  },
  {
    path: "/boile-control",
    icon: "⚡",
    label: "AutoSalt Regulator",
    color: "from-slate-600 to-slate-800",
    accent: "slate",
  },
  {
    path: "/environmental-monitoring",
    icon: "🌡️",
    label: "EcoScan",
    color: "from-slate-600 to-slate-800",
    accent: "slate",
  },
  {
    path: "/raw-fish-quality",
    icon: "🐠",
    label: "Raw Fish Quality",
    color: "from-slate-600 to-slate-800",
    accent: "slate",
  },
  {
    path: "/system-settings",
    icon: "🔧",
    label: "System Settings",
    color: "from-slate-600 to-slate-800",
    accent: "slate",
  },
];

const mobileNavItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/dried-fish-quality", icon: "🐟", label: "Dried Fish Quality" },
  { path: "/boile-control", icon: "⚡", label: "Mechanical Salt Control" },
  { path: "/environmental-monitoring", icon: "🌡️", label: "Environmental Monitoring" },
  { path: "/raw-fish-quality", icon: "🐠", label: "Raw Fish Quality" },
  { path: "/system-settings", icon: "🔧", label: "System Settings" },
];

const accentStyles = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-400",   text: "text-blue-700",   dot: "bg-blue-500",   glow: "shadow-blue-200" },
  amber:  { bg: "bg-amber-50",  border: "border-amber-400",  text: "text-amber-700",  dot: "bg-amber-500",  glow: "shadow-amber-200" },
  violet: { bg: "bg-violet-50", border: "border-violet-400", text: "text-violet-700", dot: "bg-violet-500", glow: "shadow-violet-200" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-400",   text: "text-teal-700",   dot: "bg-teal-500",   glow: "shadow-teal-200" },
  cyan:   { bg: "bg-cyan-50",   border: "border-cyan-400",   text: "text-cyan-700",   dot: "bg-cyan-500",   glow: "shadow-cyan-200" },
  slate:  { bg: "bg-slate-100", border: "border-slate-400",  text: "text-slate-700",  dot: "bg-slate-500",  glow: "shadow-slate-200" },
};

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [hoveredNav, setHoveredNav] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-menu") && !event.target.closest(".dropdown-trigger")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDropdown = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setActiveDropdown(null);
    setIsSidebarOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const activeItem = navItems.find((item) => isActive(item.path));
  const activeAccent = activeItem ? accentStyles[activeItem.accent] : accentStyles.blue;

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.15); }
          50%       { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
        }
        .nav-active-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }
        .nav-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 100%);
        }
        .nav-btn:hover::before { opacity: 1; }
        .nav-btn-active {
          animation: slideIn 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .sidebar-indicator {
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
        }
        .dropdown-animate {
          animation: slideIn 0.18s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>

      <div className="flex-1 flex flex-col bg-white rounded-t-lg shadow-2xl overflow-hidden">

        {/* Desktop Menu Bar */}
        <div className="bg-gray-100 border-b border-gray-300 px-2 py-1">
          <div className="flex items-center space-x-1">
            {/* Tools Menu */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("toolsMenu")}
                className="dropdown-trigger px-3 py-1 text-sm text-gray-700 hover:bg-white hover:border border border-transparent hover:border-gray-300 rounded transition-colors font-medium"
              >
                🛠️ Tools
              </button>
              {activeDropdown === "toolsMenu" && (
                <div className="dropdown-animate absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {[
                      { icon: "⚡", label: "Fish Detection", path: "/boile-control" },
                      { icon: "🧪", label: "Quality Analysis", path: "/dashboard" },
                      { icon: "⚡", label: "Energy Monitor", path: "/dashboard" },
                    ].map((item) => (
                      <button key={item.label} onClick={() => { handleNavigation(item.path); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {item.icon} {item.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100" />
                    {[
                      { icon: "📊", label: "Data Analytics" },
                      { icon: "📈", label: "Performance Monitor" },
                    ].map((item) => (
                      <button key={item.label} onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {item.icon} {item.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100" />
                    {[
                      { icon: "🛠️", label: "System Tools" },
                      { icon: "🧹", label: "Maintenance" },
                    ].map((item) => (
                      <button key={item.label} onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reports Menu */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("reports")}
                className="dropdown-trigger px-3 py-1 text-sm text-gray-700 hover:bg-white hover:border border border-transparent hover:border-gray-300 rounded transition-colors font-medium"
              >
                📊 Reports
              </button>
              {activeDropdown === "reports" && (
                <div className="dropdown-animate absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {["📈 Production Report","🐟 Quality Report","⚡ Energy Report"].map((label) => (
                      <button key={label} onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{label}</button>
                    ))}
                    <div className="border-t border-gray-100" />
                    {["📅 Daily Summary","📊 Weekly Analysis","📈 Monthly Report"].map((label) => (
                      <button key={label} onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{label}</button>
                    ))}
                    <div className="border-t border-gray-100" />
                    {["📤 Export Reports","📋 Report Templates"].map((label) => (
                      <button key={label} onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Help Menu */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("helpMenu")}
                className="dropdown-trigger px-3 py-1 text-sm text-gray-700 hover:bg-white hover:border border border-transparent hover:border-gray-300 rounded transition-colors font-medium"
              >
                ❓ Help
              </button>
              {activeDropdown === "helpMenu" && (
                <div className="dropdown-animate absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {["📖 User Guide","🔍 Search Help","🎥 Video Tutorials"].map((label) => (
                      <button key={label} onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{label}</button>
                    ))}
                    <div className="border-t border-gray-100" />
                    {["💬 Contact Support","📧 Send Feedback"].map((label) => (
                      <button key={label} onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{label}</button>
                    ))}
                    <div className="border-t border-gray-100" />
                    {["ℹ️ About","🔄 Check Updates"].map((label) => (
                      <button key={label} onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-200 border-b border-gray-300 px-4 py-1 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-600">🐟 FishGo Professional</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-600">Status: Ready</span>
            <span className="text-xs text-gray-500">|</span>
            <span className="text-xs text-gray-600">System: Online</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-600">📊 CPU: 45%</span>
            <span className="text-xs text-gray-600">💾 RAM: 2.1GB</span>
            <span className="text-xs text-gray-600">🌐 Network: Connected</span>
            <span className="text-xs text-gray-600">🕐 {currentTime}</span>
          </div>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Logo */}
                <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">🐟</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900">FishGo</span>
                </div>

                <div className="ml-8 relative pl-6 border-l-4 border-indigo-400 rounded-l-2xl">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        {user?.name?.split(" ")[0] || "there"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        Operational
                      </span>
                      <span className="text-gray-400 text-xs">·</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Updated just now
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <NotificationBar />
                  <RightSideNotificationBar />
                </div>

                {/* Profile Dropdown */}
                <div className="relative dropdown-menu">
                  <button
                    onClick={() => toggleDropdown("profile")}
                    className="dropdown-trigger flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-300 transition-all"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  </button>
                  {activeDropdown === "profile" && (
                    <div className="dropdown-animate absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
                      <div className="py-1">
                        <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 bg-gray-50">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {user?.name?.charAt(0).toUpperCase() || "U"}
                              </span>
                            </div>
                            {user?.name || "User"}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">{user?.email || "user@example.com"}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ● Active
                            </span>
                            <span className="text-xs text-gray-400">Professional</span>
                          </div>
                        </div>
                        <div className="py-1">
                          {[
                            { icon: "👤", label: "My Profile", path: "/dashboard" },
                            { icon: "🔔", label: "Notifications", path: "/dashboard" },
                            { icon: "🔐", label: "Security", path: "/dashboard" },
                          ].map((item) => (
                            <button key={item.label}
                              onClick={() => { handleNavigation(item.path); setActiveDropdown(null); }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                              <span className="mr-3">{item.icon}</span>{item.label}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              navigate("/dashboard");
                              setTimeout(() => { document.querySelector('[data-tab="profile"]')?.click(); }, 100);
                              setActiveDropdown(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                            <span className="mr-3">⚙️</span>Account Settings
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => { handleNavigation("/dashboard"); setActiveDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                            <span className="mr-3">❓</span>Help & Support
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <span className="mr-3">🚪</span>Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div className="md:hidden">
              <div className="fixed inset-0 z-40 flex">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button onClick={() => setIsSidebarOpen(false)}
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                    <div className="flex-shrink-0 flex items-center px-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">🐟</span>
                      </div>
                      <span className="ml-2 text-xl font-bold text-gray-900">FishGo</span>
                    </div>
                    <nav className="mt-5 px-2 space-y-1">
                      {mobileNavItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <button key={item.path}
                            onClick={() => { handleNavigation(item.path); setIsSidebarOpen(false); }}
                            className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-all ${
                              active
                                ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                                : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                            }`}>
                            {item.icon} {item.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                  <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">{user?.name || "User"}</p>
                        <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">

          {/* Desktop Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shadow-inner">

            {/* Active Page Indicator Banner */}
            {activeItem && (
              <div className={`mx-3 mt-3 mb-1 px-3 py-2 rounded-lg bg-gradient-to-r ${activeItem.color} shadow-md`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeItem.icon}</span>
                  <div>
                    <p className="text-white text-xs font-semibold leading-tight">{activeItem.label}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">Current Page</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const hovered = hoveredNav === item.path;
                const styles = accentStyles[item.accent];

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    onMouseEnter={() => setHoveredNav(item.path)}
                    onMouseLeave={() => setHoveredNav(null)}
                    className={`nav-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 group ${
                      active
                        ? `nav-btn-active ${styles.bg} ${styles.text} border ${styles.border} shadow-sm ${styles.glow} shadow-md`
                        : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent"
                    }`}
                  >
                    {/* Left accent bar */}
                    <span
                      className={`sidebar-indicator absolute left-3 w-0.5 h-5 rounded-full ${
                        active ? `${styles.dot}` : "bg-transparent"
                      }`}
                      style={{ marginLeft: "-4px" }}
                    />

                    {/* Icon bubble */}
                    <span className={`w-7 h-7 rounded-md flex items-center justify-center text-base transition-all duration-200 flex-shrink-0 ${
                      active
                        ? `bg-gradient-to-br ${item.color} shadow-sm`
                        : "bg-gray-100 group-hover:bg-gray-200"
                    }`}>
                      {item.icon}
                    </span>

                    {/* Label */}
                    <span className={`flex-1 leading-tight transition-all duration-200 ${
                      active ? "font-semibold" : "font-medium"
                    }`}>
                      {item.label}
                    </span>

                    {/* Active checkmark */}
                    {active && (
                      <span className={`flex-shrink-0 w-4 h-4 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}

                    {/* Hover arrow */}
                    {!active && hovered && (
                      <span className="flex-shrink-0 text-gray-400 text-xs">›</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="bg-white border-t border-gray-200 p-3 mx-0">
              {/* Mini breadcrumb */}
              {activeItem && (
                <div className="mb-2 px-2 py-1.5 rounded-md bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Current</p>
                  <p className="text-xs text-gray-700 font-semibold truncate mt-0.5">{activeItem.icon} {activeItem.label}</p>
                </div>
              )}
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-medium">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>License:</span>
                  <span className="font-medium">Professional</span>
                </div>
                <div className="flex justify-between">
                  <span>Server:</span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
