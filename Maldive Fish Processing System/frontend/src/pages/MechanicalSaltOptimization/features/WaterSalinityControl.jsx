import React, { useState, useEffect } from 'react';

// --- Gauge Component ---
const GaugeArc = ({ value, max, color, unit, label }) => {
  const pct = Math.min(value / max, 1);
  const startAngle = -210;
  const endAngle = 30;
  const span = endAngle - startAngle;
  const angle = startAngle + pct * span;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const cx = 50, cy = 54, r = 36;
  const arcX = (deg) => cx + r * Math.cos(toRad(deg));
  const arcY = (deg) => cy + r * Math.sin(toRad(deg));
  
  const trackD = `M${arcX(startAngle)} ${arcY(startAngle)} A${r} ${r} 0 1 1 ${arcX(endAngle)} ${arcY(endAngle)}`;
  const fillD = pct > 0 ? `M${arcX(startAngle)} ${arcY(startAngle)} A${r} ${r} 0 ${pct * span > 180 ? 1 : 0} 1 ${arcX(angle)} ${arcY(angle)}` : null;

  return (
    <div style={{ textAlign: 'center', width: 80 }}>
      <svg viewBox="0 0 100 80">
        <path d={trackD} fill="none" stroke="#E2E2D9" strokeWidth="8" strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />}
        <text x="50" y="52" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#333" fontFamily="monospace">
          {typeof value === 'number' ? value.toFixed(value < 1 ? 2 : 1) : value}
        </text>
        <text x="50" y="65" textAnchor="middle" fontSize="9" fill="#999" fontFamily="monospace">{unit}</text>
      </svg>
      <div style={{ fontSize: 10, color: '#888', marginTop: 2, fontWeight: 'bold', letterSpacing: '1px' }}>{label}</div>
    </div>
  );
};

// --- Boiler Visual with Animation ---
const BoilerIcon = ({ waterPct, isBoiling }) => {
  const fillH = (waterPct / 100) * 85;
  const waterColor = isBoiling ? '#6F42C1' : '#A5A6F6';

  return (
    <svg width="140" height="160" viewBox="0 0 120 150">
      <rect x="30" y="40" width="60" height="85" rx="15" fill="none" stroke="#B4B4A8" strokeWidth="2" />
      <rect x="22" y="65" width="8" height="30" rx="3" fill="none" stroke="#B4B4A8" strokeWidth="2" />
      <rect x="90" y="65" width="8" height="30" rx="3" fill="none" stroke="#B4B4A8" strokeWidth="2" />
      <path d="M45 40 Q60 20 75 40" fill="none" stroke="#B4B4A8" strokeWidth="2" />
      <clipPath id="boilerClip"><rect x="30" y="40" width="60" height="85" rx="15" /></clipPath>
      <rect x="30" y={125 - fillH} width="60" height={fillH} fill={waterColor} opacity="0.7" clipPath="url(#boilerClip)" />
      
      {isBoiling && (
        <g>
          <circle cx="50" cy={110 - fillH} r="2" fill="white">
            <animate attributeName="cy" from={110 - fillH} to="45" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy={110 - fillH} r="2" fill="white">
            <animate attributeName="cy" from={110 - fillH} to="45" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="1.4s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
      <rect x="30" y={125 - fillH} width="60" height="4" fill="#6F42C1" opacity="0.3" clipPath="url(#boilerClip)" />
    </svg>
  );
};

export default function BoilerDashboard() {
  // State for multiple tanks
  const [tanks, setTanks] = useState([
    { id: 1, name: 'Boiler Tank 1', length: 60, width: 30, thickness: 25, temp: 22.0, isCycling: false }
  ]);
  const [activeId, setActiveId] = useState(1);

  const activeTank = tanks.find(t => t.id === activeId);

  // Update Tank Function (Changes reflect immediately)
  const handleInputChange = (field, value) => {
    setTanks(prev => prev.map(t => 
      t.id === activeId ? { ...t, [field]: Number(value) } : t
    ));
  };

  const addTank = () => {
    const newId = tanks.length + 1;
    setTanks([...tanks, { id: newId, name: `Boiler Tank ${newId}`, length: 60, width: 30, thickness: 25, temp: 22.0, isCycling: false }]);
    setActiveId(newId);
  };

  const toggleCycle = () => {
    setTanks(prev => prev.map(t => t.id === activeId ? { ...t, isCycling: !t.isCycling } : t));
  };

  // Temp Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTanks(prev => prev.map(t => {
        if (t.isCycling && t.temp < 100) return { ...t, temp: t.temp + 0.2 };
        if (!t.isCycling && t.temp > 22) return { ...t, temp: t.temp - 0.1 };
        return t;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Calculations
  const waterVolume = (activeTank.length * activeTank.width * (activeTank.thickness / 10)) / 1000;
  const waterPct = Math.min((waterVolume / 50) * 100, 100); // 50L as max scale

  return (
    <div style={{ backgroundColor: '#F1EFE8', minHeight: '100vh', padding: '20px', fontFamily: "'Courier New', monospace" }}>
      
      {/* Tank Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '10px', borderRadius: '30px', width: 'fit-content', border: '1px solid #D3D1C7' }}>
        <span style={{ fontSize: '11px', alignSelf: 'center', color: '#888', fontWeight: 'bold', padding: '0 10px' }}>BOILER TANK MANAGEMENT</span>
        {tanks.map(t => (
          <button key={t.id} onClick={() => setActiveId(t.id)} style={{ padding: '6px 15px', borderRadius: '20px', border: activeId === t.id ? '1px solid #1D9E75' : 'none', background: activeId === t.id ? '#F0FFF4' : 'transparent', color: activeId === t.id ? '#1D9E75' : '#888', cursor: 'pointer' }}>
            {t.name}
          </button>
        ))}
        <button onClick={addTank} style={{ padding: '6px 15px', borderRadius: '20px', border: 'none', background: '#EBEBFF', color: '#6F42C1', cursor: 'pointer', fontWeight: 'bold' }}>+ ADD TANK</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* CALCULATE PANEL */}
        <div style={{ flex: '1', minWidth: '280px', background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #D3D1C7' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '20px' }}>CALCULATE - Tank Water Volume</div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '10px', color: '#999', display: 'block' }}>TANK LENGTH (cm)</label>
            <input type="number" value={activeTank.length} onChange={(e) => handleInputChange('length', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #EEE', borderRadius: '8px', background: '#F8F8F6' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '10px', color: '#999', display: 'block' }}>TANK WIDTH (cm)</label>
            <input type="number" value={activeTank.width} onChange={(e) => handleInputChange('width', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #EEE', borderRadius: '8px', background: '#F8F8F6' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '10px', color: '#999', display: 'block' }}>FISH THICKNESS (mm)</label>
            <input type="number" value={activeTank.thickness} onChange={(e) => handleInputChange('thickness', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #EEE', borderRadius: '8px', background: '#F8F8F6' }} />
          </div>
        </div>

        {/* STATUS PANEL */}
        <div style={{ flex: '1.5', background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #D3D1C7', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>BOILER STATUS — {activeTank.name}</div>
          <BoilerIcon waterPct={waterPct} isBoiling={activeTank.isCycling} />
          <div style={{ fontSize: '32px', color: '#1D9E75', fontWeight: 'bold' }}>{activeTank.temp.toFixed(1)}°C</div>
          <div style={{ fontSize: '10px', color: '#AAA', letterSpacing: '3px' }}>{activeTank.isCycling ? 'BOILING' : 'STANDBY'}</div>
        </div>

        {/* SENSORS & BUTTON PANEL */}
        <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #D3D1C7' }}>
            <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginBottom: '15px' }}>LIVE SENSORS</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <GaugeArc value={0} max={10} color="#1D9E75" unit="kg" label="FISH" />
              <GaugeArc value={waterVolume} max={50} color="#6F42C1" unit="L" label="WATER" />
              <GaugeArc value={activeTank.temp} max={100} color="#BA7517" unit="°C" label="TEMP" />
            </div>
          </div>

          <div style={{ background: '#4A3AFF', padding: '20px', borderRadius: '15px', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', opacity: '0.8' }}>REQUIRED WATER VOLUME</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{waterVolume.toFixed(2)} Liters</div>
          </div>

          <button onClick={toggleCycle} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #D3D1C7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: activeTank.isCycling ? '#FFF1F2' : '#F8F9FA' }}>
            {activeTank.isCycling ? <div style={{ width: 10, height: 10, background: '#E11D48' }} /> : <div style={{ borderLeft: '10px solid #5E6D82', borderTop: '6px solid transparent', borderBottom: '6px solid transparent' }} />}
            <span style={{ fontWeight: 'bold', color: activeTank.isCycling ? '#E11D48' : '#5E6D82' }}>{activeTank.isCycling ? 'STOP CYCLE' : 'START CYCLE'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}