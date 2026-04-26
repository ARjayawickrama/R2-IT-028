import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RawFishQuality = () => {
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [qualityMetrics, setQualityMetrics] = useState({
    freshness: 94.2,
    size: 87.5,
    color: 91.8,
    texture: 89.3,
    temperature: 4.2,
    overall: 90.7
  });

  const [recentBatches] = useState([
    { id: 'RF-2024-001', species: 'Tuna', date: '2024-04-26', status: 'Excellent', quality: 92.5, quantity: 250 },
    { id: 'RF-2024-002', species: 'Mackerel', date: '2024-04-26', status: 'Good', quality: 87.3, quantity: 180 },
    { id: 'RF-2024-003', species: 'Tuna', date: '2024-04-25', status: 'Excellent', quality: 91.8, quantity: 320 },
    { id: 'RF-2024-004', species: 'Sardine', date: '2024-04-25', status: 'Acceptable', quality: 82.1, quantity: 450 },
    { id: 'RF-2024-005', species: 'Mackerel', date: '2024-04-24', status: 'Good', quality: 86.7, quantity: 210 }
  ]);

  const [qualityAlerts] = useState([
    { type: 'warning', message: 'Temperature slightly above optimal for batch RF-2024-002', time: '30 minutes ago' },
    { type: 'info', message: 'Quality inspection completed for batch RF-2024-001', time: '2 hours ago' },
    { type: 'success', message: 'All batches meeting quality standards', time: '4 hours ago' }
  ]);

  const [speciesData] = useState([
    { species: 'Tuna', batches: 3, avgQuality: 91.5, totalQuantity: 845 },
    { species: 'Mackerel', batches: 2, avgQuality: 87.0, totalQuantity: 390 },
    { species: 'Sardine', batches: 1, avgQuality: 82.1, totalQuantity: 450 },
    { species: 'Skipjack', batches: 1, avgQuality: 88.9, totalQuantity: 280 }
  ]);

  useEffect(() => {
    // Simulate real-time quality updates
    const interval = setInterval(() => {
      setQualityMetrics(prev => ({
        freshness: Math.min(100, Math.max(70, prev.freshness + (Math.random() - 0.5) * 1)),
        size: Math.min(100, Math.max(70, prev.size + (Math.random() - 0.5) * 2)),
        color: Math.min(100, Math.max(70, prev.color + (Math.random() - 0.5) * 1)),
        texture: Math.min(100, Math.max(70, prev.texture + (Math.random() - 0.5) * 1)),
        temperature: Math.min(8, Math.max(0, prev.temperature + (Math.random() - 0.5) * 0.2)),
        overall: Math.min(100, Math.max(70, prev.overall + (Math.random() - 0.5) * 1))
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Acceptable': return 'text-yellow-600 bg-yellow-100';
      case 'Poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityColor = (quality) => {
    if (quality >= 90) return 'text-green-600';
    if (quality >= 80) return 'text-blue-600';
    if (quality >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 0 && temp <= 4) return 'text-green-600';
    if (temp > 4 && temp <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🐠 Raw Fish Quality</h1>
            <p className="text-gray-600 mt-1">Monitor and assess raw fish quality parameters</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Freshness</span>
            <span className="text-xs text-gray-500">Score</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{qualityMetrics.freshness.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Excellent</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Size</span>
            <span className="text-xs text-gray-500">Score</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{qualityMetrics.size.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Good</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Color</span>
            <span className="text-xs text-gray-500">Score</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{qualityMetrics.color.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Excellent</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Texture</span>
            <span className="text-xs text-gray-500">Score</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{qualityMetrics.texture.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Good</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Temperature</span>
            <span className="text-xs text-gray-500">°C</span>
          </div>
          <div className={`text-2xl font-bold ${getTemperatureColor(qualityMetrics.temperature)}`}>
            {qualityMetrics.temperature.toFixed(1)}°C
          </div>
          <div className="text-xs text-gray-500 mt-1">Optimal: 0-4°C</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Overall</span>
            <span className="text-xs text-gray-500">Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{qualityMetrics.overall.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Excellent</div>
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
                        <span className="text-blue-600 font-semibold">🐠</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{batch.id}</div>
                        <div className="text-sm text-gray-500">{batch.species} • {batch.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">{batch.quantity} kg</div>
                        <div className={`text-sm font-medium ${getQualityColor(batch.quality)}`}>
                          {batch.quality}%
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch.status)}`}>
                        {batch.status}
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

      {/* Species Overview */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Species Overview</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {speciesData.map((species, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{species.species}</h3>
                  <span className="text-sm text-gray-500">{species.batches} batches</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Quality:</span>
                    <span className={`font-medium ${getQualityColor(species.avgQuality)}`}>
                      {species.avgQuality}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Qty:</span>
                    <span className="font-medium">{species.totalQuantity} kg</span>
                  </div>
                </div>
              </div>
            ))}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
                <div className="text-gray-900">{selectedBatch.species}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date</label>
                <div className="text-gray-900">{selectedBatch.date}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <div className="text-gray-900">{selectedBatch.quantity} kg</div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quality Assessment</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Freshness Score</span>
                    <span className="text-sm font-medium text-green-600">94.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Size Score</span>
                    <span className="text-sm font-medium text-blue-600">87.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Color Score</span>
                    <span className="text-sm font-medium text-purple-600">91.8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Texture Score</span>
                    <span className="text-sm font-medium text-indigo-600">89.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overall Quality</span>
                    <span className={`text-sm font-medium ${getQualityColor(selectedBatch.quality)}`}>
                      {selectedBatch.quality}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Storage Conditions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Temperature</span>
                    <span className={`text-sm font-medium ${getTemperatureColor(qualityMetrics.temperature)}`}>
                      {qualityMetrics.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Storage Duration</span>
                    <span className="text-sm font-medium">12 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Storage Location</span>
                    <span className="text-sm font-medium">Cold Room A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Inspection</span>
                    <span className="text-sm font-medium">2 hours ago</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Processing Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Supplier</span>
                    <span className="text-sm font-medium">Ocean Fresh Co.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Catch Date</span>
                    <span className="text-sm font-medium">2024-04-25</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Catch Location</span>
                    <span className="text-sm font-medium">Indian Ocean</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Processing Status</span>
                    <span className="text-sm font-medium text-blue-600">Pending</span>
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

export default RawFishQuality;
