import React, { useState } from 'react';
import { 
  Box, 
  Layers, 
  Sun, 
  Maximize2, 
  Download, 
  Brain, 
  Eye, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  ShieldCheck,
  RotateCw,
  Scissors
} from 'lucide-react';

export default function Dicom3DDetailsPanel({ 
  onNavigateToCallouts, 
  onNavigateToAI, 
  onNavigateTo2D,
  modelUrl,
  volumeUrl 
}) {
  const [activePalette, setActivePalette] = useState('bronze');
  const [opacityBone, setOpacityBone] = useState(100);
  const [opacityTissue, setOpacityTissue] = useState(85);
  const [opacityVascular, setOpacityVascular] = useState(90);
  const [cutawayActive, setCutawayActive] = useState(false);

  const palettes = [
    { id: 'bronze', name: 'Radiologic Bronze & Silver', desc: 'Metallic bone & tissue contrast', color: 'from-amber-600 to-slate-400' },
    { id: 'copper', name: 'Cinematic Warm Copper', desc: 'High-contrast organ highlight', color: 'from-orange-600 to-amber-700' },
    { id: 'silver', name: 'Pearl Silver Bone', desc: 'Skeletal structure isolation', color: 'from-slate-300 to-slate-500' },
    { id: 'flesh', name: 'Visceral Organ Flesh', desc: 'Soft tissue & viscera mapping', color: 'from-rose-500 to-red-700' },
    { id: 'lung', name: 'Pulmonary Lung Cyan', desc: 'Airspace & bronchial tree focus', color: 'from-cyan-500 to-brand-600' }
  ];

  return (
    <div className="space-y-6 pt-2">
      
      {/* 1. WebGL Transfer Function & Lighting Shading Palette Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Box className="w-5 h-5 text-brand-700" />
              <span>3D Volumetric Transfer Function & Shader Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize GPU WebGL color palettes, tissue layer opacity, and 3D cutaway slicing
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-brand-600" /> 60 FPS GPU Hardware Accelerated
            </span>
          </div>
        </div>

        {/* Palettes Grid */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Color Transfer Palettes</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {palettes.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePalette(p.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activePalette === p.id
                    ? 'bg-brand-50/70 border-brand-400 ring-2 ring-brand-500/20 shadow-sm'
                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60'
                }`}
              >
                <div className={`w-full h-3 rounded-full bg-gradient-to-r ${p.color} mb-2 shadow-2xs`}></div>
                <h5 className="text-xs font-bold text-slate-900 truncate">{p.name}</h5>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Opacity Sliders & Cutaway Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Skeletal / Bone Opacity</span>
              <span className="font-mono text-brand-700">{opacityBone}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={opacityBone} 
              onChange={(e) => setOpacityBone(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Visceral Soft Tissue Opacity</span>
              <span className="font-mono text-brand-700">{opacityTissue}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={opacityTissue} 
              onChange={(e) => setOpacityTissue(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Vascular Structure Opacity</span>
              <span className="font-mono text-brand-700">{opacityVascular}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={opacityVascular} 
              onChange={(e) => setOpacityVascular(e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        </div>
      </div>

      {/* 2. 3D Geometric Mesh Properties & Bounding Volume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mesh Technical Properties */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-700" />
              <span>3D Surface Mesh Geometry & Spatial Metrics</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">
              Marching Cubes ISO
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Polygon Triangles</span>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">142,500 Tris</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Surface Area</span>
              <p className="font-mono font-extrabold text-brand-700 mt-0.5">1,840 cm²</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Bounding Box</span>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">240 x 180 x 320 mm</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Iso-Surface Threshold</span>
              <p className="font-mono font-extrabold text-purple-700 mt-0.5">+200 HU (Tissue)</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Spatial Spacing</span>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">0.75 mm Isotropic</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mesh Export Format</span>
              <p className="font-mono font-extrabold text-slate-900 mt-0.5">Binary GLB / VTI</p>
            </div>
          </div>
        </div>

        {/* Quick Shader Action Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-700" />
              <span>3D Geometry Actions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Export volumetric assets or jump to 3D Callout Viewer</p>
          </div>

          <div className="space-y-2.5">
            {onNavigateToCallouts && (
              <button
                onClick={onNavigateToCallouts}
                className="w-full px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-brand-500/20 transition-all"
              >
                <Layers className="w-4 h-4" />
                <span>Open 3D Organ Callouts</span>
              </button>
            )}

            <button
              onClick={() => alert('Exporting 3D Binary GLB Mesh Model...')}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 border border-slate-200 transition-all"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download 3D GLB Model</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Diagnostic Navigation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">MedicalNet 3D Neural Classification Ready</h4>
            <p className="text-xs text-slate-300 mt-0.5">Evaluate deep learning diagnostic feature responses and lesion confidence scores.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {onNavigateTo2D && (
            <button
              onClick={onNavigateTo2D}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
            >
              <Eye className="w-4 h-4 text-brand-700" />
              <span>View 2D Slices</span>
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
