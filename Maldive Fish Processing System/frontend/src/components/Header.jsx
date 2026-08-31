import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBar from './NotificationBar';
import RightSideNotificationBar from './RightSideNotificationBar';
import {
  Search,
  Bell,
  Mail,
  CheckSquare,
  Settings,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  Flame,
  Droplets,
  Zap,
  Sparkles,
  ExternalLink,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  Menu,
  Moon,
  Sun
} from 'lucide-react';

const Header = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userStatus, setUserStatus] = useState('Online'); // 'Online' | 'On Shift' | 'Standby'

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const msgRef = useRef(null);
  const taskRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (msgRef.current && !msgRef.current.contains(e.target)) setShowMessages(false);
      if (taskRef.current && !taskRef.current.contains(e.target)) setShowTasks(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notificationsList = [
    { id: 1, title: 'Chamber C Smoke Infusion', desc: 'Smoke density stabilized at 160 ppm.', time: '3m ago', unread: true, type: 'info' },
    { id: 2, title: 'Batch #AL-879 Approved', desc: 'AI vision validated AAA moisture compliance (13.8%).', time: '12m ago', unread: true, type: 'success' },
    { id: 3, title: 'Solar Preheater Optimization', desc: 'Thermal transfer efficiency reached 94.2%.', time: '35m ago', unread: false, type: 'info' },
  ];

  const tasksList = [
    { id: 1, task: 'Verify Brine Salinity for Chamber A', due: '10:30 AM', priority: 'High', done: false },
    { id: 2, task: 'Inspect Solar Dryer Airflow Damper B2', due: '12:00 PM', priority: 'Medium', done: false },
    { id: 3, task: 'Generate Morning Shift Production Slip', due: '02:00 PM', priority: 'Normal', done: true },
  ];

  const messagesList = [
    { id: 1, sender: 'Kasun Perera', text: 'Chamber A boiling cycle is running at 98.6°C setpoint.', time: '5m ago', unread: true },
    { id: 2, sender: 'Quality Lab (Nimal)', text: 'Raw fish sample #RF-991 scored 98.4% freshness.', time: '22m ago', unread: false },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-[0_2px_15px_-3px_rgba(15,23,42,0.04)] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ────────────────── TOP COMPACT TELEMETRY STRIP ────────────────── */}
      <div className="bg-slate-900 text-slate-300 text-[10.5px] font-mono px-4 sm:px-8 py-1 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            FISHGO ENTERPRISE SCADA · V2.4
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">
            MQTT BROKER: <strong className="text-emerald-400">ONLINE (14ms)</strong>
          </span>
          <span className="hidden lg:inline text-slate-500">|</span>
          <span className="hidden lg:inline text-slate-400">
            CHAMBERS: <strong className="text-white">4 / 4 ACTIVE</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="text-cyan-400 font-bold">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
          <span className="hidden sm:inline">
            {currentTime.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </div>
      </div>

      {/* ────────────────── MAIN HEADER BAR ────────────────── */}
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          {/* Left: Brand Identity & Quick Search */}
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            {/* Brand Logo & Tagline */}
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none flex-shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 border border-blue-400/30 flex items-center justify-center text-xl shadow-[0_4px_12px_rgba(2,132,199,0.25)] text-white">
                🐟
              </div>
              <div className="hidden sm:block">
                <div className="font-mono font-extrabold text-slate-900 text-lg tracking-tight leading-none">
                  Fish<span className="text-blue-600">Go</span>
                  <span className="text-[10px] text-blue-600 font-bold ml-1.5 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                    PRO
                  </span>
                </div>
                <div className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                  Maldive Fish Operations
                </div>
              </div>
            </div>

            <div className="hidden md:block h-6 w-px bg-slate-200 flex-shrink-0" />

            {/* Smart Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batches, chambers, sensors, or SOPs..."
                className="w-full pl-10 pr-12 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all shadow-inner"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="font-mono text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>

          {/* Center/Right: Live Telemetry Badges (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 font-semibold font-mono">
              <Flame size={14} className="text-amber-600" />
              <span>Chamber A: 98.6°C</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 font-semibold font-mono">
              <Droplets size={14} className="text-blue-600" />
              <span>RH: 34% (Dryer B)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-semibold font-mono">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Yield: 96.8% AAA</span>
            </div>
          </div>

          {/* Right Section - Action Buttons, Modals & Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            
            {/* Notifications, Messages & Tasks */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              
              {/* Notification Button & Popover */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all ${
                    showNotifications ? 'bg-white text-blue-600 shadow-sm' : ''
                  }`}
                  title="System Notifications"
                >
                  <Bell size={17} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl bg-white border border-slate-200 z-50 overflow-hidden animate-[fg-dropIn_0.15s_ease-out]">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <Bell size={15} className="text-blue-600" /> Plant Operational Alerts
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mono">
                        2 New
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {notificationsList.map((n) => (
                        <div key={n.id} className={`p-3.5 text-xs hover:bg-slate-50 transition-colors ${n.unread ? 'bg-blue-50/30' : ''}`}>
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                          </div>
                          <p className="text-slate-600 text-[11.5px] leading-relaxed">{n.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/dashboard');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        View Full Telemetry Log →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages Button & Popover */}
              <div className="relative" ref={msgRef}>
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  className={`relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all ${
                    showMessages ? 'bg-white text-blue-600 shadow-sm' : ''
                  }`}
                  title="Shift Team Messages"
                >
                  <Mail size={17} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />
                </button>

                {showMessages && (
                  <div className="absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl bg-white border border-slate-200 z-50 overflow-hidden animate-[fg-dropIn_0.15s_ease-out]">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <Mail size={15} className="text-blue-600" /> Shift Dispatch Comms
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mono">
                        Online
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {messagesList.map((m) => (
                        <div key={m.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-800">{m.sender}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{m.time}</span>
                          </div>
                          <p className="text-slate-600 text-[11.5px]">{m.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shift Tasks Button & Popover */}
              <div className="relative" ref={taskRef}>
                <button
                  onClick={() => setShowTasks(!showTasks)}
                  className={`relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all ${
                    showTasks ? 'bg-white text-blue-600 shadow-sm' : ''
                  }`}
                  title="Shift SOP Checklist"
                >
                  <CheckSquare size={17} />
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-mono text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    2
                  </span>
                </button>

                {showTasks && (
                  <div className="absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl bg-white border border-slate-200 z-50 overflow-hidden animate-[fg-dropIn_0.15s_ease-out]">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <CheckSquare size={15} className="text-amber-600" /> Active Shift Checklist
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mono">
                        1/3 Done
                      </span>
                    </div>

                    <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                      {tasksList.map((t) => (
                        <div key={t.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            defaultChecked={t.done}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className={`font-semibold ${t.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {t.task}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                              <span>Due: {t.due}</span>
                              <span>·</span>
                              <span className={`font-bold ${t.priority === 'High' ? 'text-rose-500' : 'text-slate-500'}`}>
                                {t.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Settings Shortcut */}
              <button
                onClick={() => navigate('/system-settings')}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                title="System Calibration & Settings"
              >
                <Settings size={17} />
              </button>
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'O'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user?.name || 'Kasun Perera'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {userStatus}
                  </div>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl bg-white border border-slate-200 z-50 overflow-hidden animate-[fg-dropIn_0.15s_ease-out]">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="font-bold text-slate-900 text-xs">
                      {user?.name || 'Kasun Perera'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {user?.email || 'lead.engineer@fishgo.io'}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md mt-2">
                      <Sparkles size={11} /> LEAD PROCESS ENGINEER
                    </div>
                  </div>

                  <div className="p-2 space-y-1 text-xs">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Shift Status
                    </div>
                    <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                      {['Online', 'On Shift', 'Break'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setUserStatus(status)}
                          className={`py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            userStatus === status
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    >
                      <User size={15} className="text-slate-400" />
                      <span>Operator Profile & Logs</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/system-settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    >
                      <Settings size={15} className="text-slate-400" />
                      <span>System Preferences</span>
                    </button>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-left"
                    >
                      <LogOut size={15} />
                      <span>Sign Out from Station</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
