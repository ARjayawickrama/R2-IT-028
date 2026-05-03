import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Inline style constants (white theme) ───────────────────────────────────
const S = {
  // Layout
  app: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: "'DM Sans', 'Inter', sans-serif", background: '#f8f7f4', color: '#1a1916', fontSize: 14 },

  // Top bar
  topbar: { background: '#fff', borderBottom: '1px solid #e8e6de', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, flexShrink: 0 },
  tbLeft: { display: 'flex', alignItems: 'center', gap: 20 },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  logoText: { fontSize: 15, fontWeight: 700, color: '#1a1916', letterSpacing: '-0.3px' },
  divider: { width: 1, height: 20, background: '#e8e6de' },
  navTabs: { display: 'flex', gap: 2 },
  tbRight: { display: 'flex', alignItems: 'center', gap: 8 },
  tbBtn: { border: '1px solid #e8e6de', background: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#6b6a64', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 },
  statusWrap: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b6a64' },

  // Main layout
  main: { display: 'flex', flex: 1, overflow: 'hidden' },

  // Sidebar
  sidebar: { width: 220, background: '#fff', borderRight: '1px solid #e8e6de', padding: '16px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' },
  sidebarSection: { fontSize: 10, fontWeight: 600, color: '#9e9c95', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 8px 4px' },
  sidebarBottom: { marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #e8e6de' },

  // Content
  content: { flex: 1, overflowY: 'auto', padding: 20, background: '#f8f7f4' },

  // Page header
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontSize: 18, fontWeight: 700, color: '#1a1916', letterSpacing: '-0.3px' },
  pageSub: { fontSize: 12, color: '#9e9c95', marginTop: 2 },
  headerActions: { display: 'flex', gap: 8 },

  // Cards
  card: { background: '#fff', border: '1px solid #e8e6de', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 0' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#1a1916' },
  cardMeta: { fontSize: 12, color: '#9e9c95' },
  cardBody: { padding: '16px 18px 18px' },

  // KPI
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 },
  kpiCard: { background: '#fff', border: '1px solid #e8e6de', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' },
  kpiTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  kpiVal: { fontSize: 26, fontWeight: 700, color: '#1a1916', letterSpacing: '-0.5px', lineHeight: 1 },
  kpiLabel: { fontSize: 12, color: '#9e9c95', marginTop: 4, fontWeight: 400 },
  kpiBar: { marginTop: 12, height: 3, background: '#f0efe9', borderRadius: 3, overflow: 'hidden' },

  // Buttons
  btnPrimary: { border: 'none', padding: '8px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' },
  btnGhost: { border: '1px solid #e8e6de', padding: '8px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#fff', color: '#6b6a64', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' },
  iconBtn: { width: 26, height: 26, border: '1px solid #e8e6de', background: '#fff', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },

  // Section row (2-col grid)
  sectionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },

  // Legend
  legend: { display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b6a64' },
  legendDot: { width: 8, height: 8, borderRadius: 2, flexShrink: 0 },

  // Chamber table
  chamberTable: { width: '100%', borderCollapse: 'collapse' },

  // Health grid
  healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  healthMetric: { background: '#fff', border: '1px solid #e8e6de', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' },

  // Report grid
  reportGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 },
  reportCard: { background: '#fff', border: '1px solid #e8e6de', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.2s', cursor: 'pointer' },

  // Activity
  activityItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderBottom: '1px solid #f0efe9', transition: 'background 0.15s', cursor: 'pointer' },

  // Profile
  profileFields: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 },
  fieldLabel: { fontSize: 11, color: '#9e9c95', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 },
  fieldVal: { fontSize: 14, color: '#1a1916', padding: '8px 12px', background: '#f8f7f4', border: '1px solid #e8e6de', borderRadius: 7 },

  // Modal overlay
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modal: { background: '#fff', borderRadius: 14, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#1a1916', marginBottom: 20 },
  inputWrap: { marginBottom: 14 },
  inputLabel: { display: 'block', fontSize: 12, fontWeight: 500, color: '#6b6a64', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #e8e6de', borderRadius: 7, fontSize: 13, color: '#1a1916', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
};

// ─── Color maps ──────────────────────────────────────────────────────────────
const COLORS = {
  blue:   { bg: '#eff4ff', text: '#2563eb', bar: '#2563eb', accent: '#bfcffe' },
  green:  { bg: '#ecfdf5', text: '#059669', bar: '#059669', accent: '#a7f3d0' },
  amber:  { bg: '#fffbeb', text: '#d97706', bar: '#d97706', accent: '#fde68a' },
  purple: { bg: '#f5f3ff', text: '#7c3aed', bar: '#7c3aed', accent: '#ddd6fe' },
  pink:   { bg: '#fdf2f8', text: '#db2777', bar: '#db2777', accent: '#fbcfe8' },
  red:    { bg: '#fef2f2', text: '#dc2626', bar: '#dc2626', accent: '#fecaca' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavTab({ label, icon, tabKey, active, onClick, dataTab }) {
  return (
    <button
      data-tab={dataTab || tabKey}
      onClick={() => onClick(tabKey)}
      style={{
        border: 'none', background: active ? COLORS.blue.bg : 'none',
        padding: '6px 12px', borderRadius: 6,
        fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 500 : 400,
        color: active ? COLORS.blue.text : '#6b6a64', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
      }}
    >
      {icon} {label}
    </button>
  );
}

function SidebarItem({ icon, label, active, badge, badgeColor = '#dc2626', badgeBg = '#fef2f2', badgeTxt = '#dc2626', onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s',
        color: danger ? '#dc2626' : (active ? COLORS.blue.text : '#6b6a64'),
        fontSize: 13, fontWeight: active ? 500 : 400,
        border: 'none', background: active ? COLORS.blue.bg : 'none',
        width: '100%', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 14, width: 16, textAlign: 'center' }}>{icon}</span>
      {label}
      {badge && (
        <span style={{
          marginLeft: 'auto', background: badgeBg, color: badgeTxt,
          fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 600,
        }}>{badge}</span>
      )}
    </button>
  );
}

function KpiCard({ icon, value, label, change, positive, color = 'blue', barWidth }) {
  const c = COLORS[color];
  return (
    <div
      style={{
        ...S.kpiCard,
        borderTop: `3px solid ${c.bar}`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = S.kpiCard.boxShadow; }}
    >
      <div style={S.kpiTop}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: positive ? COLORS.green.bg : COLORS.red.bg, color: positive ? COLORS.green.text : COLORS.red.text }}>
          {positive ? '↑' : '↓'} {change}
        </span>
      </div>
      <div style={S.kpiVal}>{value}</div>
      <div style={S.kpiLabel}>{label}</div>
      <div style={S.kpiBar}>
        <div style={{ height: '100%', borderRadius: 3, width: barWidth, background: c.bar, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    active:      { bg: COLORS.green.bg,  text: COLORS.green.text,  dot: COLORS.green.text,  label: 'Active' },
    warning:     { bg: COLORS.amber.bg,  text: COLORS.amber.text,  dot: COLORS.amber.text,  label: 'Warning' },
    maintenance: { bg: COLORS.blue.bg,   text: COLORS.blue.text,   dot: COLORS.blue.text,   label: 'Maintenance' },
  };
  const s = map[status] || map.active;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: s.bg, color: s.text }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

function EffBar({ value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: '#f0efe9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, width: `${value}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: '#6b6a64', minWidth: 28, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

function QualityBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#6b6a64', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, background: '#f0efe9', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 6, width: `${value}%`, background: color }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1916', minWidth: 30, textAlign: 'right' }}>{value}</span>
      </div>
    </div>
  );
}

function RingGauge({ value, color, label, status, statusColor }) {
  const r = 27, circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div style={S.healthMetric}>
      <div style={{ width: 64, height: 64, margin: '0 auto 10px', position: 'relative' }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="32" cy="32" r={r} fill="none" stroke="#f0efe9" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1916' }}>{value}%</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#9e9c95', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: statusColor || '#059669' }}>{status}</div>
    </div>
  );
}

function ActivityItem({ icon, action, chamber, time, dotColor }) {
  return (
    <div style={S.activityItem}
      onMouseEnter={e => e.currentTarget.style.background = '#f8f7f4'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#1a1916' }}>{action}</div>
        <div style={{ fontSize: 11, color: '#9e9c95' }}>{chamber}</div>
      </div>
      <div style={{ fontSize: 11, color: '#9e9c95', whiteSpace: 'nowrap' }}>{time}</div>
    </div>
  );
}

function ProductionBars() {
  const groups = [
    [65,58,45,70],[72,65,52,75],[78,70,58,82],[85,75,65,88],[89,82,70,85],[92,85,68,90],[88,80,62,86]
  ];
  const barColors = ['#2563eb','#059669','#d97706','#7c3aed'];
  const labels = ['00:00','04:00','08:00','12:00','16:00','20:00','24:00'];
  return (
    <div>
      <div style={S.legend}>
        {['Chamber A','Chamber B','Chamber C','Chamber D'].map((l,i) => (
          <div key={l} style={S.legendItem}>
            <div style={{ ...S.legendDot, background: barColors[i] }} /> {l}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ display: 'flex', alignItems: 'flex-end', gap: 2, flex: 1 }}>
            {g.map((val, ci) => (
              <div key={ci} style={{ flex: 1, height: `${val}%`, borderRadius: '3px 3px 0 0', background: barColors[ci], opacity: 0.88, cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.88'}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 6 }}>
        {labels.map(l => <span key={l} style={{ flex: 1, fontSize: 10, color: '#9e9c95', textAlign: 'center' }}>{l}</span>)}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(97);
  const [userProfile, setUserProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState('24h');
  const [exportFormat, setExportFormat] = useState('csv');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Static data
  const chamberData = [
    { id: 1, name: 'Chamber A', temp: 2.4, humidity: 78, status: 'active',      efficiency: 94, color: COLORS.green.bar, operator: 'John Doe' },
    { id: 2, name: 'Chamber B', temp: 1.8, humidity: 82, status: 'active',      efficiency: 88, color: COLORS.green.bar, operator: 'Jane Smith' },
    { id: 3, name: 'Chamber C', temp: 3.2, humidity: 65, status: 'warning',     efficiency: 76, color: COLORS.amber.bar, operator: 'Mike Johnson' },
    { id: 4, name: 'Chamber D', temp: 2.1, humidity: 74, status: 'maintenance', efficiency: 92, color: COLORS.blue.bar,  operator: 'Sarah Wilson' },
  ];
  const activities = [
    { icon: '🌡', action: 'Temperature threshold exceeded', chamber: 'Chamber C', time: '5 min ago',  dotColor: COLORS.amber.bg },
    { icon: '⚡', action: 'Energy spike detected',          chamber: 'Chamber B', time: '15 min ago', dotColor: COLORS.blue.bg },
    { icon: '🔧', action: 'Maintenance completed',          chamber: 'Chamber D', time: '1 hour ago', dotColor: COLORS.green.bg },
    { icon: '✅', action: 'Quality check passed',           chamber: 'Chamber A', time: '2 hours ago',dotColor: COLORS.green.bg },
  ];
  const qualityItems = [
    { label: 'Temperature',    value: 92, color: '#2563eb' },
    { label: 'Humidity',       value: 88, color: '#059669' },
    { label: 'Salt Content',   value: 95, color: '#7c3aed' },
    { label: 'pH Level',       value: 90, color: '#d97706' },
    { label: 'Processing Time',value: 87, color: '#db2777' },
  ];
  const reportCards = [
    { icon: '📦', name: 'Production Report', desc: 'Comprehensive production metrics, trends, and chamber-level breakdowns', last: 'Today 08:00',  btnColor: '#2563eb' },
    { icon: '✅', name: 'Quality Report',    desc: 'Quality control, compliance metrics, and parameter drift analysis',    last: 'Yesterday',   btnColor: '#059669' },
    { icon: '⚡', name: 'Energy Report',     desc: 'Energy consumption, efficiency analysis, and cost projections',        last: '3 days ago',  btnColor: '#d97706' },
    { icon: '📋', name: 'Maintenance Log',   desc: 'Scheduled maintenance, completed tasks, and upcoming service',         last: '1 week ago',  btnColor: '#7c3aed' },
    { icon: '🌡', name: 'Temperature Log',   desc: 'Detailed temperature history per chamber with threshold alerts',       last: '2 days ago',  btnColor: '#db2777' },
    { icon: '📊', name: 'Custom Report',     desc: 'Build a custom report with selected parameters and date ranges',       last: 'Custom',      btnColor: null },
  ];

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5001/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data.user);
        } else {
          setUserProfile({ name: 'John Doe', email: 'john.doe@fishgo.com', createdAt: '2024-01-15T00:00:00.000Z' });
        }
      } catch {
        setUserProfile({ name: 'John Doe', email: 'john.doe@fishgo.com', createdAt: '2024-01-15T00:00:00.000Z' });
      }
    };
    fetchProfile();
  }, []);

  // Live health ticker
  useEffect(() => {
    const t = setInterval(() => setSystemHealth(p => Math.max(85, Math.min(100, p + (Math.random() - 0.5) * 2))), 5000);
    return () => clearInterval(t);
  }, []);

  // Export
  const convertToCSV = (data) => {
    if (!data?.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const v = row[h];
      return typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','));
    return [headers.join(','), ...rows].join('\n');
  };
  const handleExport = () => {
    const content = exportFormat === 'json' ? JSON.stringify(chamberData, null, 2) : convertToCSV(chamberData);
    const mime = exportFormat === 'json' ? 'application/json' : 'text/csv';
    const ext  = exportFormat === 'json' ? 'json' : 'csv';
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `fishgo_export_${Date.now()}.${ext}`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // Password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { alert('Passwords do not match'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      if (res.ok) {
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Password changed successfully!');
      } else {
        const err = await res.json();
        alert(err.message || 'Error changing password');
      }
    } catch { alert('Error changing password'); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // Inline global styles (injected once)
  useEffect(() => {
    const id = 'fishgo-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
      body { margin:0; }
      ::-webkit-scrollbar { width:5px; height:5px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:#d4d1c6; border-radius:3px; }
      @keyframes fishgoPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      @keyframes fishgoFade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      .fishgo-anim { animation: fishgoFade 0.3s ease both; }
    `;
    document.head.appendChild(el);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>

      {/* ── TOP BAR ── */}
      <div style={S.topbar}>
        <div style={S.tbLeft}>
          
          <div style={S.divider} />
          <div style={S.navTabs}>
            {[
              { key: 'overview', icon: '📊', label: 'Overview'  },
              { key: 'reports',  icon: '📈', label: 'Reports'   },
              { key: 'system',   icon: '⚙️', label: 'System'    },
              { key: 'profile',  icon: '👤', label: 'Profile', dataTab: 'profile'   },
            ].map(t => (
              <NavTab key={t.key} tabKey={t.key} label={t.label} icon={t.icon} active={activeTab === t.key} onClick={setActiveTab} />
            ))}
          </div>
        </div>
        <div style={S.tbRight}>
          <div style={S.statusWrap}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 2px #dcfce7', display: 'inline-block', animation: 'fishgoPulse 2s infinite' }} />
            Live
          </div>
          <button style={S.tbBtn}>🔄 Refresh</button>
          <button style={S.tbBtn} onClick={() => setShowExportModal(true)}>⬇ Export</button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={S.main}>


        {/* ── CONTENT ── */}
        <div style={S.content}>

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === 'overview' && (
            <div className="fishgo-anim">
             

              {/* KPI Cards */}
              <div style={S.kpiGrid}>
                <KpiCard icon="📦" value="2,847"  label="Total Production (kg)" change="12.5%" positive color="blue"   barWidth="78%" />
                <KpiCard icon="✅" value="93.8%"  label="Quality Score"         change="3.2%"  positive color="green"  barWidth="93%" />
                <KpiCard icon="⚡" value="342"    label="Energy Usage (kW)"     change="5.1%"           color="amber"  barWidth="62%" />
                <KpiCard icon="⏱" value="24.5h"  label="Processing Time"       change="8.7%"  positive color="purple" barWidth="85%" />
              </div>

              {/* Charts row */}
              <div style={S.sectionRow}>
                {/* Production chart */}
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <div>
                      <div style={S.cardTitle}>Production Trends</div>
                      <div style={S.cardMeta}>All chambers · last 24h</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={S.iconBtn}>⟳</button>
                      <button style={S.iconBtn}>⋯</button>
                    </div>
                  </div>
                  <div style={S.cardBody}><ProductionBars /></div>
                </div>

                {/* Quality metrics */}
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <div>
                      <div style={S.cardTitle}>Quality Metrics</div>
                      <div style={S.cardMeta}>Real-time values</div>
                    </div>
                    <button style={S.iconBtn}>⋯</button>
                  </div>
                  <div style={S.cardBody}>
                    {/* Donut gauge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <div style={{ position: 'relative', width: 96, height: 96 }}>
                        <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="48" cy="48" r="38" fill="none" stroke="#f0efe9" strokeWidth="8" />
                          <circle cx="48" cy="48" r="38" fill="none" stroke="#059669" strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 38}
                            strokeDashoffset={2 * Math.PI * 38 * 0.06}
                            strokeLinecap="round" />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1916' }}>94%</span>
                          <span style={{ fontSize: 10, color: '#9e9c95' }}>overall</span>
                        </div>
                      </div>
                    </div>
                    {qualityItems.map(q => <QualityBar key={q.label} label={q.label} value={q.value} color={q.color} />)}
                  </div>
                </div>
              </div>

              {/* Chamber table */}
              <div style={{ ...S.card, marginBottom: 20 }}>
                <div style={{ ...S.cardHeader, paddingBottom: 0 }}>
                  <div>
                    <div style={S.cardTitle}>Chamber Status</div>
                    <div style={S.cardMeta}>4 chambers · 2 active, 1 warning, 1 maintenance</div>
                  </div>
                  <button style={{ ...S.btnGhost, fontSize: 12, padding: '6px 10px' }}>View All</button>
                </div>
                <div style={{ ...S.cardBody, paddingTop: 12, paddingBottom: 0 }}>
                  <table style={S.chamberTable}>
                    <thead>
                      <tr>
                        {['Chamber','Temp (°C)','Humidity','Status','Efficiency','Operator'].map(h => (
                          <th key={h} style={{ fontSize: 11, fontWeight: 500, color: '#9e9c95', padding: '0 12px 10px', textAlign: 'left', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chamberData.map(ch => (
                        <tr key={ch.id}
                          onMouseEnter={e => [...e.currentTarget.cells].forEach(c => c.style.background = '#f8f7f4')}
                          onMouseLeave={e => [...e.currentTarget.cells].forEach(c => c.style.background = '')}
                        >
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #f0efe9', fontSize: 13, fontWeight: 600, color: '#1a1916' }}>{ch.name}</td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #f0efe9', fontSize: 13, color: ch.status === 'warning' ? COLORS.amber.text : '#6b6a64' }}>{ch.temp}°C{ch.status === 'warning' ? ' ▲' : ''}</td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #f0efe9', fontSize: 13, color: '#6b6a64' }}>{ch.humidity}%</td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #f0efe9' }}><StatusChip status={ch.status} /></td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #f0efe9', minWidth: 120 }}><EffBar value={ch.efficiency} color={ch.color} /></td>
                          <td style={{ padding: '10px 12px', borderTop: '1px solid #f0efe9', fontSize: 12, color: '#6b6a64' }}>{ch.operator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ REPORTS TAB ══ */}
          {activeTab === 'reports' && (
            <div className="fishgo-anim">
              <div style={S.pageHeader}>
                <div>
                  <div style={S.pageTitle}>Reports & Analytics</div>
                  <div style={S.pageSub}>Generate and export detailed reports</div>
                </div>
                <div style={S.headerActions}>
                  <button style={S.btnGhost}>📅 Last 7 days</button>
                  <button style={S.btnPrimary} onClick={() => setShowExportModal(true)}>📊 Generate Report</button>
                </div>
              </div>
              <div style={S.reportGrid}>
                {reportCards.map(rc => (
                  <div key={rc.name} style={S.reportCard}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = S.reportCard.boxShadow; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>{rc.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1916', marginBottom: 4 }}>{rc.name}</div>
                    <div style={{ fontSize: 12, color: '#9e9c95', marginBottom: 16, lineHeight: 1.5 }}>{rc.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#9e9c95' }}>Last: {rc.last}</span>
                      {rc.btnColor
                        ? <button style={{ ...S.btnPrimary, fontSize: 12, padding: '6px 12px', background: rc.btnColor }}>Generate</button>
                        : <button style={{ ...S.btnGhost,   fontSize: 12, padding: '6px 12px' }}>Configure</button>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ SYSTEM TAB ══ */}
          {activeTab === 'system' && (
            <div className="fishgo-anim">
              <div style={S.pageHeader}>
                <div>
                  <div style={S.pageTitle}>System Health & Monitoring</div>
                  <div style={S.pageSub}>Monitor performance, alerts, and maintenance</div>
                </div>
                <div style={S.headerActions}>
                  <button style={S.btnGhost}>🔧 Maintenance</button>
                  <button style={S.btnPrimary}>🩺 Diagnostics</button>
                </div>
              </div>

              <div style={S.healthGrid}>
                <RingGauge value={Math.round(systemHealth)} color={COLORS.blue.bar}   label="Overall Health" status="Excellent"    statusColor={COLORS.green.text} />
                <RingGauge value={95}                       color={COLORS.green.bar}  label="Uptime"         status="Stable"       statusColor={COLORS.green.text} />
                <RingGauge value={70}                       color={COLORS.amber.bar}  label="CPU Load"       status="Moderate"     statusColor={COLORS.amber.text} />
                <RingGauge value={80}                       color={COLORS.purple.bar} label="Memory"         status="Normal"       statusColor={COLORS.purple.text} />
              </div>

              <div style={{ ...S.card, marginBottom: 16 }}>
                <div style={S.cardHeader}>
                  <div style={S.cardTitle}>Recent Activities</div>
                  <div style={S.cardMeta}>Last 4 events</div>
                </div>
                <div style={{ paddingTop: 8 }}>
                  {activities.map((a, i) => (
                    <ActivityItem key={i} icon={a.icon} action={a.action} chamber={a.chamber} time={a.time} dotColor={a.dotColor} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ PROFILE TAB ══ */}
          {activeTab === 'profile' && (
            <div className="fishgo-anim">
              <div style={S.pageHeader}>
                <div>
                  <div style={S.pageTitle}>User Profile</div>
                  <div style={S.pageSub}>Manage your account and security settings</div>
                </div>
                <button style={S.btnPrimary} onClick={() => setShowPasswordModal(true)}>🔐 Change Password</button>
              </div>

              <div style={{ ...S.card, marginBottom: 16 }}>
                <div style={S.cardHeader}><div style={S.cardTitle}>Account Information</div></div>
                <div style={S.cardBody}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1916' }}>{userProfile?.name || 'Loading…'}</div>
                      <div style={{ fontSize: 13, color: '#9e9c95', marginTop: 2 }}>{userProfile?.email || 'Loading…'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ background: COLORS.green.bg, color: COLORS.green.text, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20 }}>Active</span>
                        <span style={{ fontSize: 11, color: '#9e9c95' }}>
                          Member since {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={S.profileFields}>
                    {[
                      { label: 'Full Name',       val: userProfile?.name  },
                      { label: 'Email Address',   val: userProfile?.email },
                      { label: 'Account Status',  val: 'Active', green: true },
                      { label: 'Account Created', val: userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : '—' },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={S.fieldLabel}>{f.label}</div>
                        <div style={{ ...S.fieldVal, color: f.green ? COLORS.green.text : '#1a1916' }}>{f.val || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardHeader}><div style={S.cardTitle}>Security Settings</div></div>
                <div style={S.cardBody}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0efe9' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1916' }}>Password</div>
                      <div style={{ fontSize: 12, color: '#9e9c95', marginTop: 2 }}>Last changed recently</div>
                    </div>
                    <button style={S.btnPrimary} onClick={() => setShowPasswordModal(true)}>Change Password</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1916' }}>Two-Factor Authentication</div>
                      <div style={{ fontSize: 12, color: '#9e9c95', marginTop: 2 }}>Add an extra layer of security</div>
                    </div>
                    <button style={S.btnGhost}>Enable 2FA</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ PASSWORD MODAL ══ */}
      {showPasswordModal && (
        <div style={S.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowPasswordModal(false); }}>
          <div style={S.modal}>
            <div style={S.modalTitle}>🔐 Change Password</div>
            <form onSubmit={handlePasswordChange}>
              {[
                { id: 'currentPassword', label: 'Current Password' },
                { id: 'newPassword',     label: 'New Password',     min: 6 },
                { id: 'confirmPassword', label: 'Confirm Password',  min: 6 },
              ].map(f => (
                <div key={f.id} style={S.inputWrap}>
                  <label style={S.inputLabel}>{f.label}</label>
                  <input
                    type="password" required minLength={f.min}
                    value={passwordForm[f.id]}
                    onChange={e => setPasswordForm(p => ({ ...p, [f.id]: e.target.value }))}
                    style={S.input}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" style={S.btnGhost} onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>Change Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ EXPORT MODAL ══ */}
      {showExportModal && (
        <div style={S.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowExportModal(false); }}>
          <div style={S.modal}>
            <div style={S.modalTitle}>⬇ Export Data</div>
            <div style={S.inputWrap}>
              <label style={S.inputLabel}>Date Range</label>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div style={S.inputWrap}>
              <label style={S.inputLabel}>Export Format</label>
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{ ...S.input, appearance: 'none' }}>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button style={S.btnGhost} onClick={() => setShowExportModal(false)}>Cancel</button>
              <button style={S.btnPrimary} onClick={handleExport}>Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
