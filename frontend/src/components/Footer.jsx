import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Stethoscope, 
  Cpu, 
  Brain, 
  Layers, 
  Box, 
  FileCode, 
  Lock, 
  CheckCircle2, 
  Globe, 
  Sparkles,
  ArrowUpRight,
  Target
} from 'lucide-react';

export default function Footer({ activeTab, setActiveTab }) {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { id: 'overview', label: 'Dashboard Overview', icon: Activity },
    { id: 'upload', label: 'DICOM Upload Zone', icon: FileCode },
    { id: 'slice2d', label: '2D Multi-Planar Slice Viewer', icon: Layers },
    { id: 'volume3d', label: '3D Volumetric Explorer', icon: Box },
    { id: 'organ_segmentation', label: '3D Organ & Pathology Reticle', icon: Target },
    { id: 'ai_results', label: 'AI Diagnostic Analysis', icon: Brain },
    { id: 'accuracy', label: 'Accuracy Benchmark', icon: Cpu },
  ];

  return (
    <footer className="mt-12 bg-white border-t border-slate-200/80 font-sans text-slate-600">
      
      {/* Top Banner Accent Line */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600" />

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Col 1 & 2: Brand Identity & Platform Overview */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Logo Header */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900 tracking-tight">MEDIVISION</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono font-bold tracking-wider uppercase">
                    XR v2.4
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
                  Spatial Volumetric DICOM AI Platform
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed pr-4">
              Next-generation spatial imaging platform for automated 3D ResNet pathology localization, WebGL volumetric rendering, multi-organ segmentation callouts, and real-time DICOM Part 10 PACS ingestion.
            </p>

            {/* Status & Compliance Pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Backend Online (14ms)</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>HIPAA & PACS Compliant</span>
              </span>
            </div>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Workspace Navigation</span>
            </h4>
            <ul className="space-y-1.5 text-xs font-medium">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <li key={link.id}>
                    <button
                      onClick={() => setActiveTab && setActiveTab(link.id)}
                      className={`w-full text-left py-1 px-2 rounded-lg transition-colors flex items-center justify-between ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 font-bold' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span>{link.label}</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Col 4: Medical AI Capabilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Core Engines</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>3D ResNet-50 Deep Pathology Classifier</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Marching Cubes WebGL Hardware Iso-surface</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Hounsfield Unit (HU) Calibrated Windowing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Multi-Organ Anatomical Pin Callout Reticle</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Sub-Millimeter Slice Distance Calibration</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Security & Regulatory */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Security & Standards</span>
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-700 font-bold">
                <span>AES-256 TLS Encryption</span>
                <span className="text-emerald-600">Active</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-snug">
                Client-side anonymization strips Patient ID, Name, and Birthdate before cloud pipeline ingestion.
              </p>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-slate-500 font-mono text-[10px]">
                <span>PACS DICOM v3.0</span>
                <span className="font-bold text-blue-600">ISO 13485</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Divider & Rights Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-4">
            <p className="font-mono text-[11px]">
              © {currentYear} <span className="font-bold text-slate-800">MEDIVISION-XR</span>. All rights reserved.
            </p>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-slate-500">For Investigational & Clinical Decision Support Use</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px] font-medium">
            <a href="#privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Security Overview</a>
            <a href="#docs" className="hover:text-blue-600 transition-colors flex items-center gap-0.5">
              <span>API Docs</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
