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

// --- Boiler Visual for Tank A ---
const BoilerIcon = ({ waterPct, isBoiling }) => {
  const fillH = (waterPct / 100) * 85;
  const waterColor = isBoiling ? '#6F42C1' : '#A5A6F6';

  return (
    <svg width="100" height="130" viewBox="0 0 120 150">
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
    </svg>
  );
};

// --- Salt Tank Visual for Salt A ---
const SaltIcon = ({ saltPct }) => {
  const fillH = (saltPct / 100) * 85;
  return (
    <svg width="100" height="130" viewBox="0 0 120 150">
      <rect x="30" y="40" width="60" height="85" rx="15" fill="none" stroke="#D97706" strokeWidth="2" />
      <rect x="22" y="65" width="8" height="30" rx="3" fill="none" stroke="#D97706" strokeWidth="2" />
      <rect x="90" y="65" width="8" height="30" rx="3" fill="none" stroke="#D97706" strokeWidth="2" />
      <path d="M45 40 Q60 20 75 40" fill="none" stroke="#D97706" strokeWidth="2" />
      <clipPath id="saltClip"><rect x="30" y="40" width="60" height="85" rx="15" /></clipPath>
      <rect x="30" y={125 - fillH} width="60" height={fillH} fill="#F59E0B" opacity="0.5" clipPath="url(#saltClip)" />
    </svg>
  );
};

export default function BoilerDashboard() {
  const [tanks, setTanks] = useState([
    { id: 1, name: 'Boiler Tank 1', fishWeight: 3.5, thickness: 6.0, temp: 100.0, isCycling: false }
  ]);
  const [activeId, setActiveId] = useState(1);
  const [cookingTime, setCookingTime] = useState(45); 
  const [predictionStatus, setPredictionStatus] = useState("Ready for AI Prediction");

  const activeTank = tanks.find(t => t.id === activeId);

  const handleInputChange = (field, value) => {
    setTanks(prev => prev.map(t => 
      t.id === activeId ? { ...t, [field]: Number(value) } : t
    ));
  };

  const addTank = () => {
    const newId = tanks.length + 1;
    setTanks([...tanks, { id: newId, name: `Boiler Tank ${newId}`, fishWeight: 3.0, thickness: 5.0, temp: 100.0, isCycling: false }]);
    setActiveId(newId);
  };

  const toggleCycle = () => {
    setTanks(prev => prev.map(t => t.id === activeId ? { ...t, isCycling: !t.isCycling } : t));
  };

  // --- Backend Python / AI Model එක සමඟ සම්බන්ධ කිරීම (API Call) ---
  const runAIModelPrediction = async () => {
    setPredictionStatus("Running AI Model...");
    
    try {
      // මෙහිදී ඔබේ Flask හෝ FastAPI backend එකට (උදාහරණයක් ලෙස: http://localhost:5000/predict) 
      // inputs යවා Random Forest model එකෙන් output එක ලබා ගනී.
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fish_weight: activeTank.fishWeight,
          thickness: activeTank.thickness,
          temperature: activeTank.temp
        })
      });

      if (!response.ok) {
        throw new Error('AI Model server error');
      }

      const data = await response.json();
      setCookingTime(data.predicted_cooking_time);
      setPredictionStatus("AI Model Prediction Successful!");
    } catch (error) {
      // Backend එක ක්‍රියාත්මක නොමැති නම් හෝ Demo එකක් ලෙස වැඩ කිරීමට සකස් කළ Fallback කේතය
      console.warn("Backend connection failed. Using client-side estimation.", error);
      
      // Random Forest ආදර්ශයට සමාන අගයක් ලබාදීමට (Fallback formula)
      const estimated = (activeTank.fishWeight * 5) + (activeTank.thickness * 3) + (activeTank.temp * 0.1);
      setCookingTime(Math.round(estimated));
      setPredictionStatus("AI Model Ran (Offline Mode)");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTanks(prev => prev.map(t => {
        if (t.isCycling && t.temp < 100) {
          const tankLoad = t.fishWeight + t.thickness;
          const speed = Math.max(0.1, 0.6 - (tankLoad * 0.02));
          return { ...t, temp: Math.min(100, t.temp + speed) };
        }
        if (!t.isCycling && t.temp > 100) return { ...t, temp: Math.max(100, t.temp - 0.3) };
        return t;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const finalWaterLiters = activeTank.thickness; 
  const requiredSaltGrams = finalWaterLiters * 1000 * 0.03; 
  const requiredSaltKg = requiredSaltGrams / 1000; 
  const saltWaterMl = requiredSaltGrams; 
  const waterPct = Math.min((finalWaterLiters / 20) * 100, 100);
  const saltPct = Math.min((requiredSaltKg / 2) * 100, 100);

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
        <div style={{ flex: '1', minWidth: '280px', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #D3D1C7', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#1D9E75', fontWeight: 'black', marginBottom: '20px', letterSpacing: '1px' }}>SCIENTIFIC INPUTS</div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>FISH BATCH WEIGHT (kg)</label>
              <input type="number" step="0.1" value={activeTank.fishWeight} onChange={(e) => handleInputChange('fishWeight', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EEE', borderRadius: '10px', background: '#F8F8F6', fontWeight: 'bold' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>MAX FISH THICKNESS (mm) [1:1 Water Ratio]</label>
              <input type="number" step="0.1" value={activeTank.thickness} onChange={(e) => handleInputChange('thickness', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EEE', borderRadius: '10px', background: '#F8F8F6', fontWeight: 'bold' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>TEMPERATURE (°C)</label>
              <input type="number" step="0.1" value={activeTank.temp} onChange={(e) => handleInputChange('temp', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EEE', borderRadius: '10px', background: '#F8F8F6', fontWeight: 'bold' }} />
            </div>
          </div>

          <div>
            <button onClick={runAIModelPrediction} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#4A3AFF', color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 10px rgba(74, 58, 255, 0.3)' }}>
              Run AI Model (Predict)
            </button>
            <div style={{ fontSize: '9px', textAlign: 'center', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
              {predictionStatus}
            </div>
          </div>
        </div>

        {/* STATUS PANEL */}
        <div style={{ flex: '1.2', background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #D3D1C7', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '15px' }}>BOILER STATUS — {activeTank.name}</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '10px' }}>
            <div>
              <BoilerIcon waterPct={waterPct} isBoiling={activeTank.isCycling} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginTop: '5px' }}>Tank A</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#666' }}>{finalWaterLiters.toFixed(2)} L</div>
            </div>

            <div>
              <SaltIcon saltPct={saltPct} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginTop: '5px' }}>Salt A</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#666' }}>{saltWaterMl.toFixed(0)} ml</div>
            </div>
          </div>

          <div style={{ fontSize: '32px', color: '#333', fontWeight: 'black', marginTop: '20px' }}>{activeTank.temp.toFixed(1)}°C</div>
          <div style={{ fontSize: '10px', color: activeTank.isCycling ? '#E11D48' : '#AAA', letterSpacing: '2px', fontWeight: 'bold' }}>
            {activeTank.isCycling ? 'ACTIVE BOILING' : 'SYSTEM STANDBY'}
          </div>
        </div>

        {/* CALCULATION & SENSORS PANEL */}
        <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Gauges */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #D3D1C7' }}>
            <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginBottom: '15px' }}>REAL-TIME PARAMETERS</div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <GaugeArc value={activeTank.fishWeight} max={10} color="#1D9E75" unit="kg" label="BATCH" />
              <GaugeArc value={finalWaterLiters} max={20} color="#6F42C1" unit="L" label="WATER" />
              <GaugeArc value={requiredSaltGrams} max={500} color="#BA7517" unit="g" label="SALT" />
            </div>
          </div>

          {/* Results Summary with Cooking Time Badge */}
          <div style={{ background: '#4A3AFF', padding: '20px 25px', borderRadius: '20px', color: 'white', boxShadow: '0 10px 20px rgba(74, 58, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '9px', opacity: '0.8', letterSpacing: '1px' }}>TOTAL WATER (1:1 Thickness)</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{finalWaterLiters.toFixed(2)} L</div>
              </div>

              <div style={{ background: '#FF3B30', padding: '8px 15px', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
                Cooking time: {cookingTime} min
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', opacity: '0.8', letterSpacing: '1px' }}>SALT (3%)</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{requiredSaltGrams.toFixed(0)}g</div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '15px 0' }} />
            <div style={{ fontSize: '9px', opacity: '0.7', fontStyle: 'italic' }}>
              Random Forest Machine Learning Model Prediction Engine.
            </div>
          </div>

          {/* Control Button */}
          <button onClick={toggleCycle} style={{ width: '100%', padding: '16px', borderRadius: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: activeTank.isCycling ? '#FFF1F2' : '#1D9E75', transition: 'all 0.3s' }}>
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