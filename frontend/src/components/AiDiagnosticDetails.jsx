import React, { useState } from 'react';
import { 
  FileText, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Layers, 
  Eye, 
  Download, 
  Sparkles, 
  Maximize2,
  Sliders,
  Database,
  BarChart2
} from 'lucide-react';
import EnhancedChart from '../EnhancedChart';

export default function AiDiagnosticDetails({ 
  classificationData, 
  onNavigateTo2D, 
  onNavigateTo3D, 
  onNavigateToCallouts 
}) {
  const [selectedRegion, setSelectedRegion] = useState('nodule');

  const sliceConfidenceData = [
    12, 14, 15, 18, 22, 35, 58, 84, 92, 95, 91, 86, 64, 42, 28, 19, 15, 14, 12, 11
  ];

  const segmentationRegions = [
    {
      id: 'nodule',
      name: 'Right Upper Lobe Nodule',
      category: 'Primary Target Lesion',
      status: 'High Suspicion',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-200',
      volume: '1.84 cm³',
      density: '+42 HU Mean',
      sliceRange: 'Slices #38 - #46',
      targetSlice: 42,
      riskPct: 88,
      recommendation: 'Recommend contrast-enhanced thin-section follow-up CT in 3 months (RECIST 1.1 Category 4A).'
    },
    {
      id: 'lymph',
      name: 'Subcarinal Lymph Nodes',
      category: 'Nodal Assessment',
      status: 'Reactive / Mild',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      volume: '0.62 cm³',
      density: '+28 HU Mean',
      sliceRange: 'Slices #24 - #29',
      targetSlice: 26,
      riskPct: 34,
      recommendation: 'Borderline enlargement (8 mm short axis). Correlate with clinical systemic markers.'
    },
    {
      id: 'airway',
      name: 'Tracheobronchial Tree',
      category: 'Airway Anatomy',
      status: 'Patent & Clear',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      volume: '142.5 cm³',
      density: '-950 HU Mean',
      sliceRange: 'Slices #1 - #60',
      targetSlice: 20,
      riskPct: 4,
      recommendation: 'Normal airway lumen caliber. No endobronchial lesion or luminal narrowing.'
    },
    {
      id: 'pleura',
      name: 'Pleural Space & Wall',
      category: 'Thoracic Envelope',
      status: 'Trace Fluid',
      statusColor: 'bg-sky-50 text-sky-700 border-sky-200',
      volume: '0.15 cm³',
      density: '+12 HU Mean',
      sliceRange: 'Slices #50 - #58',
      targetSlice: 54,
      riskPct: 15,
      recommendation: 'Minor dependent fluid thickening. No obvious pleural nodularity or parietal pleural plaque.'
    }
  ];

  const activeRegion = segmentationRegions.find(r => r.id === selectedRegion) || segmentationRegions[0];

  return (
    <div className="space-y-6 pt-2">
      
      {/* 1. Volumetric Feature Profile & Slice Confidence Graph */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-700 dark:text-brand-400" />
              <span>Volumetric Feature Confidence (Z-Axis Profile)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              3D Convolutional activation responses across slice depth (Slices #1 to #20)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600 dark:text-purple-400" /> Peak Lesion: Slice #10 (95%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <EnhancedChart 
              data={sliceConfidenceData} 
              type="line"
              title="Slice-by-Slice AI Lesion Probability"
              color="#0284c7"
              chartHeight={190}
              xLabel="Slice Index (Z-Axis Depth)"
              yLabel="Confidence (%)"
            />
          </div>

          {/* Quick Metrics Panel */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Spatial Localization</h4>
            
            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Lesion Centroid</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">(X: 184, Y: 212, Z: 42)</span>
            </div>

            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Max Diameter</span>
              <span className="font-mono font-bold text-brand-700 dark:text-brand-400">14.2 mm</span>
            </div>

            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Radiomic SUV Max</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-400">4.85 g/mL</span>
            </div>

            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Volume Extent</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">1.84 cm³</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Organ & Anatomic Region Segmentation Breakdown */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-6 transition-colors duration-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-700 dark:text-brand-400" />
            <span>Anatomic Region & Tissue Segmentation Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed radiomic density analysis and AI risk scores per organ sub-region
          </p>
        </div>

        {/* Region Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {segmentationRegions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedRegion === region.id
                  ? 'bg-brand-50/80 dark:bg-brand-950/60 border-brand-300 dark:border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{region.category}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${region.statusColor}`}>
                  {region.riskPct}% Risk
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{region.name}</h4>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">{region.volume}</p>
            </button>
          ))}
        </div>

        {/* Selected Region Detailed Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/20 dark:from-slate-900/50 dark:to-brand-950/20 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeRegion.statusColor}`}>
                {activeRegion.status}
              </span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{activeRegion.name}</h4>
            </div>

            <div className="flex items-center space-x-3">
              {onNavigateTo2D && (
                <button
                  onClick={onNavigateTo2D}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Jump to {activeRegion.targetSlice ? `Slice #${activeRegion.targetSlice}` : '2D Viewer'}</span>
                </button>
              )}
              {onNavigateToCallouts && (
                <button
                  onClick={onNavigateToCallouts}
                  className="px-3 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-brand-500/20 transition-all"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Highlight in 3D Callouts</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <strong className="text-slate-800 dark:text-white font-bold">Clinical Insight: </strong>
            {activeRegion.recommendation}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Tissue Density</span>
              <p className="font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">{activeRegion.density}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Estimated Volume</span>
              <p className="font-mono font-extrabold text-brand-700 dark:text-brand-400 mt-0.5">{activeRegion.volume}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Slice Span</span>
              <p className="font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">{activeRegion.sliceRange}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">AI Malignancy Risk</span>
              <p className="font-mono font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{activeRegion.riskPct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Radiology Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Full Radiology AI Report Ready</h4>
            <p className="text-xs text-slate-300 mt-0.5">Includes RECIST 1.1 measurements, DICOM metadata, and 3D mesh references.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button 
            onClick={() => alert('Exporting PDF Diagnostic Report...')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
          >
            <Download className="w-4 h-4 text-brand-700" />
            <span>Export Radiology PDF</span>
          </button>
        </div>
      </div>

    </div>
  );
}
