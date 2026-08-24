import React from 'react';
import { 
  Activity, 
  User, 
  LogOut, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  ShieldCheck,
  Stethoscope,
  Cpu
} from 'lucide-react';

export default function Navbar({ 
  user, 
  onOpenAuth, 
  onLogout, 
  sessionId, 
  activeTab, 
  setActiveTab,
  backendConnected = true 
}) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">MEDIVISION</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                  XR v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Medical Imaging & 3D Diagnostics Suite
              </p>
            </div>
          </div>

          {/* Active Session Badge */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            {sessionId && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium font-mono text-[11px]">
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-400">Session:</span>
                <span className="font-bold text-slate-800">{sessionId.slice(0, 8)}...</span>
              </div>
            )}
          </div>

          {/* User Profile / Auth */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-900 leading-none">{user.name || user.email}</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">Radiologist</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
