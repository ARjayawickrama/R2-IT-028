import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { rawFishService } from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const FRESHNESS_API_URL = 'http://localhost:8000/predict';

const RawFishQuality = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [batchId, setBatchId] = useState('RF-' + Date.now());
  const [species, setSpecies] = useState('Alagoduwa');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState('Use the upload or camera feature to analyze fish freshness.');
  const [qualityData, setQualityData] = useState([]);
  const [autoCaptionActive, setAutoCaptionActive] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const autoCaptionIntervalRef = useRef(null);



  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const tabs = [
    ['upload', '📤 Upload Raw Fish'],
    ['live', '🎥 Detect Fish Live'],
    ['history', '📋 Assessment History'],
    ['analytics', '📊 Quality Analytics'],
  ];

  useEffect(() => {
    loadHistory();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopCamera();
      if (autoCaptionIntervalRef.current) clearInterval(autoCaptionIntervalRef.current);
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
    historyRecords.forEach(record => {
      const label = record.qualityLabel;
      if (label === 'Alagoduwa_Very_fresh') counts['very fresh']++;
      else if (label === 'Alagoduwa_fresh') counts['fresh']++;
      else if (label === 'Alagoduwa_Spoiled') counts['spoiled']++;
    });
    const data = [
      { name: 'Very Fresh', value: counts['very fresh'], color: '#10B981' },
      { name: 'Fresh', value: counts['fresh'], color: '#3B82F6' },
      { name: 'Spoiled', value: counts['spoiled'], color: '#EF4444' }
    ].filter(item => item.value > 0);
    setQualityData(data);
  };

  const deleteAssessment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await rawFishService.deleteAssessment(id);
      const updatedHistory = history.filter(record => record._id !== id);
      setHistory(updatedHistory);
      updateQualityData(updatedHistory);
      setFeedback('Assessment deleted successfully.');
    } catch (error) {
      console.error('Could not delete assessment:', error);
      setFeedback('Failed to delete assessment.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFeedback('Image ready for analysis. Click Analyze to continue.');
  };

  const getQualityColor = (quality) => {
    if (quality >= 90) return 'text-green-600';
    if (quality >= 80) return 'text-blue-600';
    if (quality >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFreshnessScoreFromLabel = (label) => {
    switch (label?.toLowerCase()) {
      case 'very fresh': return 98;
      case 'fresh': return 82;
      case 'spoiled': return 32;
      default: return 0;
    }
  };

  const getLabelBadgeColor = (label) => {
    switch (label?.toLowerCase()) {
      case 'very fresh': return 'bg-green-100 text-green-700';
      case 'fresh': return 'bg-blue-100 text-blue-700';
      case 'spoiled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setFeedback('Camera is not available in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setVideoStream(stream);
      setCameraActive(true);
      setFeedback('Camera started. Capture an image to analyze freshness.');
    } catch (error) {
      console.error('Camera start failed:', error);
      setFeedback('Unable to access camera. Check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setCameraActive(false);
    if (autoCaptionActive) {
      setAutoCaptionActive(false);
      setCurrentCaption('');
      if (autoCaptionIntervalRef.current) {
        clearInterval(autoCaptionIntervalRef.current);
        autoCaptionIntervalRef.current = null;
      }
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setFeedback('Camera preview is not ready.');
      return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) { setFeedback('Could not capture image.'); return; }
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedFile(file);
      await analyzeImage(file, 'camera');
    }, 'image/jpeg', 0.95);
  };

  const analyzeImage = async (file, source) => {
    try {
      setIsAnalyzing(true);
      setFeedback('Analyzing image through fish freshness API...');
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(FRESHNESS_API_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Fish freshness API returned an error');
      const apiResult = await response.json();
      const results = apiResult.results || [];
      const qualityLabel = results.length ? results[0].class : 'unknown';
      const freshnessScore = getFreshnessScoreFromLabel(qualityLabel);
      const payload = {
        batchId: batchId || `RF-${Date.now()}`,
        species,
        source,
        analysisDate: new Date().toISOString(),
        freshnessScore,
        qualityLabel,
        assessment: { total_detections: apiResult.total_detections ?? results.length, results },
        imageName: file.name,
      };
      const savedResponse = await rawFishService.saveAnalysis(payload);
      setAnalysisResult({ ...payload, assessment: payload.assessment });
      const updatedHistory = [savedResponse.data, ...history].slice(0, 10);
      setHistory(updatedHistory);
      updateQualityData(updatedHistory);
      setFeedback('Freshness analysis completed and saved to MongoDB.');
    } catch (error) {
      console.error('Analysis failed:', error);
      setFeedback(error.message || 'There was an error analyzing the image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeRealtime = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'realtime-capture.jpg', { type: 'image/jpeg' });
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(FRESHNESS_API_URL, { method: 'POST', body: formData });
        if (response.ok) {
          const apiResult = await response.json();
          const results = apiResult.results || [];
          const qualityLabel = results.length ? results[0].class : 'unknown';
          const freshnessScore = getFreshnessScoreFromLabel(qualityLabel);
          setCurrentCaption(`${qualityLabel} (${freshnessScore}%)`);
        }
      } catch (error) {
        console.error('Realtime analysis failed:', error);
        setCurrentCaption('Analysis error');
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleAutoCaption = () => {
    if (autoCaptionActive) {
      if (autoCaptionIntervalRef.current) { clearInterval(autoCaptionIntervalRef.current); autoCaptionIntervalRef.current = null; }
      setAutoCaptionActive(false);
      setCurrentCaption('');
      setFeedback('Auto caption stopped.');
    } else {
      if (!cameraActive) { setFeedback('Please start the camera first.'); return; }
      setAutoCaptionActive(true);
      setFeedback('Auto caption started. Analyzing live feed...');
      autoCaptionIntervalRef.current = setInterval(analyzeRealtime, 3000);
    }
  };

  const handleAnalyzeUpload = async () => {
    if (!selectedFile) { setFeedback('Please choose an image before analyzing.'); return; }
    await analyzeImage(selectedFile, 'upload');
  };

  const latestResult = analysisResult || {};

  // ─── Analytics stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const veryFresh = history.filter(b => b.qualityLabel === 'Alagoduwa_Very_fresh').length;
    const fresh = history.filter(b => b.qualityLabel === 'Alagoduwa_fresh').length;
    const spoiled = history.filter(b => b.qualityLabel === 'Alagoduwa_Spoiled').length;
    const total = history.length;
    return { veryFresh, fresh, spoiled, total };
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* ── Header ── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🐠 Raw Fish Quality Assessment</h1>
            <p className="text-sm text-slate-500">
              Upload Alagoduwa fish images or capture live to analyze freshness
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-2 px-6 overflow-x-auto">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-3 border-b-2 whitespace-nowrap font-medium transition-colors ${activeTab === id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-600 hover:text-blue-600'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="p-6">

        {/* ════════════════════ UPLOAD TAB ════════════════════ */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Input Source */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6 space-y-5">
              <h2 className="font-bold text-lg">Input Source</h2>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-44 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 flex flex-col justify-center items-center hover:bg-blue-100 transition"
              >
                <div className="text-4xl mb-2">📤</div>
                <p className="text-blue-700 font-semibold">Upload Raw Fish Image</p>
                <p className="text-xs text-slate-500">JPG / PNG supported</p>
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />


            </div>

            {/* Centre: Preview */}
            <div className="lg:col-span-6 bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-lg mb-4">Fish Sample Preview</h2>
              <div className="h-[420px] rounded-xl border bg-slate-50 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-slate-400">
                    <div className="text-6xl mb-3">🖼️</div>
                    <p>No image uploaded</p>
                    <p className="text-sm">Upload a raw fish sample image</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleAnalyzeUpload}
                disabled={isAnalyzing || !selectedFile}
                className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
              >
                {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Upload'}
              </button>
            </div>

            {/* Right: Results */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-lg mb-4">Detection Results</h2>

              {analysisResult ? (
                isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="font-medium text-blue-800 animate-pulse">Running Analysis...</p>
                    <p className="text-xs text-blue-500 mt-2">Checking fish freshness</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${getLabelBadgeColor(latestResult.qualityLabel)}`}>
                      <p className="text-xs font-semibold">Quality Label</p>
                      <p className="text-xl font-bold">{latestResult.qualityLabel || 'unknown'}</p>
                    </div>

                  </div>
                )
              ) : (
                <p className="text-sm text-slate-400 text-center mt-24">Awaiting image input</p>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ LIVE DETECT TAB ════════════════════ */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-12 min-h-[calc(100vh-160px)] bg-slate-100 rounded-2xl overflow-hidden shadow">

            {/* Sidebar controls */}
            <div className="col-span-3 border-r bg-slate-50 p-5 space-y-5">
              <p className="text-xs tracking-[4px] text-slate-400">CAMERA CONTROL</p>

              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-3 rounded-lg bg-green-50 border border-green-300 text-green-600 font-medium hover:bg-green-100"
                >
                  ▶ Start Camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full py-3 rounded-lg bg-red-50 border border-red-300 text-red-600 font-medium hover:bg-red-100"
                >
                  ■ Stop Camera
                </button>
              )}

              <button
                type="button"
                onClick={captureFromCamera}
                disabled={!cameraActive || isAnalyzing}
                className={`w-full py-3 rounded-lg font-medium border ${!cameraActive || isAnalyzing
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'
                  }`}
              >
                {isAnalyzing ? '⏳ Analyzing...' : '📸 Capture & Analyze'}
              </button>

              <button
                type="button"
                onClick={toggleAutoCaption}
                disabled={!cameraActive}
                className={`w-full py-3 rounded-lg font-medium border ${!cameraActive
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : autoCaptionActive
                      ? 'bg-orange-50 border-orange-300 text-orange-600 hover:bg-orange-100'
                      : 'bg-purple-50 border-purple-300 text-purple-600 hover:bg-purple-100'
                  }`}
              >
                {autoCaptionActive ? '⏹ Stop Auto Caption' : '🔄 Auto Caption'}
              </button>


            </div>

            {/* Live preview */}
            <div className="col-span-7 border-r bg-slate-100">
              <div className="p-4 border-b">
                <p className="text-xs tracking-[4px] text-slate-400">LIVE PREVIEW</p>
              </div>
              <div className="relative h-[650px] bg-[linear-gradient(#dbeafe_1px,transparent_1px),linear-gradient(90deg,#dbeafe_1px,transparent_1px)] bg-[size:50px_50px] flex items-center justify-center overflow-hidden">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500 z-10"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500 z-10"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500 z-10"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500 z-10"></div>

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-[82%] h-[75%] object-cover shadow-lg ${cameraActive ? 'block' : 'hidden'}`}
                />

                {currentCaption && cameraActive && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-semibold z-20">
                    {currentCaption}
                  </div>
                )}

                {!cameraActive && (
                  <div className="text-center text-slate-400">
                    <div className="text-7xl mb-3">◎</div>
                    <p className="font-medium">No Preview</p>
                    <p className="text-sm">Start the camera to begin live detection</p>
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(30,64,175,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(30,64,175,0.08)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Scan results panel */}
            <div className="col-span-2 bg-slate-50">
              <div className="p-4 border-b">
                <p className="text-xs tracking-[4px] text-slate-400">SCAN RESULTS</p>
              </div>
              <div className="p-4 space-y-4">
                {analysisResult ? (
                  <>
                    <div className={`p-3 rounded-xl ${getLabelBadgeColor(latestResult.qualityLabel)}`}>
                      <p className="text-xs font-semibold">Label</p>
                      <p className="text-sm font-bold mt-1">{latestResult.qualityLabel}</p>
                    </div>

                  </>
                ) : (
                  <p className="text-xs tracking-[4px] text-slate-400 text-center mt-32">AWAITING INPUT</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ HISTORY TAB ════════════════════ */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Assessment History</h2>
            {history.length === 0 ? (
              <p className="text-slate-400">No saved assessments yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {history.map((record) => (
                  <div key={record._id} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className={`h-2 w-full ${record.qualityLabel === 'Alagoduwa_Very_fresh' ? 'bg-green-400'
                        : record.qualityLabel === 'Alagoduwa_fresh' ? 'bg-blue-400'
                          : 'bg-red-400'
                      }`} />
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>

                          <p className="text-xs text-slate-500"> {new Date(record.analysisDate).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => deleteAssessment(record._id)}
                          className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-3 flex gap-2 flex-wrap">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getLabelBadgeColor(record.qualityLabel)}`}>
                          {record.qualityLabel}
                        </span>
                      </div>


                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ ANALYTICS TAB ════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Total Assessments', value: stats.total, bg: 'bg-slate-50', text: 'text-slate-700' },
                { label: 'Very Fresh', value: stats.veryFresh, bg: 'bg-green-50', text: 'text-green-700' },
                { label: 'Fresh', value: stats.fresh, bg: 'bg-blue-50', text: 'text-blue-700' },
                { label: 'Spoiled', value: stats.spoiled, bg: 'bg-red-50', text: 'text-red-700' },
              ].map((card) => (
                <div key={card.label} className={`${card.bg} rounded-2xl border p-5 text-center shadow`}>
                  <p className={`text-sm font-semibold ${card.text}`}>{card.label}</p>
                  <h3 className={`text-4xl font-bold mt-2 ${card.text}`}>{card.value}</h3>
                  <p className="text-xs text-slate-400 mt-1">Assessments</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pie chart */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold mb-4">Quality Distribution</h2>
                {qualityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={qualityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {qualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} assessments`, name]} labelFormatter={() => ''} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-400">No data available</div>
                )}
              </div>


            </div>


          </div>
        )}

      </div>
    </div>
  );
};

export default RawFishQuality;
