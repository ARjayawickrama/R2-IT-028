// fish_detection_frontend.jsx
// Frontend component for Fish Processing Quality Detection System
// Location: src/components/FishBoilingDetectionApp.jsx

import React, { useRef, useState, useEffect } from "react";
import Chart from "chart.js/auto";
import { 
  ChartPage, 
  SensorPage, 
  MechanicalPage,
  WaterSalinityControl
} from "./features";
import MeasurementPage from "./features/Measurement"; // Measurement පිටුව ආනයනය කිරීම
import GuidelinesPage from "./GuidelinesPage";

export default function FishBoilingDetectionApp() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const [mode, setMode] = useState("mechanical");

  const [thresholds, setThresholds] = useState({
    confidence: 0.6,
    overlap: 0.5,
    opacity: 0.8,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

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
      <div className="flex items-center gap-1 px-5 h-10 bg-white border-b border-gray-200 flex-shrink-0 overflow-x-auto">
        <button 
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
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
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
            mode === "measurement" 
              ? "bg-gray-50 border border-gray-200 border-b-transparent text-blue-600" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`} 
          onClick={() => { setMode("measurement"); setResults(null); }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mode === "measurement" ? "bg-blue-600" : "bg-gray-400"}`} />
          Measurement
        </button>

        <button 
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
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
          className={`px-3.5 h-[34px] rounded-t-lg text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
            mode === "chart" 
              ? "bg-gray-50 border border-gray-200 border-b-transparent text-blue-600" 
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
          }`} 
          onClick={() => { setMode("chart"); setResults(null); }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${mode === "chart" ? "bg-blue-600" : "bg-gray-400"}`} />
          Chart
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {mode === "chart" && <ChartPage />}
        {mode === "mechanical" && <MechanicalPage />}
        {mode === "measurement" && <MeasurementPage />}
        {mode === "Water" && <WaterSalinityControl />}
      </div>

      {/* Status Bar */}
      <div className="h-7 bg-gray-100 border-t border-gray-200 flex items-center px-5 gap-5 flex-shrink-0 text-[10px]">
        <span className="text-gray-500 font-mono">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
          System: {loading ? "Processing" : "Ready"}
        </span>
        <span className="text-gray-500">Mode: {mode === "Water" ? "Water Salinity Control" : mode === "chart" ? "Chart Analytics" : mode === "measurement" ? "Measurement Sizing" : mode === "mechanical" ? "Mechanical Controls" : "Unknown"}</span>
        {results && <span className="text-gray-500">Last inference: {results.inference_time_ms}ms</span>}
        {captureHistory.length > 0 && <span className="text-gray-500">Saved results: {captureHistory.length}</span>}
        <span className="text-gray-500">AI Model: YOLOv8 | Multi-sensor enabled</span>
      </div>

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
                className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
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
                className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
              />
            </div>

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

      {/* Guidelines Page Modal */}
      {showGuidelines && (
        <GuidelinesPage 
          onClose={() => setShowGuidelines(false)}
          onFinish={() => setShowGuidelines(false)}
        />
      )}
    </div>
  );
}