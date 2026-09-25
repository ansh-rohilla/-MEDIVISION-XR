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
  Wifi
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
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              {/* Active Left Accent Pill */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full"></span>
              )}

              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-600'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white backdrop-blur'
                    : 'bg-slate-100 text-slate-600 border border-slate-200/80 group-hover:bg-slate-200'
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
    <aside className="w-full md:w-64 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col justify-between shrink-0 shadow-card space-y-6">
      
      {/* Upper Navigation Sections */}
      <div className="space-y-5">
        
        {/* Section 1: Main Navigation */}
        {renderNavGroup('Navigation', mainNavigation)}

        {/* Section 2: Workstation Viewers */}
        {renderNavGroup('3D Workstation', workstationTools)}

        {/* Section 3: AI Intelligence */}
        {renderNavGroup('AI Diagnostics', aiIntelligence)}

      </div>

      {/* Lower System Workstation Cards */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        
        {/* System Engine Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-brand-950 text-white space-y-2 shadow-md">
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
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">System Monitor</p>
          <div className="space-y-1.5">
            {systemStatus.map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center space-x-1.5 text-slate-600 font-medium">
                    <Icon className={`w-3.5 h-3.5 ${st.color}`} />
                    <span>{st.label}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-[10px]">{st.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & HIPAA Compliance Tag */}
        <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> DICOM Part 10 & HIPAA
          </span>
          <span className="font-mono text-[10px] font-bold text-slate-400">v2.5</span>
        </div>

      </div>

    </aside>
  );
}
