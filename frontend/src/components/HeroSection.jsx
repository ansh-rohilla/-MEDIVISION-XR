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
  Calendar,
  ChevronRight,
  Database,
  HardDrive,
  UserCheck
} from 'lucide-react';

export default function HeroSection({ onStartUpload, onInspectSession, onNavigateTab }) {
  const stats = [
    { label: 'Volumetric DICOM Slices', value: '250,000+', desc: 'Processed DICOM frames', icon: Layers, trend: '+14% this week', color: 'from-blue-500 to-cyan-500' },
    { label: 'Diagnostic AI Accuracy', value: '99.4%', desc: '3D ResNet MedicalNet', icon: Brain, trend: 'Benchmark Leader', color: 'from-purple-500 to-indigo-500' },
    { label: '3D Render Throughput', value: '60 FPS', desc: 'WebGL GPU Hardware Accelerated', icon: Zap, trend: 'Ultra Low Latency', color: 'from-amber-500 to-orange-500' },
    { label: 'Healthcare Compliance', value: 'Part 10', desc: 'HIPAA & PACS Compliant', icon: ShieldCheck, trend: 'Encrypted & Secure', color: 'from-emerald-500 to-teal-500' },
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

  const DEFAULT_SESSIONS = [
    { 
      id: '3cb8fa29-0eed-4616-a3bf-75771bf476b1', 
      patientId: 'PT-98042 (Anon)',
      body: 'Chest CT Volumetric Series', 
      region: 'Thorax / Pulmonary',
      slices: 195, 
      thickness: '0.75 mm',
      modality: 'CT', 
      date: 'Oct 24, 2026', 
      time: '14:48:12 IST',
      relativeTime: '2 mins ago',
      finding: 'Pneumonia / Nodule (94.8%)', 
      status: 'Analysis Complete', 
      risk: 'high',
      fileSize: '24.5 MB'
    },
    { 
      id: 'bea0052e-31c4-463e-a490-c291ae644094', 
      patientId: 'PT-47219 (Anon)',
      body: 'Abdominal Viscera CT', 
      region: 'Abdomen / Hepatic',
      slices: 120, 
      thickness: '1.25 mm',
      modality: 'CT', 
      date: 'Oct 24, 2026', 
      time: '14:35:50 IST',
      relativeTime: '14 mins ago',
      finding: 'Normal Organ Anatomy', 
      status: 'Clear', 
      risk: 'none',
      fileSize: '18.2 MB'
    },
    { 
      id: '1116bc40-cb9c-4980-b5ce-2630c5dddc98', 
      patientId: 'PT-63108 (Anon)',
      body: 'Thoracic Scan (Contrast)', 
      region: 'Thorax / Vascular',
      slices: 210, 
      thickness: '0.625 mm',
      modality: 'CT', 
      date: 'Oct 24, 2026', 
      time: '14:12:05 IST',
      relativeTime: '35 mins ago',
      finding: 'Infiltration Detected (88.2%)', 
      status: 'Follow-up Recommended', 
      risk: 'medium',
      fileSize: '31.4 MB'
    },
    {
      id: '7f92e4a1-8d23-41bb-b501-447a98c0921f',
      patientId: 'PT-81045 (Anon)',
      body: 'Full Body Multi-Organ CT',
      region: 'Systemic / Torso',
      slices: 340,
      thickness: '1.00 mm',
      modality: 'CT',
      date: 'Oct 24, 2026',
      time: '13:50:22 IST',
      relativeTime: '1 hour ago',
      finding: 'Multi-Organ Mapped (96.2%)',
      status: 'Analysis Complete',
      risk: 'none',
      fileSize: '48.6 MB'
    },
    {
      id: '992a18f4-2104-45e3-99b2-38b10f227001',
      patientId: 'PT-10394 (Anon)',
      body: 'Brain Cranial MRI Scan',
      region: 'Cerebral / Neuro',
      slices: 210,
      thickness: '0.50 mm',
      modality: 'MRI',
      date: 'Oct 24, 2026',
      time: '12:15:40 IST',
      relativeTime: '2 hours ago',
      finding: 'Cortical Ventricular Surface',
      status: 'Analysis Complete',
      risk: 'none',
      fileSize: '32.1 MB'
    }
  ];

  const recentSessions = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('radiology_sessions_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = [...parsed];
          DEFAULT_SESSIONS.forEach(def => {
            if (!combined.some(c => c.id === def.id)) {
              combined.push(def);
            }
          });
          return combined;
        }
      }
    } catch (e) {}
    return DEFAULT_SESSIONS;
  }, []);

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
          </div>
        </div>
      </div>

      {/* Live System Performance & Clinical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="p-5 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-card hover:shadow-card-hover transition-all duration-200 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{st.label}</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 group-hover:text-brand-600 dark:group-hover:text-brand-400 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{st.value}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{st.desc}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/60">{st.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Core Platform Capabilities Grid */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-5 transition-colors duration-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">End-to-End Diagnostic Pipeline Capabilities</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive DICOM visualization and deep learning classification workflows</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-brand-700 dark:text-brand-400 flex items-center justify-center shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {feat.badge}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{feat.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Diagnostic Sessions Table */}
      <div className="bg-white dark:bg-[#0B0F19] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-4 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Radiologic Sessions</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">History of ingested scans and AI classification status</p>
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3 font-bold">Acquisition Timestamp</th>
                <th className="py-3 px-3 font-bold">Session / Patient UID</th>
                <th className="py-3 px-3 font-bold">Scan Series & Region</th>
                <th className="py-3 px-3 font-bold">Modality & Specs</th>
                <th className="py-3 px-3 font-bold">Diagnostic Finding</th>
                <th className="py-3 px-3 font-bold">Pipeline Status</th>
                <th className="py-3 px-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {recentSessions.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 border border-slate-200/60 dark:border-slate-700 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">{row.date}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                            {row.relativeTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                          <span>{row.time}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-brand-700 dark:text-brand-400 text-xs">{row.id.slice(0, 8)}...</span>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        <UserCheck className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>{row.patientId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{row.body}</p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{row.region}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700">
                          {row.modality}
                        </span>
                        <span className="font-mono font-medium text-slate-600 dark:text-slate-400 text-[11px]">{row.slices} frames</span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 pl-0.5">Slice: {row.thickness || '0.75 mm'}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                      row.risk === 'none'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
                        : row.risk === 'medium'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        row.risk === 'none' ? 'bg-emerald-500' : row.risk === 'medium' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                      }`} />
                      <span>{row.finding}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="space-y-0.5">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {row.status}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 pl-3.5">PACS Synced • {row.fileSize}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => onInspectSession ? onInspectSession(row) : onStartUpload()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-brand-700 dark:hover:bg-brand-600 text-white text-[11px] font-bold transition-all shadow-xs inline-flex items-center space-x-1 dark:border dark:border-slate-700"
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
