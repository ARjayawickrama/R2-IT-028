import React, { useState, useEffect } from 'react';

export default function ThresholdControls({ onThresholdsChange, selectedFile }) {
  const [thresholds, setThresholds] = useState({
    confidence: 0.60,
    overlap: 0.50,
    opacity: 0.80
  });
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('active');
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(false);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      const response = await fetch(`${API_URL}/thresholds`);
      if (response.ok) {
        const data = await response.json();
        setThresholds({
          confidence: data.confidence,
          overlap: data.overlap,
          opacity: data.opacity
        });
        setStatus(data.status);
      }
    } catch (err) {
      setError('Failed to fetch thresholds');
    }
  };

  const updateThreshold = async (thresholdName, value) => {
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append(thresholdName, value);

      const response = await fetch(`${API_URL}/thresholds`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setThresholds(prev => ({
          ...prev,
          [thresholdName]: value
        }));
        setStatus(data.status);
        
        // Notify parent component of the change
        if (onThresholdsChange) {
          onThresholdsChange({
            ...thresholds,
            [thresholdName]: value
          });
        }
      } else {
        setError('Failed to update threshold');
      }
    } catch (err) {
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const resetThresholds = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/thresholds/reset`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setThresholds({
          confidence: data.confidence,
          overlap: data.overlap,
          opacity: data.opacity
        });
        setStatus(data.status);
        
        // Notify parent component of the reset
        if (onThresholdsChange) {
          onThresholdsChange({
            confidence: data.confidence,
            overlap: data.overlap,
            opacity: data.opacity
          });
        }
      } else {
        setError('Failed to reset thresholds');
      }
    } catch (err) {
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const autoOptimizeThresholds = async () => {
    if (!selectedFile) {
      setError('Please select an image first for auto-optimization');
      return;
    }

    setOptimizing(true);
    setError('');
    setOptimizationResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('iterations', '15'); // Increased iterations for better optimization

      const response = await fetch(`${API_URL}/optimize-thresholds`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update thresholds with optimized values
        setThresholds(data.optimized_thresholds);
        setStatus('optimized');
        
        // Store optimization result for display
        setOptimizationResult(data);
        
        // Notify parent component of the optimization
        if (onThresholdsChange) {
          onThresholdsChange(data.optimized_thresholds);
        }
      } else {
        setError('Auto-optimization failed');
      }
    } catch (err) {
      setError('Failed to connect to backend for optimization');
    } finally {
      setOptimizing(false);
    }
  };

  const toggleAutoOptimize = () => {
    setAutoOptimizeEnabled(!autoOptimizeEnabled);
    if (!autoOptimizeEnabled && selectedFile) {
      // Enable auto-optimization and run it immediately
      autoOptimizeThresholds();
    }
  };

  const handleSliderChange = (thresholdName, value) => {
    const numValue = parseFloat(value);
    setThresholds(prev => ({
      ...prev,
      [thresholdName]: numValue
    }));
  };

  const handleSliderRelease = (thresholdName, value) => {
    updateThreshold(thresholdName, parseFloat(value));
  };

  const getSliderColor = (thresholdName) => {
    switch (thresholdName) {
      case 'confidence': return 'bg-blue-500';
      case 'overlap': return 'bg-green-500';
      case 'opacity': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressColor = (thresholdName) => {
    switch (thresholdName) {
      case 'confidence': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'overlap': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'opacity': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getIcon = (thresholdName) => {
    switch (thresholdName) {
      case 'confidence': return '🎯';
      case 'overlap': return '🔄';
      case 'opacity': return '👁️';
      default: return '⚙️';
    }
  };

  const getRange = (thresholdName) => {
    switch (thresholdName) {
      case 'confidence': return { min: 0.1, max: 1.0, step: 0.05 };
      case 'overlap': return { min: 0.0, max: 1.0, step: 0.05 };
      case 'opacity': return { min: 0.1, max: 1.0, step: 0.05 };
      default: return { min: 0.0, max: 1.0, step: 0.05 };
    }
  };

  const getDescription = (thresholdName) => {
    switch (thresholdName) {
      case 'confidence': return 'Min confidence for detections';
      case 'overlap': return 'Non-maximum suppression';
      case 'opacity': return 'Bounding box opacity';
      default: return 'Detection threshold';
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm font-semibold text-gray-800">⚙️ Detection Control Panel</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${
            status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
            status === 'optimizing' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
            'bg-gray-100 text-gray-700 border-gray-200'
          }`}>
            {status === 'active' ? '🟢 Active' :
             status === 'optimizing' ? '🟡 Optimizing' : '⚪ Inactive'}
          </div>
          <button className="w-4 h-4 bg-gray-300 rounded hover:bg-gray-400 transition-colors"></button>
          <button className="w-4 h-4 bg-gray-300 rounded hover:bg-gray-400 transition-colors"></button>
          <button className="w-4 h-4 bg-gray-300 rounded hover:bg-gray-400 transition-colors"></button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-4">

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <div className="text-2xl">⚠️</div>
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Threshold Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {Object.entries(thresholds).map(([name, value]) => {
          const range = getRange(name);
          const percentage = ((value - range.min) / (range.max - range.min)) * 100;
          
          return (
            <div key={name} className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-2 rounded-lg sm:rounded-xl ${
                    name === 'confidence' ? 'bg-blue-100' : 
                    name === 'overlap' ? 'bg-green-100' : 
                    'bg-purple-100'
                  }`}>
                    {name === 'confidence' && <div className="text-base sm:text-lg">🎯</div>}
                    {name === 'overlap' && <div className="text-base sm:text-lg">🔄</div>}
                    {name === 'opacity' && <div className="text-base sm:text-lg">👁️</div>}
                  </div>
                  <div>
                    <label className="font-bold text-gray-800 text-sm sm:text-base">
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </label>
                    <p className="text-gray-500 text-xs">{getDescription(name)}</p>
                  </div>
                </div>
                <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold min-w-[60px] sm:min-w-[70px] text-center text-xs sm:text-sm ${
                  name === 'confidence' ? 'bg-blue-100 text-blue-700' : 
                  name === 'overlap' ? 'bg-green-100 text-green-700' : 
                  'bg-purple-100 text-purple-700'
                }`}>
                  {value.toFixed(2)}
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="relative">
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={value}
                    onChange={(e) => handleSliderChange(name, e.target.value)}
                    onMouseUp={(e) => handleSliderRelease(name, e.target.value)}
                    onTouchEnd={(e) => handleSliderRelease(name, e.target.value)}
                    className="w-full h-2 rounded-lg sm:rounded-xl appearance-none cursor-pointer bg-gray-200"
                    style={{
                      background: `linear-gradient(to right, ${
                        name === 'confidence' ? '#3b82f6' : 
                        name === 'overlap' ? '#10b981' : 
                        '#8b5cf6'
                      } 0%, ${
                        name === 'confidence' ? '#3b82f6' : 
                        name === 'overlap' ? '#10b981' : 
                        '#8b5cf6'
                      } ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
                    }}
                    disabled={loading}
                  />
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{range.min}</span>
                  <span className="text-gray-700 font-bold">{Math.round(percentage)}%</span>
                  <span>{range.max}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-Optimization Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <div className="text-xl">🤖</div>
          </div>
          <div>
            <h4 className="font-bold text-gray-800">AI Optimization</h4>
            <p className="text-gray-600 text-sm">Automatically find optimal thresholds</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoOptimizeEnabled}
                onChange={toggleAutoOptimize}
                disabled={optimizing || !selectedFile}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
            </label>
            <label htmlFor="autoOptimize" className="text-sm font-semibold text-gray-700">
              Enable Auto-Optimization
            </label>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
            autoOptimizeEnabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            {autoOptimizeEnabled ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={autoOptimizeThresholds}
            disabled={optimizing || !selectedFile}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            {optimizing ? (
              <>
                <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Optimizing...
              </>
            ) : (
              <>
                <span className="text-lg">🎯</span>
                Auto-Optimize Now
              </>
            )}
          </button>
          <button
            onClick={resetThresholds}
            disabled={loading}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-gray-200"
          >
            <span className="text-lg">🔄</span>
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Optimization Results */}
      {optimizationResult && (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <div className="text-xl">📊</div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Optimization Results</h4>
              <p className="text-gray-600 text-sm">Performance analysis complete</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-lg">🎯</div>
                <span className="text-sm text-gray-600 font-medium">Quality Score</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {optimizationResult.best_score.toFixed(3)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-lg">🔍</div>
                <span className="text-sm text-gray-600 font-medium">Detections Found</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {optimizationResult.best_detections.length}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-3 font-bold">Optimized Thresholds:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Confidence</div>
                <div className="text-lg font-bold text-blue-600">{optimizationResult.optimized_thresholds.confidence.toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Overlap</div>
                <div className="text-lg font-bold text-green-600">{optimizationResult.optimized_thresholds.overlap.toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Opacity</div>
                <div className="text-lg font-bold text-purple-600">{optimizationResult.optimized_thresholds.opacity.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-3 rounded-2xl flex items-center gap-2">
            <div className="text-lg">✅</div>
            <span className="text-sm text-green-700 font-bold">{optimizationResult.improvement}</span>
          </div>
        </div>
      )}

      {/* Advanced Controls Info */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <div className="text-lg">ℹ️</div>
          </div>
          <div className="text-sm text-gray-600">
            Use sliders for manual adjustment or enable AI auto-optimization for best results
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
