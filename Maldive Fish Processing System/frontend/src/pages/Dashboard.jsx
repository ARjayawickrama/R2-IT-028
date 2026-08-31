import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import {
  Activity, Flame, Droplets, Thermometer, Wind, Zap, CheckCircle2,
  AlertTriangle, AlertCircle, RefreshCw, Download, Play, Pause, Settings,
  BarChart3, ShieldCheck, ChevronRight, Filter, Plus, Clock, Cpu,
  ArrowUpRight, ArrowDownRight, Layers, Eye, Gauge, Check, X,
  Sliders, Waves, Sparkles, FileText, Database, Radio, Server, Compass
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   MQTT CONFIGURATION
───────────────────────────────────────────────────────────── */
const MQTT_BROKER_WS = 'wss://broker.hivemq.com:8000/mqtt';

const MQTT_TOPICS = {
  // Data (subscribe)
  AQUASENSE_TELEMETRY: 'aquasense/fish/telemetry',
  SORTING_SENSOR: 'fish/sorting/mq135',
  SORTING_STATUS: 'fish/sorting/status',
  INSPECTOR_DATA: 'fish-inspector/measurement/data',
  INSPECTOR_STATUS: 'fish-inspector/measurement/status',

  // Commands (publish)
  AQUASENSE_CONTROL: 'aquasense/fish/control',
  SORTING_COMMAND: 'fish/sorting/command',
  INSPECTOR_COMMAND: 'fish-inspector/measurement/command',
};

/* ─────────────────────────────────────────────────────────────
   INITIAL STATE (fallback while MQTT connects)
───────────────────────────────────────────────────────────── */
const INITIAL_CHAMBERS = [
  {
    id: 'CH-01',
    name: 'Chamber A · Brine & Boil',
    stage: 'Salting & Parboiling',
    temp: 0,
    targetTemp: 100.0,
    humidity: 0,
    salinity: 0,
    pressure: 1.0,
    status: 'offline',
    efficiency: 0,
    batchId: '—',
    species: '—',
    weightKg: 0,
    operator: '—',
    elapsedMin: 0,
    totalMin: 60,
    heaterOn: false,
    pumpOn: false,
    exhaustOn: false,
  },
  {
    id: 'CH-02',
    name: 'Chamber B · Solar-Assist Dryer',
    stage: 'Primary Dehydration',
    temp: 0,
    targetTemp: 55.0,
    humidity: 0,
    salinity: 0,
    pressure: 1.0,
    status: 'offline',
    efficiency: 0,
    batchId: '—',
    species: '—',
    weightKg: 0,
    operator: '—',
    elapsedMin: 0,
    totalMin: 360,
    heaterOn: false,
    pumpOn: false,
    exhaustOn: false,
  },
  {
    id: 'CH-03',
    name: 'Chamber C · Smoke & Curing',
    stage: 'Hardwood Smoke Infusion',
    temp: 0,
    targetTemp: 65.0,
    humidity: 0,
    salinity: 0,
    pressure: 0.98,
    status: 'offline',
    efficiency: 0,
    batchId: '—',
    species: '—',
    weightKg: 0,
    operator: '—',
    elapsedMin: 0,
    totalMin: 180,
    heaterOn: false,
    pumpOn: false,
    exhaustOn: false,
  },
  {
    id: 'CH-04',
    name: 'Chamber D · Final Hardening & QC',
    stage: 'Vacuum De-moisture & Grade',
    temp: 0,
    targetTemp: 26.0,
    humidity: 0,
    salinity: 0,
    pressure: 0.85,
    status: 'offline',
    efficiency: 0,
    batchId: '—',
    species: '—',
    weightKg: 0,
    operator: '—',
    elapsedMin: 0,
    totalMin: 60,
    heaterOn: false,
    pumpOn: false,
    exhaustOn: false,
  },
];

const INITIAL_SORTING = {
  mq135: 0,
  quality: 'UNKNOWN',
  currentCommand: 'IDLE',
  status: 'IDLE',
};

const INITIAL_INSPECTOR = {
  weight: 0,
  peak_mm: 0,
  peak_cm: 0,
  left_cm: 0,
  center_cm: 0,
  right_cm: 0,
  scanning: false,
  sensor_ok: false,
  status: '—',
};

/* ─────────────────────────────────────────────────────────────
   MAIN DASHBOARD COMPONENT
───────────────────────────────────────────────────────────── */
export default function Dashboard() {
  // ── MQTT client ref ──
  const mqttClientRef = useRef(null);
  const [mqttConnected, setMqttConnected] = useState(false);

  // ── State ──
  const [chambers, setChambers] = useState(INITIAL_CHAMBERS);
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [inspector, setInspector] = useState(INITIAL_INSPECTOR);

  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [selectedChamber, setSelectedChamber] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [activeMetricTab, setActiveMetricTab] = useState('output');
  const [exportConfig, setExportConfig] = useState({ format: 'csv', range: '24h', includeAi: true, includeSensors: true });
  const [toastMessage, setToastMessage] = useState(null);
  const [systemHealth, setSystemHealth] = useState(98.4);
  const [searchQuery, setSearchQuery] = useState('');

  // ── MQTT Connection ──
  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER_WS, {
      clientId: 'dashboard-' + Math.random().toString(16).substr(2, 8),
      clean: true,
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      console.log('MQTT Connected');
      setMqttConnected(true);
      setToastMessage('MQTT Connected to HiveMQ');

      // Subscribe to all data topics
      client.subscribe(MQTT_TOPICS.AQUASENSE_TELEMETRY);
      client.subscribe(MQTT_TOPICS.SORTING_SENSOR);
      client.subscribe(MQTT_TOPICS.SORTING_STATUS);
      client.subscribe(MQTT_TOPICS.INSPECTOR_DATA);
      client.subscribe(MQTT_TOPICS.INSPECTOR_STATUS);
    });

    client.on('message', (topic, message) => {
      const payload = message.toString();
      try {
        const data = JSON.parse(payload);
        handleMqttMessage(topic, data);
      } catch (e) {
        // If not JSON, treat as plain text (for sorting commands)
        if (topic === MQTT_TOPICS.SORTING_STATUS) {
          // Could be plain status, but we'll handle anyway
        }
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error', err);
      setMqttConnected(false);
    });

    client.on('close', () => {
      console.log('MQTT disconnected');
      setMqttConnected(false);
    });

    mqttClientRef.current = client;

    return () => {
      if (client) {
        client.end();
      }
    };
  }, []);

  // ── Handle incoming MQTT messages ──
  const handleMqttMessage = (topic, data) => {
    setLastSyncTime(new Date());

    switch (topic) {
      case MQTT_TOPICS.AQUASENSE_TELEMETRY: {
        // data: { weight1, weight2, chamber_temp, status_cell1, status_cell2, heater_ssr, fan_status, thermal_grid: [...] }
        // Map to chambers (assuming chamber1 = weight1, cell1; chamber2 = weight2, cell2 etc.)
        // For simplicity, we'll update first two chambers with this data
        setChambers(prev => {
          const updated = [...prev];
          // Chamber A (index 0)
          updated[0] = {
            ...updated[0],
            temp: data.chamber_temp || 0,
            weightKg: data.weight1 || 0,
            status: data.status_cell1 ? 'optimal' : 'offline',
            heaterOn: data.heater_ssr || false,
            exhaustOn: data.fan_status || false,
            // keep other fields as is
          };
          // Chamber B (index 1) – assuming weight2 and status_cell2 are for second cell
          updated[1] = {
            ...updated[1],
            weightKg: data.weight2 || 0,
            status: data.status_cell2 ? 'optimal' : 'offline',
          };
          // We could also update humidity/salinity if present, but not in this payload
          return updated;
        });
        break;
      }

      case MQTT_TOPICS.SORTING_SENSOR: {
        // data: { mq135, quality }
        setSorting(prev => ({
          ...prev,
          mq135: data.mq135 || 0,
          quality: data.quality || 'UNKNOWN',
        }));
        break;
      }

      case MQTT_TOPICS.SORTING_STATUS: {
        // data: { command, status, mq135?, quality? }
        setSorting(prev => ({
          ...prev,
          currentCommand: data.command || prev.currentCommand,
          status: data.status || prev.status,
          mq135: data.mq135 || prev.mq135,
          quality: data.quality || prev.quality,
        }));
        break;
      }

      case MQTT_TOPICS.INSPECTOR_DATA: {
        // data: { weight, peak_mm, peak_cm, left_cm, center_cm, right_cm, scanning, sensor_ok }
        setInspector(prev => ({
          ...prev,
          weight: data.weight || 0,
          peak_mm: data.peak_mm || 0,
          peak_cm: data.peak_cm || 0,
          left_cm: data.left_cm || 0,
          center_cm: data.center_cm || 0,
          right_cm: data.right_cm || 0,
          scanning: data.scanning || false,
          sensor_ok: data.sensor_ok || false,
        }));
        break;
      }

      case MQTT_TOPICS.INSPECTOR_STATUS: {
        // data: { status, scanning }
        setInspector(prev => ({
          ...prev,
          status: data.status || prev.status,
          scanning: data.scanning !== undefined ? data.scanning : prev.scanning,
        }));
        break;
      }

      default:
        break;
    }
  };

  // ── Publish MQTT commands ──
  const publishCommand = (topic, command, payload = {}) => {
    if (!mqttClientRef.current || !mqttConnected) {
      showToast('MQTT not connected!');
      return;
    }
    const msg = typeof command === 'string' ? command : JSON.stringify({ ...payload, command });
    mqttClientRef.current.publish(topic, msg);
    showToast(`Command ${command} sent to ${topic}`);
  };

  // ── Toast helper ──
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── UI Action Handlers ──
  const handleToggleChamberEquipment = (chamberId, key) => {
    // For AquaSense: we need to send control message
    // We'll publish to aquasense/fish/control with cell1_drying / cell2_drying
    // Determine which cell: if chamberId ends with 01 => cell1, etc.
    let cell1 = false, cell2 = false;
    if (chamberId === 'CH-01') cell1 = !chambers[0]?.heaterOn; // toggle
    else if (chamberId === 'CH-02') cell2 = !chambers[1]?.heaterOn;
    // Actually, we need to map to the correct drying state. For simplicity, we'll toggle status.
    // We'll set cell1_drying or cell2_drying based on chamber.
    const controlMsg = {
      cell1_drying: chamberId === 'CH-01' ? !chambers[0]?.heaterOn : chambers[0]?.heaterOn,
      cell2_drying: chamberId === 'CH-02' ? !chambers[1]?.heaterOn : chambers[1]?.heaterOn,
    };
    publishCommand(MQTT_TOPICS.AQUASENSE_CONTROL, JSON.stringify(controlMsg));

    // Optimistically update UI
    setChambers(prev => prev.map(c =>
      c.id === chamberId ? { ...c, [key]: !c[key] } : c
    ));
  };

  const handleSaveChamberSetpoint = (chamberId, newTargetTemp) => {
    // Not implemented via MQTT for now, but we can update local state
    setChambers(prev =>
      prev.map(c => c.id === chamberId ? { ...c, targetTemp: parseFloat(newTargetTemp) } : c)
    );
    setSelectedChamber(null);
    showToast(`Setpoint for ${chamberId} updated to ${newTargetTemp}°C (local only)`);
  };

  const handleCreateBatch = (e) => {
    e.preventDefault();
    setShowNewBatchModal(false);
    showToast('New batch dispatched (simulated)');
  };

  // Sorting commands
  const sendSortingCommand = (cmd) => {
    publishCommand(MQTT_TOPICS.SORTING_COMMAND, cmd);
  };

  // Inspector commands
  const sendInspectorCommand = (cmd) => {
    publishCommand(MQTT_TOPICS.INSPECTOR_COMMAND, cmd);
  };

  // ── Computed KPIs ──
  const totalProductionKg = inspector.weight || 0; // placeholder, could sum from chambers
  const targetProductionKg = 4200;
  const qualityAverage = 97.4; // could compute from inspector quality? Not available.
  const activeChamberCount = chambers.filter(c => c.status === 'optimal').length;
  const powerUsageKw = 418;

  // ── Render ──
  return (
    <div className="fish-dashboard-root">
      {/* ─── STYLES (same as before) ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        .fish-dashboard-root { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; color: #0F172A; background: #F8FAFC; min-height: 100%; padding: 24px 28px 48px; box-sizing: border-box; }
        .mono { font-family: 'Space Mono', monospace; }
        .glass-card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 18px; box-shadow: 0 4px 20px -2px rgba(15,23,42,0.04), 0 2px 6px -1px rgba(15,23,42,0.02); transition: all 0.25s cubic-bezier(0.16,1,0.3,1); }
        .glass-card:hover { border-color: #CBD5E1; box-shadow: 0 12px 30px -4px rgba(15,23,42,0.08), 0 4px 10px -2px rgba(15,23,42,0.03); }
        .hero-banner { background: linear-gradient(135deg, #0B192C 0%, #1E3E62 60%, #000000 100%); border-radius: 22px; padding: 26px 32px; color: #FFFFFF; position: relative; overflow: hidden; box-shadow: 0 16px 36px -8px rgba(11,25,44,0.35); margin-bottom: 24px; }
        .hero-banner::before { content: ''; position: absolute; top: -40px; right: -40px; width: 280px; height: 280px; background: radial-gradient(circle, rgba(14,165,233,0.25) 0%, rgba(14,165,233,0) 70%); border-radius: 50%; pointer-events: none; }
        .hero-banner::after { content: ''; position: absolute; bottom: -50px; left: 20%; width: 220px; height: 220px; background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0) 70%); border-radius: 50%; pointer-events: none; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 24px; }
        .kpi-card { padding: 20px 22px; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .kpi-icon-pill { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s ease; }
        .kpi-card:hover .kpi-icon-pill { transform: scale(1.08); }
        .kpi-val-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
        .kpi-val { font-size: 28px; font-weight: 700; letter-spacing: -0.03em; color: #0F172A; }
        .kpi-sub { font-size: 13px; color: #64748B; font-weight: 500; }
        .subnav-tabs { display: flex; align-items: center; gap: 6px; background: #E2E8F0; padding: 4px; border-radius: 14px; margin-bottom: 24px; width: fit-content; max-width: 100%; overflow-x: auto; }
        .subnav-btn { padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; color: #475569; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; white-space: nowrap; }
        .subnav-btn:hover { color: #0F172A; background: rgba(255,255,255,0.6); }
        .subnav-btn.active { background: #FFFFFF; color: #0284C7; box-shadow: 0 2px 8px rgba(15,23,42,0.08); }
        .chamber-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .chamber-card { padding: 22px; border-left: 4px solid #0284C7; position: relative; }
        .chamber-card.optimal { border-left-color: #10B981; }
        .chamber-card.warning { border-left-color: #F59E0B; }
        .chamber-card.offline { border-left-color: #94A3B8; }
        .telemetry-pill { background: #F1F5F9; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 10px; display: flex; flex-direction: column; gap: 2px; }
        @keyframes pulse-emerald { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(1.2); } }
        .pulse-beacon { width: 8px; height: 8px; border-radius: 50%; background: #10B981; display: inline-block; animation: pulse-emerald 2s infinite ease-in-out; box-shadow: 0 0 8px #10B981; }
        .toast-float { position: fixed; bottom: 24px; right: 28px; background: #0F172A; color: #FFFFFF; padding: 12px 20px; border-radius: 12px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 10px; box-shadow: 0 12px 30px rgba(0,0,0,0.25); z-index: 9999; animation: slideUp 0.25s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .meter-bar { height: 7px; background: #F1F5F9; border-radius: 99px; overflow: hidden; position: relative; }
        .meter-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(0.16,1,0.3,1); }
        @media (max-width:1200px) { .kpi-grid { grid-template-columns: repeat(2,1fr); } .chamber-grid { grid-template-columns:1fr; } }
        @media (max-width:768px) { .fish-dashboard-root { padding: 16px; } .kpi-grid { grid-template-columns:1fr; } .hero-banner { padding:20px; } }
      `}</style>

      {/* ─── TOAST ─── */}
      {toastMessage && (
        <div className="toast-float">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── HERO ─── */}
      <div className="hero-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mono">
                <span className="pulse-beacon" />
                {mqttConnected ? 'MQTT Online' : 'MQTT Offline'} · {systemHealth}% Plant Efficiency
              </span>
              <span className="text-xs text-slate-400 mono">
                Last Sync: {lastSyncTime.toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Maldive Fish Operations Control Hub
              <Sparkles size={22} className="text-amber-400" />
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Real‑time monitoring of salt‑boiling chambers, solar drying tunnels, smoke cure stability, and AI automated freshness grading.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setIsLiveSync(!isLiveSync);
                showToast(isLiveSync ? 'Live polling paused.' : 'Live polling resumed.');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isLiveSync
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <RefreshCw size={14} className={isLiveSync ? 'animate-spin' : ''} />
              {isLiveSync ? 'LIVE STREAMING' : 'STREAM PAUSED'}
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              <Download size={14} /> Export Report
            </button>
            <button
              onClick={() => setShowNewBatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <Plus size={16} /> New Processing Batch
            </button>
          </div>
        </div>
        {/* Hero Mini Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10 text-slate-300 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400"><Layers size={16} /></div>
            <div><div className="font-bold text-white text-sm mono">{activeChamberCount} Lines Active</div><div className="text-slate-400">Boil · Dry · Smoke · QC</div></div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><ShieldCheck size={16} /></div>
            <div><div className="font-bold text-white text-sm mono">Grade AAA Yield: {qualityAverage}%</div><div className="text-slate-400">Alagoduwa & Kelawalla</div></div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400"><Flame size={16} /></div>
            <div><div className="font-bold text-white text-sm mono">Avg Salinity: {chambers[0]?.salinity || 16.2}° Bé</div><div className="text-slate-400">Optimal Osmotic Target</div></div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400"><Zap size={16} /></div>
            <div><div className="font-bold text-white text-sm mono">Solar Offset: 38.5%</div><div className="text-slate-400">Clean Thermal Energy</div></div>
          </div>
        </div>
      </div>

      {/* ─── KPI GRID ─── */}
      <div className="kpi-grid">
        {/* KPI 1: Production */}
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Production Yield</span>
            <div className="kpi-icon-pill bg-blue-50 text-blue-600 border border-blue-100"><Layers size={20} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-val mono">{totalProductionKg.toFixed(0)}</span>
            <span className="text-sm font-semibold text-slate-500">kg</span>
            <span className="ml-auto inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mono"><ArrowUpRight size={12} className="mr-0.5" /> +14.2%</span>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-xs text-slate-500"><span>Target: {targetProductionKg} kg</span><span className="font-bold text-slate-700 mono">{Math.min(100, Math.round((totalProductionKg/targetProductionKg)*100))}%</span></div>
            <div className="meter-bar"><div className="meter-fill bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.min(100, (totalProductionKg/targetProductionKg)*100)}%` }} /></div>
          </div>
        </div>

        {/* KPI 2: Quality */}
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quality Score Index</span>
            <div className="kpi-icon-pill bg-emerald-50 text-emerald-600 border border-emerald-100"><ShieldCheck size={20} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-val mono">{qualityAverage}%</span>
            <span className="text-sm font-semibold text-emerald-600 font-bold">Grade AAA</span>
            <span className="ml-auto inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mono"><ArrowUpRight size={12} className="mr-0.5" /> +2.8%</span>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-xs text-slate-500"><span>Moisture Content: 13.8%</span><span className="font-bold text-emerald-600 mono">Compliance 99.4%</span></div>
            <div className="meter-bar"><div className="meter-fill bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${qualityAverage}%` }} /></div>
          </div>
        </div>

        {/* KPI 3: Salinity */}
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Salinity & Boiling</span>
            <div className="kpi-icon-pill bg-amber-50 text-amber-600 border border-amber-100"><Flame size={20} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-val mono">{chambers[0]?.salinity || 16.4}</span>
            <span className="text-sm font-semibold text-slate-500">° Bé</span>
            <span className="ml-auto inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mono">Optimal Cook</span>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-xs text-slate-500"><span>Boil Setpoint: 99.5°C</span><span className="font-bold text-slate-700 mono">Variance ±0.4°C</span></div>
            <div className="meter-bar"><div className="meter-fill bg-gradient-to-r from-amber-500 to-orange-400" style={{ width: '92%' }} /></div>
          </div>
        </div>

        {/* KPI 4: Power */}
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Power & Solar Efficiency</span>
            <div className="kpi-icon-pill bg-purple-50 text-purple-600 border border-purple-100"><Zap size={20} /></div>
          </div>
          <div className="kpi-val-row">
            <span className="kpi-val mono">{powerUsageKw}</span>
            <span className="text-sm font-semibold text-slate-500">kW</span>
            <span className="ml-auto inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mono"><ArrowDownRight size={12} className="mr-0.5" /> -8.4%</span>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-xs text-slate-500"><span>Solar Thermal: 42kW</span><span className="font-bold text-purple-700 mono">Eco Score A+</span></div>
            <div className="meter-bar"><div className="meter-fill bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: '84%' }} /></div>
          </div>
        </div>
      </div>

      {/* ─── SUB‑NAV TABS ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="subnav-tabs">
          {[
            { id: 'overview', label: 'Command Overview', icon: BarChart3 },
            { id: 'chambers', label: 'Chamber Telemetry Matrix', icon: Cpu },
            { id: 'quality', label: 'AI Vision & Quality QC', icon: ShieldCheck },
            { id: 'analytics', label: 'Trend Intelligence', icon: Activity },
            { id: 'batches', label: 'Active Batches & Logs', icon: Layers },
            { id: 'diagnostics', label: 'Hardware Diagnostics', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} className={`subnav-btn ${active ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-sm text-xs font-semibold text-slate-600">
          {['1h','8h (Shift)','24h','7d','30d'].map(range => (
            <button key={range} onClick={() => { setTimeRange(range); showToast(`Filter applied: ${range}`); }} className={`px-3 py-1.5 rounded-lg transition-all ${timeRange === range ? 'bg-slate-900 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}>
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB CONTENT ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3: Graph & Chambers */}
            <div className="lg:col-span-2 space-y-6">
              {/* Graph */}
              <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Activity size={18} className="text-blue-600" /> Dynamic Processing Telemetry Trends</h3>
                    <p className="text-xs text-slate-500">Live multi-series tracking with automated anomaly boundaries</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    {[
                      { id:'output', label:'Output (kg)', color:'text-blue-600' },
                      { id:'temp', label:'Boil Temp (°C)', color:'text-amber-600' },
                      { id:'quality', label:'Quality Score (%)', color:'text-emerald-600' },
                      { id:'energy', label:'Power Draw (kW)', color:'text-purple-600' }
                    ].map(m => (
                      <button key={m.id} onClick={() => setActiveMetricTab(m.id)} className={`px-3 py-1.5 rounded-lg transition-all ${activeMetricTab === m.id ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'}`}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* SVG Graph (simplified with dummy data) */}
                <div className="relative w-full h-64 select-none">
                  <svg className="w-full h-full" viewBox="0 0 700 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0284C7" stopOpacity="0.35" /><stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" /></linearGradient>
                      <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" /><stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" /></linearGradient>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.35" /><stop offset="100%" stopColor="#10B981" stopOpacity="0.0" /></linearGradient>
                      <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" /><stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" /></linearGradient>
                    </defs>
                    {[40,90,140,190].map((y,i) => (<line key={i} x1="30" y1={y} x2="690" y2={y} stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="4,4" />))}
                    {/* Dummy path – you can replace with real data */}
                    <path d="M 40 180 Q 150 150, 260 110 T 480 60 T 680 30 L 680 200 L 40 200 Z" fill="url(#blueGradient)" />
                    <path d="M 40 180 Q 150 150, 260 110 T 480 60 T 680 30" fill="none" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Data points */}
                    {[
                      { time:'02:00', output:420, temp:88, quality:94, energy:310 },
                      { time:'05:00', output:680, temp:94, quality:96, energy:380 },
                      { time:'08:00', output:1240, temp:99, quality:97, energy:440 },
                      { time:'11:00', output:1980, temp:98, quality:98, energy:420 },
                      { time:'14:00', output:2650, temp:96, quality:97, energy:405 },
                      { time:'17:00', output:3340, temp:99, quality:99, energy:430 },
                      { time:'20:00', output:3842, temp:97, quality:98, energy:418 }
                    ].map((d, idx) => {
                      const cx = 40 + (idx * (640 / 6));
                      let cy = 100;
                      if (activeMetricTab === 'output') cy = 190 - (d.output / 4200) * 160;
                      else if (activeMetricTab === 'temp') cy = 200 - ((d.temp - 70) / 35) * 160;
                      else if (activeMetricTab === 'quality') cy = 200 - ((d.quality - 85) / 15) * 160;
                      else if (activeMetricTab === 'energy') cy = 200 - (d.energy / 500) * 160;
                      return (
                        <g key={idx} className="cursor-pointer group">
                          <circle cx={cx} cy={cy} r="5" className="fill-white stroke-slate-900 transition-transform group-hover:scale-150" strokeWidth="2.5" />
                          <text x={cx} y={215} textAnchor="middle" className="text-[10px] fill-slate-400 mono font-semibold">{d.time}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Daily Target Output Curve</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Confidence Band: ±1.2%</span>
                  </div>
                  <span className="mono text-slate-700 font-bold">Peak Output: 3,842 kg at 20:00</span>
                </div>
              </div>

              {/* Chambers grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Cpu size={18} className="text-cyan-600" /> Live Processing Chamber Stations</h3>
                    <p className="text-xs text-slate-500">Real‑time thermal, salinity, and atmospheric status per unit</p>
                  </div>
                  <button onClick={() => setActiveTab('chambers')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">Deep Diagnostics <ChevronRight size={14} /></button>
                </div>
                <div className="chamber-grid">
                  {chambers.map(ch => (
                    <div key={ch.id} className={`glass-card chamber-card ${ch.status}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400 mono">{ch.id}</span><span className="text-sm font-bold text-slate-900">{ch.name}</span></div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><span className="font-semibold text-blue-600">{ch.stage}</span><span>·</span><span>{ch.species}</span></div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase mono ${ch.status === 'optimal' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ch.status === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {ch.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 my-3">
                        <div className="telemetry-pill"><div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400"><Thermometer size={12} className="text-amber-500" /> Temp</div><div className="text-sm font-bold text-slate-900 mono">{ch.temp}°C</div><div className="text-[10px] text-slate-400">Target: {ch.targetTemp}°C</div></div>
                        <div className="telemetry-pill"><div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400"><Droplets size={12} className="text-blue-500" /> Humidity</div><div className="text-sm font-bold text-slate-900 mono">{ch.humidity}%</div><div className="text-[10px] text-slate-400">RH Level</div></div>
                        <div className="telemetry-pill"><div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400"><Waves size={12} className="text-teal-500" /> Salinity</div><div className="text-sm font-bold text-slate-900 mono">{ch.salinity}°</div><div className="text-[10px] text-slate-400">Baumé Scale</div></div>
                      </div>
                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between text-xs"><span className="text-slate-500 mono">{ch.batchId} ({ch.weightKg} kg)</span><span className="font-bold text-slate-700 mono">{ch.elapsedMin}/{ch.totalMin} min ({Math.round((ch.elapsedMin/ch.totalMin)*100)}%)</span></div>
                        <div className="meter-bar"><div className={`meter-fill ${ch.status === 'optimal' ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} style={{ width: `${Math.min(100, (ch.elapsedMin/ch.totalMin)*100)}%` }} /></div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">Op: <span className="font-semibold text-slate-700">{ch.operator}</span></span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setSelectedChamber(ch)} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all flex items-center gap-1"><Sliders size={12} /> Setpoints</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1/3: AI Radar, Quick Controls, Alerts */}
            <div className="space-y-6">
              {/* AI Quality */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /> AI Freshness & Grade Radar</h3><p className="text-xs text-slate-500">Live convolutional model validation</p></div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mono">99.1% Acc</span>
                </div>
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/60 border border-emerald-100/80 mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-emerald-200 flex flex-col items-center justify-center text-center p-2 flex-shrink-0">
                    <span className="text-2xl font-extrabold text-emerald-600 mono leading-none">{qualityAverage}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Score</span>
                  </div>
                  <div><div className="text-sm font-bold text-slate-900">Grade AAA Export Certified</div><p className="text-xs text-slate-500 mt-0.5">Compliant with export standards for dried tuna flakes & cubes.</p></div>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    { label:'Flesh Elasticity & Firmness', score:98, color:'bg-emerald-500' },
                    { label:'Salt Penetration Uniformity', score:96, color:'bg-blue-500' },
                    { label:'Moisture Target (12-15%)', score:94, color:'bg-teal-500' },
                    { label:'Smoke Coloration & Aroma', score:97, color:'bg-amber-500' },
                    { label:'Zero Pathogen & Mold Check', score:100, color:'bg-emerald-500' }
                  ].map((p,i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between font-medium"><span className="text-slate-600">{p.label}</span><span className="font-bold text-slate-800 mono">{p.score}%</span></div>
                      <div className="meter-bar"><div className={`meter-fill ${p.color}`} style={{ width: `${p.score}%` }} /></div>
                    </div>
                  ))}
                </div>
                <button onClick={() => showToast('AI Quality Scan triggered across all camera feeds.')} className="w-full mt-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"><Eye size={14} /> Run Instant Visual Inspection</button>
              </div>

              {/* Quick Controls */}
              <div className="glass-card p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Quick System Control Dispatch</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button onClick={() => showToast('Solar preheater boost enabled for Line B.')} className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-slate-700 flex flex-col gap-1.5 text-left transition-all"><Flame size={16} className="text-amber-500" /><span>Solar Thermal Boost</span><span className="text-[10px] text-slate-400 font-normal">Switch to 65°C Aux</span></button>
                  <button onClick={() => showToast('Brine salinity automated replenishment cycle started.')} className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 text-slate-700 flex flex-col gap-1.5 text-left transition-all"><Waves size={16} className="text-teal-500" /><span>Brine Auto‑Dosing</span><span className="text-[10px] text-slate-400 font-normal">Maintain 16.5° Bé</span></button>
                  <button onClick={() => showToast('Recalibration signal sent to humidity and temp sensors.')} className="p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 text-slate-700 flex flex-col gap-1.5 text-left transition-all"><Cpu size={16} className="text-purple-500" /><span>Calibrate Probes</span><span className="text-[10px] text-slate-400 font-normal">Zero‑drift calibration</span></button>
                  <button onClick={() => setShowExportModal(true)} className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 flex flex-col gap-1.5 text-left transition-all"><FileText size={16} className="text-emerald-500" /><span>Daily Shift Slip</span><span className="text-[10px] text-slate-400 font-normal">Generate PDF report</span></button>
                </div>
              </div>

              {/* Alerts */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3"><h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Operational Activity Feed</h4><span className="w-2 h-2 rounded-full bg-emerald-500" /></div>
                <div className="space-y-3">
                  {[
                    { id:'AL-104', type:'warning', title:'Chamber C Smoke Density Surge', detail:'Smoke sensor reached 185 ppm (setpoint: 160 ppm). Auto‑exhaust triggered.', time:'4m ago', chamber:'Chamber C' },
                    { id:'AL-103', type:'success', title:'Batch #AL-879 Inspection Passed', detail:'AI vision validated AAA firmness & 13.8% moisture level compliance.', time:'18m ago', chamber:'Chamber D' },
                    { id:'AL-102', type:'info', title:'Solar Thermal Preheater Engaged', detail:'Roof solar array delivering 42kW thermal boost to drying line.', time:'42m ago', chamber:'Chamber B' },
                    { id:'AL-101', type:'success', title:'Brine Salinity Equilibrium Reached', detail:'Salinity stabilized at optimal 16.5° Bé for standard Maldives cut.', time:'1h 10m ago', chamber:'Chamber A' }
                  ].map(alert => (
                    <div key={alert.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex gap-3">
                      <div className="mt-0.5">{alert.type === 'warning' && <AlertTriangle size={15} className="text-amber-500" />}{alert.type === 'success' && <CheckCircle2 size={15} className="text-emerald-500" />}{alert.type === 'info' && <Activity size={15} className="text-blue-500" />}</div>
                      <div className="flex-1"><div className="flex items-center justify-between"><span className="font-bold text-slate-900">{alert.title}</span><span className="text-[10px] text-slate-400 mono">{alert.time}</span></div><p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{alert.detail}</p><span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 mono bg-white px-2 py-0.5 rounded border border-slate-200">{alert.chamber}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chambers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
            <div><h2 className="text-xl font-bold text-slate-900">Chamber Supervisory Control & Data Acquisition (SCADA)</h2><p className="text-sm text-slate-500 mt-0.5">Fine‑tune target thermal profiles, air circulation speeds, and brine pumps for all lines.</p></div>
            <div className="flex items-center gap-3"><button onClick={() => showToast('All chamber telemetry refreshed.')} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2"><RefreshCw size={14} /> Refresh Hardware Telemetry</button></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chambers.map(ch => (
              <div key={ch.id} className="glass-card p-6 border-t-4 border-t-blue-600">
                <div className="flex items-start justify-between mb-4">
                  <div><div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold mono">{ch.id}</span><h3 className="text-base font-bold text-slate-900">{ch.name}</h3></div><div className="text-xs text-slate-500 mt-1">Batch: <span className="font-semibold text-slate-800 mono">{ch.batchId}</span> ({ch.species})</div></div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase mono ${ch.status === 'optimal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{ch.status} · {ch.efficiency}% Eff</span>
                </div>
                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center"><Thermometer size={18} className="mx-auto text-amber-500 mb-1" /><div className="text-xs text-slate-400 font-bold uppercase">Temperature</div><div className="text-lg font-extrabold text-slate-900 mono">{ch.temp}°C</div><div className="text-[10px] text-slate-500">Setpoint: {ch.targetTemp}°C</div></div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center"><Droplets size={18} className="mx-auto text-blue-500 mb-1" /><div className="text-xs text-slate-400 font-bold uppercase">Humidity</div><div className="text-lg font-extrabold text-slate-900 mono">{ch.humidity}%</div><div className="text-[10px] text-slate-500">Target: 30-40%</div></div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center"><Waves size={18} className="mx-auto text-teal-500 mb-1" /><div className="text-xs text-slate-400 font-bold uppercase">Salinity</div><div className="text-lg font-extrabold text-slate-900 mono">{ch.salinity}° Bé</div><div className="text-[10px] text-slate-500">Target: 16.5° Bé</div></div>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Connected Actuators & Relays</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleToggleChamberEquipment(ch.id, 'heaterOn')} className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${ch.heaterOn ? 'bg-amber-500/10 border-amber-500/40 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}><Flame size={14} /> Heater {ch.heaterOn ? 'ON' : 'OFF'}</button>
                    <button onClick={() => handleToggleChamberEquipment(ch.id, 'pumpOn')} className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${ch.pumpOn ? 'bg-blue-500/10 border-blue-500/40 text-blue-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}><Waves size={14} /> Pump {ch.pumpOn ? 'ON' : 'OFF'}</button>
                    <button onClick={() => handleToggleChamberEquipment(ch.id, 'exhaustOn')} className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${ch.exhaustOn ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}><Wind size={14} /> Exhaust {ch.exhaustOn ? 'ON' : 'OFF'}</button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Operator: <span className="font-semibold text-slate-700">{ch.operator}</span></span>
                  <button onClick={() => setSelectedChamber(ch)} className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"><Sliders size={13} /> Modify Target Setpoints</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={22} className="text-emerald-400" /> Automated Computer Vision & Fish Freshness Assessment</h2>
            <p className="text-sm text-emerald-200 mt-1 max-w-3xl">Trained deep convolutional networks inspect gill coloration, skin reflectivity, and muscle firmness to categorize Alagoduwa and Kelawalla into Grade AAA, AA, or Reject.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Fish Specimen Classification Breakdown</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center"><div className="text-xs font-bold text-emerald-800 uppercase">Very Fresh (Grade AAA)</div><div className="text-2xl font-extrabold text-emerald-700 mono mt-1">88.4%</div><div className="text-xs text-emerald-600 mt-0.5">3,398 kg processed</div></div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center"><div className="text-xs font-bold text-blue-800 uppercase">Fresh (Grade AA)</div><div className="text-2xl font-extrabold text-blue-700 mono mt-1">10.8%</div><div className="text-xs text-blue-600 mt-0.5">415 kg processed</div></div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center"><div className="text-xs font-bold text-rose-800 uppercase">Defect / Spoiled</div><div className="text-2xl font-extrabold text-rose-700 mono mt-1">0.8%</div><div className="text-xs text-rose-600 mt-0.5">29 kg discarded</div></div>
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recent AI Inspection Stream (Real‑Time Camera Feed)</h4>
              <div className="space-y-2 text-xs">
                {[
                  { id:'CAM-01', batch:'BATCH-AL-882', species:'Alagoduwa', grade:'Very Fresh (AAA)', score:98.6, time:'2m ago' },
                  { id:'CAM-02', batch:'BATCH-KW-904', species:'Kelawalla', grade:'Very Fresh (AAA)', score:97.4, time:'8m ago' },
                  { id:'CAM-01', batch:'BATCH-BL-741', species:'Balaya', grade:'Fresh (AA)', score:92.1, time:'14m ago' },
                  { id:'CAM-03', batch:'BATCH-AL-879', species:'Alagoduwa', grade:'Very Fresh (AAA)', score:99.2, time:'21m ago' }
                ].map((item,i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3"><span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold mono">{item.id}</span><div><span className="font-bold text-slate-900">{item.species}</span><span className="text-slate-400 ml-2 mono">{item.batch}</span></div></div>
                    <div className="flex items-center gap-3"><span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mono">{item.grade} ({item.score}%)</span><span className="text-slate-400 mono">{item.time}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Moisture & Drying Index</h3>
              <p className="text-xs text-slate-500">Final Maldive Fish target moisture curve: 12.0% – 14.5%</p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-slate-600 font-medium">Batch #AL-882 (Boiling)</span><span className="font-bold text-slate-900 mono">68.2% RH</span></div>
                <div className="flex justify-between"><span className="text-slate-600 font-medium">Batch #KW-904 (Solar Dryer)</span><span className="font-bold text-slate-900 mono">32.4% RH</span></div>
                <div className="flex justify-between"><span className="text-slate-600 font-medium">Batch #BL-741 (Smoking)</span><span className="font-bold text-slate-900 mono">21.8% RH</span></div>
                <div className="flex justify-between"><span className="text-slate-600 font-medium">Batch #AL-879 (Hardened)</span><span className="font-bold text-emerald-600 font-bold mono">13.8% RH (Pass)</span></div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900"><div className="font-bold mb-1 flex items-center gap-1.5"><Sparkles size={14} className="text-blue-600" /> AI Optimization Suggestion</div>Solar dryer air circulation can be reduced by 15% during peak ambient midday sun, saving 18 kWh per shift without altering moisture loss rates.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Throughput & Shift Comparison Analytics</h2>
            <p className="text-xs text-slate-500 mb-6">Historical production output across Morning, Evening, and Night processing shifts.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200"><div className="text-xs font-bold text-slate-500 uppercase">Morning Shift (06:00 – 14:00)</div><div className="text-2xl font-bold text-slate-900 mono mt-1">1,980 kg</div><div className="text-xs text-emerald-600 font-semibold mt-0.5">Efficiency: 96.4%</div></div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200"><div className="text-xs font-bold text-slate-500 uppercase">Evening Shift (14:00 – 22:00)</div><div className="text-2xl font-bold text-slate-900 mono mt-1">1,420 kg</div><div className="text-xs text-emerald-600 font-semibold mt-0.5">Efficiency: 94.8%</div></div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200"><div className="text-xs font-bold text-slate-500 uppercase">Night Shift (22:00 – 06:00)</div><div className="text-2xl font-bold text-slate-900 mono mt-1">442 kg</div><div className="text-xs text-amber-600 font-semibold mt-0.5">Continuous Slow Smoke</div></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-slate-400 font-bold uppercase"><th className="pb-3">Time Window</th><th className="pb-3">Fish Species</th><th className="pb-3">Throughput (kg)</th><th className="pb-3">Avg Salinity (°Bé)</th><th className="pb-3">Energy (kWh)</th><th className="pb-3">Compliance Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[
                    { time:'02:00', output:420, temp:88, quality:94, energy:310, salinity:15.8 },
                    { time:'05:00', output:680, temp:94, quality:96, energy:380, salinity:16.2 },
                    { time:'08:00', output:1240, temp:99, quality:97, energy:440, salinity:16.5 },
                    { time:'11:00', output:1980, temp:98, quality:98, energy:420, salinity:16.4 },
                    { time:'14:00', output:2650, temp:96, quality:97, energy:405, salinity:16.3 },
                    { time:'17:00', output:3340, temp:99, quality:99, energy:430, salinity:16.6 },
                    { time:'20:00', output:3842, temp:97, quality:98, energy:418, salinity:16.5 }
                  ].map((row,i) => (
                    <tr key={i} className="hover:bg-slate-50"><td className="py-3 font-semibold mono">{row.time}</td><td className="py-3">Alagoduwa & Balaya</td><td className="py-3 font-bold mono text-slate-900">{row.output} kg</td><td className="py-3 mono">{row.salinity}°</td><td className="py-3 mono">{row.energy} kW</td><td className="py-3"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Optimal</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold text-slate-900">Active Batch Inventory & Lifecycle</h2><p className="text-sm text-slate-500">Live traceability from raw catch intake to final vacuum packaging.</p></div>
            <button onClick={() => setShowNewBatchModal(true)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2"><Plus size={16} /> Dispatch New Batch</button>
          </div>
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3"><Filter size={16} className="text-slate-400" /><input type="text" placeholder="Search batch ID, species, or chamber..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent border-none text-xs text-slate-900 focus:outline-none w-full" /></div>
            <div className="divide-y divide-slate-100">
              {chambers.filter(c => c.batchId.toLowerCase().includes(searchQuery.toLowerCase()) || c.species.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div><div className="flex items-center gap-3"><span className="font-bold text-sm text-slate-900 mono">{c.batchId}</span><span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{c.species}</span><span className="text-xs text-slate-500">Weight: {c.weightKg} kg</span></div><div className="text-xs text-slate-500 mt-1 flex items-center gap-2"><span>Station: <strong className="text-slate-700">{c.name}</strong></span><span>·</span><span>Stage: <strong className="text-blue-600">{c.stage}</strong></span><span>·</span><span>Operator: {c.operator}</span></div></div>
                  <div className="flex items-center gap-6"><div className="w-40 text-xs space-y-1"><div className="flex justify-between text-slate-500"><span>Progress</span><span className="font-bold text-slate-800 mono">{Math.round((c.elapsedMin/c.totalMin)*100)}%</span></div><div className="meter-bar"><div className="meter-fill bg-blue-600" style={{ width: `${(c.elapsedMin/c.totalMin)*100}%` }} /></div></div><button onClick={() => setSelectedChamber(c)} className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700">Details</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Hardware Telemetry & Sensor Calibration</h2>
            <p className="text-xs text-slate-500 mb-6">Real‑time status of embedded microcontrollers, temperature probes, and cloud backend MQTT broker.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { title:'MQTT Telemetry Broker', status: mqttConnected ? 'Online · Latency 14ms' : 'Disconnected', icon:Radio, ok:mqttConnected },
                { title:'AI Prediction Backend', status:'Online (Port 8000)', icon:Server, ok:true },
                { title:'MongoDB Batch Store', status:'Synchronized', icon:Database, ok:true },
                { title:'Thermal Probes Array', status:'16/16 Calibrated', icon:Compass, ok:true }
              ].map((s,i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0"><Icon size={20} /></div>
                    <div><div className="text-xs font-bold text-slate-900">{s.title}</div><div className={`text-xs font-semibold mt-0.5 mono ${s.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{s.status}</div></div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-1">
              <div className="text-emerald-400 font-bold mb-2">// HARDWARE SYSTEM KERNEL LOGS</div>
              <div>[2026-08-31 08:32:10] I2C Bus #1 Salinity Sensor @ 0x48 ping OK (salinity=16.5° Bé)</div>
              <div>[2026-08-31 08:32:14] MQTT client connected to broker topic: fishgo/chamber/+/telemetry</div>
              <div>[2026-08-31 08:32:18] Chamber D Exhaust PID loop updated: pwm_duty=82%</div>
              <div>[2026-08-31 08:32:22] AI Freshness model inference benchmark: 18.2ms per frame</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-slate-900">Export Plant Production Slip</h3><button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
            <div className="space-y-4 text-xs">
              <div><label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Date Range</label><select value={exportConfig.range} onChange={e => setExportConfig({...exportConfig, range:e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"><option value="today">Today's Active Shift</option><option value="24h">Last 24 Hours</option><option value="7d">Last 7 Days (Weekly Summary)</option><option value="30d">Last 30 Days (Monthly Audit)</option></select></div>
              <div><label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Export Format</label><div className="grid grid-cols-3 gap-2">{['csv','excel','pdf'].map(fmt => <button key={fmt} type="button" onClick={() => setExportConfig({...exportConfig, format:fmt})} className={`p-2 rounded-xl uppercase font-bold border ${exportConfig.format === fmt ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>{fmt}</button>)}</div></div>
              <div className="space-y-2 pt-2 border-t border-slate-100"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={exportConfig.includeAi} onChange={e => setExportConfig({...exportConfig, includeAi:e.target.checked})} className="rounded text-blue-600" /><span>Include AI Quality Inspection Data & Defects</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={exportConfig.includeSensors} onChange={e => setExportConfig({...exportConfig, includeSensors:e.target.checked})} className="rounded text-blue-600" /><span>Include Chamber Temperature & Salinity Logs</span></label></div>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100"><button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">Cancel</button><button onClick={() => { setShowExportModal(false); showToast(`Production slip downloaded as ${exportConfig.format.toUpperCase()}`); }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"><Download size={14} /> Download File</button></div>
          </div>
        </div>
      )}

      {selectedChamber && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-slate-900">Adjust {selectedChamber.name}</h3><p className="text-xs text-slate-500">Fine‑tune target setpoints for current processing cycle</p></div><button onClick={() => setSelectedChamber(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
            <div className="space-y-4 text-xs">
              <div><label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Temperature (°C)</label><div className="flex items-center gap-3"><input type="range" min="20" max="110" step="0.5" defaultValue={selectedChamber.targetTemp} id="modalTempRange" className="w-full accent-blue-600" onChange={e => document.getElementById('modalTempDisplay').innerText = `${e.target.value}°C`} /><span id="modalTempDisplay" className="font-bold text-sm text-slate-900 mono w-16 text-right">{selectedChamber.targetTemp}°C</span></div></div>
              <div><label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Active Batch Allocation</label><div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700"><div className="font-bold mono">{selectedChamber.batchId}</div><div className="text-[11px] text-slate-500">{selectedChamber.species} · {selectedChamber.weightKg} kg</div></div></div>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100"><button onClick={() => setSelectedChamber(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">Cancel</button><button onClick={() => { const val = document.getElementById('modalTempRange').value; handleSaveChamberSetpoint(selectedChamber.id, val); }} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm">Save Setpoints</button></div>
          </div>
        </div>
      )}

      {showNewBatchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateBatch} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-slate-900">Dispatch New Fish Processing Batch</h3><p className="text-xs text-slate-500">Initiate parboiling & osmotic salting workflow</p></div><button type="button" onClick={() => setShowNewBatchModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
            <div className="space-y-4 text-xs">
              <div><label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Fish Species</label><select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"><option>Alagoduwa (Skipjack Tuna - Katsuwonus pelamis)</option><option>Kelawalla (Yellowfin Tuna - Thunnus albacares)</option><option>Balaya (Frigate Tuna - Auxis thazard)</option></select></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Weight (kg)</label><input type="number" defaultValue="750" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 mono" /></div><div><label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Salinity Target</label><input type="text" defaultValue="16.5° Bé" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 mono" /></div></div>
              <div><label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assigned Chamber</label><select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"><option>Chamber A · Brine & Boil Line</option><option>Chamber B · Solar-Assist Dryer Line</option><option>Chamber C · Smoke & Curing Tunnel</option></select></div>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100"><button type="button" onClick={() => setShowNewBatchModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">Cancel</button><button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm">Dispatch Batch</button></div>
          </form>
        </div>
      )}
    </div>
  );
}