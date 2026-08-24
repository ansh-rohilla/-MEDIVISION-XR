import React, { useState } from 'react';
import { 
  Layers, 
  Sun, 
  Sliders, 
  Maximize2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export default function Dicom2DViewer({ 
  sliceUrls = [], 
  currentSliceIdx = 0, 
  onSliceChange,
  metadata 
}) {
  const [contrastPreset, setContrastPreset] = useState('soft_tissue');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(100);

  if (!sliceUrls || sliceUrls.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-card">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">No 2D Slices Available</h3>
          <p className="text-xs text-slate-500 mt-1">Please upload a DICOM scan series to inspect multiplanar reconstruction slices.</p>
        </div>
      </div>
    );
  }

  const currentSliceUrl = sliceUrls[currentSliceIdx] || sliceUrls[0];

  const presets = [
    { id: 'soft_tissue', label: 'Soft Tissue', b: 100, c: 100 },
    { id: 'bone', label: 'Bone Window', b: 115, c: 140 },
    { id: 'lung', label: 'Lung Window', b: 85, c: 160 },
  ];

  const handlePresetChange = (preset) => {
    setContrastPreset(preset.id);
    setBrightness(preset.b);
    setContrast(preset.c);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setZoom(100);
    setContrastPreset('soft_tissue');
  };

  const handleDownloadSnapshot = () => {
    if (!currentSliceUrl) return;
    const a = document.createElement('a');
    a.href = currentSliceUrl;
    a.download = `dicom_slice_${currentSliceIdx + 1}.png`;
    a.click();
  };

  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      
      {/* Viewer Header & Preset Toolbar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-brand-700/50 text-accent-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span>2D DICOM Slice Reconstruction</span>
              <span className="px-2 py-0.5 rounded bg-brand-500/20 text-accent-400 text-[10px] font-mono">
                Axial View
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Frame {currentSliceIdx + 1} of {sliceUrls.length}
            </p>
          </div>
        </div>

        {/* Contrast Presets */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                contrastPreset === p.id 
                  ? 'bg-brand-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Adjustments"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadSnapshot}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Snapshot</span>
          </button>
        </div>
      </div>

      {/* Main Viewport & HUD */}
      <div className="relative flex-1 min-h-[440px] bg-black flex items-center justify-center p-4 overflow-hidden select-none">
        
        {/* Slice Image Canvas */}
        <img
          src={currentSliceUrl}
          alt={`DICOM Slice ${currentSliceIdx + 1}`}
          className="max-h-[500px] object-contain transition-all duration-150"
          style={{
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
            transform: `scale(${zoom / 100})`,
          }}
        />

        {/* HUD Metadata Overlay - Top Left */}
        <div className="absolute top-4 left-4 p-3 rounded-xl bg-slate-950/70 border border-white/10 backdrop-blur-md font-mono text-[10px] text-accent-300 space-y-1 pointer-events-none">
          <p className="font-bold text-white">PATIENT SCAN INFO</p>
          <p>MODALITY: CT / Volumetric</p>
          <p>FRAME: {currentSliceIdx + 1} / {sliceUrls.length}</p>
          <p>ZOOM: {zoom}%</p>
        </div>

        {/* HUD Metadata Overlay - Bottom Right */}
        <div className="absolute bottom-4 right-4 p-3 rounded-xl bg-slate-950/70 border border-white/10 backdrop-blur-md font-mono text-[10px] text-slate-400 space-y-0.5 pointer-events-none">
          <p>BRIGHTNESS: {brightness}%</p>
          <p>CONTRAST: {contrast}%</p>
          <p>ORIENTATION: AXIAL</p>
        </div>
      </div>

      {/* Slice Stepper & Controls Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-4">
        
        {/* Slice Navigation Slider */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSliceChange(Math.max(0, currentSliceIdx - 1))}
            disabled={currentSliceIdx === 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center space-x-3">
            <input
              type="range"
              min={0}
              max={sliceUrls.length - 1}
              value={currentSliceIdx}
              onChange={(e) => onSliceChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent-500"
            />
            <span className="font-mono text-xs text-white font-bold shrink-0 w-16 text-right">
              {currentSliceIdx + 1} / {sliceUrls.length}
            </span>
          </div>

          <button
            onClick={() => onSliceChange(Math.min(sliceUrls.length - 1, currentSliceIdx + 1))}
            disabled={currentSliceIdx === sliceUrls.length - 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:hover:bg-slate-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Fine Adjustment Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-900 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Sun className="w-4 h-4 text-slate-400" />
            <span className="w-20">Brightness:</span>
            <input
              type="range"
              min={50}
              max={150}
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full accent-accent-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="w-20">Contrast:</span>
            <input
              type="range"
              min={50}
              max={180}
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
              className="w-full accent-accent-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Maximize2 className="w-4 h-4 text-slate-400" />
            <span className="w-20">Zoom:</span>
            <input
              type="range"
              min={70}
              max={200}
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="w-full accent-accent-500"
            />
          </div>
        </div>

      </div>

    </div>
  );
}
