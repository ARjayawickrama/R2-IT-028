import React from 'react';

const QualityGauge = ({ value = 85, maxValue = 100, size = 200, title = "Quality Score", color = 'blue' }) => {
  const safeValue = value || 85;
  const percentage = (safeValue / maxValue) * 100;
  const radius = (size - 20) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;
  
  const getColorClasses = () => {
    if (percentage >= 90) return 'text-green-500 stroke-green-500';
    if (percentage >= 75) return 'text-blue-500 stroke-blue-500';
    if (percentage >= 60) return 'text-yellow-500 stroke-yellow-500';
    return 'text-red-500 stroke-red-500';
  };

  const getBgColorClasses = () => {
    if (percentage >= 90) return 'bg-green-100';
    if (percentage >= 75) return 'bg-blue-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            width={size}
            height={size / 2 + 20}
            className="transform -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${getColorClasses()} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center mt-8">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getColorClasses().split(' ')[0]}`}>
                {safeValue.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Quality Score</div>
            </div>
          </div>
        </div>
        <div className={`mt-4 px-3 py-1 rounded-full text-sm font-medium ${getBgColorClasses()} ${getColorClasses().split(' ')[0]}`}>
          {percentage >= 90 ? 'Excellent' : 
           percentage >= 75 ? 'Good' : 
           percentage >= 60 ? 'Fair' : 'Poor'}
        </div>
      </div>
    </div>
  );
};

export default QualityGauge;
