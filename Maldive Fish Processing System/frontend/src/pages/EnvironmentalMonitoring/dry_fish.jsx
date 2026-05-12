import React, { useState, useEffect } from 'react';
import { Scale, Droplets, Timer, CheckCircle, Play, RotateCcw, AlertCircle, FileDown, Flame, Fish } from 'lucide-react';

// ── Sample batch data ──────────────────────────────────────────────
const INITIAL_BATCHES = [
  {
    id: 'B-001', name: 'Dried Anchovy', status: 'drying',
    weight: 2350, temp: 78.6, quality: 'Grade A',
    initialMoisture: 78.67, targetMoisture: 20,
    moistureTrend: [22, 20, 18, 17, 15, 14, 12.4],
  },
  {
    id: 'B-002', name: 'Salted Mackerel', status: 'drying',
    weight: 3100, temp: 74.2, quality: 'Grade A',
    initialMoisture: 78.67, targetMoisture: 20,
    moistureTrend: [28, 25, 22, 19, 17, 16, 15.1],
  },
  {
    id: 'B-003', name: 'Dried Sardine', status: 'complete',
    weight: 1850, temp: 82.1, quality: 'Grade B',
    initialMoisture: 78.67, targetMoisture: 20,
    moistureTrend: [18, 15, 13, 12, 11, 11, 10.8],
  },
  {
    id: 'B-004', name: 'Dried Tuna', status: 'pending',
    weight: 4200, temp: 0, quality: 'Grade A',
    initialMoisture: 78.67, targetMoisture: 20,
    moistureTrend: [78, 78, 78, 78, 78, 78, 78.67],
  },
  {
    id: 'B-005', name: 'Dried Prawns', status: 'complete',
    weight: 980, temp: 79.0, quality: 'Grade A',
    initialMoisture: 78.67, targetMoisture: 20,
    moistureTrend: [20, 17, 14, 12, 11, 10, 9.5],
  },
  {
    id: 'B-006', name: 'Dried Squid', status: 'pending',
    weight: 1560, temp: 0, quality: 'Grade B',
    initialMoisture: 78.67, targetMoisture: 20,
    moistureTrend: [78, 78, 78, 78, 78, 78, 78.67],
  },
];

// ── Helpers ────────────────────────────────────────────────────────
function calcMoisture(batch) {
  const dryMatter = (batch.initialWeight ?? batch.weight) * (1 - batch.initialMoisture / 100);
  return ((batch.weight - dryMatter) / batch.weight) * 100;
}

function calcProgress(batch) {
  const mc = calcMoisture(batch);
  return Math.min(100, Math.max(0,
    ((batch.initialMoisture - mc) / (batch.initialMoisture - batch.targetMoisture)) * 100
  ));
}

// Sparkline SVG
function Sparkline({ data, color }) {
  const w = 120, h = 36, pad = 4;
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

// Status badge
function StatusBadge({ status }) {
  const map = {
    drying:   { label: 'DRYING',   bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
    complete: { label: 'COMPLETE', bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-400'  },
    pending:  { label: 'PENDING',  bg: 'bg-gray-500/15',   text: 'text-gray-400',   dot: 'bg-gray-500'   },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'drying' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function DryFishMonitor() {
  const INITIAL_MOISTURE_REF = 78.67;
  const TARGET_MOISTURE = 20.0;

  // Initialise batches with saved initialWeight
  const [batches, setBatches] = useState(() =>
    INITIAL_BATCHES.map(b => ({ ...b, initialWeight: b.weight }))
  );
  const [filter, setFilter] = useState('all');
  const [isDrying, setIsDrying] = useState(false);

  // AquaSense single-unit simulation
  const [initialWeight] = useState(1000);
  const [currentWeight, setCurrentWeight] = useState(1000);
  const dryMatter = initialWeight * (1 - INITIAL_MOISTURE_REF / 100);
  const currentMoisture = ((currentWeight - dryMatter) / currentWeight) * 100;
  const progress = Math.min(100, Math.max(0,
    ((INITIAL_MOISTURE_REF - currentMoisture) / (INITIAL_MOISTURE_REF - TARGET_MOISTURE)) * 100
  ));

  // Simulate drying across all "drying" batches
  useEffect(() => {
    if (!isDrying) return;
    const interval = setInterval(() => {
      setBatches(prev => prev.map(b => {
        if (b.status !== 'drying') return b;
        const mc = calcMoisture(b);
        if (mc <= b.targetMoisture) return { ...b, status: 'complete' };
        const minWeight = (b.initialWeight * (1 - b.initialMoisture / 100)) / (1 - b.targetMoisture / 100);
        const next = Math.max(b.weight - 1.5, minWeight);
        return { ...b, weight: next };
      }));
      // AquaSense unit
      setCurrentWeight(prev => {
        const next = prev - 0.5;
        const min = dryMatter / (1 - TARGET_MOISTURE / 100);
        return next > min ? next : prev;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isDrying, dryMatter]);

  // Summary stats
  const totalWeight = batches.reduce((s, b) => s + b.weight, 0);
  const dryingBatches = batches.filter(b => b.status === 'drying');
  const completedBatches = batches.filter(b => b.status === 'complete');
  const avgMoisture = batches.length
    ? batches.reduce((s, b) => s + calcMoisture(b), 0) / batches.length
    : 0;

  const filtered = filter === 'all' ? batches : batches.filter(b => b.status === filter);

  const handleStartStop = () => {
    if (currentMoisture <= TARGET_MOISTURE) {
      setCurrentWeight(initialWeight);
      setBatches(INITIAL_BATCHES.map(b => ({ ...b, initialWeight: b.weight })));
    }
    setIsDrying(v => !v);
  };

  const tempColor = (t) => t >= 80 ? 'text-red-400' : t >= 70 ? 'text-orange-400' : t > 0 ? 'text-yellow-400' : 'text-gray-600';
  const moistureBarColor = (mc) => mc <= 15 ? '#22c55e' : mc <= 25 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen bg-[#f0f2f8] text-gray-900 font-sans">

      {/* ── Top Nav ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Fish size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-none">Dry Fish Monitor</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Batch drying management · Live status</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartStop}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isDrying
                ? 'bg-red-100 text-red-600 border border-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
            }`}
          >
            {isDrying ? <RotateCcw size={15} /> : <Play size={15} />}
            {isDrying ? 'Stop' : currentMoisture <= TARGET_MOISTURE ? 'Reset' : 'Start Drying'}
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
            <FileDown size={15} />
            Export Report
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <Scale size={22} className="text-blue-600" />,
              iconBg: 'bg-blue-50',
              label: 'Total Weight',
              value: (totalWeight / 1000).toFixed(2),
              unit: 'kg',
              valueClass: 'text-gray-900',
            },
            {
              icon: <Droplets size={22} className="text-blue-500" />,
              iconBg: 'bg-blue-50',
              label: 'Avg Moisture',
              value: avgMoisture.toFixed(1),
              unit: '%',
              valueClass: 'text-blue-500',
            },
            {
              icon: <Flame size={22} className="text-orange-500" />,
              iconBg: 'bg-orange-50',
              label: 'Currently Drying',
              value: dryingBatches.length,
              unit: 'batch',
              valueClass: 'text-orange-500',
            },
            {
              icon: <CheckCircle size={22} className="text-green-500" />,
              iconBg: 'bg-green-50',
              label: 'Completed',
              value: completedBatches.length,
              unit: 'batch',
              valueClass: 'text-green-500',
            },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
                {c.icon}
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold mb-0.5">{c.label}</p>
                <p className={`text-2xl font-black ${c.valueClass} leading-none`}>
                  {c.value}<span className="text-sm font-semibold text-gray-400 ml-1">{c.unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── AquaSense Live Panel ── */}
        <div className="bg-gray-950 text-gray-100 rounded-3xl p-6 border border-gray-800 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-blue-400 font-black text-lg flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full bg-blue-400 ${isDrying ? 'animate-ping' : ''}`} />
                AQUASENSE LIVE
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">Real-time Mass-Balance Monitoring</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Moisture Gauge */}
            <div className="bg-gray-900 rounded-[28px] border border-gray-800 p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold mb-2 relative z-10">Current Moisture</p>
              <h3 className={`text-5xl font-black relative z-10 transition-colors duration-500 ${currentMoisture <= TARGET_MOISTURE ? 'text-green-400' : 'text-white'}`}>
                {currentMoisture.toFixed(1)}<span className="text-xl text-gray-600">%</span>
              </h3>
              <p className="text-gray-500 text-xs mt-2 flex items-center gap-1.5 relative z-10">
                <Droplets size={12} className="text-blue-400" /> Wet Basis (MCwb)
              </p>
              <div
                className="absolute bottom-0 left-0 w-full bg-blue-600/10 transition-all duration-1000 ease-linear"
                style={{ height: `${currentMoisture}%` }}
              />
            </div>

            {/* Weight */}
            <div className="bg-gray-900 rounded-[28px] border border-gray-800 p-6 flex flex-col justify-center">
              <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Current Weight</p>
              <h3 className="text-4xl font-black">{currentWeight.toFixed(1)}<span className="text-lg text-gray-600">g</span></h3>
              <Scale size={28} className="text-gray-700 mt-3" />
            </div>

            {/* Progress */}
            <div className={`rounded-[28px] border p-6 transition-all duration-500 ${currentMoisture <= TARGET_MOISTURE ? 'bg-green-500/10 border-green-500/20' : 'bg-gray-900 border-gray-800'}`}>
              <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Drying Progress</p>
              <h3 className={`text-4xl font-black ${currentMoisture <= TARGET_MOISTURE ? 'text-green-400' : 'text-blue-400'}`}>
                {progress.toFixed(0)}%
              </h3>
              <div className="mt-4 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(59,130,246,0.6)' }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-600 mt-2 font-bold">
                <span>78.7%</span><span>20.0%</span>
              </div>
              <div className={`mt-3 flex items-center gap-2 text-sm font-bold ${currentMoisture <= TARGET_MOISTURE ? 'text-green-400' : 'text-gray-400'}`}>
                {currentMoisture <= TARGET_MOISTURE ? <><CheckCircle size={16} /> SAFE TO STORE</> : <><Timer size={16} className="animate-spin" /> DRYING...</>}
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex gap-2 items-start">
            <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={15} />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <span className="text-blue-300 font-bold">Calculation Logic:</span> Constant Dry Matter of{' '}
              <span className="text-white">{dryMatter.toFixed(1)}g</span>. As water evaporates, mass decreases and MCwb is recalculated in real-time. Reference: Babiker et al. 2016.
            </p>
          </div>
        </div>

        {/* ── Batch Table ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filter tabs */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: 'All dry fish' },
                { key: 'drying', label: 'Drying' },
                { key: 'complete', label: 'Complete' },
                { key: 'pending', label: 'Pending' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    filter === f.key
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {f.key !== 'all' && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      f.key === 'drying' ? 'bg-orange-400' : f.key === 'complete' ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  )}
                  {f.key === 'all' && <Fish size={13} />}
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 font-semibold">{filtered.length} batches</span>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
            {filtered.map(batch => {
              const mc = calcMoisture(batch);
              const barColor = moistureBarColor(mc);
              const sparkColor = batch.status === 'complete' ? '#22c55e' : '#f59e0b';
              return (
                <div key={batch.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all bg-white group">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-gray-900 text-base">{batch.name}</h3>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Batch {batch.id}</p>
                    </div>
                    <StatusBadge status={batch.status} />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Weight</p>
                      <p className="text-sm font-bold text-gray-800">{(batch.weight / 1000).toFixed(2)} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Temp</p>
                      <p className={`text-sm font-bold ${tempColor(batch.temp)}`}>
                        {batch.temp > 0 ? `${batch.temp}°C` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Quality</p>
                      <p className={`text-sm font-bold ${batch.quality === 'Grade A' ? 'text-green-500' : 'text-orange-400'}`}>
                        {batch.quality}
                      </p>
                    </div>
                  </div>

                  {/* Moisture bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1.5">
                      <span>Moisture Level</span>
                      <span className="text-gray-700 font-bold">{mc.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(mc / 80) * 100}%`, background: barColor }}
                      />
                    </div>
                  </div>

                  {/* Trend sparkline */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-semibold">Moisture trend</span>
                    <Sparkline data={batch.moistureTrend} color={sparkColor} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
