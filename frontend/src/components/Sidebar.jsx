import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Layers, 
  Box, 
  BrainCircuit, 
  BarChart3, 
  ShieldCheck,
  HeartPulse,
  Activity,
  Cpu,
  Database,
  Lock,
  Sparkles,
  ChevronRight,
  Wifi,
  Sliders,
  SlidersHorizontal,
  Target
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, hasScan = false }) {
  const mainNavigation = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, badge: 'Home' },
    { id: 'upload', label: 'DICOM Ingestion', icon: UploadCloud, badge: 'ZIP / DCM' },
  ];

  const workstationTools = [
    { id: 'slice2d', label: '2D Multiplanar Viewer', icon: Layers, badge: hasScan ? 'Active' : '2D Slices' },
    { id: 'volume3d', label: '3D Volumetric Explorer', icon: Box, badge: hasScan ? 'Ready' : 'WebGL 3D' },
    { id: 'organ_segmentation', label: '3D Organ Callouts', icon: HeartPulse, badge: 'Anatomy' },
  ];

  const aiIntelligence = [
    { id: 'ai_results', label: 'AI Diagnostic Suite', icon: BrainCircuit, badge: 'MedicalNet' },
    { id: 'accuracy', label: 'Model Benchmark', icon: BarChart3, badge: '3.6% Gain' },
  ];

  const systemStatus = [
    { label: 'PACS Gateway', status: 'Connected', icon: Wifi, color: 'text-emerald-500' },
    { label: '3D WebGL Engine', status: '60 FPS Active', icon: Cpu, color: 'text-brand-500' },
    { label: 'MedicalNet ML', status: 'Weights Loaded', icon: BrainCircuit, color: 'text-purple-500' }
  ];

  const renderNavGroup = (title, items) => (
    <div className="space-y-1.5">
      <p className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {/* Active Left Accent Pill */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full"></span>
              )}

              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white backdrop-blur'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col shrink-0 shadow-card space-y-4 sticky top-6 h-fit transition-colors duration-200">
      
      {/* Section 1: Main Navigation */}
      {renderNavGroup('Navigation', mainNavigation)}

      {/* Section 2: Workstation Viewers */}
      {renderNavGroup('3D Workstation', workstationTools)}

      {/* Section 3: AI Intelligence */}
      {renderNavGroup('AI Diagnostics', aiIntelligence)}

      {/* Quick Active Scan Metadata Widget */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <span>Active Session</span>
          <span className="text-brand-700 dark:text-brand-400 font-mono">CT #3cb8</span>
        </div>
        <div className="space-y-1 text-xs font-bold text-slate-800 dark:text-slate-200">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Modality</span>
            <span className="font-mono text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-800 text-[10px]">CT Scan</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Frames</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">195 DICOM</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">HU Window</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">Soft Tissue</span>
          </div>
        </div>
      </div>

      {/* Lower System Workstation Cards */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        
        {/* System Engine Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-brand-950 dark:from-slate-950 dark:to-[#082F49] text-white space-y-1.5 shadow-md border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-300">Engine Core</span>
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <h4 className="text-xs font-bold text-white">3D ResNet & VTK Engine</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            Real-time volumetric DICOM rendering with SimpleITK & MedicalNet feature extraction.
          </p>
        </div>

        {/* Live System Status Monitor */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">System Monitor</p>
          <div className="space-y-1">
            {systemStatus.map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <Icon className={`w-3.5 h-3.5 ${st.color}`} />
                    <span>{st.label}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[10px]">{st.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & HIPAA Compliance Tag */}
        <div className="pt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> DICOM Part 10 & HIPAA
          </span>
          <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">v2.5</span>
        </div>

      </div>

    </aside>
  );
}
