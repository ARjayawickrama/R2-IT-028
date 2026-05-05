import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { rawFishService } from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const FRESHNESS_API_URL = 'http://localhost:8000/predict';

const RawFishQuality = () => {
  const navigate = useNavigate();
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
  const [recentBatches] = useState([
    { id: 'RF-2024-001', species: 'Alagoduwa', date: '2024-04-26', status: 'Excellent', quality: 92.5, quantity: 250 },
    { id: 'RF-2024-002', species: 'Alagoduwa', date: '2024-04-26', status: 'Good', quality: 87.3, quantity: 180 },
    { id: 'RF-2024-003', species: 'Alagoduwa', date: '2024-04-25', status: 'Excellent', quality: 91.8, quantity: 320 },
    { id: 'RF-2024-004', species: 'Alagoduwa', date: '2024-04-25', status: 'Acceptable', quality: 82.1, quantity: 450 },
    { id: 'RF-2024-005', species: 'Alagoduwa', date: '2024-04-24', status: 'Good', quality: 86.7, quantity: 210 }
  ]);
  const [qualityAlerts] = useState([
    { type: 'warning', message: 'Temperature slightly above optimal for batch RF-2024-002', time: '30 minutes ago' },
    { type: 'info', message: 'Quality inspection completed for batch RF-2024-001', time: '2 hours ago' },
    { type: 'success', message: 'All batches meeting quality standards', time: '4 hours ago' }
  ]);
  const [speciesData] = useState([
    { species: 'Alagoduwa', batches: 5, avgQuality: 89.6, totalQuantity: 1400 }
  ]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

    historyRecords.forEach(record => {
      const label = record.qualityLabel;
      if (label === 'Alagoduwa_Very_fresh') {
        counts['very fresh']++;
      } else if (label === 'Alagoduwa_fresh') {
        counts['fresh']++;
      } else if (label === 'Alagoduwa_Spoiled') {
        counts['spoiled']++;
      }
    });

    const data = [
      { name: 'Very Fresh', value: counts['very fresh'], color: '#10B981' },
      { name: 'Fresh', value: counts['fresh'], color: '#3B82F6' },
      { name: 'Spoiled', value: counts['spoiled'], color: '#EF4444' }
    ].filter(item => item.value > 0); // Only show categories with data

    setQualityData(data);
  };

  const deleteAssessment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Acceptable': return 'text-yellow-600 bg-yellow-100';
      case 'Poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getFreshnessScoreFromLabel = (label) => {
    switch (label?.toLowerCase()) {
      case 'very fresh':
        return 98;
      case 'fresh':
        return 82;
      case 'spoiled':
        return 32;
      default:
        return 0;
    }
  };

  const getLabelBadgeColor = (label) => {
    switch (label?.toLowerCase()) {
      case 'very fresh':
        return 'bg-green-100 text-green-700';
      case 'fresh':
        return 'bg-blue-100 text-blue-700';
      case 'spoiled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 0 && temp <= 4) return 'text-green-600';
    if (temp > 4 && temp <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setFeedback('Camera is not available in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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
      if (!blob) {
        setFeedback('Could not capture image.');
        return;
      }
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

      const response = await fetch(FRESHNESS_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Fish freshness API returned an error');
      }

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
        assessment: {
          total_detections: apiResult.total_detections ?? results.length,
          results,
        },
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

  const handleAnalyzeUpload = async () => {
    if (!selectedFile) {
      setFeedback('Please choose an image before analyzing.');
      return;
    }
    await analyzeImage(selectedFile, 'upload');
  };

  const latestResult = analysisResult || {};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🐠 Raw Fish Quality</h1>
          <p className="text-gray-600 mt-1">Upload Alagoduwa fish images or capture from camera to analyze freshness and store results in MongoDB.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Freshness analysis</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Batch ID</span>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Species</span>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Alagoduwa">Alagoduwa</option>
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Upload image</p>
                  <p className="text-xs text-gray-500">Accepts JPG / PNG images of Alagoduwa raw fish.</p>
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="mt-3 h-48 w-full rounded-lg object-cover" />
                )}
                <button
                  onClick={handleAnalyzeUpload}
                  disabled={isAnalyzing}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Upload'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Live camera</p>
                  <p className="text-xs text-gray-500">Capture fish quality directly from your webcam.</p>
                </div>
                <div className="overflow-hidden rounded-lg bg-black">
                  <video
                    ref={videoRef}
                    className="h-64 w-full object-cover"
                    autoPlay
                    playsInline
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                      Start Camera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                      Stop Camera
                    </button>
                  )}
                  <button
                    onClick={captureFromCamera}
                    disabled={!cameraActive || isAnalyzing}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {isAnalyzing ? 'Capturing...' : 'Capture & Analyze'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Analysis status</h3>
            <p className="mt-2 text-sm text-gray-600">{feedback}</p>
            {analysisResult && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Quality Label</p>
                  <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getLabelBadgeColor(latestResult.qualityLabel)}`}>
                    {latestResult.qualityLabel || 'unknown'}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Freshness Score</p>
                  <p className="mt-2 text-xl font-semibold text-green-600">{latestResult.freshnessScore ?? 0}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Detections</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{latestResult.assessment?.total_detections ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{latestResult.source || 'upload'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Quality Distribution</h2>
            <div className="mt-4">
              {qualityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} assessments`, name]}
                      labelFormatter={() => ''}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-500">
                  <p>No quality data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Latest assessments</h2>
            <div className="mt-4 space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">No saved assessments yet.</p>
              ) : (
                history.slice(0, 5).map((record) => (
                  <div key={record._id} className="rounded-lg border border-gray-100 bg-gray-50 p-4 relative">
                    <button
                      onClick={() => deleteAssessment(record._id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete assessment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="flex items-center justify-between gap-2 pr-8">
                      <div>
                        <p className="font-semibold text-gray-900">{record.batchId}</p>
                        <p className="text-sm text-gray-500">{record.species} • {new Date(record.analysisDate).toLocaleString()}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${getQualityColor(record.freshnessScore)}`}>
                        {record.freshnessScore}%
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-gray-500">Quality label</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{record.qualityLabel}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-gray-500">Source</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{record.source}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Species overview</h2>
            <div className="mt-4 grid gap-4">
              {speciesData.map((speciesItem) => (
                <div key={speciesItem.species} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{speciesItem.species}</p>
                    <span className="text-sm text-gray-500">{speciesItem.batches} batches</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>Avg quality</span>
                    <span className={getQualityColor(speciesItem.avgQuality)}>{speciesItem.avgQuality}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawFishQuality;
