import React, { useState } from 'react';

const EnhancedChart = ({ 
  data, 
  groupedData,
  type = 'line', 
  title = 'Performance Breakdown', 
  color = '#0ea5e9', 
  chartHeight = 220,
  showGrid = true,
  xLabel = 'Metrics',
  yLabel = 'Score (%)',
  normalized = false 
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  // Default demo data for grouped bar chart if none provided
  const defaultGroupedData = [
    { metric: 'Accuracy', baseline: 91.2, medicalNet: 94.8 },
    { metric: 'Precision', baseline: 89.4, medicalNet: 93.5 },
    { metric: 'Recall', baseline: 90.8, medicalNet: 94.2 },
    { metric: 'F1 Score', baseline: 90.1, medicalNet: 93.8 },
    { metric: 'Dice Coeff', baseline: 85.4, medicalNet: 91.2 },
    { metric: 'IoU Score', baseline: 78.2, medicalNet: 84.1 },
  ];

  const items = groupedData || (type === 'bar' ? defaultGroupedData : null);

  // Grouped Bar Chart Render Path
  if (type === 'bar' || items) {
    const activeData = items || defaultGroupedData;
    const padding = { top: 25, right: 20, bottom: 40, left: 45 };
    const viewBoxWidth = 460;
    const viewBoxHeight = chartHeight;
    const width = viewBoxWidth - padding.left - padding.right;
    const height = viewBoxHeight - padding.top - padding.bottom;

    const groupWidth = width / activeData.length;
    const barWidth = Math.min(18, groupWidth * 0.35);

    const minY = 70; // Zoom in Y axis from 70% to 100% for better visual resolution
    const maxY = 100;
    const yScale = (val) => height - ((val - minY) / (maxY - minY)) * height;

    const gridLines = [];
    const yTicks = [70, 80, 90, 100];
    yTicks.forEach((tick, i) => {
      const y = yScale(tick);
      gridLines.push(
        <g key={`ytick-${i}`}>
          <line
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={-8}
            y={y + 4}
            textAnchor="end"
            className="text-[10px] fill-slate-400 font-mono font-medium"
          >
            {tick}%
          </text>
        </g>
      );
    });

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-slate-400 inline-block shadow-sm"></span>
              <span className="font-semibold text-slate-600 text-[11px]">Baseline 3D-ResNet18</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-brand-600 inline-block shadow-sm"></span>
              <span className="font-bold text-brand-700 text-[11px]">MedicalNet 3D-ResNet50</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            className="w-full h-auto bg-slate-50/50 rounded-2xl border border-slate-200/80 p-1"
          >
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Horizontal Grid */}
              {gridLines}

              {/* Bars Group */}
              {activeData.map((d, i) => {
                const groupX = i * groupWidth + groupWidth / 2;
                const bHeight = height - yScale(d.baseline);
                const mHeight = height - yScale(d.medicalNet);

                const bX = groupX - barWidth - 2;
                const mX = groupX + 2;

                const isHovered = hoveredItem?.index === i;

                return (
                  <g 
                    key={i}
                    onMouseEnter={() => setHoveredItem({ index: i, data: d })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="cursor-pointer group"
                  >
                    {/* Hover Highlight Overlay */}
                    <rect
                      x={i * groupWidth + 2}
                      y={0}
                      width={groupWidth - 4}
                      height={height}
                      fill={isHovered ? '#0284c7' : 'transparent'}
                      opacity={isHovered ? 0.05 : 0}
                      rx="6"
                      className="transition-opacity duration-200"
                    />

                    {/* Baseline Bar */}
                    <rect
                      x={bX}
                      y={yScale(d.baseline)}
                      width={barWidth}
                      height={Math.max(bHeight, 2)}
                      fill="#94a3b8"
                      rx="4"
                      className="transition-all duration-300 group-hover:fill-slate-500"
                    />

                    {/* MedicalNet Bar */}
                    <rect
                      x={mX}
                      y={yScale(d.medicalNet)}
                      width={barWidth}
                      height={Math.max(mHeight, 2)}
                      fill="#0284c7"
                      rx="4"
                      className="transition-all duration-300 group-hover:fill-brand-700"
                    />

                    {/* Value Badge above MedicalNet bar */}
                    <text
                      x={mX + barWidth / 2}
                      y={yScale(d.medicalNet) - 5}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-brand-700 font-mono"
                    >
                      {d.medicalNet}%
                    </text>

                    {/* Metric Label below X-axis */}
                    <text
                      x={groupX}
                      y={height + 18}
                      textAnchor="middle"
                      className={`text-[11px] font-bold transition-colors ${
                        isHovered ? 'fill-brand-700 font-extrabold' : 'fill-slate-600'
                      }`}
                    >
                      {d.metric}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Line */}
              <line x1={0} y1={height} x2={width} y2={height} stroke="#cbd5e1" strokeWidth="1.5" />
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredItem && (
            <div className="absolute top-2 right-4 bg-slate-900/90 backdrop-blur text-white text-xs p-2.5 rounded-xl shadow-lg border border-slate-700 z-10 pointer-events-none">
              <p className="font-bold text-slate-200 mb-1">{hoveredItem.data.metric} Breakdown</p>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between space-x-3 text-slate-300">
                  <span>Baseline:</span>
                  <span className="font-bold">{hoveredItem.data.baseline}%</span>
                </div>
                <div className="flex justify-between space-x-3 text-emerald-400">
                  <span>MedicalNet:</span>
                  <span className="font-bold">{hoveredItem.data.medicalNet}%</span>
                </div>
                <div className="flex justify-between space-x-3 text-brand-300 pt-1 border-t border-slate-700 text-[10px]">
                  <span>Improvement:</span>
                  <span className="font-bold">+{(hoveredItem.data.medicalNet - hoveredItem.data.baseline).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single Array Line Chart Fallback
  const activeLineData = data || [80, 85, 88, 92, 94.8];
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };
  const width = 400;
  const height = chartHeight - padding.top - padding.bottom;

  const xScale = (i) => (i / Math.max(activeLineData.length - 1, 1)) * width;
  const maxValue = normalized ? 1 : Math.max(...activeLineData, 100);
  const yScale = (val) => height - (val / maxValue) * height;

  const points = activeLineData.map((val, i) => `${xScale(i)},${yScale(val)}`).join(' ');

  return (
    <div className="w-full">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">{title}</div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width + padding.left + padding.right} ${chartHeight}`}
          className="w-full bg-slate-50 rounded-2xl border border-slate-200"
        >
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Axes */}
            <line x1={0} y1={height} x2={width} y2={height} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={0} y1={0} x2={0} y2={height} stroke="#cbd5e1" strokeWidth="1" />

            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {activeLineData.map((val, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(val)}
                r="4"
                fill={color}
                className="cursor-pointer hover:r-6 transition-all"
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default EnhancedChart;
