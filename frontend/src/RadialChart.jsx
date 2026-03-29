import React from 'react';

const RadialChart = ({ data, size = 120, colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-neutral-500 text-sm">
        No data available
      </div>
    );
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;
  
  let currentAngle = -90; // Start from top
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angleSize = (percentage / 100) * 360;
    const endAngle = currentAngle + angleSize;
    
    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = angleSize > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    const labelAngle = currentAngle + angleSize / 2;
    const labelRad = (labelAngle * Math.PI) / 180;
    const labelX = centerX + (radius * 0.7) * Math.cos(labelRad);
    const labelY = centerY + (radius * 0.7) * Math.sin(labelRad);
    
    const segment = {
      path: pathData,
      color: colors[index % colors.length],
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1),
      labelX,
      labelY
    };
    
    currentAngle = endAngle;
    return segment;
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            stroke="#1f2937"
            strokeWidth="2"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
      </svg>
      <div className="mt-2 space-y-1 text-xs">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-neutral-300">{segment.label}: {segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadialChart;
