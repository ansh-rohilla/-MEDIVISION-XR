import React, { useState } from 'react';

const RadarChart = ({ 
  data, 
  size = 280, 
  colors = ['#0284c7', '#64748b'] // MedicalNet (Brand Blue) vs Baseline (Slate)
}) => {
  const [hoveredMetric, setHoveredMetric] = useState(null);

  const defaultData = [
    {
      name: 'MedicalNet 3D-ResNet50',
      color: '#0284c7',
      metrics: [
        { name: 'Accuracy', value: 94.8 },
        { name: 'Precision', value: 93.5 },
        { name: 'Recall', value: 94.2 },
        { name: 'F1 Score', value: 93.8 },
        { name: 'Dice Coeff', value: 91.2 },
        { name: 'IoU Score', value: 84.1 },
      ]
    },
    {
      name: 'Baseline 3D-ResNet18',
      color: '#64748b',
      metrics: [
        { name: 'Accuracy', value: 91.2 },
        { name: 'Precision', value: 89.4 },
        { name: 'Recall', value: 90.8 },
        { name: 'F1 Score', value: 90.1 },
        { name: 'Dice Coeff', value: 85.4 },
        { name: 'IoU Score', value: 78.2 },
      ]
    }
  ];

  const chartData = data || defaultData;
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center text-slate-400 text-xs">
        No radar data available
      </div>
    );
  }

  const viewBoxSize = 320;
  const centerX = viewBoxSize / 2;
  const centerY = viewBoxSize / 2 - 10;
  const radius = 95;

  const metricsList = chartData[0].metrics;
  const numAxes = metricsList.length;
  const angleStep = (2 * Math.PI) / numAxes;

  // Web Concentric Polygons / Concentric Circles (5 rings: 20%, 40%, 60%, 80%, 100%)
  const gridRings = [0.2, 0.4, 0.6, 0.8, 1.0].map((scale, rIdx) => {
    const ringPoints = metricsList.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * scale * Math.cos(angle);
      const y = centerY + radius * scale * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    return (
      <g key={`ring-group-${rIdx}`}>
        <polygon
          points={ringPoints}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray={rIdx < 4 ? "3 3" : "none"}
          opacity={0.6}
        />
        {/* Ring percentage label on top axis */}
        <text
          x={centerX + 4}
          y={centerY - radius * scale + 3}
          className="text-[9px] font-mono fill-slate-400 font-bold"
        >
          {Math.round(scale * 100)}%
        </text>
      </g>
    );
  });

  // Spokes & Axis Labels
  const axes = [];
  metricsList.forEach((metric, i) => {
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
        stroke="#cbd5e1"
        strokeWidth="1.2"
      />
    );
    
    // Label Placement with padding
    const labelRadius = radius + 22;
    const labelX = centerX + labelRadius * Math.cos(angle);
    const labelY = centerY + labelRadius * Math.sin(angle);

    let textAnchor = "middle";
    if (Math.abs(Math.cos(angle)) > 0.3) {
      textAnchor = Math.cos(angle) > 0 ? "start" : "end";
    }

    const isHovered = hoveredMetric === i;

    axes.push(
      <g 
        key={`label-group-${i}`} 
        className="cursor-pointer"
        onMouseEnter={() => setHoveredMetric(i)}
        onMouseLeave={() => setHoveredMetric(null)}
      >
        <text
          x={labelX}
          y={labelY}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          className={`text-[11px] font-bold transition-colors ${
            isHovered ? 'fill-brand-700 font-extrabold scale-105' : 'fill-slate-700'
          }`}
        >
          {metric.name}
        </text>
      </g>
    );
  });

  // Render Polygons for each Model
  const polygons = chartData.map((dataset, dsIdx) => {
    const points = dataset.metrics.map((m, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const normVal = m.value / 100;
      const x = centerX + radius * normVal * Math.cos(angle);
      const y = centerY + radius * normVal * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = dataset.color || colors[dsIdx % colors.length];

    return (
      <g key={`dataset-group-${dsIdx}`}>
        {/* Filled polygon */}
        <polygon
          points={points}
          fill={strokeColor}
          fillOpacity={dsIdx === 0 ? "0.2" : "0.08"}
          stroke={strokeColor}
          strokeWidth={dsIdx === 0 ? "2.5" : "1.8"}
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {/* Data points */}
        {dataset.metrics.map((m, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const normVal = m.value / 100;
          const x = centerX + radius * normVal * Math.cos(angle);
          const y = centerY + radius * normVal * Math.sin(angle);
          return (
            <circle
              key={`dot-${dsIdx}-${i}`}
              cx={x}
              cy={y}
              r={dsIdx === 0 ? "4" : "3"}
              fill={strokeColor}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="hover:r-5 transition-all cursor-pointer"
            >
              <title>{`${dataset.name} - ${m.name}: ${m.value}%`}</title>
            </circle>
          );
        })}
      </g>
    );
  });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Multi-Axis Radar Analysis</h4>
        <span className="text-[10px] font-mono text-slate-400">0% - 100% Normalized</span>
      </div>

      <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
        <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
          {gridRings}
          {axes}
          {polygons}
        </svg>

        {/* Interactive Hover Tooltip Overlay */}
        {hoveredMetric !== null && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 z-10 pointer-events-none flex items-center space-x-3">
            <span className="font-bold text-brand-300">{metricsList[hoveredMetric].name}:</span>
            <span className="font-mono text-emerald-400 font-bold">MedicalNet {chartData[0].metrics[hoveredMetric].value}%</span>
            <span className="font-mono text-slate-400">vs Baseline {chartData[1]?.metrics[hoveredMetric].value}%</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center space-x-6 text-xs">
        {chartData.map((ds, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: ds.color || colors[idx % colors.length] }}
            />
            <span className="font-bold text-slate-700 text-[11px]">{ds.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
