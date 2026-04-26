import React, { useState, useEffect } from 'react';

const SystemHealthDashboard = () => {
  const [healthMetrics, setHealthMetrics] = useState({
    overallQuality: 93.8,
    qualityScore: 'Excellent',
    processEfficiency: 88.2,
    efficiencyScore: 'Good',
    safetyScore: 91.5,
    safetyRating: 'Excellent',
    systemHealth: 97.04655183384035,
    healthStatus: 'Healthy',
    lastUpdated: new Date()
  });

  const [isMobile, setIsMobile] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthMetrics(prev => ({
        ...prev,
        overallQuality: Math.min(100, Math.max(85, prev.overallQuality + (Math.random() - 0.5) * 2)),
        processEfficiency: Math.min(100, Math.max(80, prev.processEfficiency + (Math.random() - 0.5) * 3)),
        safetyScore: Math.min(100, Math.max(85, prev.safetyScore + (Math.random() - 0.5) * 1.5)),
        systemHealth: Math.min(100, Math.max(90, prev.systemHealth + (Math.random() - 0.5) * 1)),
        lastUpdated: new Date()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 95) return 'text-green-600 bg-green-100';
    if (score >= 85) return 'text-blue-600 bg-blue-100';
    if (score >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreRating = (score) => {
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    if (score >= 75) return 'Fair';
    return 'Poor';
  };

  const getProgressColor = (score) => {
    if (score >= 95) return 'bg-green-500';
    if (score >= 85) return 'bg-blue-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const MetricCard = ({ title, value, rating, icon, color, trend, details }) => (
    <div 
      className={`p-4 sm:p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
        selectedMetric === title 
          ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      } ${isMobile ? 'mb-4' : ''}`}
      onClick={() => setSelectedMetric(selectedMetric === title ? null : title)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl">{icon}</span>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{title}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
          {rating}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toFixed(1) : value}%
          </span>
          {trend && (
            <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-3">
        <div 
          className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${getProgressColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>

      {selectedMetric === title && details && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {Object.entries(details).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className="font-medium text-gray-900">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">System Health Dashboard</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Last updated: {healthMetrics.lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${healthMetrics.healthStatus === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
          <span className="text-sm font-medium text-gray-700">
            System Status: <span className={healthMetrics.healthStatus === 'Healthy' ? 'text-green-600' : 'text-yellow-600'}>
              {healthMetrics.healthStatus}
            </span>
          </span>
        </div>
      </div>

      {/* Main System Health Display */}
      <div className={`mb-6 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 ${
        isMobile ? '' : 'text-center'
      }`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall System Health</h3>
        <div className={`flex items-center justify-center gap-4 ${isMobile ? 'flex-col' : ''}`}>
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-blue-200 flex items-center justify-center bg-white">
              <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                {healthMetrics.systemHealth.toFixed(1)}%
              </span>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <div className={`text-left ${isMobile ? 'text-center' : ''}`}>
            <div className="text-sm text-gray-600 mb-1">Performance Level</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(healthMetrics.systemHealth)}`}>
              {getScoreRating(healthMetrics.systemHealth)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-4 sm:gap-6`}>
        <MetricCard
          title="Overall Quality"
          value={healthMetrics.overallQuality}
          rating={healthMetrics.qualityScore}
          icon="🎯"
          color={getScoreColor(healthMetrics.overallQuality)}
          trend={2.3}
          details={{
            'Defect Rate': '0.8%',
            'Customer Satisfaction': '96%',
            'Quality Checks': 'Passed',
            'Compliance': '100%'
          }}
        />
        
        <MetricCard
          title="Process Efficiency"
          value={healthMetrics.processEfficiency}
          rating={healthMetrics.efficiencyScore}
          icon="⚡"
          color={getScoreColor(healthMetrics.processEfficiency)}
          trend={-1.2}
          details={{
            'Cycle Time': '2.3h',
            'Throughput': '450 units/h',
            'Utilization': '89%',
            'Downtime': '0.8%'
          }}
        />
        
        <MetricCard
          title="Safety Score"
          value={healthMetrics.safetyScore}
          rating={healthMetrics.safetyRating}
          icon="🛡️"
          color={getScoreColor(healthMetrics.safetyScore)}
          trend={0.5}
          details={{
            'Incidents': '0',
            'Safety Audits': 'Passed',
            'Training': '100%',
            'Compliance': 'Excellent'
          }}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className={`mt-6 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🌡️</span>
            <span className="text-sm font-medium text-gray-700">Temperature</span>
          </div>
          <div className="text-xl font-bold text-gray-900">72.3°C</div>
          <div className="text-xs text-green-600">Normal Range</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💧</span>
            <span className="text-sm font-medium text-gray-700">Humidity</span>
          </div>
          <div className="text-xl font-bold text-gray-900">45%</div>
          <div className="text-xs text-green-600">Optimal</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚙️</span>
            <span className="text-sm font-medium text-gray-700">Equipment</span>
          </div>
          <div className="text-xl font-bold text-gray-900">98%</div>
          <div className="text-xs text-green-600">Operational</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📊</span>
            <span className="text-sm font-medium text-gray-700">Output</span>
          </div>
          <div className="text-xl font-bold text-gray-900">1,247</div>
          <div className="text-xs text-blue-600">Units Today</div>
        </div>
      </div>

      {/* Alert Section */}
      {healthMetrics.systemHealth < 95 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Performance Alert</h4>
              <p className="text-sm text-yellow-700">
                System health is below optimal levels. Consider reviewing process efficiency metrics.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthDashboard;
