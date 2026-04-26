import React from 'react';

const ChamberStatusChart = ({ chambers }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'maintenance': return 'bg-blue-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-50';
    if (efficiency >= 80) return 'text-yellow-600 bg-yellow-50';
    if (efficiency >= 70) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Chamber Status Overview</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chambers.map((chamber) => (
            <div key={chamber.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(chamber.status)}`}></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{chamber.name}</h3>
                    <p className="text-sm text-gray-500">{chamber.operator}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEfficiencyColor(chamber.efficiency)}`}>
                  {chamber.efficiency}%
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Temperature</span>
                  <span className="font-medium">{chamber.temp}°C</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Humidity</span>
                  <span className="font-medium">{chamber.humidity}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium capitalize">{chamber.status}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(chamber.status)}`}></div>
                    <span className="text-xs text-gray-500 capitalize">{chamber.status}</span>
                  </div>
                  {chamber.status === 'warning' && (
                    <span className="text-xs text-yellow-600 font-medium">2 Alerts</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChamberStatusChart;
