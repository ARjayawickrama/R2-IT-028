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
  WifiOff
} from 'lucide-react';

// ── Master Batch Registry ───────────────────────────────────────────
const INITIAL_BATCHES = [
  { id: 'B-001', name: 'Dried Anchovy', initialWeight: 1000, currentWeight: 1000, temp: 0, quality: 'Grade A', initialMoisture: 78.67, targetMoisture: 20, assignedCell: 1, moistureTrend: [78.67] },
  { id: 'B-002', name: 'Salted Mackerel', initialWeight: 1000, currentWeight: 1000, temp: 0, quality: 'Grade A', initialMoisture: 78.67, targetMoisture: 20, assignedCell: 2, moistureTrend: [78.67] },
  { id: 'B-003', name: 'Dried Sardine', initialWeight: 1200, currentWeight: 1200, temp: 0, quality: 'Grade B', initialMoisture: 75.00, targetMoisture: 20, assignedCell: null, moistureTrend: [75.00] },
  { id: 'B-004', name: 'Dried Tuna', initialWeight: 2000, currentWeight: 2000, temp: 0, quality: 'Grade A', initialMoisture: 76.50, targetMoisture: 20, assignedCell: null, moistureTrend: [76.50] },
  { id: 'B-005', name: 'Dried Prawns', initialWeight: 800, currentWeight: 800, temp: 0, quality: 'Grade A', initialMoisture: 79.20, targetMoisture: 20, assignedCell: null, moistureTrend: [79.20] },
  { id: 'B-006', name: 'Dried Squid', initialWeight: 1500, currentWeight: 1500, temp: 0, quality: 'Grade B', initialMoisture: 77.00, targetMoisture: 20, assignedCell: null, moistureTrend: [77.00] },
];

// ── Calculation Helpers ─────────────────────────────────────────────
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
  if (!data || data.length < 2) return <div className="h-[26px] text-[10px] text-slate-300 flex items-center">Collecting data...</div>;
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

// ── Main Dashboard Component ────────────────────────────────────────
export default function DryFishMonitor() {
  const TARGET_MOISTURE = 20.0;
  const mqttClientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Filter State
  const [filter, setFilter] = useState('all');

  // Load Cells Linkage & Drying Controls
  const [cell1BatchId, setCell1BatchId] = useState('B-001');
  const [cell2BatchId, setCell2BatchId] = useState('B-002');
  const [cell1Active, setCell1Active] = useState(false);
  const [cell2Active, setCell2Active] = useState(false);

  // Environmental Sensor States
  const [chamberTemp, setChamberTemp] = useState(0.0);
  const [thermalMatrix, setThermalMatrix] = useState(() => Array(64).fill(25.0));

  // Dynamic Batch Pool
  const [batches, setBatches] = useState(INITIAL_BATCHES);

  // ── MQTT Client Setup ──
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

          // 1. Environmental Sensor Readings
          if (telemetry.chamber_temp !== undefined) setChamberTemp(telemetry.chamber_temp);
          if (telemetry.thermal_grid && Array.isArray(telemetry.thermal_grid)) setThermalMatrix(telemetry.thermal_grid);

          // 2. Real-time Batch Lifecycle Calculation from Sensor Data
          setBatches(prev => prev.map(b => {
            let liveWeight = b.currentWeight;
            let isDryingSlot = false;

            // Load Cell 1
            if (b.id === cell1BatchId && telemetry.weight1 !== undefined) {
              liveWeight = telemetry.weight1;
              isDryingSlot = cell1Active;
            }
            // Load Cell 2
            else if (b.id === cell2BatchId && telemetry.weight2 !== undefined) {
              liveWeight = telemetry.weight2;
              isDryingSlot = cell2Active;
            } else {
              return b;
            }

            // Real-time Moisture Calculation
            const liveMC = calculateMoisture(b.initialWeight, liveWeight, b.initialMoisture);

            // Dynamic Status Transition
            let dynamicStatus = 'pending';
            if (liveMC <= b.targetMoisture && liveWeight > 0 && liveMC > 0) {
              dynamicStatus = 'complete';
            } else if (isDryingSlot && liveWeight > 0) {
              dynamicStatus = 'drying';
            } else {
              dynamicStatus = 'pending';
            }

            const updatedTrend = [...b.moistureTrend, Number(liveMC.toFixed(1))].slice(-10);

            return {
              ...b,
              currentWeight: liveWeight,
              status: dynamicStatus,
              temp: telemetry.chamber_temp || b.temp,
              moistureTrend: updatedTrend
            };
          }));

        } catch (err) {
          console.error("Payload parse error:", err);
        }
      }
    });

    return () => client.end();
  }, [cell1BatchId, cell2BatchId, cell1Active, cell2Active]);

  // Command Publisher to ESP32
  const publishMqttControl = (c1, c2) => {
    if (mqttClientRef.current && isConnected) {
      mqttClientRef.current.publish('aquasense/fish/control', JSON.stringify({
        cell1_drying: c1,
        cell2_drying: c2
      }));
    }
  };

  const toggleCell1 = () => {
    const next = !cell1Active;
    setCell1Active(next);
    publishMqttControl(next, cell2Active);
  };

  const toggleCell2 = () => {
    const next = !cell2Active;
    setCell2Active(next);
    publishMqttControl(cell1Active, next);
  };

  const assignBatchToCell = (cellNum, batchId) => {
    if (cellNum === 1) setCell1BatchId(batchId);
    if (cellNum === 2) setCell2BatchId(batchId);

    setBatches(prev => prev.map(b => {
      if (b.id === batchId) return { ...b, assignedCell: cellNum };
      if (b.assignedCell === cellNum) return { ...b, assignedCell: null, status: 'pending' };
      return b;
    }));
  };

  const getHeatmapColor = (t) => {
    if (t >= 55) return '#ef4444';
    if (t >= 48) return '#f97316';
    if (t >= 42) return '#eab308';
    if (t >= 36) return '#3b82f6';
    return '#6366f1';
  };

  const moistureBarColor = (mc) => mc <= 15 ? '#10b981' : mc <= 25 ? '#f59e0b' : '#ef4444';

  // Dynamic Category Filters
  const dryingList = batches.filter(b => b.status === 'drying');
  const completeList = batches.filter(b => b.status === 'complete');
  const pendingList = batches.filter(b => b.status === 'pending');

  const filteredBatches =
    filter === 'drying' ? dryingList :
      filter === 'complete' ? completeList :
        filter === 'pending' ? pendingList : batches;

  const activeBatch1 = batches.find(b => b.id === cell1BatchId) || batches[0];
  const activeBatch2 = batches.find(b => b.id === cell2BatchId) || batches[1];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 space-y-6">

      {/* ── Top Header ── */}
      <header className="bg-white border border-slate-200/80 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Fish size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">AquaSense Industrial Live Monitor</h1>
            <p className="text-xs text-slate-500 font-medium">Multi-Sensor Telemetry & Automated Lifecycle</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isConnected ? 'ESP32 MQTT Connected' : 'Sensor Hub Offline'}
          </div>
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-all">
            <FileDown size={14} /> Export Logs
          </button>
        </div>
      </header>

      {/* ── Dual Load Cell Live Processing Units ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[
          { cellNum: 1, batch: activeBatch1, isActive: cell1Active, toggle: toggleCell1, setBatch: (id) => assignBatchToCell(1, id) },
          { cellNum: 2, batch: activeBatch2, isActive: cell2Active, toggle: toggleCell2, setBatch: (id) => assignBatchToCell(2, id) }
        ].map(({ cellNum, batch, isActive, toggle, setBatch }) => {
          const mc = calculateMoisture(batch.initialWeight, batch.currentWeight, batch.initialMoisture);
          const prg = calculateProgress(batch.initialMoisture, mc, batch.targetMoisture);
          const dryMatter = (batch.initialWeight * (1 - batch.initialMoisture / 100)).toFixed(1);

          return (
            <div key={cellNum} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isActive && batch.status === 'drying' ? 'bg-blue-600 animate-ping' : 'bg-slate-300'}`} />
                    <h2 className="text-blue-600 font-black text-sm tracking-wider">LOAD CELL {cellNum}</h2>
                  </div>

                  {/* Select batch placed on tray */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Assigned Tray:</span>
                    <select
                      value={batch.id}
                      onChange={(e) => setBatch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-2.5 py-1 outline-none cursor-pointer"
                    >
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.id} ({b.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Real-time Moisture */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <p className="text-slate-400 uppercase tracking-widest text-[9px] font-bold mb-1 relative z-10">Moisture Content</p>
                    <h3 className={`text-4xl font-black relative z-10 ${mc <= batch.targetMoisture ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {mc.toFixed(1)}<span className="text-sm text-slate-400 font-normal ml-0.5">%</span>
                    </h3>
                    <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1 relative z-10 font-medium">
                      <Droplets size={11} className="text-blue-500" /> Target: {batch.targetMoisture}%
                    </p>
                    <div
                      className="absolute bottom-0 left-0 w-full bg-blue-100/60 transition-all duration-300"
                      style={{ height: `${mc}%` }}
                    />
                  </div>

                  {/* Real-time Weight from HX711 */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-4 flex flex-col justify-center items-center">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Live Scale Reading</p>
                    <h3 className="text-3xl font-black text-slate-900">
                      {batch.currentWeight.toFixed(1)}<span className="text-xs text-slate-400 font-normal ml-0.5">g</span>
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-medium">
                      <Scale size={14} /> Wet Initial: {batch.initialWeight}g
                    </div>
                  </div>

                  {/* Dynamic Progress */}
                  <div className={`rounded-2xl border p-4 flex flex-col justify-center ${mc <= batch.targetMoisture ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200/70'}`}>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Process Progress</p>
                    <h3 className={`text-3xl font-black ${mc <= batch.targetMoisture ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {prg.toFixed(0)}%
                    </h3>
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${prg}%` }} />
                    </div>
                    <div className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${mc <= batch.targetMoisture ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {mc <= batch.targetMoisture ? <><CheckCircle size={13} /> SAFE TO STORE</> : <><Timer size={13} className={isActive ? 'animate-spin' : ''} /> DRYING ACTIVE</>}
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
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isActive
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                    }`}
                >
                  {isActive ? <RotateCcw size={14} /> : <Play size={14} />}
                  {isActive ? 'Pause / Stop' : 'Start Drying Cycle'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DS18B20 Temp Probe & AMG8833 Thermal Array ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer size={18} className="text-orange-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">DS18B20 Chamber Probe</h3>
            </div>
            <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-600 px-2.5 py-0.5 rounded-full font-bold">1-Wire Digital</span>
          </div>
          <div className="my-4">
            <div className="text-5xl font-black text-slate-900">{chamberTemp.toFixed(1)}°C</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Internal air circulation temperature</p>
          </div>
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex justify-between">
            <span>Target: 45.0°C – 55.0°C</span>
            <span className="text-emerald-600 font-bold">Live Synced</span>
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-red-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">AMG8833 GridEYE Thermal Array</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">8x8 Surface Infrared Matrix (Hotspot Tracking)</p>
            <div className="flex gap-3 text-xs pt-4">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold"><span className="w-3 h-3 rounded-full bg-[#3b82f6]" /> Cold</span>
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold"><span className="w-3 h-3 rounded-full bg-[#eab308]" /> Warm</span>
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold"><span className="w-3 h-3 rounded-full bg-[#ef4444]" /> Hot</span>
            </div>
          </div>

          <div className="grid grid-cols-8 gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            {thermalMatrix.map((pixelTemp, idx) => (
              <div
                key={idx}
                title={`${pixelTemp.toFixed(1)}°C`}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-md transition-colors duration-200 shadow-sm"
                style={{ backgroundColor: getHeatmapColor(pixelTemp) }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Real-time Interactive Batch Categories Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* Dynamic Category Navigation */}
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === tab.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === tab.key ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-semibold">Real-time Feed Active ({filteredBatches.length} items)</span>
        </div>

        {/* Live Filtered Cards Grid */}
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
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                          Batch {batch.id}
                          {batch.assignedCell && (
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">
                              Load Cell {batch.assignedCell}
                            </span>
                          )}
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