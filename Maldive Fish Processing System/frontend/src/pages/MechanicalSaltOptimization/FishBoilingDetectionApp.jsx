import React, { useRef, useState, useEffect } from "react";
import Chart from "chart.js/auto";

// Add custom styles for sliders
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #3b82f6;
    cursor: pointer;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #3b82f6;
    cursor: pointer;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .slider::-webkit-slider-thumb:hover {
    background: #2563eb;
    transform: scale(1.1);
  }
  
  .slider::-moz-range-thumb:hover {
    background: #2563eb;
    transform: scale(1.1);
  }
`;

export default function FishBoilingDetectionApp() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const [mode, setMode] = useState("upload");
  const [stream, setStream] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);

  const [thresholds, setThresholds] = useState({
    confidence: 0.6,
    overlap: 0.5,
    opacity: 0.8,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [captureHistory, setCaptureHistory] = useState([]);

  const API_URL = "http://localhost:8000/predict";

  useEffect(() => {
    return () => stopWebcam();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
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
      setError("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = () => {
    if (!selectedFile) {
      setError("Select an image first");
      return;
    }
    processImage(selectedFile);
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setWebcamActive(true);
    } catch {
      setError("Webcam access denied");
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setWebcamActive(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
      processImage(file);
    });
  };

  const renderChart = (data) => {
    if (!data?.detections) return;

    const labels = data.detections.map((d, i) => `${d.label} ${i + 1}`);
    const values = data.detections.map((d) => d.confidence * 100);

    const ctx = chartRef.current.getContext("2d");

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
          },
        ],
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
      setCaptureHistory(prev => [capture, ...prev].slice(0, 10)); // Keep last 10 captures
    }
  };

  const handleExportCapture = (capture) => {
    // Create a download link for the captured image
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${capture.image}`;
    link.download = `fish_detection_${capture.id}.jpg`;
    link.click();
  };

  const handleDeleteCapture = (captureId) => {
    setCaptureHistory(prev => prev.filter(c => c.id !== captureId));
  };

  const handleSettingsSave = () => {
    // Save settings to localStorage
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
    <>
      <style>{sliderStyles}</style>
      <div className="h-screen flex flex-col bg-gray-200 text-sm">

      {/* Title Bar */}
      <div className="bg-gray-800 text-white px-3 py-1 flex justify-between">
        <span>Fish Detection System</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-100 border-b px-2 py-1 flex gap-4">
        <button 
          onClick={handleCapture}
          disabled={!results}
          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Capture
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Settings
        </button>
        <button 
          onClick={() => setShowHelp(true)}
          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Help
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b px-2 py-2 flex gap-2">
        <button onClick={() => setMode("upload")} className="border px-3 py-1 bg-white">
          Upload
        </button>
        <button onClick={() => setMode("webcam")} className="border px-3 py-1 bg-white">
          Webcam
        </button>
        <button onClick={handleDetect} className="border px-3 py-1 bg-blue-500 text-white">
          Detect
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel */}
        <div className="w-1/4 border-r bg-white p-3">
          <h3 className="font-bold mb-2">Controls</h3>

          <input type="file" onChange={handleFileChange} />

          <p className="mt-2 text-xs text-gray-500">{fileName}</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confidence: {(thresholds.confidence * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={thresholds.confidence * 100}
                onChange={(e) => setThresholds(prev => ({
                  ...prev,
                  confidence: parseFloat(e.target.value) / 100
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Overlap: {(thresholds.overlap * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={thresholds.overlap * 100}
                onChange={(e) => setThresholds(prev => ({
                  ...prev,
                  overlap: parseFloat(e.target.value) / 100
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Opacity: {(thresholds.opacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={thresholds.opacity * 100}
                onChange={(e) => setThresholds(prev => ({
                  ...prev,
                  opacity: parseFloat(e.target.value) / 100
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Quick Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setThresholds({ confidence: 0.6, overlap: 0.5, opacity: 0.8 })}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Default
              </button>
              <button
                onClick={() => setThresholds({ confidence: 0.8, overlap: 0.3, opacity: 0.9 })}
                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                High Quality
              </button>
              <button
                onClick={() => setThresholds({ confidence: 0.4, overlap: 0.7, opacity: 0.6 })}
                className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Sensitive
              </button>
              <button
                onClick={() => setThresholds({ confidence: 0.9, overlap: 0.2, opacity: 0.95 })}
                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Strict
              </button>
            </div>
          </div>

          {mode === "webcam" && (
            <div className="mt-4 space-y-2">
              {!webcamActive ? (
                <button onClick={startWebcam} className="border px-2 py-1 w-full">
                  Start Camera
                </button>
              ) : (
                <>
                  <button onClick={captureFrame} className="border px-2 py-1 w-full">
                    Capture
                  </button>
                  <button onClick={stopWebcam} className="border px-2 py-1 w-full">
                    Stop
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center Panel */}
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          {mode === "webcam" ? (
            <video ref={videoRef} autoPlay className="max-h-full" />
          ) : results ? (
            <img
              src={`data:image/jpeg;base64,${results.annotated_image_base64}`}
              className="max-h-full"
            />
          ) : (
            <p>No Preview</p>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-1/4 border-l bg-white p-3 overflow-auto">
          <h3 className="font-bold mb-2">Results</h3>

          {loading && <p>Processing...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {results?.detections?.map((d, i) => (
            <div key={i} className="border p-2 mb-2">
              <div>{d.label}</div>
              <div>{(d.confidence * 100).toFixed(1)}%</div>
            </div>
          ))}

          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-300 px-3 py-1 flex justify-between">
        <span>Status: {loading ? "Processing..." : "Ready"}</span>
        <span>Mode: {mode}</span>
        {captureHistory.length > 0 && (
          <span className="text-blue-600">Captures: {captureHistory.length}</span>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Detection Thresholds</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700">Confidence: {(thresholds.confidence * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={thresholds.confidence * 100}
                      onChange={(e) => setThresholds(prev => ({
                        ...prev,
                        confidence: parseFloat(e.target.value) / 100
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Overlap: {(thresholds.overlap * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={thresholds.overlap * 100}
                      onChange={(e) => setThresholds(prev => ({
                        ...prev,
                        overlap: parseFloat(e.target.value) / 100
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Opacity: {(thresholds.opacity * 100).toFixed(0)}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={thresholds.opacity * 100}
                      onChange={(e) => setThresholds(prev => ({
                        ...prev,
                        opacity: parseFloat(e.target.value) / 100
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Capture History</h3>
                <p className="text-sm text-gray-600">Total captures: {captureHistory.length}</p>
                <button
                  onClick={() => setCaptureHistory([])}
                  className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Clear History
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleSettingsReset}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Reset
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSettingsSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Help & Documentation</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">📖 How to Use</h3>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Upload an image or use webcam for detection</li>
                  <li>Adjust thresholds using the sliders</li>
                  <li>Click "Detect" to analyze the image</li>
                  <li>View results in the right panel</li>
                  <li>Capture important detections for later</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">⚙️ Threshold Settings</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Confidence:</strong> Minimum detection confidence (0-100%)</li>
                  <li><strong>Overlap:</strong> Maximum overlap between detections (0-100%)</li>
                  <li><strong>Opacity:</strong> Detection box opacity (0-100%)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">🎯 Presets</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><strong>Default:</strong> Balanced settings for general use</li>
                  <li><strong>High Quality:</strong> Strict for accurate results</li>
                  <li><strong>Sensitive:</strong> Lower thresholds for more detections</li>
                  <li><strong>Strict:</strong> Very high confidence requirements</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">💡 Tips</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Use well-lit images for better detection</li>
                  <li>Adjust thresholds based on your specific needs</li>
                  <li>Capture important results for documentation</li>
                  <li>Settings are automatically saved</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">🔧 Troubleshooting</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>If no detections appear, lower the confidence threshold</li>
                  <li>For too many detections, increase confidence threshold</li>
                  <li>Check webcam permissions if webcam doesn't work</li>
                  <li>Ensure image format is supported (JPG, PNG)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capture History Sidebar */}
      {captureHistory.length > 0 && (
        <div className="fixed right-4 top-20 w-64 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-40">
          <h3 className="font-semibold mb-2">Recent Captures</h3>
          <div className="space-y-2">
            {captureHistory.slice(0, 5).map(capture => (
              <div key={capture.id} className="border rounded p-2">
                <div className="text-xs text-gray-500">{capture.timestamp}</div>
                <div className="text-sm font-medium">{capture.detections?.length || 0} detections</div>
                <div className="flex space-x-2 mt-1">
                  <button
                    onClick={() => handleExportCapture(capture)}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => handleDeleteCapture(capture.id)}
                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}