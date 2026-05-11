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
          <circle cx="50" cy={125 - fillH} r="2" fill="white">
            <animate attributeName="cy" from={125 - fillH} to="45" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="70" cy={125 - fillH} r="2" fill="white">
            <animate attributeName="cy" from={125 - fillH} to="45" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="1" to="0" dur="1.4s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
      <rect x="30" y={125 - fillH} width="60" height="4" fill="#6F42C1" opacity="0.3" clipPath="url(#boilerClip)" />
    </svg>
  );
};

export default function BoilerDashboard() {
  const [tanks, setTanks] = useState([
    { id: 1, name: 'Boiler Tank 1', length: 60, width: 40, thickness: 25, fishWeight: 3, temp: 22.0, isCycling: false }
  ]);
  const [activeId, setActiveId] = useState(1);

  const activeTank = tanks.find(t => t.id === activeId);

  const handleInputChange = (field, value) => {
    setTanks(prev => prev.map(t => 
      t.id === activeId ? { ...t, [field]: Number(value) } : t
    ));
  };

  const addTank = () => {
    const newId = tanks.length + 1;
    setTanks([...tanks, { id: newId, name: `Boiler Tank ${newId}`, length: 60, width: 40, thickness: 25, fishWeight: 3, temp: 22.0, isCycling: false }]);
    setActiveId(newId);
  };

  const toggleCycle = () => {
    setTanks(prev => prev.map(t => t.id === activeId ? { ...t, isCycling: !t.isCycling } : t));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTanks(prev => prev.map(t => {
        if (t.isCycling && t.temp < 100) return { ...t, temp: t.temp + 0.5 };
        if (!t.isCycling && t.temp > 22) return { ...t, temp: t.temp - 0.2 };
        return t;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Scientific Calculations ---

  const requiredHeight = (activeTank.thickness / 10) + 2; 
  
  const volumeBasedWater = (activeTank.length * activeTank.width * requiredHeight) / 1000;
  

  const weightBasedWater = activeTank.fishWeight * 2;

  const finalWaterLiters = Math.max(volumeBasedWater, weightBasedWater);
  
  
  const requiredSalt = finalWaterLiters * 1000 * 0.03;

  const waterPct = Math.min((finalWaterLiters / 50) * 100, 100);

  return (
    <div style={{ backgroundColor: '#F1EFE8', minHeight: '100vh', padding: '20px', fontFamily: "'Courier New', monospace" }}>
      
      {/* Tank Management Tabs */}
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
        
        {/* INPUT PANEL */}
        <div style={{ flex: '1', minWidth: '300px', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #D3D1C7', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: 'black', marginBottom: '20px', letterSpacing: '1px' }}>SCIENTIFIC INPUTS</div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>FISH BATCH WEIGHT (kg)</label>
            <input type="number" value={activeTank.fishWeight} onChange={(e) => handleInputChange('fishWeight', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EEE', borderRadius: '10px', background: '#F8F8F6', fontWeight: 'bold' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>LENGTH (cm)</label>
              <input type="number" value={activeTank.length} onChange={(e) => handleInputChange('length', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EEE', borderRadius: '10px', background: '#F8F8F6' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>WIDTH (cm)</label>
              <input type="number" value={activeTank.width} onChange={(e) => handleInputChange('width', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EEE', borderRadius: '10px', background: '#F8F8F6' }} />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>MAX FISH THICKNESS (mm)</label>
            <input type="number" value={activeTank.thickness} onChange={(e) => handleInputChange('thickness', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EEE', borderRadius: '10px', background: '#F8F8F6' }} />
          </div>
        </div>

        {/* STATUS PANEL */}
        <div style={{ flex: '1.2', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #D3D1C7', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>BOILER STATUS — {activeTank.name}</div>
          <BoilerIcon waterPct={waterPct} isBoiling={activeTank.isCycling} />
          <div style={{ fontSize: '42px', color: '#333', fontWeight: 'black', marginTop: '10px' }}>{activeTank.temp.toFixed(1)}°C</div>
          <div style={{ fontSize: '10px', color: activeTank.isCycling ? '#E11D48' : '#AAA', letterSpacing: '4px', fontWeight: 'bold' }}>{activeTank.isCycling ? 'ACTIVE BOILING' : 'SYSTEM STANDBY'}</div>
        </div>

        {/* CALCULATION & SENSORS PANEL */}
        <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Gauges */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #D3D1C7' }}>
            <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginBottom: '15px' }}>REAL-TIME PARAMETERS</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <GaugeArc value={activeTank.fishWeight} max={20} color="#1D9E75" unit="kg" label="BATCH" />
              <GaugeArc value={finalWaterLiters} max={50} color="#6F42C1" unit="L" label="WATER" />
              <GaugeArc value={requiredSalt} max={1000} color="#BA7517" unit="g" label="SALT" />
            </div>
          </div>

          {/* Results Summary */}
          <div style={{ background: '#4A3AFF', padding: '25px', borderRadius: '20px', color: 'white', boxShadow: '0 10px 20px rgba(74, 58, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '10px', opacity: '0.8', letterSpacing: '1px' }}>TOTAL WATER REQUIRED</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{finalWaterLiters.toFixed(2)} L</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', opacity: '0.8', letterSpacing: '1px' }}>SALT (3%)</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{requiredSalt.toFixed(0)}g</div>
              </div>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '15px 0' }} />
            <div style={{ fontSize: '9px', opacity: '0.7', fontStyle: 'italic' }}>
              Target Submersion Height: {requiredHeight.toFixed(1)} cm | Based on Codex CXC 52-2003
            </div>
          </div>

          {/* Control Button */}
          <button onClick={toggleCycle} style={{ width: '100%', padding: '18px', borderRadius: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: activeTank.isCycling ? '#FFF1F2' : '#1D9E75', transition: 'all 0.3s' }}>
            {activeTank.isCycling ? 
              <div style={{ width: 12, height: 12, background: '#E11D48' }} /> : 
              <div style={{ borderLeft: '12px solid white', borderTop: '8px solid transparent', borderBottom: '8px solid transparent' }} />
            }
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: activeTank.isCycling ? '#E11D48' : 'white' }}>
              {activeTank.isCycling ? 'TERMINATE BOILING CYCLE' : 'INITIATE BOILING CYCLE'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}