// fish_detection_frontend.jsx
// Frontend component for Fish Processing Quality Detection System
// Location: src/components/FishBoilingDetectionApp.jsx

import React, { useRef, useState, useEffect } from "react";
import Chart from "chart.js/auto";
import { 
  UploadPage, 
  ChartPage, 
  SensorPage, 
  MechanicalPage,
  WaterSalinityControl
} from "./features";

export default function FishBoilingDetectionApp() {
  const fileInputRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const [mode, setMode] = useState("upload");

  const [thresholds, setThresholds] = useState({
    confidence: 0.6,
    overlap: 0.5,
    opacity: 0.8,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  const API_URL = "http://localhost:8000/predict";

  // Clock effect
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setResults(null);
    }
  };

  const processImage = async (file) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confidence_threshold", thresholds.confidence);
      formData.append("overlap_threshold", thresholds.overlap);
      formData.append("opacity_threshold", thresholds.opacity);

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Backend error");

      const data = await res.json();
      setResults(data);

      setTimeout(() => renderChart(data), 200);
    } catch (err) {
      setError("Failed to connect to backend. Make sure the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = () => {
    if (!selectedFile && mode === "upload") {
      setError("Select an image first");
      return;
    }
    if (selectedFile) {
      processImage(selectedFile);
    }
  };

  const renderChart = (data) => {
    if (!data?.detections) return;

    const labels = data.detections.map((d, i) => `${d.label || "Fish"} ${i + 1}`);
    const values = data.detections.map((d) => (d.confidence * 100).toFixed(1));

    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Confidence %",
            data: values,
            backgroundColor: "rgba(13,110,253,0.7)",
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { ticks: { color: "#6c757d", font: { size: 10 } }, grid: { color: "#e9ecef" } },
          y: { ticks: { color: "#6c757d", font: { size: 10 } }, grid: { color: "#e9ecef" }, min: 0, max: 100 },
        },
      },
    });
  };

  const handleCapture = () => {
    if (results) {
      const capture = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        image: results.annotated_image_base64,
        detections: results.detections,
        thresholds: { ...thresholds },
        fileName: fileName || 'captured_image'
      };
      setCaptureHistory(prev => [capture, ...prev].slice(0, 10));
    }
  };

  const handleExportCapture = (capture) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${capture.image}`;
    link.download = `fish_detection_${capture.id}.jpg`;
    link.click();
  };

  const handleDeleteCapture = (captureId) => {
    setCaptureHistory(prev => prev.filter(c => c.id !== captureId));
  };

  const handleSettingsSave = () => {
    localStorage.setItem('fishDetectionSettings', JSON.stringify(thresholds));
    setShowSettings(false);
  };

  const handleSettingsReset = () => {
    setThresholds({ confidence: 0.6, overlap: 0.5, opacity: 0.8 });
  };

  const handleLoadSettings = () => {
    const saved = localStorage.getItem('fishDetectionSettings');
    if (saved) {
      setThresholds(JSON.parse(saved));
    }
  };

  useEffect(() => {
    handleLoadSettings();
  }, []);

  const qualityPillClass = (quality) => {
    if (quality === "PREMIUM") return "bg-amber-100 text-amber-800 border border-amber-200";
    if (quality === "GOOD") return "bg-green-100 text-green-700 border border-green-200";
    if (quality === "SPLIT" || quality === "DAMAGED") return "bg-red-100 text-red-700 border border-red-200";
    return "bg-blue-100 text-blue-700 border border-blue-200";
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans text-[13px] overflow-hidden">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-5 h-12 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold tracking-wide text-blue-600">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-sm text-white font-bold">🐟</div>
            Smart Maldive Fish Processing System
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wide font-medium bg-green-100 text-green-700 border border-green-200">● OPERATIONAL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-gray-500">{clock}</span>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="flex items-center gap-1 px-5 h-10 bg-white border-b border-gray-200 flex-shrink-0">
        <button 
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all ${
            mode === "upload" 
              ? "bg-gray-50 border border-gray-200 border-b-transparent text-blue-600" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`} 
          onClick={() => { setMode("upload"); setResults(null); }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mode === "upload" ? "bg-blue-600" : "bg-gray-400"}`} />
          Upload Image
        </button>
       
        <button 
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all ${
            mode === "sensors" 
              ? "bg-gray-50 border border-gray-200 border-b-transparent text-blue-600" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`} 
          onClick={() => { setMode("sensors"); setResults(null); }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mode === "sensors" ? "bg-orange-500" : "bg-gray-400"}`} />
          Sensor Data
        </button>
        <button 
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all ${
            mode === "mechanical" 
              ? "bg-gray-50 border border-gray-200 border-b-transparent text-blue-600" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`} 
          onClick={() => { setMode("mechanical"); setResults(null); }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mode === "mechanical" ? "bg-purple-600" : "bg-gray-400"}`} />
          Mechanical System Controllers
        </button>
        <button 
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all ${
            mode === "Water" 
              ? "bg-gray-50 border border-gray-200 border-b-transparent text-blue-600" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`} 
          onClick={() => { setMode("Water"); setResults(null); }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mode === "Water" ? "bg-teal-500" : "bg-gray-400"}`} />
          Water Quality & Salinity Control
        </button>

         <button 
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all ${
            mode === "chart" 
              ? "bg-gray-50 border border-gray-200 border-b-transparent text-blue-600" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`} 
          onClick={() => { setMode("chart"); setResults(null); }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mode === "chart" ? "bg-blue-600" : "bg-gray-400"}`} />
          Chart
        </button>
         <button 
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all ${
            mode === "chart" 
              ? "bg-gray-50 border border-gray-200 border-b-transparent text-blue-600" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`} 
          onClick={() => { setMode("chart"); setResults(null); }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mode === "guidelines" ? "bg-blue-600" : "bg-gray-400"}`} />
          Guidelines
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {mode === "upload" && (
          <UploadPage 
            onFileSelect={handleFileChange}
            selectedFile={selectedFile}
            onRemoveFile={() => setSelectedFile(null)}
          />
        )}
        {mode === "chart" && <ChartPage />}
        {mode === "sensors" && <SensorPage />}
        {mode === "mechanical" && <MechanicalPage />}
        {mode === "Water" && <WaterSalinityControl />}
      </div>

      {/* Status Bar */}
      <div className="h-7 bg-gray-100 border-t border-gray-200 flex items-center px-5 gap-5 flex-shrink-0 text-[10px]">
        <span className="text-gray-500 font-mono">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
          System: {loading ? "Processing" : "Ready"}
        </span>
        <span className="text-gray-500">Mode: {mode === "upload" ? "Image Upload" : mode === "Water" ? "Water Salinity Control" : mode === "chart" ? "Chart Analytics" : mode === "sensors" ? "Sensor Data" : mode === "mechanical" ? "Mechanical Controls" : "Unknown"}</span>
        {results && <span className="text-gray-500">Last inference: {results.inference_time_ms}ms</span>}
        {captureHistory.length > 0 && <span className="text-gray-500">Saved results: {captureHistory.length}</span>}
        <span className="text-gray-500">AI Model: YOLOv8 | Multi-sensor enabled</span>
      </div>

      {/* Capture History Sidebar */}
      {captureHistory.length > 0 && (
        <div className="fixed right-5 top-20 w-72 bg-white border border-gray-200 rounded-xl shadow-lg max-h-[calc(100vh-100px)] overflow-y-auto z-40">
          <h3 className="text-xs font-semibold text-gray-900 px-4 py-3 border-b border-gray-200 bg-gray-50 m-0">
            📸 Saved Results ({captureHistory.length})
          </h3>
          {captureHistory.slice(0, 5).map(capture => (
            <div key={capture.id} className="px-4 py-3 border-b border-gray-100 last:border-none">
              <div className="text-[10px] text-gray-500 font-mono mb-1.5">🕐 {capture.timestamp}</div>
              <div className="text-[11px] mb-2.5 font-medium">🐟 {capture.detections?.length || 0} detections</div>
              <div className="flex gap-2.5">
                <button className="px-2.5 py-1 text-[10px] font-medium bg-blue-600 text-white rounded border border-blue-600 hover:bg-blue-700 transition-colors" onClick={() => handleExportCapture(capture)}>
                  📥 Export
                </button>
                <button className="px-2.5 py-1 text-[10px] font-medium bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 transition-colors" onClick={() => handleDeleteCapture(capture.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white border border-gray-200 rounded-xl p-6 w-[450px] max-h-[85vh] overflow-y-auto shadow-xl">
            <h2 className="text-base font-semibold mb-4 text-gray-900">⚙️ Detection Threshold Settings</h2>
            
            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-2.5">Confidence Threshold</h3>
            <div className="mb-3.5">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                <span>Minimum confidence for detection</span>
                <span className="text-blue-600 font-mono text-[10px] font-semibold">{(thresholds.confidence * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={thresholds.confidence * 100}
                onChange={(e) => setThresholds(prev => ({
                  ...prev,
                  confidence: parseFloat(e.target.value) / 100
                }))}
                className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>
            
            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-2.5">Overlap Threshold (NMS)</h3>
            <div className="mb-3.5">
              <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
                <span>Maximum allowed overlap</span>
                <span className="text-blue-600 font-mono text-[10px] font-semibold">{(thresholds.overlap * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={thresholds.overlap * 100}
                onChange={(e) => setThresholds(prev => ({
                  ...prev,
                  overlap: parseFloat(e.target.value) / 100
                }))}
                className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-2.5">📸 Capture History</h3>
            <p className="text-[11px] text-gray-500">Total saved results: {captureHistory.length}</p>
            <button
              className="mt-2 px-3 py-1.5 text-[11px] font-medium bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100 transition-colors"
              onClick={() => setCaptureHistory([])}
            >
              🗑️ Clear All Results
            </button>

            <div className="flex justify-end gap-2.5 mt-6">
              <button className="px-3 py-1.5 text-[11px] font-medium bg-gray-100 text-gray-700 rounded border border-gray-200 hover:bg-gray-200 transition-colors" onClick={handleSettingsReset}>
                Reset to Default
              </button>
              <button className="px-3 py-1.5 text-[11px] font-medium bg-gray-100 text-gray-700 rounded border border-gray-200 hover:bg-gray-200 transition-colors" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button className="px-3 py-1.5 text-[11px] font-medium bg-blue-600 text-white rounded border border-blue-600 hover:bg-blue-700 transition-colors" onClick={handleSettingsSave}>
                💾 Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white border border-gray-200 rounded-xl p-6 w-[450px] max-h-[85vh] overflow-y-auto shadow-xl">
            <h2 className="text-base font-semibold mb-4 text-gray-900">❓ System Help & Documentation</h2>
            
            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-2.5">📖 How to Use</h3>
            <ol className="pl-5.5 my-2.5 list-decimal">
              <li className="text-xs text-gray-500 mb-1.5">Upload a fish image or use live camera for real-time inspection</li>
              <li className="text-xs text-gray-500 mb-1.5">Adjust confidence thresholds using the sliders for optimal detection</li>
              <li className="text-xs text-gray-500 mb-1.5">Click "Detect & Analyze" to run AI-powered quality assessment</li>
              <li className="text-xs text-gray-500 mb-1.5">Review quality results in the right panel</li>
              <li className="text-xs text-gray-500 mb-1.5">Save important results for quality documentation</li>
            </ol>

            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-2.5">⚙️ Quality Levels</h3>
            <ul className="pl-5.5 my-2.5 list-disc">
              <li className="text-xs text-gray-500 mb-1.5"><strong className="font-semibold text-amber-700">PREMIUM (Gold):</strong> Excellent color, texture, and shape - export quality</li>
              <li className="text-xs text-gray-500 mb-1.5"><strong className="font-semibold text-green-700">GOOD (Green):</strong> Acceptable quality for local market</li>
              <li className="text-xs text-gray-500 mb-1.5"><strong className="font-semibold text-blue-700">PROCESSING (Blue):</strong> Still in processing stage</li>
              <li className="text-xs text-gray-500 mb-1.5"><strong className="font-semibold text-red-700">SPLIT/DAMAGED (Red):</strong> Quality issues detected</li>
              <li className="text-xs text-gray-500 mb-1.5"><strong className="font-semibold text-gray-600">REJECTED (Gray):</strong> Non-fish objects or severely damaged</li>
            </ul>

            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-2.5">🎯 AI Features</h3>
            <ul className="pl-5.5 my-2.5 list-disc">
              <li className="text-xs text-gray-500 mb-1.5">Advanced color analysis in HSV/LAB color spaces</li>
              <li className="text-xs text-gray-500 mb-1.5">Shape validation for fish-like characteristics</li>
              <li className="text-xs text-gray-500 mb-1.5">Texture anomaly detection (split, cracks, damage)</li>
              <li className="text-xs text-gray-500 mb-1.5">Hierarchical quality classification</li>
              <li className="text-xs text-gray-500 mb-1.5">Multi-sensor data fusion ready</li>
            </ul>

            <h3 className="text-xs font-semibold text-gray-500 mt-5 mb-2.5">💡 Best Practices</h3>
            <ul className="pl-5.5 my-2.5 list-disc">
              <li className="text-xs text-gray-500 mb-1.5">Use well-lit images for best detection accuracy</li>
              <li className="text-xs text-gray-500 mb-1.5">Adjust confidence threshold based on your quality standards</li>
              <li className="text-xs text-gray-500 mb-1.5">Use presets for common use cases</li>
              <li className="text-xs text-gray-500 mb-1.5">Settings are automatically saved locally</li>
            </ul>

            <div className="flex justify-end mt-6">
              <button className="px-3 py-1.5 text-[11px] font-medium bg-blue-600 text-white rounded border border-blue-600 hover:bg-blue-700 transition-colors" onClick={() => setShowHelp(false)}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}