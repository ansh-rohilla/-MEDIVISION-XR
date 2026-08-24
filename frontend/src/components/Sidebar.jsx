import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Layers, 
  Box, 
  BrainCircuit, 
  BarChart3, 
  ShieldCheck,
  HeartPulse
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, hasScan = false }) {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'upload', label: 'DICOM Upload', icon: UploadCloud, badge: 'ZIP/Folder' },
    { id: 'slice2d', label: '2D Slice Viewer', icon: Layers, badge: hasScan ? 'Active' : null },
    { id: 'volume3d', label: '3D Explorer', icon: Box, badge: hasScan ? 'Ready' : null },
    { id: 'organ_segmentation', label: '3D Organ Callouts', icon: HeartPulse, badge: '3D Callouts' },
    { id: 'ai_results', label: 'AI Diagnostic', icon: BrainCircuit, badge: 'ML' },
    { id: 'accuracy', label: 'Model Benchmark', icon: BarChart3, badge: 'Compare' },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-sm">
      <div className="space-y-5">
        <div>
          <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Navigation
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Capability Highlight */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 hidden md:block">
          <p className="text-xs font-bold text-slate-800">3D ResNet & VTK Engine</p>
          <p className="text-[11px] text-slate-500 leading-normal">
            Real-time volumetric DICOM rendering with SimpleITK and MedicalNet feature extraction.
          </p>
        </div>
      </div>

      {/* Security Tag */}
      <div className="pt-3 border-t border-slate-100 hidden md:block">
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>DICOM Part 10 & HIPAA Ready</span>
        </div>
      </div>
    </aside>
  );
}
