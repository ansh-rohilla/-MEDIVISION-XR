import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  AlertCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, authError }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(username, password);
      } else {
        await onRegister(username, password);
      }
      onClose();
    } catch (err) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Activity className="w-5 h-5 text-accent-400 animate-pulse" />
            </div>
            <span className="font-bold text-base tracking-tight">Medivision XR Portal</span>
          </div>

          <h2 className="text-xl font-bold text-white">
            {isLogin ? 'Sign In to Your Workspace' : 'Create Radiologist Account'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Access secure diagnostic workflows and 3D volumetric scans
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setLocalError(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              isLogin 
                ? 'border-brand-700 text-brand-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setIsLogin(false); setLocalError(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              !isLogin 
                ? 'border-brand-700 text-brand-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Register
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(localError || authError) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{localError || authError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email / Radiologist ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. demo@medivision.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs font-medium text-slate-800 placeholder-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs font-medium text-slate-800 placeholder-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                />
                <span>Remember session</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 hover:from-brand-800 hover:to-brand-600 text-white font-bold text-xs shadow-md shadow-brand-700/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <span>{isLogin ? 'Sign In to Dashboard' : 'Register Account'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
