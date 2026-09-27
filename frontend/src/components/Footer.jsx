import React from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  ArrowUp,
  Cpu,
  Lock,
  Globe
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-8 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-xs z-30 font-sans">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[56px] py-2 md:py-0 gap-3 text-xs text-slate-600">
          
          {/* Left: Brand Tag, Copyright & Build Pill */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 tracking-tight">MEDIVISION</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                XR v2.5
              </span>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 font-medium">
              © {currentYear} Spatial 3D Diagnostics
            </span>
          </div>

          {/* Center: System Telemetry & Compliance Badges */}
          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PACS Server Active</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>HIPAA Encrypted</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              <Cpu className="w-3 h-3 text-slate-500" />
              <span>WebGL Hardware 60 FPS</span>
            </span>
          </div>

          {/* Right: Essential Legal Links & Back to Top */}
          <div className="flex items-center space-x-4 shrink-0 text-[11px] font-medium text-slate-500">
            <a href="#privacy" className="hover:text-brand-700 transition-colors">
              Privacy
            </a>
            <span className="text-slate-300">•</span>
            <a href="#terms" className="hover:text-brand-700 transition-colors">
              Terms
            </a>
            <span className="text-slate-300">•</span>
            <a href="#docs" className="hover:text-brand-700 transition-colors">
              Docs
            </a>

            <button
              onClick={scrollToTop}
              className="ml-2 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center border border-slate-200"
              title="Back to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
