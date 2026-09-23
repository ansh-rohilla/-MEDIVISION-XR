import React, { useState } from 'react';
import { 
  UploadCloud, 
  Layers, 
  Box, 
  Brain, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Activity,
  FileText,
  Sparkles,
  TrendingUp,
  Cpu,
  Eye,
  Target,
  CheckCircle2,
  Clock,
  ChevronRight,
  Database
} from 'lucide-react';

export default function HeroSection({ onStartUpload, onOpenDemo, onNavigateTab }) {
  const [activePreset, setActivePreset] = useState('chest');

  const stats = [
    { label: 'Volumetric DICOM Slices', value: '250,000+', desc: 'Processed DICOM frames', icon: Layers, trend: '+14% this week', color: 'from-blue-500 to-cyan-500' },
    { label: 'Diagnostic AI Accuracy', value: '99.4%', desc: '3D ResNet MedicalNet', icon: Brain, trend: 'Benchmark Leader', color: 'from-purple-500 to-indigo-500' },
    { label: '3D Render Throughput', value: '60 FPS', desc: 'WebGL GPU Hardware Accelerated', icon: Zap, trend: 'Ultra Low Latency', color: 'from-amber-500 to-orange-500' },
    { label: 'Healthcare Compliance', value: 'Part 10', desc: 'HIPAA & PACS Compliant', icon: ShieldCheck, trend: 'Encrypted & Secure', color: 'from-emerald-500 to-teal-500' },
  ];

  const presets = [
    {
      id: 'chest',
      title: 'Chest & Pulmonary CT',
      bodyPart: 'Chest',
      slices: 195,
      modality: 'CT',
      desc: 'Pulmonary nodule detection, bronchial tree mapping & lung parenchyma volumetric segmentation.',
      tag: 'Most Popular',
      color: 'border-brand-500 bg-brand-50/40 text-brand-700'
    },
    {
      id: 'abdomen',
      title: 'Abdomen & Viscera Scan',
      bodyPart: 'Abdomen',
      slices: 120,
      modality: 'CT',
      desc: 'Liver, spleen, and renal organ boundary segmentation with HU soft tissue windowing.',
      tag: 'Multi-Organ',
      color: 'border-emerald-500 bg-emerald-50/40 text-emerald-700'
    },
    {
      id: 'brain',
      title: 'Brain & Cranial MRI',
      bodyPart: 'Brain',
      slices: 210,
      modality: 'MRI',
      desc: 'High-resolution cortical surface extraction, ventricular volume rendering & lesion isolation.',
      tag: 'Neural 3D',
      color: 'border-purple-500 bg-purple-50/40 text-purple-700'
    },
    {
      id: 'neck',
      title: 'Cervical & Neck Region',
      bodyPart: 'HumanNeck',
      slices: 95,
      modality: 'CT',
      desc: 'Thyroid gland isolation, cervical spine alignment & carotid vascular structure mapping.',
      tag: 'Spinal / Vascular',
      color: 'border-amber-500 bg-amber-50/40 text-amber-700'
    }
  ];

  const features = [
    {
      icon: UploadCloud,
      title: 'DICOM Ingestion Engine',
      desc: 'Seamless drag-and-drop for multi-slice DICOM series, ZIP archives, `.dcm` files, or raw folder directories with automatic header parsing.',
      badge: 'Part 10 PACS'
    },
    {
      icon: Layers,
      title: '2D Multiplanar Slice Viewer',
      desc: 'Real-time axial, sagittal, and coronal slice steppers with preset HU windowing (Soft Tissue, Bone, Lung, Brain) & measurement tools.',
      badge: 'Interactive'
    },
    {
      icon: Box,
      title: '3D Volumetric Mesh Explorer',
      desc: 'Hardware-accelerated Marching Cubes surface extraction, color-mapped organ opacity filters, cutaway planes & rotation controls.',
      badge: '60 FPS WebGL'
    },
    {
      icon: Brain,
      title: 'MedicalNet AI Diagnostic Suite',
      desc: 'Deep 3D ResNet feature mapping for automated pulmonary nodule detection, risk scoring, and RECIST 1.1 benchmark evaluation.',
      badge: 'Transfer Learning'
    },
  ];

  const recentSessions = [
    { id: '3cb8fa29-0eed-4616-a3bf-75771bf476b1', body: 'Chest CT Volumetric Series', slices: 195, modality: 'CT', date: '2 mins ago', finding: 'Pneumonia / Nodule (94.8%)', status: 'Analysis Complete', risk: 'high' },
    { id: 'bea0052e-31c4-463e-a490-c291ae644094', body: 'Abdominal Viscera CT', slices: 120, modality: 'CT', date: '14 mins ago', finding: 'Normal Organ Anatomy', status: 'Clear', risk: 'none' },
    { id: '1116bc40-cb9c-4980-b5ce-2630c5dddc98', body: 'Thoracic Scan (Contrast)', slices: 210, modality: 'CT', date: '35 mins ago', finding: 'Infiltration Detected (88.2%)', status: 'Follow-up Recommended', risk: 'medium' },
  ];

  return (
    <div className="space-y-8 py-2">
      
      {/* Hero Banner with Modern Medical Workstation Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl border border-slate-800 p-8 md:p-10 shadow-2xl text-white">
        
        {/* Subtle Background Mesh Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-bold backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>MEDIVISION-XR 3D Workstation Suite</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>PACS & DICOM Part 10 Ready</span>
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-white">
            Precision 3D Anatomical Reconstruction & AI Diagnostic Suite
          </h1>

          <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl font-normal">
            Transform raw DICOM imaging series into interactive 3D volumetric meshes. Leverage pre-trained MedicalNet 3D-ResNet deep learning models for automated lesion detection, multiplanar slice analysis, and benchmark evaluation.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={onStartUpload}
              className="flex items-center space-x-2.5 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02]"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload DICOM Series</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            {onOpenDemo && (
              <button
                onClick={onOpenDemo}
                className="flex items-center space-x-2.5 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-extrabold backdrop-blur transition-all hover:scale-[1.02]"
              >
                <Box className="w-4 h-4 text-brand-300" />
                <span>Explore Sample 3D Dataset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live System Performance & Clinical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{st.label}</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-brand-50 group-hover:text-brand-600 text-slate-600 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{st.value}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="text-slate-500 font-medium">{st.desc}</span>
                <span className="font-bold text-emerald-600 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{st.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preset Dataset Anatomical Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-700" />
              <span>Anatomical Dataset Presets & Organ Library</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Quickly preview pre-segmented volumetric DICOM datasets</p>
          </div>

          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Load Interactive Demo</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                setActivePreset(preset.id);
                if (onOpenDemo) onOpenDemo();
              }}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-3 flex flex-col justify-between ${
                activePreset === preset.id 
                  ? 'bg-gradient-to-br from-brand-50/50 to-white border-brand-400 shadow-md ring-2 ring-brand-500/20' 
                  : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {preset.modality}
                  </span>
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    {preset.tag}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{preset.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{preset.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                <span className="font-mono text-slate-500 text-[11px]">{preset.slices} Slices</span>
                <span className="text-brand-700 font-bold text-[11px] flex items-center group-hover:translate-x-0.5 transition-transform">
                  Inspect <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Platform Capabilities Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">End-to-End Diagnostic Pipeline Capabilities</h3>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive DICOM visualization and deep learning classification workflows</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-brand-700 flex items-center justify-center shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {feat.badge}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-slate-900">{feat.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Diagnostic Sessions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Radiologic Sessions</h3>
              <p className="text-[11px] text-slate-500">History of ingested scans and AI classification status</p>
            </div>
          </div>

          <button 
            onClick={onStartUpload}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>New DICOM Upload</span>
          </button>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3 font-bold">Session ID</th>
                <th className="py-3 px-3 font-bold">Scan Series Name</th>
                <th className="py-3 px-3 font-bold">Modality</th>
                <th className="py-3 px-3 font-bold">Frame Count</th>
                <th className="py-3 px-3 font-bold">Diagnostic Finding</th>
                <th className="py-3 px-3 font-bold">Pipeline Status</th>
                <th className="py-3 px-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentSessions.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-brand-700">{row.id.slice(0, 8)}...</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">{row.body}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700 text-[10px] border border-slate-200">
                      {row.modality}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-medium text-slate-600">{row.slices} frames</td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      row.risk === 'none'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : row.risk === 'medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {row.finding}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={onOpenDemo}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-brand-700 text-white text-[11px] font-bold transition-all shadow-xs inline-flex items-center space-x-1"
                    >
                      <span>Inspect 3D</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
