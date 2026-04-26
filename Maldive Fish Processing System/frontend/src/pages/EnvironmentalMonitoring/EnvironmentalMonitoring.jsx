import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EnvironmentalMonitoring = () => {
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState({
    temperature: 28.5,
    humidity: 65.2,
    airQuality: 92.8,
    co2Level: 420,
    ventilation: 85.3,
    lightLevel: 750
  });

  const [zones] = useState([
    { id: 'ZONE-A', name: 'Drying Chamber A', status: 'Optimal', temperature: 28.5, humidity: 65.2 },
    { id: 'ZONE-B', name: 'Drying Chamber B', status: 'Good', temperature: 29.1, humidity: 68.7 },
    { id: 'ZONE-C', name: 'Storage Area', status: 'Optimal', temperature: 26.8, humidity: 62.3 },
    { id: 'ZONE-D', name: 'Processing Area', status: 'Warning', temperature: 31.2, humidity: 72.5 },
    { id: 'ZONE-E', name: 'Quality Control', status: 'Optimal', temperature: 27.3, humidity: 64.8 }
  ]);

  const [alerts] = useState([
    { type: 'warning', message: 'High temperature detected in Zone D', time: '15 minutes ago', zone: 'ZONE-D' },
    { type: 'info', message: 'Ventilation system cycle completed', time: '1 hour ago', zone: 'All Zones' },
    { type: 'success', message: 'All environmental parameters within optimal range', time: '2 hours ago', zone: 'System' }
  ]);

  const [historicalData] = useState([
    { time: '00:00', temp: 27.8, humidity: 63.2, co2: 380 },
    { time: '04:00', temp: 27.2, humidity: 64.1, co2: 390 },
    { time: '08:00', temp: 28.5, humidity: 65.2, co2: 420 },
    { time: '12:00', temp: 29.8, humidity: 67.3, co2: 450 },
    { time: '16:00', temp: 30.2, humidity: 68.1, co2: 440 },
    { time: '20:00', temp: 28.9, humidity: 66.4, co2: 410 }
  ]);

  useEffect(() => {
    // Simulate real-time environmental updates
    const interval = setInterval(() => {
      setEnvironmentalData(prev => ({
        temperature: Math.min(35, Math.max(25, prev.temperature + (Math.random() - 0.5) * 0.5)),
        humidity: Math.min(80, Math.max(55, prev.humidity + (Math.random() - 0.5) * 1)),
        airQuality: Math.min(100, Math.max(70, prev.airQuality + (Math.random() - 0.5) * 2)),
        co2Level: Math.min(600, Math.max(350, prev.co2Level + (Math.random() - 0.5) * 10)),
        ventilation: Math.min(100, Math.max(70, prev.ventilation + (Math.random() - 0.5) * 2)),
        lightLevel: Math.min(1000, Math.max(500, prev.lightLevel + (Math.random() - 0.5) * 20))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Optimal': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Warning': return 'text-yellow-600 bg-yellow-100';
      case 'Critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getParameterStatus = (value, parameter) => {
    const ranges = {
      temperature: { min: 25, max: 30 },
      humidity: { min: 60, max: 70 },
      co2Level: { min: 350, max: 500 },
      airQuality: { min: 80, max: 100 },
      ventilation: { min: 75, max: 100 },
      lightLevel: { min: 600, max: 900 }
    };
    
    const range = ranges[parameter];
    if (!range) return 'text-gray-600';
    
    if (value >= range.min && value <= range.max) return 'text-green-600';
    if (value < range.min - 5 || value > range.max + 5) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🌡️ Environmental Monitoring</h1>
            <p className="text-gray-600 mt-1">Real-time environmental conditions and control systems</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Environmental Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Temperature</span>
            <span className="text-xs text-gray-500">°C</span>
          </div>
          <div className={`text-2xl font-bold ${getParameterStatus(environmentalData.temperature, 'temperature')}`}>
            {environmentalData.temperature.toFixed(1)}°C
          </div>
          <div className="text-xs text-gray-500 mt-1">Optimal: 25-30°C</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Humidity</span>
            <span className="text-xs text-gray-500">%</span>
          </div>
          <div className={`text-2xl font-bold ${getParameterStatus(environmentalData.humidity, 'humidity')}`}>
            {environmentalData.humidity.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Optimal: 60-70%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Air Quality</span>
            <span className="text-xs text-gray-500">AQI</span>
          </div>
          <div className={`text-2xl font-bold ${getParameterStatus(environmentalData.airQuality, 'airQuality')}`}>
            {environmentalData.airQuality.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Excellent</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">CO₂ Level</span>
            <span className="text-xs text-gray-500">ppm</span>
          </div>
          <div className={`text-2xl font-bold ${getParameterStatus(environmentalData.co2Level, 'co2Level')}`}>
            {environmentalData.co2Level.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Normal: 350-500</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Ventilation</span>
            <span className="text-xs text-gray-500">%</span>
          </div>
          <div className={`text-2xl font-bold ${getParameterStatus(environmentalData.ventilation, 'ventilation')}`}>
            {environmentalData.ventilation.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Optimal: 75-100%</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Light Level</span>
            <span className="text-xs text-gray-500">lux</span>
          </div>
          <div className={`text-2xl font-bold ${getParameterStatus(environmentalData.lightLevel, 'lightLevel')}`}>
            {environmentalData.lightLevel.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Optimal: 600-900</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Status */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Zone Status</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedZone(zone)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">🌡️</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{zone.name}</div>
                        <div className="text-sm text-gray-500">{zone.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">🌡️ {zone.temperature.toFixed(1)}°C</div>
                        <div className="text-sm text-gray-600">💧 {zone.humidity.toFixed(1)}%</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(zone.status)}`}>
                        {zone.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Alerts */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        alert.type === 'warning' ? 'bg-yellow-500' :
                        alert.type === 'success' ? 'bg-green-500' :
                        alert.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{alert.message}</div>
                        <div className="text-xs text-gray-500 mt-1">{alert.time} • {alert.zone}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Trends */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">24-Hour Environmental Trends</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Temperature Trend</h3>
              <div className="space-y-2">
                {historicalData.map((data, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{data.time}</span>
                    <span className={`font-medium ${getParameterStatus(data.temp, 'temperature')}`}>
                      {data.temp.toFixed(1)}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Humidity Trend</h3>
              <div className="space-y-2">
                {historicalData.map((data, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{data.time}</span>
                    <span className={`font-medium ${getParameterStatus(data.humidity, 'humidity')}`}>
                      {data.humidity.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">CO₂ Level Trend</h3>
              <div className="space-y-2">
                {historicalData.map((data, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{data.time}</span>
                    <span className={`font-medium ${getParameterStatus(data.co2, 'co2Level')}`}>
                      {data.co2} ppm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Zone Details */}
      {selectedZone && (
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Zone Details: {selectedZone.name}</h2>
              <button
                onClick={() => setSelectedZone(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone ID</label>
                <div className="text-gray-900">{selectedZone.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <div className="text-gray-900">{selectedZone.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedZone.status)}`}>
                  {selectedZone.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <div className="text-gray-900">2 minutes ago</div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Current Conditions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Temperature</span>
                    <span className={`text-sm font-medium ${getParameterStatus(selectedZone.temperature, 'temperature')}`}>
                      {selectedZone.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Humidity</span>
                    <span className={`text-sm font-medium ${getParameterStatus(selectedZone.humidity, 'humidity')}`}>
                      {selectedZone.humidity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Air Quality</span>
                    <span className="text-sm font-medium text-green-600">92.8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">CO₂ Level</span>
                    <span className="text-sm font-medium text-blue-600">415 ppm</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Control Systems</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">HVAC Status</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ventilation</span>
                    <span className="text-sm font-medium text-blue-600">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dehumidifier</span>
                    <span className="text-sm font-medium text-green-600">Running</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Air Circulation</span>
                    <span className="text-sm font-medium text-blue-600">Normal</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Alert History</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">No active alerts</div>
                  <div className="text-sm text-gray-500">Last alert: 3 days ago</div>
                  <div className="text-sm text-gray-500">Total alerts today: 0</div>
                  <div className="text-sm text-gray-500">System uptime: 99.8%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentalMonitoring;
