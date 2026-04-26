import React from 'react';

const SystemHealthChart = ({ health = 98, size = 120 }) => {
  const getColor = (value) => {
    if (value >= 90) return 'text-green-500';
    if (value >= 75) return 'text-yellow-500';
    if (value >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getBgColor = (value) => {
    if (value >= 90) return 'bg-green-100';
    if (value >= 75) return 'bg-yellow-100';
    if (value >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getStatus = (value) => {
    if (value >= 90) return 'Healthy';
    if (value >= 75) return 'Good';
    if (value >= 60) return 'Warning';
    return 'Critical';
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex flex-col items-center">
        <div className={`relative inline-flex items-center justify-center w-24 h-24`}>
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - health / 100)}`}
              strokeLinecap="round"
              className={`${getColor(health)} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getColor(health)}`}>
              {health}%
            </span>
          </div>
        </div>
        <div className="mt-3 text-center">
          <h3 className="text-sm font-semibold text-gray-900">System Health</h3>
          <div className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${getBgColor(health)} ${getColor(health)}`}>
            {getStatus(health)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthChart;
