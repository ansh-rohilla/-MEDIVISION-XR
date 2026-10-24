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
    <footer className="mt-8 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 shadow-xs z-30 font-sans transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between min-h-[56px] py-2 md:py-0 gap-3 text-xs text-slate-600 dark:text-slate-400">
          
          {/* Left: Brand Tag, Copyright & Build Pill */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">MEDIVISION</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                XR v2.5
              </span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              © {currentYear} Spatial 3D Diagnostics
            </span>
          </div>

          {/* Center: System Telemetry & Compliance Badges */}
          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>PACS Server Active</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-bold">
              <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>HIPAA Encrypted</span>
            </span>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              <Cpu className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>WebGL Hardware 60 FPS</span>
            </span>
          </div>

          {/* Right: Essential Legal Links & Back to Top */}
          <div className="flex items-center space-x-4 shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <a href="#privacy" className="hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
              Privacy
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="#terms" className="hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
              Terms
            </a>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <a href="#docs" className="hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
              Docs
            </a>

            <button
              onClick={scrollToTop}
              className="ml-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700"
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
