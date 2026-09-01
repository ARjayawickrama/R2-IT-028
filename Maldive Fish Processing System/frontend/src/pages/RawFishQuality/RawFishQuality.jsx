import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import mqtt from 'mqtt';
import {
  ShieldCheck,
  Flame,
  Wind,
  Droplets,
  Sparkles,
  Radio,
  Wifi,
  WifiOff,
  Activity,
  Upload,
  Camera,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  ChevronRight,
  Video,
  VideoOff,
  Settings
} from 'lucide-react';
import { rawFishService } from '../../services/api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const AI_BACKEND_URL = 'http://localhost:8000';
const FRESHNESS_API_URL = `${AI_BACKEND_URL}/predict`;
const MQTT_WS_BROKER = 'wss://broker.hivemq.com:8884/mqtt';
const MQTT_SENSOR_TOPIC = 'fish/sorting/mq135';
const MQTT_STATUS_TOPIC = 'fish/sorting/status';
const MQTT_COMMAND_TOPIC = 'fish/sorting/command';

/**
 * MQ-135 Tuna Freshness Thresholds
 * Reference Table:
 * - Very Fresh:         <= 90   (Typical: 59 – 88)
 * - Fresh / Acceptable: 91 – 150 (Typical: 118 – 145)
 * - Spoiled:            > 150   (Typical: 150 – 200)
 */
export const getMqFreshnessDetails = (value) => {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return {
      level: 'Awaiting Telemetry',
      range: 'Standby',
      typical: 'N/A',
      badge: 'bg-slate-100 text-slate-600 border-slate-300',
      bgLight: 'bg-slate-50',
      borderLight: 'border-slate-200',
      textColor: 'text-slate-500',
      color: '#94A3B8',
      command: 'IDLE',
      qualityText: 'Waiting for Sensor...',
      suitability: 'Awaiting MQ-135 reading from ESP32',
      desc: 'Hardware is connecting to HiveMQ broker. Waiting for live sensor packet on fish/sorting/mq135.'
    };
  }

  const num = Number(value);
  if (num <= 90) {
    return {
      level: 'Very Fresh',
      range: '≤ 90',
      typical: '59 – 88',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      bgLight: 'bg-emerald-50/80',
      borderLight: 'border-emerald-200',
      textColor: 'text-emerald-700',
      color: '#10B981',
      command: 'A',
      qualityText: 'Optimal Freshness',
      suitability: 'Ready for boiling & Maldive fish processing',
      desc: 'Minimal volatile gas emissions. Optimal muscle tissue condition with lowest volatile organic base level.'
    };
  } else if (num <= 150) {
    return {
      level: 'Fresh / Acceptable',
      range: '91 – 150',
      typical: '118 – 145',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      bgLight: 'bg-blue-50/80',
      borderLight: 'border-blue-200',
      textColor: 'text-blue-700',
      color: '#3B82F6',
      command: 'B',
      qualityText: 'Acceptable Freshness',
      suitability: 'Process immediately without delay',
      desc: 'Moderate gas emissions within acceptable limits. Early breakdown amines present.'
    };
  } else {
    return {
      level: 'Spoiled',
      range: '> 150',
      typical: '150 – 200',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      bgLight: 'bg-rose-50/80',
      borderLight: 'border-rose-200',
      textColor: 'text-rose-700',
      color: '#EF4444',
      command: 'C',
      qualityText: 'Spoiled / Unsafe',
      suitability: 'Batch rejected - Do not process',
      desc: 'High concentration of decomposition gases (ammonia & volatile basic nitrogen). Reject batch.'
    };
  }
};

const RawFishQuality = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [batchId, setBatchId] = useState('RF-' + Date.now().toString().slice(-6));
  const [species, setSpecies] = useState('Alagoduwa');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // ─── Camera / Live Stream States ───────────────────────────────────────────
  const [cameraActive, setCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState('Ready for assessment. Connect ESP32 or upload a raw fish image.');
  const [qualityData, setQualityData] = useState([]);

  // ─── Real-Time MQTT / ESP32 Hardware State (No Dummy Initial Values) ──────
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const [mqValue, setMqValue] = useState(null); // Real-time MQ-135 value from ESP32 (null = waiting)
  const [hardwareQuality, setHardwareQuality] = useState(null);
  const [hardwareStatus, setHardwareStatus] = useState('STANDBY');
  const [lastCommand, setLastCommand] = useState('IDLE');
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);
  const mqttClientRef = useRef(null);

  // Time-series history for live chart (Starts clean)
  const [mqHistory, setMqHistory] = useState([]);

  // Logged readings for history table & CSV export (Starts clean)
  const [mqLogs, setMqLogs] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const tabs = [
    ['upload', '📤 Upload & AI Assessment'],
    ['live', '🎥 Live Camera Detection'],
    ['mq135', '💨 MQ-135 Sensor & Sorter Telemetry'],
    ['history', '📋 Assessment History'],
    ['analytics', '📊 Quality Analytics'],
  ];

  // ─── Enumerate Camera Devices ─────────────────────────────────────────────
  const refreshCameraDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('Could not enumerate video devices:', e);
    }
  };

  useEffect(() => {
    refreshCameraDevices();
  }, []);

  // ─── Video Ref Stream Binder Effect ───────────────────────────────────────
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current
        .play()
        .then(() => {
          setCameraActive(true);
        })
        .catch((err) => {
          console.warn('Video play attempt:', err);
        });
    }
  }, [videoStream, activeTab]);

  // ─── Camera Control Handlers ──────────────────────────────────────────────
  const startCamera = async (deviceIdToUse) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setFeedback('Webcam access is not supported in this browser.');
      return;
    }

    try {
      setIsCameraLoading(true);
      setFeedback('Initializing webcam connection...');

      // Stop any existing stream
      if (videoStream) {
        videoStream.getTracks().forEach((t) => t.stop());
      }

      const devId = deviceIdToUse || selectedDeviceId;
      const constraints = {
        video: devId
          ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      setCameraActive(true);
      setIsCameraLoading(false);
      setFeedback('Webcam connected successfully! Position fish specimen and capture.');

      // Refresh device list with granted labels
      refreshCameraDevices();
    } catch (error) {
      console.error('Camera connection failed:', error);
      setIsCameraLoading(false);
      setCameraActive(false);
      setFeedback(`Camera error: ${error.message || 'Please check webcam permissions.'}`);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setFeedback('Webcam stopped.');
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setFeedback('Webcam is not ready for capture.');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `webcam-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedFile(file);
      await analyzeImage(file, 'camera');
    }, 'image/jpeg', 0.95);
  };

  // ─── MQTT Connection to HiveMQ (Matching crack.cc) ────────────────────────
  useEffect(() => {
    let client = null;
    try {
      client = mqtt.connect(MQTT_WS_BROKER, {
        clientId: 'FishFrontend-' + Math.random().toString(16).slice(2, 8),
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
      });
      mqttClientRef.current = client;

      client.on('connect', () => {
        setIsMqttConnected(true);
        client.subscribe([MQTT_SENSOR_TOPIC, MQTT_STATUS_TOPIC], (err) => {
          if (!err) {
            console.log(`Subscribed to ${MQTT_SENSOR_TOPIC} and ${MQTT_STATUS_TOPIC}`);
          }
        });
      });

      client.on('message', (topic, payload) => {
        try {
          const str = payload.toString();
          const data = JSON.parse(str);
          const nowStr = new Date().toLocaleTimeString();

          if (topic === MQTT_SENSOR_TOPIC || data.mq135 !== undefined) {
            const rawVal = Number(data.mq135);
            if (!isNaN(rawVal)) {
              setMqValue(rawVal);
              if (data.quality) setHardwareQuality(data.quality);
              setLastUpdatedTime(nowStr);

              setMqHistory((prev) => {
                const updated = [...prev, { time: nowStr, value: rawVal }];
                return updated.slice(-25);
              });
            }
          }

          if (topic === MQTT_STATUS_TOPIC) {
            if (data.command) setLastCommand(data.command);
            if (data.status) setHardwareStatus(data.status);
            if (data.mq135 !== undefined) {
              const rawVal = Number(data.mq135);
              if (!isNaN(rawVal)) {
                setMqValue(rawVal);
              }
            }
          }
        } catch (e) {
          console.warn('MQTT Message parse error:', e);
        }
      });

      client.on('error', (e) => {
        console.warn('MQTT Error:', e);
        setIsMqttConnected(false);
      });

      client.on('offline', () => setIsMqttConnected(false));
      client.on('close', () => setIsMqttConnected(false));
    } catch (err) {
      console.error('MQTT connection setup failed:', err);
    }

    return () => {
      if (client) client.end();
    };
  }, []);



  useEffect(() => {
    loadHistory();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopCamera();
    };
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await rawFishService.fetchHistory();
      setHistory(data);
      updateQualityData(data);
    } catch (error) {
      console.error('Could not load raw fish history:', error);
    }
  };

  const updateQualityData = (historyRecords) => {
    const counts = { 'very fresh': 0, 'fresh': 0, 'spoiled': 0 };
    historyRecords.forEach((record) => {
      const label = record.qualityLabel;
      if (label === 'Alagoduwa_Very_fresh') counts['very fresh']++;
      else if (label === 'Alagoduwa_fresh') counts['fresh']++;
      else if (label === 'Alagoduwa_Spoiled') counts['spoiled']++;
    });
    const data = [
      { name: 'Very Fresh', value: counts['very fresh'], color: '#10B981' },
      { name: 'Fresh', value: counts['fresh'], color: '#3B82F6' },
      { name: 'Spoiled', value: counts['spoiled'], color: '#EF4444' }
    ].filter((item) => item.value > 0);
    setQualityData(data);
  };

  const deleteAssessment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await rawFishService.deleteAssessment(id);
      const updatedHistory = history.filter((record) => record._id !== id);
      setHistory(updatedHistory);
      updateQualityData(updatedHistory);
      setFeedback('Assessment deleted successfully.');
    } catch (error) {
      console.error('Could not delete assessment:', error);
      setFeedback('Failed to delete assessment.');
    }
  };

  // ─── Dispatch MQTT Hardware Command ────────────────────────────────────────
  const sendHardwareCommand = async (cmd) => {
    const cleanCmd = cmd.trim().toUpperCase();
    try {
      if (mqttClientRef.current && isMqttConnected) {
        mqttClientRef.current.publish(MQTT_COMMAND_TOPIC, cleanCmd);
      }
      const formData = new FormData();
      formData.append('command', cleanCmd);
      await fetch(`${AI_BACKEND_URL}/sensor/command`, { method: 'POST', body: formData });
      setLastCommand(cleanCmd);
      setFeedback(`Sent Hardware Command: '${cleanCmd}' to topic ${MQTT_COMMAND_TOPIC}`);
    } catch (e) {
      console.error('Failed to send hardware command:', e);
      setFeedback(`Command dispatch failed: ${e.message}`);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFeedback('Image selected. Click Analyze to process with YOLO & MQ-135 telemetry.');
  };

  const getFreshnessScoreFromLabel = (label) => {
    switch (label?.toLowerCase()) {
      case 'alagoduwa_very_fresh':
      case 'very fresh':
        return 98;
      case 'alagoduwa_fresh':
      case 'fresh':
        return 82;
      case 'alagoduwa_spoiled':
      case 'spoiled':
        return 28;
      default:
        return 50;
    }
  };

  const getLabelBadgeColor = (label) => {
    if (!label) return 'bg-gray-100 text-gray-700';
    if (label.toLowerCase().includes('very_fresh')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (label.toLowerCase().includes('fresh')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (label.toLowerCase().includes('spoiled')) return 'bg-rose-100 text-rose-800 border-rose-300';
    return 'bg-gray-100 text-gray-700';
  };

  const analyzeImage = async (file, source) => {
    try {
      setIsAnalyzing(true);
      setFeedback('Running AI Vision inference and correlating MQ-135 sensor telemetry...');
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(FRESHNESS_API_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('AI Freshness API returned an error');
      const apiResult = await response.json();
      const results = apiResult.results || [];
      const qualityLabel = results.length ? results[0].class : 'Alagoduwa_Very_fresh';
      const freshnessScore = getFreshnessScoreFromLabel(qualityLabel);
      const triggeredCmd = apiResult.command_triggered;

      const payload = {
        batchId: batchId || `RF-${Date.now().toString().slice(-6)}`,
        species,
        source,
        analysisDate: new Date().toISOString(),
        freshnessScore,
        qualityLabel,
        assessment: { total_detections: apiResult.total_detections ?? results.length, results },
        imageName: file.name,
      };

      const savedResponse = await rawFishService.saveAnalysis(payload);
      setAnalysisResult({
        ...payload,
        commandTriggered: triggeredCmd,
        mqValueAtAssessment: mqValue,
        mqStatusAtAssessment: getMqFreshnessDetails(mqValue),
      });

      const updatedHistory = [savedResponse.data, ...history].slice(0, 20);
      setHistory(updatedHistory);
      updateQualityData(updatedHistory);
      setFeedback(`Analysis completed! Classification: ${qualityLabel} (Auto MQTT Command: ${triggeredCmd || 'N/A'})`);
    } catch (error) {
      console.error('Analysis failed:', error);
      setFeedback(error.message || 'There was an error analyzing the image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogCurrentReading = () => {
    if (mqValue === null) {
      alert('No active MQ-135 reading from ESP32 yet.');
      return;
    }
    const details = getMqFreshnessDetails(mqValue);
    const newEntry = {
      id: `MQ-LOG-${Date.now().toString().slice(-4)}`,
      batchId: batchId || `RF-${Date.now().toString().slice(-6)}`,
      species,
      timestamp: new Date().toLocaleTimeString(),
      value: mqValue,
      level: details.level,
      command: details.command,
    };
    setMqLogs([newEntry, ...mqLogs]);
    setFeedback(`Logged MQ-135 reading: ${mqValue} (${details.level})`);
  };

  const handleExportCsv = () => {
    if (mqLogs.length === 0) {
      alert('No logged sensor records to export.');
      return;
    }
    const headers = 'Log ID,Batch ID,Species,Timestamp,MQ135 Value,Freshness Level,Auto Command\n';
    const rows = mqLogs.map(l => `"${l.id}","${l.batchId}","${l.species}","${l.timestamp}",${l.value},"${l.level}","${l.command}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mq135_tuna_freshness_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentMq = getMqFreshnessDetails(mqValue);

  // ─── Analytics stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const veryFresh = history.filter((b) => b.qualityLabel === 'Alagoduwa_Very_fresh').length;
    const fresh = history.filter((b) => b.qualityLabel === 'Alagoduwa_fresh').length;
    const spoiled = history.filter((b) => b.qualityLabel === 'Alagoduwa_Spoiled').length;
    const total = history.length;
    return { veryFresh, fresh, spoiled, total };
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12">
      {/* ── Top App Bar ── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xl shadow-md">
              🐟
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Raw Catch Freshness & MQ-135 Telemetry</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                  Live Vision + Gas QC
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Alagoduwa (Skipjack Tuna) freshness assessment & automated sorting control (crack.cc hardware synced)
              </p>
            </div>
          </div>

          {/* Quick Hardware Status Chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">Batch:</span>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-24 px-1.5 py-0.5 font-bold text-slate-700 bg-white border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Live MQ-135 Quick Chip (Real-time, No dummy values) */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${currentMq.borderLight} ${currentMq.bgLight} transition-all shadow-sm`}>
              <Activity className={`w-4 h-4 ${currentMq.textColor} ${mqValue !== null ? 'animate-pulse' : ''}`} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-slate-600">MQ-135:</span>
                <span className={`text-sm font-extrabold ${currentMq.textColor}`}>
                  {mqValue !== null ? `${mqValue} PPM` : '--'}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${currentMq.badge}`}>
                  {currentMq.level}
                </span>
              </div>
            </div>

            {/* MQTT Connection State */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${isMqttConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
              {isMqttConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
              <span>{isMqttConnected ? 'ESP32 MQTT Synced' : 'MQTT Standby'}</span>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition text-xs font-medium shadow-sm"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex gap-2 px-6 overflow-x-auto bg-slate-50/50 border-t">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (id === 'live' && !cameraActive) {
                  startCamera();
                }
              }}
              className={`px-4 py-2.5 border-b-2 whitespace-nowrap text-xs font-bold transition-all ${activeTab === id
                  ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-blue-600 hover:bg-white/60'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Status Feedback Banner ── */}
      {feedback && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 shadow-sm">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{feedback}</span>
            </div>
            <span className="text-[11px] text-blue-600 font-mono">Broker: broker.hivemq.com (1883)</span>
          </div>
        </div>
      )}

      {/* ── Main Tab Contents ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ════════════════════ UPLOAD & AI ASSESSMENT TAB ════════════════════ */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Input Selection (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
              <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Raw Fish Sample Input
              </h2>

              {/* Upload Drop Area */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50/50 flex flex-col justify-center items-center hover:bg-blue-100/60 transition group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition">
                  📤
                </div>
                <p className="text-sm text-blue-800 font-bold">Select Raw Fish Photo</p>
                <p className="text-xs text-slate-500 mt-1">Supports JPG / PNG (Alagoduwa specimen)</p>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

              {/* Live MQ-135 Mini Widget */}
              <div className={`p-4 rounded-2xl border ${currentMq.borderLight} ${currentMq.bgLight} space-y-2`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Live Gas Sensor (crack.cc)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {lastUpdatedTime ? `Updated: ${lastUpdatedTime}` : 'Awaiting ESP32'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-3xl font-black text-slate-900">
                      {mqValue !== null ? mqValue : '--'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 ml-1">PPM</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${currentMq.badge}`}>
                    {currentMq.level}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex justify-between pt-1 border-t border-slate-200/60">
                  <span>Threshold: <strong>{currentMq.range}</strong></span>
                  <span>Typical: <strong>{currentMq.typical}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => selectedFile && analyzeImage(selectedFile, 'upload')}
                disabled={isAnalyzing || !selectedFile}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing Assessment...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Raw Fish Freshness
                  </>
                )}
              </button>
            </div>

            {/* Center: Image Preview (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col">
              <h2 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
                <span>🖼️</span> Specimen Preview
              </h2>
              <div className="flex-1 min-h-[300px] rounded-xl border bg-slate-50 flex items-center justify-center overflow-hidden relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Fish Specimen" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center text-slate-400 p-6">
                    <div className="text-5xl mb-2">📸</div>
                    <p className="font-semibold text-sm text-slate-600">No Image Uploaded</p>
                    <p className="text-xs text-slate-400 mt-1">Upload a photo to see sample preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Integrated Assessment Results (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between space-y-4">
              <div>
                <h2 className="font-bold text-base text-slate-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Assessment Outcome
                  </span>
                  {analysisResult && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {analysisResult.batchId}
                    </span>
                  )}
                </h2>

                {analysisResult ? (
                  <div className="space-y-3">
                    {/* YOLO Vision Result */}
                    <div className={`p-4 rounded-xl border ${getLabelBadgeColor(analysisResult.qualityLabel)} space-y-1`}>
                      <div className="flex justify-between items-center text-xs font-semibold opacity-80">
                        <span>AI Vision Result (YOLO)</span>
                        <span>Score: {analysisResult.freshnessScore}%</span>
                      </div>
                      <h3 className="text-lg font-extrabold tracking-tight">
                        {analysisResult.qualityLabel}
                      </h3>
                    </div>

                    {/* MQ-135 Gas Correlation */}
                    <div className={`p-4 rounded-xl border ${analysisResult.mqStatusAtAssessment.borderLight} ${analysisResult.mqStatusAtAssessment.bgLight} space-y-1`}>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                        <span>MQ-135 Gas Reading</span>
                        <span>{analysisResult.mqValueAtAssessment !== null ? `${analysisResult.mqValueAtAssessment} PPM` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-bold ${analysisResult.mqStatusAtAssessment.textColor}`}>
                          {analysisResult.mqStatusAtAssessment.level}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Range: {analysisResult.mqStatusAtAssessment.range}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 pt-1 leading-tight">
                        {analysisResult.mqStatusAtAssessment.desc}
                      </p>
                    </div>

                    {/* Sorter Command Triggered */}
                    <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Automated Sorter Action</span>
                        <span className="text-emerald-400 font-bold">crack.cc Synced</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-bold text-white">
                          Dispatched Command: <span className="text-yellow-400 font-mono text-base font-black">[{analysisResult.commandTriggered || analysisResult.mqStatusAtAssessment.command}]</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <Layers className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold text-slate-500">Awaiting Fish Specimen Analysis</p>
                    <p className="text-[11px] text-slate-400">Upload or capture an image to generate dual QC verdict</p>
                  </div>
                )}
              </div>

              {/* Direct Hardware Trigger Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Manual Sorter Command Dispatch
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => sendHardwareCommand('A')}
                    className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition flex flex-col items-center"
                  >
                    <span>Command A</span>
                    <span className="text-[9px] font-normal">High Quality</span>
                  </button>
                  <button
                    onClick={() => sendHardwareCommand('B')}
                    className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold transition flex flex-col items-center"
                  >
                    <span>Command B</span>
                    <span className="text-[9px] font-normal">Medium Quality</span>
                  </button>
                  <button
                    onClick={() => sendHardwareCommand('C')}
                    className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition flex flex-col items-center"
                  >
                    <span>Command C</span>
                    <span className="text-[9px] font-normal">Spoiled / Reject</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ════════════════════ LIVE CAMERA DETECTION TAB ════════════════════ */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden p-6">
            {/* Camera Controls Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Live Webcam QC Rig
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connect local webcam or USB camera feed for instant on-conveyor fish freshness scans.
                </p>
              </div>

              {/* Camera Source Selector */}
              {videoDevices.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Select Camera Device:
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      if (cameraActive) {
                        startCamera(e.target.value);
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {videoDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {!cameraActive ? (
                  <button
                    onClick={() => startCamera()}
                    disabled={isCameraLoading}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-md disabled:bg-slate-300"
                  >
                    {isCameraLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Connecting Camera...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Connect & Start Webcam
                      </>
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={stopCamera}
                      className="py-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <VideoOff className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                    <button
                      onClick={() => startCamera()}
                      className="py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restart
                    </button>
                  </div>
                )}

                <button
                  onClick={captureFromCamera}
                  disabled={!cameraActive || isAnalyzing}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  {isAnalyzing ? 'Analyzing Specimen...' : '📸 Capture & Analyze'}
                </button>
              </div>

              {/* Real-time MQ-135 Gas Reading */}
              <div className={`p-4 rounded-xl border ${currentMq.borderLight} ${currentMq.bgLight} space-y-2`}>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Current Gas Reading</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${currentMq.badge}`}>{currentMq.level}</span>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {mqValue !== null ? `${mqValue} PPM` : '--'}
                </div>
                <p className="text-[11px] text-slate-500">
                  Target threshold range: <strong>{currentMq.range}</strong>
                </p>
              </div>
            </div>

            {/* Video Viewport (8 cols) */}
            <div className="lg:col-span-8 p-4 flex flex-col items-center justify-center bg-slate-950 rounded-2xl relative min-h-[460px] overflow-hidden border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full max-h-[480px] object-contain rounded-xl shadow-2xl ${cameraActive ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {!cameraActive && (
                <div className="text-center text-slate-400 space-y-4 p-8">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
                    📷
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-200">Webcam Disconnected</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Click <strong>'Connect & Start Webcam'</strong> above to activate live camera video streaming.
                    </p>
                  </div>
                  <button
                    onClick={() => startCamera()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    Activate Webcam Now
                  </button>
                </div>
              )}

              {cameraActive && (
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-mono flex items-center gap-2 border border-emerald-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  WEBCAM STREAM LIVE
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ MQ-135 SENSOR & SORTER TELEMETRY TAB ════════════════════ */}
        {activeTab === 'mq135' && (
          <div className="space-y-6">

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Card 1: Real-Time Value (No dummy values) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MQ-135 SENSOR VALUE</span>
                    <h3 className="text-4xl font-extrabold text-slate-900 mt-2 flex items-baseline gap-2">
                      <span>{mqValue !== null ? mqValue : '--'}</span>
                      <span className="text-sm font-semibold text-slate-400">PPM</span>
                    </h3>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${currentMq.bgLight} ${currentMq.textColor} flex items-center justify-center text-xl font-bold`}>
                    💨
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentMq.badge}`}>
                    {currentMq.level}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {lastUpdatedTime ? `Sync: ${lastUpdatedTime}` : 'Awaiting ESP32'}
                  </span>
                </div>
              </div>

              {/* Card 2: Associated Sorter Command */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ESP32 SORTING COMMAND</span>
                    <h3 className="text-3xl font-extrabold text-slate-900 mt-2 flex items-baseline gap-2">
                      <span>Command {currentMq.command}</span>
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-700 flex items-center justify-center text-xl font-bold">
                    ⚡
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Auto Routing:</span>
                  <span className="font-bold text-slate-800">{currentMq.qualityText}</span>
                </div>
              </div>

              {/* Card 3: ESP32 Hardware Link */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MQTT PROTOCOL STATUS</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${isMqttConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
                      {isMqttConnected ? 'Broker Connected' : 'Broker Standby'}
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl">
                    📡
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Topic: {MQTT_SENSOR_TOPIC}</span>
                  <span>Port: 1883</span>
                </div>
              </div>

            </div>

            {/* Middle Section: Threshold Table Widget (From user's uploaded image) + Live Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Threshold Reference Table Widget (5 Cols) */}
              <div className="lg:col-span-5 bg-black text-white rounded-2xl p-6 shadow-md flex flex-col justify-between border border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    MQ-135 Tuna Freshness Thresholds
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Classification ranges derived from Alagoduwa volatile gas experiments
                  </p>

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="grid grid-cols-2 pb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
                      <span>Freshness Level</span>
                      <span>MQ-135 Value Range</span>
                    </div>

                    {/* Row 1: Very Fresh */}
                    <div className={`grid grid-cols-2 py-3 px-3 rounded-xl border transition-all ${mqValue !== null && mqValue <= 90
                        ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold ring-1 ring-emerald-500'
                        : 'border-transparent text-slate-300'
                      }`}>
                      <div className="flex items-center gap-2">
                        {mqValue !== null && mqValue <= 90 && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                        <span className="text-sm">Very Fresh</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold">≤ 90</span>
                        <span className="text-xs text-slate-400 ml-1">(Typical: 59 – 88)</span>
                      </div>
                    </div>

                    {/* Row 2: Fresh / Acceptable */}
                    <div className={`grid grid-cols-2 py-3 px-3 rounded-xl border transition-all ${mqValue !== null && mqValue > 90 && mqValue <= 150
                        ? 'bg-blue-950/60 border-blue-500 text-white font-bold ring-1 ring-blue-500'
                        : 'border-transparent text-slate-300'
                      }`}>
                      <div className="flex items-center gap-2">
                        {mqValue !== null && mqValue > 90 && mqValue <= 150 && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
                        <span className="text-sm">Fresh / Acceptable</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold">91 – 150</span>
                        <span className="text-xs text-slate-400 ml-1">(Typical: 118 – 145)</span>
                      </div>
                    </div>

                    {/* Row 3: Spoiled */}
                    <div className={`grid grid-cols-2 py-3 px-3 rounded-xl border transition-all ${mqValue !== null && mqValue > 150
                        ? 'bg-rose-950/60 border-rose-500 text-white font-bold ring-1 ring-rose-500'
                        : 'border-transparent text-slate-300'
                      }`}>
                      <div className="flex items-center gap-2">
                        {mqValue !== null && mqValue > 150 && <span className="w-2 h-2 rounded-full bg-rose-400"></span>}
                        <span className="text-sm">Spoiled</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold">&gt; 150</span>
                        <span className="text-xs text-slate-400 ml-1">(Typical: 150 – 200)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Current Active Classification:</span>
                  <span className={`font-bold ${mqValue === null ? 'text-slate-400' :
                      mqValue <= 90 ? 'text-emerald-400' :
                        mqValue <= 150 ? 'text-blue-400' : 'text-rose-400'
                    }`}>
                    {mqValue !== null ? `${currentMq.level} (${mqValue} PPM)` : 'Awaiting ESP32 Telemetry'}
                  </span>
                </div>
              </div>

              {/* Live Telemetry Chart (7 Cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Real-Time MQ-135 Sensor Stream</h3>
                    <p className="text-xs text-slate-500">Live time-series readings received over MQTT from ESP32</p>
                  </div>
                  <button
                    onClick={handleLogCurrentReading}
                    disabled={mqValue === null}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    📝 Log Reading
                  </button>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  {mqHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mqHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="mqGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={currentMq.color} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={currentMq.color} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis domain={[0, 'auto']} stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '11px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="MQ-135 (PPM)"
                          stroke={currentMq.color}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#mqGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-slate-400 text-xs p-6">
                      <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-500">Awaiting Live Sensor Stream</p>
                      <p className="text-slate-400 mt-0.5">When ESP32 publishes readings to <code>{MQTT_SENSOR_TOPIC}</code>, the live curve will appear here.</p>
                    </div>
                  )}
                </div>

                {/* Sorter Controller Triggers */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">Manual Command Control:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendHardwareCommand('AUTO')}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-xs font-bold transition"
                    >
                      AUTO SORT
                    </button>
                    <button
                      onClick={() => sendHardwareCommand('A')}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition"
                    >
                      A (≤90)
                    </button>
                    <button
                      onClick={() => sendHardwareCommand('B')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold transition"
                    >
                      B (91-150)
                    </button>
                    <button
                      onClick={() => sendHardwareCommand('C')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition"
                    >
                      C (&gt;150)
                    </button>
                    <button
                      onClick={() => sendHardwareCommand('STOP')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition"
                    >
                      STOP
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Logged Readings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">MQ-135 Batch Log</h3>
                  <p className="text-xs text-slate-500">Recorded gas concentration measurements for raw fish batches</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCsv}
                    disabled={mqLogs.length === 0}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  {mqLogs.length > 0 && (
                    <button
                      onClick={() => setMqLogs([])}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition"
                    >
                      Clear Log
                    </button>
                  )}
                </div>
              </div>

              {mqLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No readings logged yet. When live data is received from ESP32, click "Log Reading" to record measurements.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400">
                        <th className="pb-2.5 font-semibold">LOG ID</th>
                        <th className="pb-2.5 font-semibold">BATCH ID</th>
                        <th className="pb-2.5 font-semibold">SPECIES</th>
                        <th className="pb-2.5 font-semibold">TIMESTAMP</th>
                        <th className="pb-2.5 font-semibold">MQ-135 VALUE</th>
                        <th className="pb-2.5 font-semibold">FRESHNESS LEVEL</th>
                        <th className="pb-2.5 font-semibold">AUTO COMMAND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mqLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-mono text-slate-600">{log.id}</td>
                          <td className="py-2.5 font-semibold text-slate-800">{log.batchId}</td>
                          <td className="py-2.5 text-slate-600">{log.species}</td>
                          <td className="py-2.5 text-slate-500">{log.timestamp}</td>
                          <td className="py-2.5 font-bold text-slate-900">{log.value} PPM</td>
                          <td className="py-2.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${log.value <= 90 ? 'bg-emerald-100 text-emerald-800' :
                                log.value <= 150 ? 'bg-blue-100 text-blue-800' :
                                  'bg-rose-100 text-rose-800'
                              }`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono font-bold text-blue-700">[{log.command}]</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ════════════════════ ASSESSMENT HISTORY TAB ════════════════════ */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Assessment History (MongoDB)</h2>
                <p className="text-xs text-slate-500">Archived raw fish quality assessment records</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {history.length} Records
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No saved assessments found.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {history.map((record) => (
                  <div key={record._id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition">
                    <div className={`h-2 w-full ${record.qualityLabel?.toLowerCase().includes('very_fresh') ? 'bg-emerald-500' :
                        record.qualityLabel?.toLowerCase().includes('fresh') ? 'bg-blue-500' :
                          'bg-rose-500'
                      }`} />
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{record.batchId}</p>
                          <p className="text-xs text-slate-400">{new Date(record.analysisDate).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => deleteAssessment(record._id)}
                          className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Assessment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getLabelBadgeColor(record.qualityLabel)}`}>
                          {record.qualityLabel}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Score: {record.freshnessScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ QUALITY ANALYTICS TAB ════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Total Assessments', value: stats.total, bg: 'bg-white', text: 'text-slate-800' },
                { label: 'Very Fresh (≤90)', value: stats.veryFresh, bg: 'bg-emerald-50', text: 'text-emerald-700' },
                { label: 'Fresh / Acceptable (91–150)', value: stats.fresh, bg: 'bg-blue-50', text: 'text-blue-700' },
                { label: 'Spoiled (>150)', value: stats.spoiled, bg: 'bg-rose-50', text: 'text-rose-700' },
              ].map((card) => (
                <div key={card.label} className={`${card.bg} rounded-2xl border border-slate-200/80 p-5 shadow-sm`}>
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <h3 className="text-3xl font-extrabold mt-2 text-slate-900">{card.value}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Batches analyzed</p>
                </div>
              ))}
            </div>

            {/* Quality Distribution Pie Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Quality Distribution</h2>
              <p className="text-xs text-slate-500 mb-4">Proportion of raw catch categories processed through the pipeline</p>
              {qualityData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qualityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {qualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} batches`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                  No batch data available for distribution graph.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RawFishQuality;
