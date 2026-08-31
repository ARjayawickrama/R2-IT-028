import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import {
  Plus, Flame, Snowflake, Droplet, Thermometer, Scale, Ruler, Play, Square,
  Cpu, Bell, FlaskConical, Gauge, CheckCircle2, Loader2, Waves, Timer, Box, Settings, X, Wifi, RefreshCw
} from 'lucide-react';

const C = {
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  surface: '#F1F5F9',
  border: '#E2E8F0',
  ink: '#0F172A',
  muted: '#64748B',
  faint: '#94A3B8',
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySoft: '#CCFBF1',
  water: '#0284C7',
  waterSoft: '#E0F2FE',
  salt: '#D97706',
  saltSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  success: '#16A34A',
  successSoft: '#DCFCE7'
};

const FONT_DISPLAY = "'Space Grotesk', 'Inter', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";
const FONT_BODY = "'Inter', sans-serif";

const STAGES = [
  { key: 'STANDBY', label: 'Standby', icon: Snowflake },
  { key: 'WATER_FILLING', label: 'Water Filling', icon: Droplet },
  { key: 'SALT_ADDING', label: 'Salt Adding', icon: FlaskConical },
  { key: 'HEATING', label: 'Heating', icon: Thermometer },
  { key: 'BOILING_ACTIVE', label: 'Boiling', icon: Flame },
];

const Card = ({ children, style }) => (
  <div style={{
    background: C.cardBg,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02), 0 2px 4px -2px rgba(15, 23, 42, 0.02)',
    transition: 'all 0.2s ease',
    ...style
  }}>
    {children}
  </div>
);

const SectionLabel = ({ children, color = C.muted }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
    color, fontFamily: FONT_DISPLAY, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6
  }}>
    {children}
  </div>
);

const FlowBar = ({ value, max, color, softColor }) => {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 10, borderRadius: 999, background: softColor, overflow: 'hidden', padding: 2 }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 999, background: color,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
};

const GaugeArc = ({ value, max, color, unit, label }) => {
  const pct = Math.min(value / (max || 1), 1);
  const startAngle = -210, endAngle = 30;
  const span = endAngle - startAngle;
  const angle = startAngle + pct * span;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const cx = 50, cy = 54, r = 36;
  const arcX = (deg) => cx + r * Math.cos(toRad(deg));
  const arcY = (deg) => cy + r * Math.sin(toRad(deg));

  const trackD = `M${arcX(startAngle)} ${arcY(startAngle)} A${r} ${r} 0 1 1 ${arcX(endAngle)} ${arcY(endAngle)}`;
  const fillD = pct > 0 ? `M${arcX(startAngle)} ${arcY(startAngle)} A${r} ${r} 0 ${pct * span > 180 ? 1 : 0} 1 ${arcX(angle)} ${arcY(angle)}` : null;

  return (
    <div style={{ textAlign: 'center', width: 92 }}>
      <svg viewBox="0 0 100 80">
        <path d={trackD} fill="none" stroke={C.surface} strokeWidth="8" strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />}
        <text x="50" y="51" textAnchor="middle" fontSize="15" fontWeight="700" fill={C.ink} fontFamily={FONT_MONO}>
          {typeof value === 'number' ? value.toFixed(value < 1 ? 2 : 1) : value}
        </text>
        <text x="50" y="65" textAnchor="middle" fontSize="8.5" fill={C.muted} fontWeight="600" fontFamily={FONT_MONO}>{unit}</text>
      </svg>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontWeight: 700, fontFamily: FONT_DISPLAY }}>{label}</div>
    </div>
  );
};

const ProcessRail = ({ processState, isCycling }) => {
  const currentIndex = STAGES.findIndex(s => s.key === processState);
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '4px 0' }}>
      {STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        const isPending = i > currentIndex;

        const dotColor = isDone || isActive ? C.primary : C.border;
        const bgColor = isDone || isActive ? C.primary : C.surface;
        const iconColor = (isDone || isActive) ? '#FFFFFF' : C.faint;

        return (
          <React.Fragment key={stage.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 78 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '12px',
                background: bgColor,
                border: `2px solid ${isActive && isCycling ? C.primaryDark : dotColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                boxShadow: isActive && isCycling ? `0 0 0 4px ${C.primarySoft}` : 'none',
                transition: 'all 0.3s ease'
              }}>
                {isActive && isCycling
                  ? <Loader2 size={20} color="#FFFFFF" style={{ animation: 'spin 1.4s linear infinite' }} />
                  : (isDone || isActive)
                    ? <CheckCircle2 size={20} color="#FFFFFF" />
                    : <Icon size={20} color={iconColor} />}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, marginTop: 8, textAlign: 'center',
                color: isPending ? C.faint : C.ink, fontFamily: FONT_DISPLAY
              }}>
                {stage.label}
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <div style={{
                flex: 1, height: 3,
                background: i < currentIndex ? C.primary : C.border,
                margin: '0 4px 22px', borderRadius: 4,
                transition: 'background 0.3s ease'
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default function BoilerDashboard() {
  const [tanks, setTanks] = useState([
    { id: 1, name: 'Tank Alpha', fishWeight: 0.0, thickness: 0.0, temp: 28.0, maxCapacity: 4.5, isCycling: false }
  ]);
  const [activeId, setActiveId] = useState(1);
  const [cookingTime, setCookingTime] = useState(45);
  const [predictionStatus, setPredictionStatus] = useState('AI Automation Ready');

  const [aiWaterLiters, setAiWaterLiters] = useState(4.5);
  const [aiSaltGrams, setAiSaltGrams] = useState(135.0);

  const [currentWaterFlow, setCurrentWaterFlow] = useState(0.0);
  const [currentSaltFlow, setCurrentSaltFlow] = useState(0.0);

  const [processState, setProcessState] = useState('STANDBY');
  const [toastMessage, setToastMessage] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Live Hardware States
  const [espTemp, setEspTemp] = useState(28.0);
  const [isSaltDetected, setIsSaltDetected] = useState(false);
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const [lastSyncedFishNo, setLastSyncedFishNo] = useState(null);

  const activeTank = tanks.find(t => t.id === activeId);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initial Load: Database එකෙන් අලුත්ම Fish Record එක ලබාගෙන Batch Parameters වලට දැමීම
  useEffect(() => {
    const fetchLatestFishData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/measurements');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const latest = data[0]; // අලුත්ම record එක
          const weightNum = parseFloat(latest.fish_weight.replace(' kg', '')) || 0.0;
          const thickCm = parseFloat(latest.fish_thickness.replace(' cm', '')) || 0.0;
          const thickMm = +(thickCm * 10).toFixed(1); // cm to mm

          setTanks(prev => prev.map(t =>
            t.id === activeId ? { ...t, fishWeight: weightNum, thickness: thickMm } : t
          ));
          setLastSyncedFishNo(latest.fish_no);
        }
      } catch (err) {
        console.log('Measurement API sync waiting...');
      }
    };

    fetchLatestFishData();
  }, [activeId]);

  // 2. Real-time Live Sync: MQTT හරහා Laser & Scale එකෙන් Data එන විට auto-update වීම
  useEffect(() => {
    // HiveMQ WebSocket Port 8884 / 8000
    const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');

    client.on('connect', () => {
      setIsMqttConnected(true);
      // Temperature & TDS topics
      client.subscribe(['aquasense/water/temperature', 'aquasense/water/tds', 'fish-inspector/measurement/data']);
    });

    client.on('message', (topic, payload) => {
      try {
        const msg = payload.toString();

        if (topic === 'aquasense/water/temperature') {
          const tempVal = parseFloat(msg);
          if (!isNaN(tempVal)) {
            setEspTemp(tempVal);
            setTanks(prev => prev.map(t => t.id === activeId ? { ...t, temp: tempVal } : t));
          }
        } else if (topic === 'aquasense/water/tds') {
          const tdsVal = parseFloat(msg);
          setIsSaltDetected(!isNaN(tdsVal) && tdsVal > 250);
        } else if (topic === 'fish-inspector/measurement/data') {
          // Live Laser & Scale Telemetry
          const d = JSON.parse(msg);
          if (d.peak_cm !== undefined && d.weight !== undefined) {
            const liveWeight = parseFloat(d.weight) || 0.0;
            const liveThickMm = (parseFloat(d.peak_cm) * 10.0) || 0.0;

            // මාළුවා ස්කෑන් වී අගයන් ලැබුණු විට Active Tank එකට Auto-Fill කිරීම
            if (liveWeight > 0 || liveThickMm > 0) {
              setTanks(prev => prev.map(t =>
                t.id === activeId ? { ...t, fishWeight: liveWeight, thickness: liveThickMm } : t
              ));
            }
          }
        }
      } catch (e) {
        console.error('MQTT Parsing error:', e);
      }
    });

    client.on('error', () => setIsMqttConnected(false));
    client.on('close', () => setIsMqttConnected(false));

    return () => {
      if (client) client.end();
    };
  }, [activeId]);

  const handleInputChange = (field, value) => {
    const numValue = Number(value);
    setTanks(prev => prev.map(t =>
      t.id === activeId ? { ...t, [field]: numValue } : t
    ));

    if (field === 'maxCapacity') {
      setAiWaterLiters(prev => Math.min(prev, numValue));
      setAiSaltGrams(prev => Math.min(prev, numValue * 1000 * 0.03));
      showNotification(`⚙️ Tank Capacity updated to ${numValue} Liters`);
    }
  };

  const addTank = () => {
    const newId = tanks.length + 1;
    setTanks([...tanks, { id: newId, name: `Tank 0${newId}`, fishWeight: 0.0, thickness: 0.0, temp: 28.0, maxCapacity: 4.5, isCycling: false }]);
    setActiveId(newId);
  };

  const startAutomatedBoiling = async () => {
    const nextState = !activeTank.isCycling;

    if (nextState) {
      setPredictionStatus('AI Analyzing...');
      showNotification('🤖 AI analyzing parameters and initiating process...');

      try {
        const response = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fish_weight: activeTank.fishWeight,
            thickness: activeTank.thickness,
            temperature: espTemp,
            max_capacity: activeTank.maxCapacity
          })
        });
        if (!response.ok) throw new Error('Server error');
        const data = await response.json();

        const calculatedWater = Number(data.water_liters ?? (activeTank.thickness / 10));
        const waterLiters = Math.min(calculatedWater, activeTank.maxCapacity);
        const saltGrams = Number(data.salt_grams ?? waterLiters * 1000 * 0.03);
        const predictedTime = data.predicted_cooking_time || 45;

        setCookingTime(predictedTime);
        setAiWaterLiters(waterLiters);
        setAiSaltGrams(saltGrams);
        setRemainingSeconds(predictedTime * 60);
        setPredictionStatus('AI Optimized & Running');
      } catch (error) {
        const estimated = Math.round((activeTank.fishWeight * 5) + ((activeTank.thickness / 10) * 3));
        const waterLiters = Math.min(activeTank.thickness > 0 ? (activeTank.thickness / 10) : 3.5, activeTank.maxCapacity);
        const saltGrams = waterLiters * 1000 * 0.03;

        setCookingTime(estimated);
        setAiWaterLiters(waterLiters);
        setAiSaltGrams(saltGrams);
        setRemainingSeconds(estimated * 60);
        setPredictionStatus('Offline AI Mode Active');
      }

      setTanks(prev => prev.map(t => t.id === activeId ? { ...t, isCycling: true } : t));
      setCurrentWaterFlow(0.0);
      setCurrentSaltFlow(0.0);
      setProcessState('WATER_FILLING');
      showNotification('🌊 Water filling initiated (Pump 1 ON)...');
    } else {
      setTanks(prev => prev.map(t => t.id === activeId ? { ...t, isCycling: false } : t));
      setProcessState('STANDBY');
      setPredictionStatus('AI Automation Ready');
      showNotification('⏹ Process cycle terminated by user.');
    }
  };

  useEffect(() => {
    let interval = null;
    if (activeTank.isCycling) {
      if (processState === 'WATER_FILLING') {
        interval = setInterval(() => {
          setCurrentWaterFlow(prev => {
            if (prev >= aiWaterLiters) {
              clearInterval(interval);
              setProcessState('SALT_ADDING');
              showNotification('🧂 Water level reached. Adding 3% salt mixture...');
              return aiWaterLiters;
            }
            return Number((prev + 0.2).toFixed(2));
          });
        }, 300);
      } else if (processState === 'SALT_ADDING') {
        interval = setInterval(() => {
          setCurrentSaltFlow(prev => {
            const targetSaltLiters = aiSaltGrams / 1000.0;
            if (prev >= targetSaltLiters) {
              clearInterval(interval);
              setProcessState('HEATING');
              showNotification('🔥 Heating element activated...');
              return targetSaltLiters;
            }
            return Number((prev + 0.05).toFixed(2));
          });
        }, 300);
      } else if (processState === 'HEATING') {
        if (espTemp >= 98.0) {
          setProcessState('BOILING_ACTIVE');
          showNotification('♨️ Boiling temperature reached. Timer started!');
        }
      } else if (processState === 'BOILING_ACTIVE') {
        interval = setInterval(() => {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setTanks(tList => tList.map(t => t.id === activeId ? { ...t, isCycling: false } : t));
              setProcessState('STANDBY');
              showNotification('🎉 Boiling process completed successfully.');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [activeTank.isCycling, processState, aiWaterLiters, aiSaltGrams, espTemp, activeId]);

  const fieldStyle = {
    width: '100%', padding: '12px 14px 12px 42px', border: `1px solid ${C.border}`,
    borderRadius: 12, background: C.surface, fontWeight: 700, fontSize: 14,
    fontFamily: FONT_MONO, color: C.ink, outline: 'none', boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
    fontWeight: 700, letterSpacing: '0.5px', fontFamily: FONT_DISPLAY, textTransform: 'uppercase'
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '24px 32px', fontFamily: FONT_BODY, color: C.ink }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .bd-grid { display: grid; grid-template-columns: 1fr 1.15fr 1.35fr; gap: 20px; }
        @media (max-width: 1024px) { .bd-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000, maxWidth: 380,
          background: '#0F172A', color: '#FFFFFF', padding: '16px 20px', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600,
          borderLeft: `4px solid ${C.primary}`, animation: 'slideIn 0.25s ease'
        }}>
          <Bell size={18} color={C.primary} style={{ flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Card style={{ padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
          }}>
            <Waves size={24} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: FONT_DISPLAY }}>
              AquaSense Industrial Dashboard
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <span>Active: <strong style={{ color: C.primary }}>{activeTank.name}</strong></span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isMqttConnected ? C.success : C.danger }}>
                <Wifi size={13} /> {isMqttConnected ? 'Laser & ESP32 Synced' : 'Hardware Gateway Offline'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, background: C.surface, padding: 6, borderRadius: 16, border: `1px solid ${C.border}` }}>
          {tanks.map(t => (
            <button key={t.id} onClick={() => setActiveId(t.id)} style={{
              padding: '8px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: activeId === t.id ? C.primary : 'transparent',
              color: activeId === t.id ? '#FFFFFF' : C.muted,
              fontSize: 12, fontWeight: 700, fontFamily: FONT_DISPLAY
            }}>
              {t.name}
            </button>
          ))}
          <button onClick={addTank} style={{
            padding: '8px 16px', borderRadius: 12, border: `1px dashed ${C.faint}`, cursor: 'pointer',
            background: 'transparent', color: C.primary, fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT_DISPLAY
          }}>
            <Plus size={14} /> Tank
          </button>
        </div>
      </Card>

      {/* Process Rail */}
      <Card style={{ padding: '22px 28px', marginBottom: 20 }}>
        <ProcessRail processState={processState} isCycling={activeTank.isCycling} />
      </Card>

      <div className="bd-grid">

        {/* INPUT PARAMETERS (AUTO-SYNCED) */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <SectionLabel color={C.primary}>Batch Parameters</SectionLabel>
              <span style={{ fontSize: 10.5, color: C.primary, fontWeight: 700, background: C.primarySoft, padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <RefreshCw size={11} /> Auto-Sync Active
              </span>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                <span>Fish Batch Weight (kg)</span>
                {activeTank.fishWeight > 0 && <span style={{ color: C.primary }}>Live Calibrated</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <Scale size={16} color={C.muted} style={{ position: 'absolute', left: 14, top: 14 }} />
                <input type="number" step="0.01" value={activeTank.fishWeight}
                  onChange={(e) => handleInputChange('fishWeight', e.target.value)} style={fieldStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                <span>Max Fish Thickness (mm)</span>
                {activeTank.thickness > 0 && <span style={{ color: C.primary }}>Laser Apex Synced</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <Ruler size={16} color={C.muted} style={{ position: 'absolute', left: 14, top: 14 }} />
                <input type="number" step="0.1" value={activeTank.thickness}
                  onChange={(e) => handleInputChange('thickness', e.target.value)} style={fieldStyle} />
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 700, fontFamily: FONT_DISPLAY, marginBottom: 4 }}>AI STATUS</div>
            <div style={{ fontSize: 12, color: C.ink, fontWeight: 600, fontFamily: FONT_MONO, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} color={C.primary} /> {predictionStatus}
            </div>
          </div>
        </Card>

        {/* LIVE TELEMETRY */}
        <Card style={{ padding: 24 }}>
          <SectionLabel color={C.water}>Live Telemetry</SectionLabel>

          <div style={{ textAlign: 'center', padding: '12px 0 16px', borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ fontSize: 44, color: C.ink, fontWeight: 700, fontFamily: FONT_MONO, lineHeight: 1 }}>
              {espTemp.toFixed(1)}<span style={{ fontSize: 22, color: C.muted }}>&deg;C</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, fontFamily: FONT_DISPLAY, marginTop: 4 }}>
              DS18B20 TEMPERATURE SENSOR (GPIO 4)
            </div>
          </div>

          <div style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: isSaltDetected ? C.successSoft : C.dangerSoft,
            border: `1px solid ${isSaltDetected ? '#86EFAC' : '#FCA5A5'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FlaskConical size={18} color={isSaltDetected ? C.success : C.danger} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: isSaltDetected ? C.success : C.danger, fontFamily: FONT_DISPLAY }}>
                  {isSaltDetected ? 'SALT PRESENT (DETECTED)' : 'NO SALT DETECTED'}
                </div>
                <div style={{ fontSize: 10, color: C.muted }}>TDS Sensor (Analog Pin 34)</div>
              </div>
            </div>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: isSaltDetected ? C.success : C.danger
            }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.ink }}>
                <Droplet size={14} color={C.water} /> Water Intake Level
              </div>
              <div style={{ fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, color: C.water }}>
                {currentWaterFlow.toFixed(2)} <span style={{ color: C.muted, fontWeight: 500 }}>/ {aiWaterLiters} L</span>
              </div>
            </div>
            <FlowBar value={currentWaterFlow} max={aiWaterLiters || 1} color={C.water} softColor={C.waterSoft} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.ink }}>
                <FlaskConical size={14} color={C.salt} /> Salt Mixture (3%)
              </div>
              <div style={{ fontSize: 13, fontFamily: FONT_MONO, fontWeight: 700, color: C.salt }}>
                {(currentSaltFlow * 1000).toFixed(0)} <span style={{ color: C.muted, fontWeight: 500 }}>/ {aiSaltGrams} g</span>
              </div>
            </div>
            <FlowBar value={currentSaltFlow * 1000} max={aiSaltGrams || 1} color={C.salt} softColor={C.saltSoft} />
          </div>
        </Card>

        {/* METRICS & AUTOMATION CONTROL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card style={{ padding: 20 }}>
            <SectionLabel color={C.muted}>AI Target Distribution</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <GaugeArc value={currentWaterFlow} max={activeTank.maxCapacity} color={C.water} unit="L" label="WATER" />
              <GaugeArc value={currentSaltFlow * 1000} max={activeTank.maxCapacity * 30} color={C.salt} unit="g" label="SALT" />
              <GaugeArc value={activeTank.fishWeight} max={10} color={C.primary} unit="kg" label="BATCH" />
            </div>
          </Card>

          {processState === 'BOILING_ACTIVE' && (
            <Card style={{ padding: '16px 20px', background: C.dangerSoft, border: '1px solid #FCA5A5', textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.danger, letterSpacing: '1px', fontFamily: FONT_DISPLAY, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Timer size={14} /> BOILING IN PROGRESS
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: FONT_MONO, color: C.danger, margin: '6px 0' }}>
                {Math.floor(remainingSeconds / 60)}:{('0' + (remainingSeconds % 60)).slice(-2)} Mins
              </div>
            </Card>
          )}

          <button onClick={startAutomatedBoiling} style={{
            width: '100%', padding: '18px 20px', borderRadius: 14,
            border: activeTank.isCycling ? `1px solid #FCA5A5` : 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: activeTank.isCycling ? C.dangerSoft : `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`,
            boxShadow: activeTank.isCycling ? 'none' : `0 10px 20px -6px ${C.primary}`,
            transition: 'all 0.2s ease'
          }}>
            {activeTank.isCycling ? <Square size={16} color={C.danger} /> : <Play size={16} color="#FFFFFF" />}
            <span style={{ fontWeight: 700, fontSize: 13.5, color: activeTank.isCycling ? C.danger : '#FFFFFF', fontFamily: FONT_DISPLAY, letterSpacing: '0.5px' }}>
              {activeTank.isCycling ? 'TERMINATE CYCLE' : 'START AI AUTOMATED BOILING'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}