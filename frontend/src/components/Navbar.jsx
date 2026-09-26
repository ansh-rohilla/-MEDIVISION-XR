import React, { useState, useRef, useEffect } from 'react';
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
  Cpu,
  Search,
  Bell,
  Plus,
  Wifi,
  ChevronRight,
  SlidersHorizontal,
  Command,
  Brain,
  Layers,
  Box,
  Check,
  X
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Pulmonary Nodule Classified (94.8%)',
      desc: 'MedicalNet 3D ResNet identified high suspicion nodule in Series #3cb8fa29.',
      time: '2 mins ago',
      unread: true,
      type: 'high',
      icon: Brain,
      targetTab: 'ai_results'
    },
    {
      id: 2,
      title: 'PACS DICOM Gateway Ingestion Synced',
      desc: '195 DICOM frames anonymized under HIPAA guidelines.',
      time: '12 mins ago',
      unread: true,
      type: 'info',
      icon: Layers,
      targetTab: 'slice2d'
    },
    {
      id: 3,
      title: '3D Volumetric Mesh Rendered',
      desc: 'Marching Cubes WebGL GLB geometry generated at 60 FPS.',
      time: '25 mins ago',
      unread: true,
      type: 'success',
      icon: Box,
      targetTab: 'volume3d'
    }
  ]);

  const popoverRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (notification) => {
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, unread: false } : n));
    if (notification.targetTab) {
      setActiveTab(notification.targetTab);
    }
    setShowNotifications(false);
  };

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'overview': return 'Dashboard Overview';
      case 'upload': return 'DICOM Ingestion Pipeline';
      case 'slice2d': return '2D Multiplanar Viewer';
      case 'volume3d': return '3D Volumetric Explorer';
      case 'organ_segmentation': return '3D Organ Callouts';
      case 'ai_results': return 'AI Diagnostic Suite';
      case 'accuracy': return 'Model Evaluation Benchmark';
      default: return 'Workstation';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Brand Logo & Active Breadcrumb */}
          <div className="flex items-center space-x-4 shrink-0">
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => setActiveTab('overview')}
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight font-sans">MEDIVISION</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                    XR v2.5
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 hidden sm:block">
                  Medical Imaging 3D Diagnostics Suite
                </p>
              </div>
            </div>

            {/* Active Tab Breadcrumb */}
            <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium">Workstation</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-brand-700 bg-brand-50/80 px-2.5 py-1 rounded-xl border border-brand-200/60">
                {getTabLabel(activeTab)}
              </span>
            </div>
          </div>

          {/* Center: Global Search Bar & Live System Status Badges */}
          <div className="flex-1 max-w-xl hidden md:flex items-center space-x-3">
            
            {/* Global Search Bar */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient DICOM series, CT/MRI scans, or pathology..."
                className="w-full pl-9 pr-12 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <span className="px-1.5 py-0.5 rounded bg-slate-200/70 border border-slate-300 text-[10px] font-mono font-bold text-slate-500 flex items-center gap-0.5">
                  <Command className="w-2.5 h-2.5" /> K
                </span>
              </div>
            </div>

            {/* PACS Status Pill */}
            <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-slate-700">PACS Online</span>
            </div>

          </div>

          {/* Right: Quick Actions, Alerts & User Profile */}
          <div className="flex items-center space-x-3 shrink-0">
            
            {/* Quick Upload Action */}
            <button
              onClick={() => setActiveTab('upload')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </button>

            {/* Notification Bell Dropdown Container */}
            <div className="relative" ref={popoverRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors ${
                  showNotifications ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100/80'
                }`}
                title="Radiology Alerts & Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Popover Dropdown Box */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden text-xs">
                  
                  {/* Popover Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-brand-700" />
                      <h4 className="font-bold text-slate-900">Radiology Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          {unreadCount} New
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-brand-700 hover:text-brand-800 font-bold flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                            item.unread ? 'bg-brand-50/40 hover:bg-brand-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            item.type === 'high' 
                              ? 'bg-rose-100 text-rose-700' 
                              : item.type === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-brand-100 text-brand-700'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <h5 className={`text-xs font-bold ${item.unread ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                                {item.title}
                              </h5>
                              {item.unread && (
                                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{item.desc}</p>
                            <p className="text-[10px] font-mono text-slate-400 pt-0.5">{item.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Popover Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setActiveTab('ai_results');
                        setShowNotifications(false);
                      }}
                      className="text-[11px] font-bold text-brand-700 hover:text-brand-800 flex items-center justify-center space-x-1 mx-auto"
                    >
                      <span>Open AI Diagnostic Suite</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Active Session Identifier */}
            {sessionId && (
              <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                <FileCode className="w-3.5 h-3.5 text-brand-600" />
                <span className="font-bold text-slate-800">{sessionId.slice(0, 6)}</span>
              </div>
            )}

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200/80">
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-100/80 border border-slate-200/80">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center text-xs font-extrabold shadow-2xs">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-900 leading-none">{user.name || user.email || 'Ansh'}</p>
                    <p className="text-[10px] text-brand-700 font-semibold leading-tight">Radiologist</p>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
