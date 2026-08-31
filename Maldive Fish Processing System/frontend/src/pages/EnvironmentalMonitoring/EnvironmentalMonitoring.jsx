import React, { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { 
  Scale, 
  Droplets, 
  Timer, 
  CheckCircle, 
  Play, 
  RotateCcw, 
  AlertCircle, 
  FileDown, 
  Fish, 
  Thermometer, 
  Eye, 
  Wifi, 
  WifiOff,
  Flame,
  Fan,
  Activity
} from 'lucide-react';

// ── Master Batch Registry ───────────────────────────────────────────
const INITIAL_BATCHES = [
  { id: 'B-001', name: 'Dried Anchovy', initialWeight: 1000, currentWeight: 1000, temp: 0, quality: 'Grade A', initialMoisture: 78.67, targetMoisture: 20, moistureTrend: [78.67] },
  { id: 'B-002', name: 'Salted Mackerel', initialWeight: 1000, currentWeight: 1000, temp: 0, quality: 'Grade A', initialMoisture: 78.67, targetMoisture: 20, moistureTrend: [78.67] },
  { id: 'B-003', name: 'Dried Sardine', initialWeight: 1200, currentWeight: 1200, temp: 0, quality: 'Grade B', initialMoisture: 75.00, targetMoisture: 20, moistureTrend: [75.00] },
  { id: 'B-004', name: 'Dried Tuna', initialWeight: 2000, currentWeight: 2000, temp: 0, quality: 'Grade A', initialMoisture: 76.50, targetMoisture: 20, moistureTrend: [76.50] },
  { id: 'B-005', name: 'Dried Prawns', initialWeight: 800, currentWeight: 800, temp: 0, quality: 'Grade A', initialMoisture: 79.20, targetMoisture: 20, moistureTrend: [79.20] },
  { id: 'B-006', name: 'Dried Squid', initialWeight: 1500, currentWeight: 1500, temp: 0, quality: 'Grade B', initialMoisture: 77.00, targetMoisture: 20, moistureTrend: [77.00] },
];

// ── Helpers ────────────────────────────────────────────────────────
function calculateMoisture(initialWeight, currentWeight, initialMoisture) {
  if (!currentWeight || currentWeight <= 0) return 0;
  const dryMatter = initialWeight * (1 - initialMoisture / 100);
  const mc = ((currentWeight - dryMatter) / currentWeight) * 100;
  return Math.max(0, Math.min(100, mc));
}

function calculateProgress(initialMoisture, currentMoisture, targetMoisture) {
  const prg = ((initialMoisture - currentMoisture) / (initialMoisture - targetMoisture)) * 100;
  return Math.min(100, Math.max(0, prg));
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) {
    return <div className="h-[28px] text-[10px] text-slate-400 flex items-center">Live telemetry sync...</div>;
  }
  const w = 110, h = 28, pad = 3;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const map = {
    drying:   { label: 'DRYING',   bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-500' },
    complete: { label: 'COMPLETE', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    pending:  { label: 'PENDING',  bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-200',  dot: 'bg-slate-400'   },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'drying' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function DryFishMonitor() {
  const TARGET_MOISTURE = 20.0;
  const INITIAL_REF_MOISTURE = 78.67;
  const INITIAL_REF_WEIGHT = 1000.0;

  const mqttClientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState('all');

  // Direct Hardware Load Cell Readings (No tray linkages)
  const [cell1, setCell1] = useState({ weight: 0.0, active: false });
  const [cell2, setCell2] = useState({ weight: 0.0, active: false });

  // Hardware Status Flags from ESP32
  const [heaterSSR, setHeaterSSR] = useState(false);
  const [fanStatus, setFanStatus] = useState(false);

  // Environmental Telemetry
  const [chamberTemp, setChamberTemp] = useState(0.0);
  const [thermalMatrix, setThermalMatrix] = useState(() => Array(64).fill(28.5));

  // Dynamic Batch Pool
  const [batches, setBatches] = useState(INITIAL_BATCHES);

  // ── MQTT Client Connection ──
  useEffect(() => {
    const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
      clientId: `AquaSense_App_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 2500,
    });

    mqttClientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);
      client.subscribe('aquasense/fish/telemetry');
    });

    client.on('error', () => setIsConnected(false));
    client.on('close', () => setIsConnected(false));

    client.on('message', (topic, message) => {
      if (topic === 'aquasense/fish/telemetry') {
        try {
          const telemetry = JSON.parse(message.toString());

          // Environmental readings & Hardware Actuator States
          if (telemetry.chamber_temp !== undefined) setChamberTemp(telemetry.chamber_temp);
          if (telemetry.thermal_grid && Array.isArray(telemetry.thermal_grid)) setThermalMatrix(telemetry.thermal_grid);
          if (telemetry.heater_ssr !== undefined) setHeaterSSR(telemetry.heater_ssr);
          if (telemetry.fan_status !== undefined) setFanStatus(telemetry.fan_status);

          // Direct sensor weight mapping
          if (telemetry.weight1 !== undefined) {
            setCell1(prev => ({ ...prev, weight: telemetry.weight1 }));
          }
          if (telemetry.weight2 !== undefined) {
            setCell2(prev => ({ ...prev, weight: telemetry.weight2 }));
          }

          // Live dynamic update for batch registry table
          setBatches(prev => prev.map((b, idx) => {
            let currentLiveWeight = b.currentWeight;
            let isDrying = false;

            if (idx === 0 && telemetry.weight1 !== undefined) {
              currentLiveWeight = telemetry.weight1;
              isDrying = cell1.active;
            } else if (idx === 1 && telemetry.weight2 !== undefined) {
              currentLiveWeight = telemetry.weight2;
              isDrying = cell2.active;
            } else {
              return b;
            }

            const liveMC = calculateMoisture(b.initialWeight, currentLiveWeight, b.initialMoisture);
            let dynamicStatus = 'pending';
            if (liveMC <= b.targetMoisture && currentLiveWeight > 0 && liveMC > 0) {
              dynamicStatus = 'complete';
            } else if (isDrying && currentLiveWeight > 0) {
              dynamicStatus = 'drying';
            } else {
              dynamicStatus = 'pending';
            }

            const updatedTrend = [...b.moistureTrend, Number(liveMC.toFixed(1))].slice(-10);

            return {
              ...b,
              currentWeight: currentLiveWeight,
              status: dynamicStatus,
              temp: telemetry.chamber_temp || b.temp,
              moistureTrend: updatedTrend
            };
          }));

        } catch (err) {
          console.error("Telemetry Parse Error:", err);
        }
      }
    });

    return () => client.end();
  }, [cell1.active, cell2.active]);

  // Command to ESP32 (Controls Relay & Fan directly)
  const publishMqttControl = (c1, c2) => {
    if (mqttClientRef.current && isConnected) {
      mqttClientRef.current.publish('aquasense/fish/control', JSON.stringify({
        cell1_drying: c1,
        cell2_drying: c2
      }));
    }
  };

  const toggleCell1 = () => {
    const next = !cell1.active;
    setCell1(prev => ({ ...prev, active: next }));
    publishMqttControl(next, cell2.active);
  };

  const toggleCell2 = () => {
    const next = !cell2.active;
    setCell2(prev => ({ ...prev, active: next }));
    publishMqttControl(cell1.active, next);
  };

  // ── High-Precision Thermal Color Palette ──
  const getThermalStyle = (t) => {
    if (t >= 55) return { bg: '#dc2626', shadow: 'rgba(220, 38, 38, 0.4)', text: '#ffffff' };
    if (t >= 48) return { bg: '#ea580c', shadow: 'rgba(234, 88, 12, 0.4)', text: '#ffffff' };
    if (t >= 42) return { bg: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.35)', text: '#1e293b' };
    if (t >= 36) return { bg: '#eab308', shadow: 'rgba(234, 179, 8, 0.3)', text: '#1e293b' };
    if (t >= 30) return { bg: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.3)', text: '#ffffff' };
    if (t >= 25) return { bg: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.3)', text: '#ffffff' };
    return { bg: '#4f46e5', shadow: 'rgba(79, 70, 229, 0.3)', text: '#ffffff' };
  };

  // Thermal Stats
  const maxThermal = Math.max(...thermalMatrix, 0);
  const minThermal = Math.min(...thermalMatrix, 100);
  const avgThermal = thermalMatrix.reduce((a, b) => a + b, 0) / (thermalMatrix.length || 1);

  const moistureBarColor = (mc) => mc <= 15 ? '#10b981' : mc <= 25 ? '#f59e0b' : '#ef4444';

  // Filters
  const dryingList = batches.filter(b => b.status === 'drying');
  const completeList = batches.filter(b => b.status === 'complete');
  const pendingList = batches.filter(b => b.status === 'pending');

  const filteredBatches = 
    filter === 'drying' ? dryingList :
    filter === 'complete' ? completeList :
    filter === 'pending' ? pendingList : batches;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 space-y-6">

      {/* ── Top Header ── */}
      <header className="bg-white border border-slate-200/80 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Fish size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">AquaSense Industrial Monitor</h1>
            <p className="text-xs text-slate-500 font-medium">Dual Load Cell & Industrial Thermal Matrix Telemetry</p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            heaterSSR ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            <Flame size={13} />
            {heaterSSR ? 'HEATER: ON' : 'HEATER: OFF'}
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            fanStatus ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}>
            <Fan size={13} className={fanStatus ? 'animate-spin' : ''} />
            {fanStatus ? 'FAN: ACTIVE' : 'FAN: OFF'}
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
            isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isConnected ? 'MQTT Online' : 'MQTT Offline'}
          </div>

          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all">
            <FileDown size={14} /> Export Report
          </button>
        </div>
      </header>

      {/* ── Side-by-Side Dual Load Cell Hardware Processing Panels ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[
          { cellNum: 1, cellData: cell1, toggle: toggleCell1 },
          { cellNum: 2, cellData: cell2, toggle: toggleCell2 }
        ].map(({ cellNum, cellData, toggle }) => {
          const currentWeight = cellData.weight;
          const mc = calculateMoisture(INITIAL_REF_WEIGHT, currentWeight, INITIAL_REF_MOISTURE);
          const prg = calculateProgress(INITIAL_REF_MOISTURE, mc, TARGET_MOISTURE);
          const dryMatter = (INITIAL_REF_WEIGHT * (1 - INITIAL_REF_MOISTURE / 100)).toFixed(1);

          return (
            <div key={cellNum} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cellData.active ? 'bg-blue-600 animate-ping' : 'bg-slate-300'}`} />
                    <h2 className="text-blue-600 font-black text-sm tracking-wider">LOAD CELL {cellNum}</h2>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                    Target: {TARGET_MOISTURE}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Real-time Moisture */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-1 relative z-10">Moisture Content</p>
                    <h3 className={`text-4xl font-black relative z-10 ${mc <= TARGET_MOISTURE && currentWeight > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {mc.toFixed(1)}<span className="text-sm text-slate-400 font-normal ml-0.5">%</span>
                    </h3>
                    <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1 relative z-10 font-medium">
                      <Droplets size={11} className="text-blue-500" /> Wet Basis (MCwb)
                    </p>
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-blue-100/60 transition-all duration-300" 
                      style={{ height: `${Math.min(100, mc)}%` }} 
                    />
                  </div>

                  {/* Live Scale Weight from HX711 */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 flex flex-col justify-center items-center">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Live Scale Reading</p>
                    <h3 className="text-3xl font-black text-slate-900">
                      {currentWeight.toFixed(1)}<span className="text-xs text-slate-400 font-normal ml-0.5">g</span>
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-medium">
                      <Scale size={14} /> Ref Initial: {INITIAL_REF_WEIGHT}g
                    </div>
                  </div>

                  {/* Process Progress */}
                  <div className={`rounded-2xl border p-4 flex flex-col justify-center ${mc <= TARGET_MOISTURE && currentWeight > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200/70'}`}>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Process Progress</p>
                    <h3 className={`text-3xl font-black ${mc <= TARGET_MOISTURE && currentWeight > 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {prg.toFixed(0)}%
                    </h3>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${prg}%` }} />
                    </div>
                    <div className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${mc <= TARGET_MOISTURE && currentWeight > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {mc <= TARGET_MOISTURE && currentWeight > 0 ? <><CheckCircle size={13} /> SAFE TO STORE</> : <><Timer size={13} className={cellData.active ? 'animate-spin' : ''} /> {cellData.active ? 'DRYING ACTIVE' : 'STANDBY'}</>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <AlertCircle size={14} className="text-blue-600 shrink-0" />
                  <span>Dry Solid Mass: <strong className="text-slate-700">{dryMatter}g</strong></span>
                </div>
                <button
                  onClick={toggle}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    cellData.active
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {cellData.active ? <RotateCcw size={14} /> : <Play size={14} />}
                  {cellData.active ? 'Stop Drying Cycle' : 'Start Drying Cycle'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DS18B20 Temp Probe & Beautiful AMG8833 Thermal Array Display ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* DS18B20 Chamber Probe */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-500 border border-orange-100">
                <Thermometer size={18} />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">DS18B20 Chamber Temp</h3>
            </div>
            <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-600 px-2.5 py-0.5 rounded-full font-bold">1-Wire Digital</span>
          </div>
          <div className="my-4">
            <div className="text-5xl font-black text-slate-900">{chamberTemp.toFixed(1)}°C</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Internal air circulation temperature</p>
          </div>
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex justify-between">
            <span>Target Range: 45.0°C – 55.0°C</span>
            <span className="text-emerald-600 font-bold">Live Synced</span>
          </div>
        </div>

        {/* ── Beautiful Redesigned AMG8833 GridEYE Thermal Array ── */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Thermal Header & Telemetry Metrics */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4 z-10">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                  <Eye size={16} />
                </div>
                <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-2">
                  AMG8833 GridEYE Thermal Camera
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">8×8 Infrared Focal Plane Array · Real-time Hotspot Tracking</p>
            </div>

            {/* Live Stats Pill Badges */}
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60">
              <div className="px-2.5 py-1 text-center border-r border-slate-700/60">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Min</span>
                <span className="text-xs font-black text-cyan-400">{minThermal.toFixed(1)}°C</span>
              </div>
              <div className="px-2.5 py-1 text-center border-r border-slate-700/60">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Avg</span>
                <span className="text-xs font-black text-amber-400">{avgThermal.toFixed(1)}°C</span>
              </div>
              <div className="px-2.5 py-1 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Max</span>
                <span className="text-xs font-black text-rose-400">{maxThermal.toFixed(1)}°C</span>
              </div>
            </div>
          </div>

          {/* Thermal Heatmap Matrix & Palette Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 z-10 my-2">
            
            {/* 8x8 Thermal Pixels Matrix */}
            <div className="p-3 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl">
              <div className="grid grid-cols-8 gap-1.5">
                {thermalMatrix.map((pixelTemp, idx) => {
                  const style = getThermalStyle(pixelTemp);
                  return (
                    <div
                      key={idx}
                      title={`Pixel ${idx + 1}: ${Number(pixelTemp).toFixed(1)}°C`}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all duration-300 flex items-center justify-center text-[8px] font-black cursor-pointer hover:scale-125 hover:z-20"
                      style={{ 
                        backgroundColor: style.bg,
                        color: style.text,
                        boxShadow: `0 0 10px ${style.shadow}`
                      }}
                    >
                      {Math.round(pixelTemp)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thermal Palette Legend */}
            <div className="flex flex-col justify-center space-y-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                <Activity size={14} className="text-indigo-400" />
                Thermal Calibration Spectrum
              </div>
              
              {/* Visual Gradient Bar */}
              <div className="w-full sm:w-48 h-3 rounded-full bg-gradient-to-r from-indigo-600 via-cyan-400 via-amber-400 via-orange-500 to-rose-600 shadow-inner" />
              
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>&lt; 25°C (Cool)</span>
                <span>35°C</span>
                <span>&gt; 50°C (Hotspot)</span>
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                Hotspot detection algorithm active for uneven surface moisture evaporation.
              </div>
            </div>

          </div>

          <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-3 flex justify-between items-center z-10 mt-2">
            <span>Sensor: Panasonic AMG8833 (I2C 0x69)</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 64 Frame Array OK
            </span>
          </div>

        </div>
      </div>

      {/* ── Real-time Interactive Batch Registry Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Category Navigation Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All Batches', count: batches.length },
              { key: 'drying', label: 'Drying', count: dryingList.length },
              { key: 'complete', label: 'Complete', count: completeList.length },
              { key: 'pending', label: 'Pending', count: pendingList.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === tab.key 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  filter === tab.key ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-semibold">Real-time Telemetry Feed ({filteredBatches.length} items)</span>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-400 text-xs font-bold">
              No batches currently found under the "{filter.toUpperCase()}" category.
            </div>
          ) : (
            filteredBatches.map(batch => {
              const mc = calculateMoisture(batch.initialWeight, batch.currentWeight, batch.initialMoisture);
              const barColor = moistureBarColor(mc);
              const sparkColor = batch.status === 'complete' ? '#10b981' : batch.status === 'drying' ? '#f59e0b' : '#94a3b8';

              return (
                <div key={batch.id} className="border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{batch.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Batch {batch.id}
                        </p>
                      </div>
                      <StatusBadge status={batch.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-xl text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Weight</p>
                        <p className="text-xs font-bold text-slate-800">{(batch.currentWeight / 1000).toFixed(2)} kg</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Temp</p>
                        <p className="text-xs font-bold text-slate-800">
                          {batch.temp > 0 ? `${batch.temp}°C` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold">Quality</p>
                        <p className={`text-xs font-bold ${batch.quality === 'Grade A' ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {batch.quality}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                        <span>Moisture Level</span>
                        <span className="text-slate-700 font-bold">{mc.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${(mc / 80) * 100}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Moisture Curve</span>
                    <Sparkline data={batch.moistureTrend} color={sparkColor} />
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}