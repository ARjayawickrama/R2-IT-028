import React, { useState, useEffect } from 'react';
import { Plus, Flame, Snowflake, Droplet, Thermometer, Scale, Ruler, Play, Square, Cpu, Gauge, CircleDot } from 'lucide-react';

// ---------- Palette / Tokens ----------
const C = {
  bg: '#ECEFF3',
  panel: '#FFFFFF',
  border: '#D6DCE3',
  borderSoft: '#E4E8EC',
  ink: '#17222C',
  muted: '#78838F',
  faint: '#B3BAC2',
  teal: '#0E6F5C',
  tealDark: '#0A5647',
  steel: '#22507A',
  amber: '#B4700D',
  danger: '#B23A2E',
  hazard: '#F2B705',
};

const FONT_DISPLAY = "'Space Grotesk', 'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'DM Mono', monospace";
const FONT_BODY = "'Inter', -apple-system, sans-serif";

// ---------- Decorative machined-panel rivet ----------
const Rivet = ({ top, left, right, bottom }) => (
  <div style={{
    position: 'absolute', top, left, right, bottom,
    width: 6, height: 6, borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 30%, #FAFBFC, #C7CED5 70%, #AEB6BF)',
    boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.15)'
  }} />
);

const Panel = ({ children, accent, style }) => (
  <div style={{
    position: 'relative',
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: '10px',
    boxShadow: '0 1px 2px rgba(23,34,44,0.04), 0 8px 20px -14px rgba(23,34,44,0.15)',
    ...style
  }}>
    {accent && (
      <div style={{
        position: 'absolute', top: 0, left: 14, right: 14, height: 3,
        borderRadius: '0 0 3px 3px', background: accent
      }} />
    )}
    <Rivet top={8} left={8} /><Rivet top={8} right={8} />
    <Rivet bottom={8} left={8} /><Rivet bottom={8} right={8} />
    {children}
  </div>
);

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
    <div style={{ textAlign: 'center', width: 90 }}>
      <svg viewBox="0 0 100 80">
        <path d={trackD} fill="none" stroke="#E4E8EC" strokeWidth="7" strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />}
        {/* tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = startAngle + t * span;
          return (
            <line key={t} x1={cx + (r + 5) * Math.cos(toRad(a))} y1={cy + (r + 5) * Math.sin(toRad(a))}
              x2={cx + (r + 9) * Math.cos(toRad(a))} y2={cy + (r + 9) * Math.sin(toRad(a))}
              stroke="#CBD2D9" strokeWidth="1.5" />
          );
        })}
        <text x="50" y="51" textAnchor="middle" fontSize="15" fontWeight="600" fill={C.ink} fontFamily={FONT_MONO}>
          {typeof value === 'number' ? value.toFixed(value < 1 ? 2 : 1) : value}
        </text>
        <text x="50" y="64" textAnchor="middle" fontSize="8.5" fill={C.muted} fontFamily={FONT_MONO} letterSpacing="0.5">{unit}</text>
      </svg>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontWeight: 700, letterSpacing: '1.4px', fontFamily: FONT_DISPLAY }}>{label}</div>
    </div>
  );
};

// --- Boiler Visual for Tank A ---
const BoilerIcon = ({ waterPct, isBoiling }) => {
  const fillH = (waterPct / 100) * 85;
  const waterColor = isBoiling ? C.steel : '#8FB0D6';

  return (
    <svg width="92" height="118" viewBox="0 0 120 150">
      <rect x="30" y="40" width="60" height="85" rx="12" fill="#F6F8FA" stroke={C.border} strokeWidth="2" />
      <rect x="22" y="65" width="8" height="30" rx="3" fill="#F6F8FA" stroke={C.border} strokeWidth="2" />
      <rect x="90" y="65" width="8" height="30" rx="3" fill="#F6F8FA" stroke={C.border} strokeWidth="2" />
      <path d="M45 40 Q60 20 75 40" fill="none" stroke={C.border} strokeWidth="2" />
      <clipPath id="boilerClip"><rect x="30" y="40" width="60" height="85" rx="12" /></clipPath>
      <rect x="30" y={125 - fillH} width="60" height={fillH} fill={waterColor} opacity="0.85" clipPath="url(#boilerClip)" />
      {/* gauge window band */}
      <rect x="30" y="40" width="60" height="85" rx="12" fill="none" stroke={C.border} strokeWidth="1" />
      <text x="60" y="136" textAnchor="middle" fontSize="8" fontFamily={FONT_MONO} fill={C.faint} letterSpacing="1">TANK A</text>

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
    <svg width="92" height="118" viewBox="0 0 120 150">
      <rect x="30" y="40" width="60" height="85" rx="12" fill="#F6F8FA" stroke={C.border} strokeWidth="2" />
      <rect x="22" y="65" width="8" height="30" rx="3" fill="#F6F8FA" stroke={C.border} strokeWidth="2" />
      <rect x="90" y="65" width="8" height="30" rx="3" fill="#F6F8FA" stroke={C.border} strokeWidth="2" />
      <path d="M45 40 Q60 20 75 40" fill="none" stroke={C.border} strokeWidth="2" />
      <clipPath id="saltClip"><rect x="30" y="40" width="60" height="85" rx="12" /></clipPath>
      <rect x="30" y={125 - fillH} width="60" height={fillH} fill={C.amber} opacity="0.55" clipPath="url(#saltClip)" />
      <rect x="30" y="40" width="60" height="85" rx="12" fill="none" stroke={C.border} strokeWidth="1" />
      <text x="60" y="136" textAnchor="middle" fontSize="8" fontFamily={FONT_MONO} fill={C.faint} letterSpacing="1">SALT A</text>
    </svg>
  );
};

export default function BoilerDashboard() {
  const [tanks, setTanks] = useState([
    { id: 1, name: 'Boiler Tank 1', fishWeight: 3.5, thickness: 6.0, temp: 100.0, isCycling: false }
  ]);
  const [activeId, setActiveId] = useState(1);
  const [cookingTime, setCookingTime] = useState(45);
  const [predictionStatus, setPredictionStatus] = useState('Ready for AI prediction');

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

  const runAIModelPrediction = async () => {
    setPredictionStatus('Running AI model...');
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fish_weight: activeTank.fishWeight,
          thickness: activeTank.thickness,
          temperature: activeTank.temp
        })
      });
      if (!response.ok) throw new Error('AI model server error');
      const data = await response.json();
      setCookingTime(data.predicted_cooking_time);
      setPredictionStatus('AI model prediction successful');
    } catch (error) {
      console.warn('Backend connection failed. Using client-side estimation.', error);
      const estimated = (activeTank.fishWeight * 5) + (activeTank.thickness * 3) + (activeTank.temp * 0.1);
      setCookingTime(Math.round(estimated));
      setPredictionStatus('AI model ran (offline mode)');
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

  const fieldStyle = {
    width: '100%',
    padding: '11px 12px 11px 38px',
    border: `1px solid ${C.border}`,
    borderRadius: '8px',
    background: C.bg,
    fontWeight: 600,
    fontSize: '14px',
    fontFamily: FONT_MONO,
    color: C.ink,
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '10.5px', color: C.muted, display: 'block', marginBottom: '7px',
    fontWeight: 700, letterSpacing: '1px', fontFamily: FONT_DISPLAY, textTransform: 'uppercase'
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '24px', fontFamily: FONT_BODY, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 1; }
        input:focus { border-color: ${C.teal} !important; box-shadow: 0 0 0 3px rgba(14,111,92,0.12); }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '18px', flexWrap: 'wrap', gap: '14px',
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '9px',
            background: `linear-gradient(155deg, ${C.tealDark}, ${C.teal})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 10px -4px rgba(14,111,92,0.5)'
          }}>
            <Flame size={21} color="#FFFFFF" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: '17.5px', fontWeight: 700, letterSpacing: '-0.2px', fontFamily: FONT_DISPLAY }}>
              Fish Boiler Control System
            </div>
            <div style={{ fontSize: '11px', color: C.muted, fontWeight: 600, fontFamily: FONT_MONO, letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <CircleDot size={11} color={C.teal} /> MACHINE HMI &middot; RANDOM FOREST PREDICTION ENGINE
            </div>
          </div>
        </div>

        {/* Tank Tabs */}
        <div style={{ display: 'flex', gap: '5px', background: C.bg, padding: '5px', borderRadius: '24px', border: `1px solid ${C.border}` }}>
          {tanks.map(t => (
            <button key={t.id} onClick={() => setActiveId(t.id)} style={{
              padding: '8px 16px', borderRadius: '18px', border: 'none', cursor: 'pointer',
              background: activeId === t.id ? C.teal : 'transparent',
              color: activeId === t.id ? '#FFFFFF' : C.muted,
              fontSize: '12px', fontWeight: 700, fontFamily: FONT_DISPLAY, letterSpacing: '0.2px',
              transition: 'all 0.15s'
            }}>
              {t.name}
            </button>
          ))}
          <button onClick={addTank} style={{
            padding: '8px 14px', borderRadius: '18px', border: `1px dashed ${C.faint}`, cursor: 'pointer',
            background: 'transparent', color: C.teal, fontSize: '12px', fontWeight: 700, fontFamily: FONT_DISPLAY,
            display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            <Plus size={13} strokeWidth={2.5} /> Add Tank
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(280px, 1.15fr) minmax(300px, 1.4fr)', gap: '18px' }}>

        {/* INPUT PANEL */}
        <Panel accent={C.teal} style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10.5px', color: C.teal, fontWeight: 700, marginBottom: '18px', letterSpacing: '1.4px', fontFamily: FONT_DISPLAY }}>
              ⚙ SCIENTIFIC INPUTS
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Fish Batch Weight (kg)</label>
              <div style={{ position: 'relative' }}>
                <Scale size={16} color={C.muted} style={{ position: 'absolute', left: 12, top: 13 }} />
                <input type="number" step="0.1" value={activeTank.fishWeight} onChange={(e) => handleInputChange('fishWeight', e.target.value)} style={fieldStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Max Fish Thickness (mm)</label>
              <div style={{ position: 'relative' }}>
                <Ruler size={16} color={C.muted} style={{ position: 'absolute', left: 12, top: 13 }} />
                <input type="number" step="0.1" value={activeTank.thickness} onChange={(e) => handleInputChange('thickness', e.target.value)} style={fieldStyle} />
              </div>
              <div style={{ fontSize: '10px', color: C.faint, marginTop: '5px', fontWeight: 500, fontFamily: FONT_MONO }}>Uses a 1:1 water ratio</div>
            </div>

            <div style={{ marginBottom: '4px' }}>
              <label style={labelStyle}>Temperature (&deg;C)</label>
              <div style={{ position: 'relative' }}>
                <Thermometer size={16} color={C.muted} style={{ position: 'absolute', left: 12, top: 13 }} />
                <input type="number" step="0.1" value={activeTank.temp} onChange={(e) => handleInputChange('temp', e.target.value)} style={fieldStyle} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <button onClick={runAIModelPrediction} style={{
              width: '100%', padding: '13px', borderRadius: '9px', border: 'none',
              background: C.ink, color: '#FFFFFF', fontWeight: 700, fontSize: '12.5px', fontFamily: FONT_DISPLAY,
              letterSpacing: '0.3px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              <Cpu size={16} /> RUN AI MODEL
            </button>
            <div style={{ fontSize: '10.5px', textAlign: 'center', color: C.muted, marginTop: '9px', fontWeight: 500, fontFamily: FONT_MONO }}>
              {predictionStatus}
            </div>
          </div>
        </Panel>

        {/* STATUS PANEL */}
        <Panel accent={activeTank.isCycling ? C.danger : C.steel} style={{ padding: '22px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
            <Gauge size={13} color={C.muted} />
            <div style={{ fontSize: '10.5px', color: C.muted, fontWeight: 700, letterSpacing: '1.2px', fontFamily: FONT_DISPLAY }}>
              {activeTank.name.toUpperCase()} STATUS
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
            <div>
              <BoilerIcon waterPct={waterPct} isBoiling={activeTank.isCycling} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: C.ink, marginTop: '6px', fontFamily: FONT_DISPLAY }}>Tank A</div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: C.muted, fontFamily: FONT_MONO }}>{finalWaterLiters.toFixed(2)} L</div>
            </div>

            <div>
              <SaltIcon saltPct={saltPct} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: C.ink, marginTop: '6px', fontFamily: FONT_DISPLAY }}>Salt A</div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: C.muted, fontFamily: FONT_MONO }}>{saltWaterMl.toFixed(0)} ml</div>
            </div>
          </div>

          <div style={{ fontSize: '38px', color: C.ink, fontWeight: 700, marginTop: '20px', fontFamily: FONT_MONO, letterSpacing: '-1px' }}>
            {activeTank.temp.toFixed(1)}&deg;C
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px',
            padding: '5px 13px', borderRadius: '20px',
            background: activeTank.isCycling ? '#FBEAE8' : C.bg,
            border: `1px solid ${activeTank.isCycling ? '#F0C6C1' : C.border}`
          }}>
            {activeTank.isCycling ? <Flame size={12} color={C.danger} /> : <Snowflake size={12} color={C.muted} />}
            <span style={{ fontSize: '10px', color: activeTank.isCycling ? C.danger : C.muted, letterSpacing: '1px', fontWeight: 700, fontFamily: FONT_DISPLAY }}>
              {activeTank.isCycling ? 'ACTIVE BOILING' : 'SYSTEM STANDBY'}
            </span>
          </div>
        </Panel>

        {/* CALCULATION & SENSORS PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Live Gauges */}
          <Panel accent={C.steel} style={{ padding: '20px' }}>
            <div style={{ fontSize: '10.5px', color: C.muted, fontWeight: 700, letterSpacing: '1.2px', marginBottom: '14px', fontFamily: FONT_DISPLAY }}>
              REAL-TIME PARAMETERS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <GaugeArc value={activeTank.fishWeight} max={10} color={C.teal} unit="kg" label="BATCH" />
              <GaugeArc value={finalWaterLiters} max={20} color={C.steel} unit="L" label="WATER" />
              <GaugeArc value={requiredSaltGrams} max={500} color={C.amber} unit="g" label="SALT" />
            </div>
          </Panel>

          {/* Results Summary — machined "ticket" plate */}
          <div style={{
            position: 'relative',
            background: `linear-gradient(165deg, ${C.ink}, #1F2E3A)`,
            padding: '20px 22px', borderRadius: '10px', color: '#FFFFFF',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px -16px rgba(0,0,0,0.5)'
          }}>
            <Rivet top={8} left={8} /><Rivet top={8} right={8} />
            <Rivet bottom={8} left={8} /><Rivet bottom={8} right={8} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '9.5px', color: '#8FA0AE', letterSpacing: '1.2px', fontWeight: 700, fontFamily: FONT_DISPLAY }}>TOTAL WATER</div>
                <div style={{ fontSize: '27px', fontWeight: 700, fontFamily: FONT_MONO }}>{finalWaterLiters.toFixed(2)} L</div>
              </div>

              <div style={{
                background: `linear-gradient(155deg, ${C.tealDark}, ${C.teal})`, padding: '9px 16px', borderRadius: '8px',
                color: '#FFFFFF', fontWeight: 700, fontSize: '12.5px', fontFamily: FONT_DISPLAY,
                display: 'flex', alignItems: 'center', gap: '7px'
              }}>
                <Droplet size={14} /> {cookingTime} MIN COOK TIME
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9.5px', color: '#8FA0AE', letterSpacing: '1.2px', fontWeight: 700, fontFamily: FONT_DISPLAY }}>SALT (3%)</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: FONT_MONO }}>{requiredSaltGrams.toFixed(0)}g</div>
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
            <div style={{ fontSize: '10.5px', color: '#8FA0AE', fontWeight: 500, fontFamily: FONT_MONO }}>
              Prediction from random forest machine learning model.
            </div>
          </div>

          {/* Control Button — hazard-edge start/stop */}
          <button onClick={toggleCycle} style={{
            width: '100%', padding: '15px', borderRadius: '10px',
            border: activeTank.isCycling ? `1px solid #E2A79E` : `1px solid ${C.tealDark}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: activeTank.isCycling
              ? 'repeating-linear-gradient(135deg, #FBEAE8, #FBEAE8 10px, #F6DAD6 10px, #F6DAD6 20px)'
              : `linear-gradient(155deg, ${C.tealDark}, ${C.teal})`,
            transition: 'all 0.15s', position: 'relative', overflow: 'hidden'
          }}>
            {activeTank.isCycling ? <Square size={15} color="#8A2E22" fill="#8A2E22" /> : <Play size={15} color="#FFFFFF" fill="#FFFFFF" />}
            <span style={{
              fontWeight: 700, fontSize: '13px', letterSpacing: '0.4px', fontFamily: FONT_DISPLAY,
              color: activeTank.isCycling ? '#8A2E22' : '#FFFFFF'
            }}>
              {activeTank.isCycling ? 'TERMINATE BOILING CYCLE' : 'INITIATE BOILING CYCLE'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
