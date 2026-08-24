import React, { useState, useRef } from 'react';
import { 
  Box, 
  Maximize2, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Layers, 
  Orbit,
  RefreshCw
} from 'lucide-react';

export default function Dicom3DViewer({ 
  containerRef, 
  modelUrl, 
  volumeUrl, 
  showVolume, 
  volReady, 
  onToggleVolume,
  onResetCamera,
  sampleDistance,
  onSampleDistanceChange,
  qualityScale,
  onQualityScaleChange,
  snapshotUrl
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMousePosRef.current.x;
    const deltaY = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => prev + deltaX * 0.6);
    setRotX((prev) => Math.max(-85, Math.min(85, prev - deltaY * 0.6)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.5, Math.min(3.0, z * factor)));
  };

  const resetInteractiveView = () => {
    setRotX(0);
    setRotY(0);
    setZoom(1);
    if (onResetCamera) onResetCamera();
  };

  return (
    <div className={`bg-obsidian-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
      fullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'relative'
    }`}>
      
      {/* 3D Viewer Glass Top Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-white z-30">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-accent-500 text-white flex items-center justify-center shadow-lg shadow-brand-700/20">
            <Box className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span>3D Volumetric Anatomical Explorer</span>
              <span className="px-2 py-0.5 rounded bg-accent-500/20 text-accent-400 text-[10px] font-mono font-bold">
                VTK / WebGL 3D Orbit
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive 360° Mouse Rotation & Volumetric Render
            </p>
          </div>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center space-x-2">
          {volumeUrl && (
            <button
              onClick={onToggleVolume}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                showVolume 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showVolume ? '3D Density Volume (Active)' : '3D Density Volume (Switch)'}</span>
            </button>
          )}

          <button
            onClick={resetInteractiveView}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Fullscreen View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Container & Floating HUD */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="relative flex-1 min-h-[480px] bg-obsidian-950 flex items-center justify-center p-2 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        
        {/* VTK Volume Rendering Canvas Container */}
        <div
          ref={containerRef}
          className="w-full h-full min-h-[460px] transition-opacity duration-200"
          style={{
            opacity: showVolume ? 1 : 0,
            pointerEvents: showVolume ? 'auto' : 'none',
            position: 'absolute',
            inset: 0,
            zIndex: showVolume ? 10 : 0
          }}
        />

        {/* Fallback Interactive 3D Orbit View (Rotatable PNG/Snapshot or Model) */}
        {!showVolume && (
          <div className="w-full h-full min-h-[460px] flex items-center justify-center relative z-10 p-4">
            <div 
              className="transition-transform duration-75 flex items-center justify-center"
              style={{
                transform: `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${zoom})`,
                transformStyle: 'preserve-3d',
              }}
            >
              {snapshotUrl ? (
                <img
                  src={snapshotUrl}
                  alt="3D Preview Snapshot"
                  draggable={false}
                  className="max-h-[380px] rounded-2xl border border-slate-800 shadow-2xl object-contain pointer-events-none"
                />
              ) : (
                <div className="text-slate-500 space-y-2 text-center p-8">
                  <Box className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-xs font-medium">No 3D Model Loaded</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating HUD Controls Overlay - Bottom Left */}
        {showVolume && volReady && (
          <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-md text-xs text-slate-300 space-y-2 max-w-xs pointer-events-auto shadow-2xl z-20">
            <div className="flex items-center space-x-2 text-accent-400 font-bold">
              <Sliders className="w-4 h-4" />
              <span>Volume Render Controls</span>
            </div>

            {onSampleDistanceChange && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span>Sample Distance:</span>
                  <span className="text-white font-bold">{sampleDistance?.toFixed(1) || '1.0'}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  value={sampleDistance || 1.0}
                  onChange={(e) => onSampleDistanceChange(parseFloat(e.target.value))}
                  className="w-full accent-accent-500"
                />
              </div>
            )}
          </div>
        )}

        {/* 360 Degree Orbit Help Badge - Bottom Right */}
        <div className="absolute bottom-4 right-4 p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-md text-[11px] font-mono text-slate-300 space-y-1 pointer-events-none z-20 shadow-2xl">
          <p className="text-accent-400 font-bold flex items-center gap-1.5">
            <Orbit className="w-4 h-4 text-accent-400 animate-spin-slow" />
            <span>360° INTERACTIVE 3D ORBIT ACTIVE</span>
          </p>
          <p className="text-slate-300">✦ Click & Drag Mouse: Rotate 3D Anatomical Model</p>
          <p className="text-slate-300">✦ Scroll Wheel: Zoom In / Out</p>
        </div>

      </div>

    </div>
  );
}
