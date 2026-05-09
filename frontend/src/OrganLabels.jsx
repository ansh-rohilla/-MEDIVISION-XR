import React, { useEffect, useRef, useState } from 'react';
import { mockLabels } from './mockBackend';

const OrganLabels = ({ bodyPart, containerRef, visible, backendOrigin }) => {
  const [labels, setLabels] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [scanBounds, setScanBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // Add CSS animations to document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes label-entrance {
        0% { opacity: 0; transform: scale(0.8) translateY(10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      
      @keyframes scan-sweep {
        0% { background-position: 0% 0%; }
        50% { background-position: 100% 0%; }
        100% { background-position: 200% 0%; }
      }
      
      @keyframes hud-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Use container bounds directly for 3D viewer
  useEffect(() => {
    if (!containerRef.current || !visible) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // For 3D viewer, use very conservative bounds to ensure labels stay inside
    const safeBounds = {
      left: containerRect.width * 0.20,   // 20% margin from left
      top: containerRect.height * 0.15,  // 15% margin from top  
      width: containerRect.width * 0.60,  // 60% of width (very conservative)
      height: containerRect.height * 0.70 // 70% of height (very conservative)
    };
    
    console.log('🎯 Using CONSERVATIVE container bounds for 3D viewer:', safeBounds);
    console.log('🎯 Container size:', { width: containerRect.width, height: containerRect.height });
    setScanBounds(safeBounds);
  }, [containerRef, visible]);

  console.log('🏷️ OrganLabels component called with props:', { bodyPart, visible, containerRef: !!containerRef });

  useEffect(() => {
    console.log('Fetching labels for body part:', bodyPart);
    
    // Try to fetch from backend first (use proxy)
    fetch(`/api/labels/${bodyPart}`)
      .then(r => {
        if (!r.ok) throw new Error('Backend not accessible');
        return r.json();
      })
      .then(data => {
        console.log('API response received:', data);
        if (data && data.labels && data.labels.length > 0) {
          setLabels(data.labels);
        } else {
          // Fallback to mock data if backend returns empty
          console.log('Backend returned empty, using mock data');
          fetchMockData();
        }
      })
      .catch(error => {
        console.error('Error fetching labels, using mock data:', error);
        // Use mock data as fallback
        fetchMockData();
      });
    
    // Function to fetch mock data
    function fetchMockData() {
      fetch('/api/mock.json')
        .then(r => r.json())
        .then(mockData => {
          const mockLabels = mockData[bodyPart] || mockData.brain;
          setLabels(mockLabels.labels);
        })
        .catch(error => {
          console.error('Error fetching mock data:', error);
          // Final fallback to hardcoded data
          const fallbackLabels = [
            {name: "Cerebrum", x: 50, y: 30, side: "center", type: "normal", category: "organs", description: "Largest part of brain responsible for higher functions"},
            {name: "Cerebellum", x: 50, y: 65, side: "center", type: "normal", category: "organs", description: "Coordinates movement and balance"},
            {name: "Brainstem", x: 50, y: 80, side: "center", type: "normal", category: "organs", description: "Controls vital functions like breathing and heart rate"}
          ];
          setLabels(fallbackLabels);
        });
    }
  }, [bodyPart, backendOrigin]);

  useEffect(() => {
    if (!containerRef?.current) return;
    const updateDims = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height }); // Use actual container height
    };
    updateDims();
    const observer = new ResizeObserver(updateDims);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  if (!visible || dimensions.width === 0) return null;

  // Sort labels by Y position to prevent overlap
  const sortedLabels = [...labels].sort((a, b) => a.y - b.y);

  console.log('🔍 DEBUG - Container dimensions:', dimensions);
  console.log('🔍 DEBUG - Scan bounds:', scanBounds);
  console.log('🔍 DEBUG - Labels count:', labels.length);

  // Function to detect and resolve label overlaps
  const resolveOverlaps = (labelPositions) => {
    const BOX_H = 32;
    const HORIZONTAL_SPACING = 25;
    const VERTICAL_SPACING = 70;
    const resolvedPositions = [...labelPositions];
    
    // Sort by Y position for collision detection
    resolvedPositions.sort((a, b) => a.boxY - b.boxY);
    
    // First, try to distribute labels evenly vertically if there are many
    if (resolvedPositions.length > 3) {
      const availableHeight = dimensions.height - 20; // 10px margin top and bottom
      const totalRequiredHeight = resolvedPositions.length * (BOX_H + VERTICAL_SPACING);
      
      if (totalRequiredHeight > availableHeight) {
        // Compress spacing to fit all labels
        const compressedSpacing = (availableHeight - resolvedPositions.length * BOX_H) / (resolvedPositions.length - 1);
        const startY = 10;
        resolvedPositions.forEach((pos, idx) => {
          pos.boxY = startY + idx * (BOX_H + compressedSpacing);
        });
      } else {
        // Distribute evenly with full spacing
        const startY = 10;
        resolvedPositions.forEach((pos, idx) => {
          pos.boxY = startY + idx * (BOX_H + VERTICAL_SPACING);
        });
      }
    }
    
    // Then check for remaining collisions and resolve them
    let hasOverlap = true;
    let maxPasses = 20;
    let pass = 0;
    
    while (hasOverlap && pass < maxPasses) {
      hasOverlap = false;
      pass++;
      
      for (let i = 0; i < resolvedPositions.length; i++) {
        for (let j = i + 1; j < resolvedPositions.length; j++) {
          const a = resolvedPositions[i];
          const b = resolvedPositions[j];
          
          // Check if boxes overlap (both x and y)
          const xOverlap = !(a.boxX + a.BOX_W + HORIZONTAL_SPACING < b.boxX ||
                           b.boxX + b.BOX_W + HORIZONTAL_SPACING < a.boxX);
          const yOverlap = !(a.boxY + a.BOX_H + VERTICAL_SPACING < b.boxY ||
                           b.boxY + b.BOX_H + VERTICAL_SPACING < a.boxY);
          
          if (xOverlap && yOverlap) {
            hasOverlap = true;
            // Push both labels apart
            const midY = (a.boxY + b.boxY) / 2;
            const spacing = BOX_H + VERTICAL_SPACING;
            
            a.boxY = Math.max(10, midY - spacing / 2);
            b.boxY = Math.min(dimensions.height - BOX_H - 10, midY + spacing / 2);
          }
        }
      }
    }
    
    // Final bounds check to ensure all labels are within container
    resolvedPositions.forEach(pos => {
      pos.boxX = Math.max(10, Math.min(pos.boxX, dimensions.width - pos.BOX_W - 10));
      pos.boxY = Math.max(10, Math.min(pos.boxY, dimensions.height - pos.BOX_H - 10));
    });
    
    return resolvedPositions;
  };

  if (!visible || dimensions.width === 0 || scanBounds.width === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0,
      width: dimensions.width,
      height: dimensions.height,
      pointerEvents: 'none',
      zIndex: 999,
      background: 'transparent',
      overflow: 'hidden' // CRITICAL: Prevent overflow outside container
    }}>
      {/* Premium viewer frame */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        border: '1px solid rgba(16,185,129,0.3)',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 20px rgba(16,185,129,0.1)',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        {/* Corner brackets */}
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Top-left bracket */}
          <path d="M 0 0 L 20 0 L 20 20 L 0 20 Z" fill="none" stroke="#10B981" strokeWidth="1" opacity="0.6" />
          {/* Top-right bracket */}
          <path d={`M ${dimensions.width - 20} 0 L ${dimensions.width} 0 L ${dimensions.width} 20 L ${dimensions.width - 20} 20 Z`} fill="none" stroke="#10B981" strokeWidth="1" opacity="0.6" />
          {/* Bottom-left bracket */}
          <path d={`M 0 ${dimensions.height - 20} L 20 ${dimensions.height - 20} L 20 ${dimensions.height - 20} L 0 ${dimensions.height - 20} Z`} fill="none" stroke="#10B981" strokeWidth="1" opacity="0.6" />
          {/* Bottom-right bracket */}
          <path d={`M ${dimensions.width - 20} ${dimensions.height - 20} L ${dimensions.width} ${dimensions.height - 20} L ${dimensions.width - 20} ${dimensions.height - 20} Z`} fill="none" stroke="#10B981" strokeWidth="1" opacity="0.6" />
        </svg>
        
        {/* Scanning line animation */}
        <div style={{
          position: 'absolute',
          top: '10px', left: '20px', right: '20px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #10B981, transparent)',
          opacity: '0.4'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #10B981 0%, transparent 100%)',
            animation: 'scan-sweep 4s linear infinite'
          }} />
        </div>
        
                
              </div>
      
      {/* Unified SVG for all elements */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          overflow: 'hidden',
          zIndex: 999,
          pointerEvents: 'none'
        }}
      >
        {/* Define clipping path */}
        <defs>
          <clipPath id="viewer-clip">
            <rect x="0" y="0" width={dimensions.width} height={dimensions.height} />
          </clipPath>
        </defs>
        
        {/* Group with clipping applied */}
        <g clipPath="url(#viewer-clip)">
        {(() => {
          // First pass: Calculate all label positions
          const labelPositions = sortedLabels.map((label, i) => {
            // Calculate position within scan image area
            const dotX = scanBounds.left + (label.x / 100) * scanBounds.width;
            const dotY = scanBounds.top + (label.y / 100) * scanBounds.height;
            
            // Label box positioning with bounds checking
            const BOX_W = Math.max(90, label.name.length * 9 + 28);
            const BOX_H = 32;
            
            let boxX = label.side === 'left' 
              ? dotX - BOX_W - 35 
              : dotX + 35;
            let boxY = dotY - BOX_H / 2;
            
            // Clamp to scan image bounds with very strict margins
            const margin = 30;
            boxX = Math.max(scanBounds.left + margin, Math.min(boxX, scanBounds.left + scanBounds.width - BOX_W - margin));
            boxY = Math.max(scanBounds.top + margin, Math.min(boxY, scanBounds.top + scanBounds.height - BOX_H - margin));
            
            // FINAL safety check - ensure labels don't go outside container at all
            const containerWidth = dimensions.width;
            const containerHeight = dimensions.height;
            boxX = Math.max(10, Math.min(boxX, containerWidth - BOX_W - 10));
            boxY = Math.max(10, Math.min(boxY, containerHeight - BOX_H - 10));
            
            return {
              label,
              dotX,
              dotY,
              boxX,
              boxY,
              BOX_W,
              BOX_H,
              index: i
            };
          });
          
          // Resolve overlaps
          const resolvedPositions = resolveOverlaps(labelPositions);
          
          // Render labels with resolved positions
          return resolvedPositions.map(({ label, dotX, dotY, boxX, boxY, BOX_W, BOX_H, index: i }) => {
            console.log(`� Label ${i}: ${label.name} - Raw coords: x=${label.x}, y=${label.y}`);
            console.log(`📏 Scan bounds: left=${scanBounds.left.toFixed(1)}, top=${scanBounds.top.toFixed(1)}, width=${scanBounds.width.toFixed(1)}, height=${scanBounds.height.toFixed(1)}`);
            console.log(`🎯 Calculated dot: X=${dotX.toFixed(1)}, Y=${dotY.toFixed(1)}`);
            console.log(`📦 FINAL Label box: X=${boxX.toFixed(1)}, Y=${boxY.toFixed(1)}, W=${BOX_W}, H=${BOX_H}`);
            
            const labelCenterX = boxX + BOX_W / 2;
            const labelCenterY = boxY + BOX_H / 2;

            // Enhanced color mapping
            const getLabelColor = (type, category) => {
              const colorMap = {
                'airways': '#06B6D4', 'vascular': '#EF4444', 'lungs': '#10B981',
                'bones': '#F59E0B', 'organs': '#8B5CF6', 'gi': '#F97316',
                'tumor': '#EF4444'
              };
              return colorMap[category] || colorMap[type] || '#F59E0B';
            };

            const color = getLabelColor(label.type, label.category);
            const animationDelay = i * 100;
            
            console.log(`📍 Label ${i}: ${label.name} at scan coords (${dotX.toFixed(1)}, ${dotY.toFixed(1)})`);
            
            // Calculate bezier curve for connector
            const lineEndX = label.side === 'left' ? boxX + BOX_W : boxX;
            const lineEndY = labelCenterY;
            const cpX = (dotX + lineEndX) / 2;
            const cpY = Math.min(dotY, lineEndY) - 25;

          return (
            <g key={i} style={{
              animation: `label-entrance 0.6s ease-out ${animationDelay}ms both`
            }}>
              {/* Premium connector line */}
              <defs>
                <linearGradient id={`connector-gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.8" />
                </linearGradient>
              </defs>
              
              <path
                d={`M ${dotX} ${dotY} Q ${cpX} ${cpY} ${lineEndX} ${lineEndY}`}
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="5,3"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              >
                <animate attributeName="stroke-dashoffset" values="0;8" dur="2s" repeatCount="indefinite" />
              </path>
              
              {/* Premium anchor dot */}
              <g>
                <circle cx={dotX} cy={dotY} r="10" 
                  fill="none" stroke={color} strokeWidth="1" opacity="0.3">
                  <animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={dotX} cy={dotY} r="5" fill={color} opacity="0.95"/>
                <g>
                  <line x1={dotX - 8} y1={dotY} x2={dotX + 8} y2={dotY} 
                    stroke="white" strokeWidth="1" opacity="0.8" />
                  <line x1={dotX} y1={dotY - 8} x2={dotX} y2={dotY + 8} 
                    stroke="white" strokeWidth="1" opacity="0.8" />
                </g>
              </g>
              
              {/* Premium label box */}
              <defs>
                <linearGradient id={`label-gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.82)" />
                  <stop offset="100%" stopColor="rgba(94, 94, 181, 0.9)" />
                </linearGradient>
                <filter id={`label-glow-${i}`}>
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  <feMerge>
                    <feMergeNode in="SourceGraphic" />
                    <feMergeNode in="SourceGraphic" in2="BackgroundImage" mode="multiply" />
                  </feMerge>
                </filter>
              </defs>
              
              <g filter={`url(#label-glow-${i})`}>
                <rect
                  x={boxX} y={boxY}
                  width={BOX_W} height={BOX_H}
                  rx="5" ry="5"
                  fill={`url(#label-gradient-${i})`}
                  stroke={color} strokeWidth="1.5"
                  opacity="0.95"
                />
                
                {/* Left accent bar */}
                {label.side === 'left' && (
                  <rect
                    x={boxX} y={boxY}
                    width="3" height={BOX_H}
                    rx="2" fill={color} opacity="0.8"/>
                )}
                
                {/* Status badge */}
                <circle cx={boxX + BOX_W - 10} cy={boxY + 10} r="4" 
                  fill={label.type === 'tumor' ? '#EF4444' : '#10B981'} 
                  stroke="white" strokeWidth="0.5" />
                <text x={boxX + BOX_W - 10} y={boxY + 14} 
                  textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                  {label.type === 'tumor' ? '!' : '✓'}
                </text>
                
                {/* Label text */}
                <text
                  x={labelCenterX} y={labelCenterY + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="700"
                  fontFamily="Inter, -apple-system, sans-serif"
                  letterSpacing="0.5px"
                  textShadow="0 1px 2px rgba(0,0,0,0.8)"
                >
                  {label.name}
                </text>
              </g>
            </g>
          );
        });
        })()}
          </g> {/* Close clipping group */}
        </svg>
    </div>
  );
};

export default OrganLabels;
