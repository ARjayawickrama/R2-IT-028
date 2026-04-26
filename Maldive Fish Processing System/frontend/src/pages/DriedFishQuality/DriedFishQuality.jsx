import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DriedFishQuality = () => {
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [qualityMetrics, setQualityMetrics] = useState({
    moisture: 85.2,
    saltContent: 12.5,
    texture: 92.1,
    appearance: 88.7,
    overall: 89.6
  });

  const [recentBatches] = useState([
    { id: 'DF-2024-001', date: '2024-04-26', status: 'Excellent', quality: 92.5 },
    { id: 'DF-2024-002', date: '2024-04-25', status: 'Good', quality: 87.3 },
    { id: 'DF-2024-003', date: '2024-04-24', status: 'Excellent', quality: 91.8 },
    { id: 'DF-2024-004', date: '2024-04-23', status: 'Acceptable', quality: 82.1 },
    { id: 'DF-2024-005', date: '2024-04-22', status: 'Good', quality: 86.7 }
  ]);

  const [qualityAlerts] = useState([
    { type: 'warning', message: 'Moisture levels slightly above optimal range', time: '2 hours ago' },
    { type: 'info', message: 'Quality check completed for batch DF-2024-001', time: '4 hours ago' },
    { type: 'success', message: 'All batches meeting quality standards', time: '6 hours ago' }
  ]);

  useEffect(() => {
    // Simulate real-time quality updates
    const interval = setInterval(() => {
      setQualityMetrics(prev => ({
        moisture: Math.min(100, Math.max(70, prev.moisture + (Math.random() - 0.5) * 2)),
        saltContent: Math.min(20, Math.max(8, prev.saltContent + (Math.random() - 0.5) * 1)),
        texture: Math.min(100, Math.max(70, prev.texture + (Math.random() - 0.5) * 2)),
        appearance: Math.min(100, Math.max(70, prev.appearance + (Math.random() - 0.5) * 2)),
        overall: Math.min(100, Math.max(70, prev.overall + (Math.random() - 0.5) * 1))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Acceptable': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityColor = (quality) => {
    if (quality >= 90) return 'text-green-600';
    if (quality >= 80) return 'text-blue-600';
    if (quality >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🐟 Dried Fish Quality</h1>
            <p className="text-gray-600 mt-1">Monitor and manage dried fish quality metrics</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Quality Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Moisture</span>
            <span className="text-xs text-gray-500">%</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{qualityMetrics.moisture.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">Optimal: 75-85%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Salt Content</span>
            <span className="text-xs text-gray-500">%</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{qualityMetrics.saltContent.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">Optimal: 10-15%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Texture</span>
            <span className="text-xs text-gray-500">Score</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{qualityMetrics.texture.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Excellent</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Appearance</span>
            <span className="text-xs text-gray-500">Score</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{qualityMetrics.appearance.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Good</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Overall</span>
            <span className="text-xs text-gray-500">Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{qualityMetrics.overall.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Good</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Batches */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Batches</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {recentBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">🐟</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{batch.id}</div>
                        <div className="text-sm text-gray-500">{batch.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                      <span className={`text-sm font-medium ${getQualityColor(batch.quality)}`}>
                        {batch.quality}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quality Alerts */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quality Alerts</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {qualityAlerts.map((alert, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        alert.type === 'warning' ? 'bg-yellow-500' :
                        alert.type === 'success' ? 'bg-green-500' :
                        alert.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{alert.message}</div>
                        <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Batch Details */}
      {selectedBatch && (
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Batch Details: {selectedBatch.id}</h2>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                <div className="text-gray-900">{selectedBatch.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production Date</label>
                <div className="text-gray-900">{selectedBatch.date}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedBatch.status)}`}>
                  {selectedBatch.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Score</label>
                <div className={`text-lg font-medium ${getQualityColor(selectedBatch.quality)}`}>
                  {selectedBatch.quality}%
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quality Parameters</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Moisture Content</span>
                    <span className="text-sm font-medium">82.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Salt Content</span>
                    <span className="text-sm font-medium">11.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Texture Score</span>
                    <span className="text-sm font-medium">91.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Appearance Score</span>
                    <span className="text-sm font-medium">89.5</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Processing Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Drying Time</span>
                    <span className="text-sm font-medium">48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Temperature Range</span>
                    <span className="text-sm font-medium">25-30°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Humidity Range</span>
                    <span className="text-sm font-medium">60-70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Weight Loss</span>
                    <span className="text-sm font-medium">65.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriedFishQuality;
