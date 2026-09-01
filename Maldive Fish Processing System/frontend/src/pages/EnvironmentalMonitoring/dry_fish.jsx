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
  Activity,
  Square
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
    drying: { label: 'DRYING', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-500' },
    complete: { label: 'COMPLETE', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    pending: { label: 'PENDING', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
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

  // ── Cell States with integrated moisture simulation ──
  const [cell1, setCell1] = useState({
    weight: 0.0,
    active: false,
    moisture: 0.0, // displayed moisture
  });
  const [cell2, setCell2] = useState({
    weight: 0.0,
    active: false,
    moisture: 0.0,
  });

  // Refs for interval and active state
  const intervalRef1 = useRef(null);
  const intervalRef2 = useRef(null);
  const cell1ActiveRef = useRef(false);
  const cell2ActiveRef = useRef(false);

  // Hardware Status Flags from ESP32
  const [heaterSSR, setHeaterSSR] = useState(false);
  const [fanStatus, setFanStatus] = useState(false);

  // Environmental Telemetry
  const [chamberTemp, setChamberTemp] = useState(0.0);
  const [thermalMatrix, setThermalMatrix] = useState(() => Array(64).fill(28.5));

  // Dynamic Batch Pool
  const [batches, setBatches] = useState(INITIAL_BATCHES);

  // ── Simulation effect for Cell 1 ──
  useEffect(() => {
    if (cell1.active && cell1.moisture > TARGET_MOISTURE) {
      if (intervalRef1.current) clearInterval(intervalRef1.current);
      intervalRef1.current = setInterval(() => {
        setCell1(prev => {
          const newMoisture = Math.max(TARGET_MOISTURE, prev.moisture - 0.5);
          const dryMatter = INITIAL_REF_WEIGHT * (1 - INITIAL_REF_MOISTURE / 100);
          const newWeight = dryMatter / (1 - newMoisture / 100);

          // Update batch table (index 0)
          setBatches(prevBatches => prevBatches.map((b, idx) => {
            if (idx === 0) {
              const trend = [...b.moistureTrend, Number(newMoisture.toFixed(1))].slice(-10);
              return { ...b, currentWeight: newWeight, moistureTrend: trend };
            }
            return b;
          }));

          return { ...prev, moisture: newMoisture, weight: newWeight };
        });
      }, 300);
    } else {
      if (intervalRef1.current) {
        clearInterval(intervalRef1.current);
        intervalRef1.current = null;
      }
    }
    return () => {
      if (intervalRef1.current) clearInterval(intervalRef1.current);
    };
  }, [cell1.active, cell1.moisture, TARGET_MOISTURE]);

  // ── Simulation effect for Cell 2 ──
  useEffect(() => {
    if (cell2.active && cell2.moisture > TARGET_MOISTURE) {
      if (intervalRef2.current) clearInterval(intervalRef2.current);
      intervalRef2.current = setInterval(() => {
        setCell2(prev => {
          const newMoisture = Math.max(TARGET_MOISTURE, prev.moisture - 0.5);
          const dryMatter = INITIAL_REF_WEIGHT * (1 - INITIAL_REF_MOISTURE / 100);
          const newWeight = dryMatter / (1 - newMoisture / 100);

          setBatches(prevBatches => prevBatches.map((b, idx) => {
            if (idx === 1) {
              const trend = [...b.moistureTrend, Number(newMoisture.toFixed(1))].slice(-10);
              return { ...b, currentWeight: newWeight, moistureTrend: trend };
            }
            return b;
          }));

          return { ...prev, moisture: newMoisture, weight: newWeight };
        });
      }, 300);
    } else {
      if (intervalRef2.current) {
        clearInterval(intervalRef2.current);
        intervalRef2.current = null;
      }
    }
    return () => {
      if (intervalRef2.current) clearInterval(intervalRef2.current);
    };
  }, [cell2.active, cell2.moisture, TARGET_MOISTURE]);

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

          if (telemetry.chamber_temp !== undefined) setChamberTemp(telemetry.chamber_temp);
          if (telemetry.thermal_grid && Array.isArray(telemetry.thermal_grid)) setThermalMatrix(telemetry.thermal_grid);
          if (telemetry.heater_ssr !== undefined) setHeaterSSR(telemetry.heater_ssr);
          if (telemetry.fan_status !== undefined) setFanStatus(telemetry.fan_status);

          // ── MQTT Override for Load Cells ──
          if (telemetry.weight1 !== undefined) {
            const realMoisture = calculateMoisture(INITIAL_REF_WEIGHT, telemetry.weight1, INITIAL_REF_MOISTURE);
            setCell1(prev => ({ ...prev, weight: telemetry.weight1, moisture: realMoisture }));
          }
          if (telemetry.weight2 !== undefined) {
            const realMoisture = calculateMoisture(INITIAL_REF_WEIGHT, telemetry.weight2, INITIAL_REF_MOISTURE);
            setCell2(prev => ({ ...prev, weight: telemetry.weight2, moisture: realMoisture }));
          }

          // ── Update Batch Registry Table ──
          setBatches(prev => prev.map((b, idx) => {
            let currentLiveWeight = b.currentWeight;
            let isDrying = false;

            if (idx === 0 && telemetry.weight1 !== undefined) {
              currentLiveWeight = telemetry.weight1;
              isDrying = cell1ActiveRef.current;
            } else if (idx === 1 && telemetry.weight2 !== undefined) {
              currentLiveWeight = telemetry.weight2;
              isDrying = cell2ActiveRef.current;
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
  }, []); // Empty dependency – connects once

  // Update refs when active changes
  useEffect(() => {
    cell1ActiveRef.current = cell1.active;
  }, [cell1.active]);

  useEffect(() => {
    cell2ActiveRef.current = cell2.active;
  }, [cell2.active]);

  // ── MQTT Control Publish ──
  const publishMqttControl = (c1, c2) => {
    if (mqttClientRef.current && isConnected) {
      mqttClientRef.current.publish('aquasense/fish/control', JSON.stringify({
        cell1_drying: c1,
        cell2_drying: c2
      }));
    }
  };

  // ── Toggle functions ──
  const toggleCell1 = () => {
    const next = !cell1.active;
    setCell1(prev => {
      // If starting drying, set initial weight and moisture
      const newWeight = next ? INITIAL_REF_WEIGHT : prev.weight;
      const newMoisture = next ? INITIAL_REF_MOISTURE : prev.moisture;
      return { ...prev, active: next, weight: newWeight, moisture: newMoisture };
    });
    publishMqttControl(next, cell2.active);
  };

  const toggleCell2 = () => {
    const next = !cell2.active;
    setCell2(prev => {
      const newWeight = next ? INITIAL_REF_WEIGHT : prev.weight;
      const newMoisture = next ? INITIAL_REF_MOISTURE : prev.moisture;
      return { ...prev, active: next, weight: newWeight, moisture: newMoisture };
    });
    publishMqttControl(cell1.active, next);
  };

  // ── Zero / Tare Scale functions ──
  const zeroCell1 = () => {
    if (intervalRef1.current) {
      clearInterval(intervalRef1.current);
      intervalRef1.current = null;
    }
    setCell1({
      weight: 0.0,
      active: false,
      moisture: 0.0,
    });
    setBatches(prev => prev.map((b, idx) => {
      if (idx === 0) {
        return { ...b, currentWeight: 0, status: 'pending', moistureTrend: [0] };
      }
      return b;
    }));
    if (mqttClientRef.current && isConnected) {
      mqttClientRef.current.publish('aquasense/fish/control', JSON.stringify({
        cell1_drying: false,
        tare_cell1: true,
        command: 'TARE_CELL1'
      }));
    }
  };

  const zeroCell2 = () => {
    if (intervalRef2.current) {
      clearInterval(intervalRef2.current);
      intervalRef2.current = null;
    }
    setCell2({
      weight: 0.0,
      active: false,
      moisture: 0.0,
    });
    setBatches(prev => prev.map((b, idx) => {
      if (idx === 1) {
        return { ...b, currentWeight: 0, status: 'pending', moistureTrend: [0] };
      }
      return b;
    }));
    if (mqttClientRef.current && isConnected) {
      mqttClientRef.current.publish('aquasense/fish/control', JSON.stringify({
        cell2_drying: false,
        tare_cell2: true,
        command: 'TARE_CELL2'
      }));
    }
  };

  // ── Thermal Color Palette ──
  const getThermalStyle = (t) => {
    if (t >= 55) return { bg: '#ef4444', shadow: 'rgba(239, 68, 68, 0.3)', text: '#ffffff' };
    if (t >= 48) return { bg: '#f97316', shadow: 'rgba(249, 115, 22, 0.3)', text: '#ffffff' };
    if (t >= 42) return { bg: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.25)', text: '#ffffff' };
    if (t >= 36) return { bg: '#eab308', shadow: 'rgba(234, 179, 8, 0.25)', text: '#1e293b' };
    if (t >= 30) return { bg: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.25)', text: '#ffffff' };
    if (t >= 25) return { bg: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.25)', text: '#ffffff' };
    return { bg: '#6366f1', shadow: 'rgba(99, 102, 241, 0.25)', text: '#ffffff' };
  };

  const maxThermal = Math.max(...thermalMatrix, 0);
  const minThermal = Math.min(...thermalMatrix, 100);
  const avgThermal = thermalMatrix.reduce((a, b) => a + b, 0) / (thermalMatrix.length || 1);

  const moistureBarColor = (mc) => mc > 40 ? '#ef4444' : mc > 20 ? '#f59e0b' : '#10b981';

  // Filters
  const dryingList = batches.filter(b => b.status === 'drying');
  const completeList = batches.filter(b => b.status === 'complete');
  const pendingList = batches.filter(b => b.status === 'pending');
  const filteredBatches =
    filter === 'drying' ? dryingList :
      filter === 'complete' ? completeList :
        filter === 'pending' ? pendingList : batches;

  // ── UI ──
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 space-y-6">

      {/* ── Header ── */}
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
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${heaterSSR ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
            <Flame size={13} /> {heaterSSR ? 'HEATER: ON' : 'HEATER: OFF'}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${fanStatus ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
            <Fan size={13} className={fanStatus ? 'animate-spin' : ''} /> {fanStatus ? 'FAN: ACTIVE' : 'FAN: OFF'}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />} {isConnected ? 'MQTT Online' : 'MQTT Offline'}
          </div>
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all">
            <FileDown size={14} /> Export Report
          </button>
        </div>
      </header>

      {/* ── Dual Load Cell Panels ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[
          { cellNum: 1, cellData: cell1, toggle: toggleCell1, zero: zeroCell1 },
          { cellNum: 2, cellData: cell2, toggle: toggleCell2, zero: zeroCell2 }
        ].map(({ cellNum, cellData, toggle, zero }) => {
          const mc = cellData.moisture;
          const prg = calculateProgress(INITIAL_REF_MOISTURE, mc, TARGET_MOISTURE);
          const dryMatter = (INITIAL_REF_WEIGHT * (1 - INITIAL_REF_MOISTURE / 100)).toFixed(1);
          const moistureReduced = Math.max(0, INITIAL_REF_MOISTURE - mc);
          const moistureRemaining = Math.max(0, mc - TARGET_MOISTURE);
          const isComplete = mc <= TARGET_MOISTURE && cellData.weight > 0;
          const isDryingActive = cellData.active && !isComplete;

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
                  {/* ── Moisture (RED if > 20%) ── */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-1 relative z-10">Moisture Content</p>
                    <h3 className={`text-4xl font-black relative z-10 ${isComplete ? 'text-emerald-600' : 'text-red-600'}`}>
                      {mc.toFixed(1)}<span className="text-sm text-slate-400 font-normal ml-0.5">%</span>
                    </h3>
                    <p className="text-[10px] font-semibold relative z-10 mt-0.5 flex items-center gap-1">
                      <span className="text-slate-400">Reduced:</span>
                      <span className={`${isComplete ? 'text-emerald-600' : 'text-red-500'}`}>
                        {moistureReduced.toFixed(1)}%
                      </span>
                    </p>
                    <div className="absolute bottom-0 left-0 w-full bg-blue-100/60 transition-all duration-300" style={{ height: `${Math.min(100, mc)}%` }} />
                  </div>

                  {/* ── Weight ── */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 flex flex-col justify-center items-center">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Live Scale Reading</p>
                    <h3 className="text-3xl font-black text-slate-900">
                      {cellData.weight.toFixed(1)}<span className="text-xs text-slate-400 font-normal ml-0.5">g</span>
                    </h3>
                    <div className="flex items-center justify-between w-full mt-2 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Scale size={13} /> Ref: {INITIAL_REF_WEIGHT}g</span>
                      <button
                        onClick={zero}
                        className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 text-[10px] flex items-center gap-1 transition-all"
                        title={`Zero / Tare Load Cell ${cellNum}`}
                      >
                        <RotateCcw size={10} /> Zero
                      </button>
                    </div>
                  </div>

                  {/* ── Progress & Remaining ── */}
                  <div className={`rounded-2xl border p-4 flex flex-col justify-center ${isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200/70'}`}>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Process Progress</p>
                    <h3 className={`text-3xl font-black ${isComplete ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {prg.toFixed(0)}%
                    </h3>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${prg}%` }} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium">
                      <span className="text-slate-400">Remaining to remove:</span>
                      <span className={`font-bold ${isComplete ? 'text-emerald-600' : 'text-red-500'}`}>
                        {moistureRemaining.toFixed(1)}%
                      </span>
                    </div>
                    <div className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${isComplete ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {isComplete ? <><CheckCircle size={13} /> SAFE TO STORE</> : <><Timer size={13} className={isDryingActive ? 'animate-spin' : ''} /> {isDryingActive ? 'DRYING ACTIVE' : 'STANDBY'}</>}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Action Button ── */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <AlertCircle size={14} className="text-blue-600 shrink-0" />
                  <span>Dry Solid Mass: <strong className="text-slate-700">{dryMatter}g</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={zero}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all shadow-sm"
                    title={`Zero / Tare Load Cell ${cellNum} weight`}
                  >
                    <RotateCcw size={14} /> Zero Weight
                  </button>
                  <button
                    onClick={toggle}
                    className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${cellData.active
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                      }`}
                  >
                    {cellData.active ? <Square size={14} /> : <Play size={14} />}
                    {cellData.active ? 'Stop Drying Cycle' : 'Start Drying Cycle'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Temperature & Thermal Camera ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 text-red-500 border border-red-100">
                  <Eye size={18} />
                </div>
                <h3 className="font-black text-sm tracking-wide text-slate-900 flex items-center gap-2">
                  AMG8833 GridEYE Thermal Camera
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">8×8 Infrared Surface Matrix · Real-time Hotspot Tracking</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <div className="px-3 py-1 text-center border-r border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Min</span>
                <span className="text-xs font-black text-cyan-600">{minThermal.toFixed(1)}°C</span>
              </div>
              <div className="px-3 py-1 text-center border-r border-slate-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Avg</span>
                <span className="text-xs font-black text-amber-600">{avgThermal.toFixed(1)}°C</span>
              </div>
              <div className="px-3 py-1 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Max</span>
                <span className="text-xs font-black text-rose-600">{maxThermal.toFixed(1)}°C</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
              <div className="grid grid-cols-8 gap-1.5">
                {thermalMatrix.map((pixelTemp, idx) => {
                  const style = getThermalStyle(pixelTemp);
                  return (
                    <div
                      key={idx}
                      title={`Pixel ${idx + 1}: ${Number(pixelTemp).toFixed(1)}°C`}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all duration-300 flex items-center justify-center text-[8px] font-black cursor-pointer hover:scale-125 hover:shadow-lg"
                      style={{ backgroundColor: style.bg, color: style.text, boxShadow: `0 2px 6px ${style.shadow}` }}
                    >
                      {Math.round(pixelTemp)}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                <Activity size={14} className="text-blue-600" /> Thermal Calibration Spectrum
              </div>
              <div className="w-full sm:w-48 h-3 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 via-amber-400 via-orange-500 to-rose-500 shadow-inner" />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>&lt; 25°C (Cool)</span> <span>35°C</span> <span>&gt; 50°C (Hotspot)</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">Hotspot detection algorithm active for uneven surface moisture evaporation.</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 flex justify-between items-center mt-2">
            <span>Sensor: Panasonic AMG8833 (I2C 0x69)</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 64 Frame Array OK</span>
          </div>
        </div>
      </div>

      {/* ── Batch Registry Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === tab.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === tab.key ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-semibold">Real-time Telemetry Feed ({filteredBatches.length} items)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full text-center py-10 text-slate-400 text-xs font-bold">No batches found.</div>
          ) : (
            filteredBatches.map(batch => {
              const mc = calculateMoisture(batch.initialWeight, batch.currentWeight, batch.initialMoisture);
              const barColor = moistureBarColor(mc);
              const sparkColor = batch.status === 'complete' ? '#10b981' : batch.status === 'drying' ? '#f59e0b' : '#94a3b8';
              const isComplete = mc <= batch.targetMoisture && batch.currentWeight > 0;

              return (
                <div key={batch.id} className="border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{batch.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Batch {batch.id}</p>
                      </div>
                      <StatusBadge status={batch.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-xl text-center">
                      <div><p className="text-[10px] text-slate-400 font-semibold">Weight</p><p className="text-xs font-bold text-slate-800">{(batch.currentWeight / 1000).toFixed(2)} kg</p></div>
                      <div><p className="text-[10px] text-slate-400 font-semibold">Temp</p><p className="text-xs font-bold text-slate-800">{batch.temp > 0 ? `${batch.temp}°C` : '—'}</p></div>
                      <div><p className="text-[10px] text-slate-400 font-semibold">Quality</p><p className={`text-xs font-bold ${batch.quality === 'Grade A' ? 'text-emerald-600' : 'text-orange-500'}`}>{batch.quality}</p></div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                        <span>Moisture Level</span>
                        <span className={`font-bold ${isComplete ? 'text-emerald-600' : 'text-red-500'}`}>{mc.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(mc / 80) * 100}%`, backgroundColor: barColor }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                        <span>Initial: {batch.initialMoisture}%</span>
                        <span>Reduced: {(batch.initialMoisture - mc).toFixed(1)}%</span>
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