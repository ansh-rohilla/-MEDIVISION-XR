import React from 'react';

const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  showPercentage = true, 
  color = 'emerald',
  size = 'md',
  animated = true,
  label 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const colors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-300">{label}</span>
          {showPercentage && (
            <span className="text-sm text-neutral-400">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-neutral-800 rounded-full overflow-hidden ${sizes[size] || sizes.md}`}>
        <div
          className={`h-full ${colors[color] || colors.emerald} transition-all duration-500 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
