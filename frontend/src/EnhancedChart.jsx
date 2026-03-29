import React, { useState, useRef, useEffect } from 'react';

const EnhancedChart = ({ 
  data, 
  type = 'line', 
  title, 
  color = '#0ea5e9', 
  chartHeight = 200,
  showGrid = true,
  xLabel = 'Slice Number',
  yLabel = 'Confidence',
  normalized = false 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-neutral-500 text-sm">
        No data available
      </div>
    );
  }

  const padding = { top: 20, right: 40, bottom: 40, left: 50 };
  const width = 400;
  const height = chartHeight - padding.top - padding.bottom;
  
  // Calculate scales
  const xScale = (i) => (i / (data.length - 1)) * width;
  const maxValue = normalized ? 1 : Math.max(...data);
  const yScale = (val) => height - (val / maxValue) * height;
  
  // Generate points for polyline
  const points = data.map((val, i) => `${xScale(i)},${yScale(val)}`).join(' ');

  // Grid lines
  const gridLines = [];
  if (showGrid) {
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      gridLines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#374151"
          strokeWidth="0.5"
          opacity="0.3"
        />
      );
      const x = (width / 5) * i;
      gridLines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#374151"
          strokeWidth="0.5"
          opacity="0.3"
        />
      );
    }
  }

  return (
    <div className="w-full">
      <div className="text-sm font-medium text-neutral-200 mb-2">{title}</div>
      <div className="relative">
        <svg
          ref={svgRef}
          width={width + padding.left + padding.right}
          height={chartHeight + padding.top + padding.bottom}
          className="w-full bg-neutral-950 rounded border border-neutral-800"
        >
          {/* Grid */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {gridLines}
          </g>
          
          {/* Axes */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* X-axis */}
            <line x1={0} y1={height} x2={width} y2={height} stroke="#6b7280" strokeWidth="1" />
            {/* Y-axis */}
            <line x1={0} y1={0} x2={0} y2={height} stroke="#6b7280" strokeWidth="1" />
            
            {/* Data line */}
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            
            {/* Data points */}
            {data.map((val, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(val)}
                r="3"
                fill={color}
                className="cursor-pointer hover:r-4"
                onMouseEnter={(e) => {
                  setHoveredPoint({ index: i, value: val, x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </g>
          
          {/* Axis labels */}
          <text x={width / 2 + padding.left} y={height + padding.top + 25} 
                textAnchor="middle" className="text-xs fill-neutral-400">
            {xLabel}
          </text>
          <text x={-height / 2 + padding.top} y={15} 
                textAnchor="middle" transform="rotate(-90)" className="text-xs fill-neutral-400">
            {yLabel}
          </text>
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-neutral-800 border border-neutral-600 rounded px-2 py-1 text-xs text-white pointer-events-none z-10"
            style={{
              left: hoveredPoint.x - padding.left,
              top: hoveredPoint.y - padding.top - 40,
            }}
          >
            <div>Slice {hoveredPoint.index + 1}</div>
            <div>{yLabel}: {hoveredPoint.value.toFixed(3)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChart;
