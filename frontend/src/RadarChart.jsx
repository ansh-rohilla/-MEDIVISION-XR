import React from 'react';

const RadarChart = ({ data, size = 150, colors = ['#0ea5e9', '#10b981'] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-neutral-500 text-sm">
        No data available
      </div>
    );
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 20;
  const numAxes = data[0].metrics.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Generate grid circles
  const gridCircles = [];
  for (let i = 1; i <= 5; i++) {
    const r = (radius / 5) * i;
    gridCircles.push(
      <circle
        key={`grid-${i}`}
        cx={centerX}
        cy={centerY}
        r={r}
        fill="none"
        stroke="#374151"
        strokeWidth="0.5"
        opacity="0.3"
      />
    );
  }

  // Generate axes
  const axes = [];
  const labels = [];
  data[0].metrics.forEach((metric, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    axes.push(
      <line
        key={`axis-${i}`}
        x1={centerX}
        y1={centerY}
        x2={x}
        y2={y}
        stroke="#6b7280"
        strokeWidth="0.5"
      />
    );
    
    const labelX = centerX + (radius + 15) * Math.cos(angle);
    const labelY = centerY + (radius + 15) * Math.sin(angle);
    
    labels.push(
      <text
        key={`label-${i}`}
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs fill-neutral-400"
        transform={`rotate(${(i * angleStep * 180 / Math.PI) - 90}, ${labelX}, ${labelY})`}
      >
        {metric.name}
      </text>
    );
  });

  // Generate data polygons
  const polygons = data.map((dataset, datasetIndex) => {
    const points = dataset.metrics.map((metric, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const value = metric.value / 100; // Normalize to 0-1
      const x = centerX + radius * value * Math.cos(angle);
      const y = centerY + radius * value * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    return (
      <polygon
        key={`dataset-${datasetIndex}`}
        points={points}
        fill={colors[datasetIndex % colors.length]}
        fillOpacity="0.3"
        stroke={colors[datasetIndex % colors.length]}
        strokeWidth="2"
      />
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        {gridCircles}
        {axes}
        {polygons}
        {labels}
      </svg>
      <div className="mt-2 space-y-1 text-xs">
        {data.map((dataset, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-neutral-300">{dataset.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
