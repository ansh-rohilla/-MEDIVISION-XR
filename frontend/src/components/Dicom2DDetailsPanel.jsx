import React, { useState } from 'react';
import { 
  Sliders, 
  Activity, 
  Layers, 
  FileText, 
  Eye, 
  Box, 
  Brain, 
  Target, 
  ShieldCheck, 
  Info,
  Maximize2,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import EnhancedChart from '../EnhancedChart';

export default function Dicom2DDetailsPanel({ 
  currentSliceIdx = 0, 
  totalSlices = 218, 
  bodyPart = 'Chest', 
  sessionId = '',
  onSliceChange,
  onNavigateTo3D,
  onNavigateToAI
}) {
  const [activeWindow, setActiveWindow] = useState('soft_tissue');

  // Simulated Hounsfield Unit (HU) histogram profile data
  const huHistogramData = [
    15, 22, 45, 98, 142, 85, 42, 38, 65, 110, 185, 240, 190, 125, 75, 48, 32, 28, 55, 92, 130, 85, 40, 22
  ];

  const landmarks = [
    { name: 'Right Upper Lobe Lesion Target', slice: 42, type: 'Pathology', status: 'High Risk', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { name: 'Carina / Tracheal Bifurcation', slice: 28, type: 'Anatomical', status: 'Reference', color: 'bg-brand-50 text-brand-700 border-brand-200' },
    { name: 'Aortic Arch & Great Vessels', slice: 18, type: 'Vascular', status: 'Normal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Diaphragmatic Dome & Liver Peak', slice: 85, type: 'Visceral', status: 'Normal', color: 'bg-amber-50 text-amber-700 border-amber-200' }
  ];

  const windowPresets = [
    { id: 'soft_tissue', name: 'Soft Tissue', width: 400, level: 40, desc: 'Optimized for muscle, organs & visceral structures' },
    { id: 'bone', name: 'Bone Window', width: 1800, level: 400, desc: 'Optimized for skeletal cortical bone & calcification' },
    { id: 'lung', name: 'Lung Parenchyma', width: 1500, level: -600, desc: 'Optimized for pulmonary airspaces & nodule margins' },
    { id: 'brain', name: 'Brain / Cranial', width: 80, level: 40, desc: 'Optimized for gray/white matter differentiation' }
  ];

  return (
    <div className="space-y-6 pt-2">
      
      {/* 1. Hounsfield Unit (HU) Histogram & Window Level Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-700" />
              <span>Pixel Intensity & Hounsfield Unit (HU) Calibration</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live HU distribution curve for Frame #{currentSliceIdx + 1} of {totalSlices}
            </p>
          </div>

          {/* Window Preset Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {windowPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setActiveWindow(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  activeWindow === preset.id
                    ? 'bg-brand-700 text-white border-brand-700 shadow-md shadow-brand-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <EnhancedChart 
              data={huHistogramData} 
              type="line"
              title="HU Pixel Intensity Distribution Curve"
              color="#0284c7"
              chartHeight={180}
              xLabel="Hounsfield Units (-1000 HU Air to +1000 HU Bone)"
              yLabel="Voxel Count"
            />
          </div>

          {/* HU Reference Ranges */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Radiodensity References</h4>

            <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-500 font-medium">Air / Lung Parenchyma</span>
              <span className="font-mono font-bold text-slate-900">-1000 to -500 HU</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-500 font-medium">Fat & Soft Tissue</span>
              <span className="font-mono font-bold text-brand-700">-100 to +80 HU</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-500 font-medium">Blood & Contrast</span>
              <span className="font-mono font-bold text-purple-700">+30 to +150 HU</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-500 font-medium">Cortical Bone</span>
              <span className="font-mono font-bold text-slate-900">+400 to +1000 HU</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DICOM Acquisition Metadata & Key Landmarks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DICOM Header Metadata Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-700" />
              <span>DICOM Acquisition & Tag Header Specification</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Part 10 Standard
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Imaging Modality</span>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">CT (Computed Tomography)</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Voxel Matrix</span>
              <p className="font-mono font-extrabold text-brand-700 mt-0.5">512 x 512 x {totalSlices}</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Slice Thickness</span>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">1.25 mm</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pixel Spacing (dX, dY)</span>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">0.703 mm x 0.703 mm</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">KVP / Tube Current</span>
              <p className="font-mono font-extrabold text-purple-700 mt-0.5">120 kV / 200 mA</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Patient Orientation</span>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">Axial (R-L, A-P)</p>
            </div>
          </div>
        </div>

        {/* Key Anatomical Landmarks Jumpers */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-700" />
            <span>Key Anatomical Landmarks</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {landmarks.map((lm, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between hover:border-brand-300 transition-colors"
              >
                <div>
                  <p className="font-bold text-slate-900">{lm.name}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">Target Frame: Slice #{lm.slice}</p>
                </div>

                {onSliceChange && (
                  <button
                    onClick={() => onSliceChange(lm.slice - 1)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-brand-400 text-brand-700 font-bold text-[11px] shadow-2xs transition-all shrink-0"
                  >
                    Jump
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Navigation Shortcuts Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">3D Volumetric Mesh Ready for Render</h4>
            <p className="text-xs text-slate-300 mt-0.5">Launch hardware-accelerated WebGL opacity controls and 3D organ callouts.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {onNavigateTo3D && (
            <button
              onClick={onNavigateTo3D}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
            >
              <Box className="w-4 h-4 text-brand-700" />
              <span>Open 3D Explorer</span>
            </button>
          )}

          {onNavigateToAI && (
            <button
              onClick={onNavigateToAI}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-brand-600/30 transition-all"
            >
              <Brain className="w-4 h-4" />
              <span>Run AI Diagnostics</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
