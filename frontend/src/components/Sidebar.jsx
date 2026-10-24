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
  Wifi,
  ChevronRight,
  Database
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  hasScan = false,
  sessionId = '',
  sliceCount = 0 
}) {
  const mainNavigation = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'upload', label: 'DICOM Ingestion', icon: UploadCloud },
  ];

  const workstationTools = [
    { id: 'slice2d', label: '2D Multiplanar Viewer', icon: Layers, badge: hasScan ? 'Loaded' : null },
    { id: 'volume3d', label: '3D Volumetric Explorer', icon: Box, badge: hasScan ? 'Ready' : null },
    { id: 'organ_segmentation', label: '3D Organ Callouts', icon: HeartPulse },
  ];

  const aiIntelligence = [
    { id: 'ai_results', label: 'AI Diagnostic Suite', icon: BrainCircuit },
    { id: 'accuracy', label: 'Model Benchmark', icon: BarChart3 },
  ];

  const renderNavGroup = (title, items) => (
    <div className="space-y-1">
      <p className="px-3 py-1 text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 group relative overflow-hidden ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
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
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
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
    <aside className="w-full md:w-64 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 flex flex-col shrink-0 shadow-card space-y-4 sticky top-6 h-fit transition-colors duration-200">
      
      {/* Section 1: Main Navigation */}
      {renderNavGroup('Navigation', mainNavigation)}

      {/* Section 2: Workstation Viewers */}
      {renderNavGroup('3D Workstation', workstationTools)}

      {/* Section 3: AI Intelligence */}
      {renderNavGroup('AI Diagnostics', aiIntelligence)}

      {/* Dynamic Active Series Badge (Only shown when a real scan is active) */}
      {hasScan && sessionId && (
        <div className="p-3 rounded-2xl bg-brand-50/70 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800/60 space-y-1 text-xs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active Series
            </span>
            {sliceCount > 0 && <span className="font-mono text-[10px]">{sliceCount} frames</span>}
          </div>
          <p className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
            UID: {sessionId.slice(0, 12)}...
          </p>
        </div>
      )}

      {/* Clean, Minimalist Status Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PACS Online</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold">
          HIPAA Ready
        </span>
      </div>

    </aside>
  );
}
