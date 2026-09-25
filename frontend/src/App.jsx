import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import AuthModal from './components/AuthModal';
import UploadZone from './components/UploadZone';
import Dicom2DViewer from './components/Dicom2DViewer';
import Dicom2DDetailsPanel from './components/Dicom2DDetailsPanel';
import Dicom3DViewer from './components/Dicom3DViewer';
import ThreeDicomViewer from './components/ThreeDicomViewer';
import Dicom3DDetailsPanel from './components/Dicom3DDetailsPanel';
import OrganSegmentationViewer from './components/OrganSegmentationViewer';
import AiDiagnosticCard from './components/AiDiagnosticCard';
import AiDiagnosticDetails from './components/AiDiagnosticDetails';
import AccuracyComparison from './components/AccuracyComparison';
import OrganLabels from './OrganLabels';
import ScanMetadata from './ScanMetadata';

import { mockLabels } from './mockBackend';
import { api, pollUploadStatus } from './api';

// IMPORTANT: Load rendering profile BEFORE importing vtk classes to register WebGL implementations
import 'vtk.js/Sources/Rendering/Profiles/All';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkOpenGLVolumeMapper from 'vtk.js/Sources/Rendering/OpenGL/VolumeMapper';

// Defensive runtime patch for VTK WebGL Volume Mapper program.setContext null bug
try {
  if (vtkOpenGLVolumeMapper && vtkOpenGLVolumeMapper.extend) {
    const origExt = vtkOpenGLVolumeMapper.extend;
    vtkOpenGLVolumeMapper.extend = function (publicAPI, model, initialValues = {}) {
      const res = origExt(publicAPI, model, initialValues);
      const origForceRender = publicAPI.forceRender;
      if (origForceRender) {
        publicAPI.forceRender = function (...args) {
          try {
            return origForceRender.apply(this, args);
          } catch (err) {
            if (err?.message?.includes('setContext') || err?.message?.includes('model.program') || err?.message?.includes('null is not an object')) {
              console.warn('VTK OpenGLVolumeMapper forceRender suppressed context error:', err);
              return;
            }
            throw err;
          }
        };
      }
      return res;
    };
  }

  if (vtkRenderWindow && vtkRenderWindow.extend) {
    const origRWExt = vtkRenderWindow.extend;
    vtkRenderWindow.extend = function (publicAPI, model, initialValues = {}) {
      const res = origRWExt(publicAPI, model, initialValues);
      const origRender = publicAPI.render;
      if (origRender) {
        publicAPI.render = function (...args) {
          try {
            return origRender.apply(this, args);
          } catch (err) {
            if (err?.message?.includes('setContext') || err?.message?.includes('model.program') || err?.message?.includes('null is not an object')) {
              console.warn('VTK RenderWindow render suppressed context error:', err);
              return;
            }
            throw err;
          }
        };
      }
      return res;
    };
  }
} catch (e) {}

function App() {
  const BACKEND_ORIGIN = process.env.REACT_APP_BACKEND_ORIGIN || 'http://localhost:1000';
  const toBackendUrl = (u) => (u && u.startsWith('/')) ? `${BACKEND_ORIGIN}${u}` : u;
  const fmtError = (e) => {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e.message && typeof e.message === 'string') return e.message;
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  const detectBodyPart = (files) => {
    if (!files || !files.length) return 'chest';
    const fileArray = Array.from(files);
    for (const f of fileArray) {
      const name = (f.name || f.webkitRelativePath || '').toLowerCase();
      if (name.includes('brain') || name.includes('head')) return 'brain';
      if (name.includes('chest') || name.includes('lung') || name.includes('thorax')) return 'chest';
      if (name.includes('abdomen') || name.includes('stomach') || name.includes('liver')) return 'abdomen';
      if (name.includes('heart') || name.includes('cardio')) return 'heart';
      if (name.includes('neck')) return 'neck';
      if (name.includes('body') || name.includes('full')) return 'fullbody';
    }
    return 'chest';
  };

  // State Management
  const [sliceUrls, setSliceUrls] = useState([]);
  const [bodyPart, setBodyPart] = useState('brain');
  const [manualBodyPart, setManualBodyPart] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [volumeUrl, setVolumeUrl] = useState('');
  const [showVolume, setShowVolume] = useState(true);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const [sessionId, setSessionId] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [authOpen, setAuthOpen] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'upload' | 'slice2d' | 'volume3d' | 'ai_results' | 'accuracy'
  const [evalRes, setEvalRes] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [volDomain, setVolDomain] = useState(null);
  const [volWW, setVolWW] = useState(0);
  const [volWC, setVolWC] = useState(0);
  const [qualityScale, setQualityScale] = useState(1);
  const [sampleDistance, setSampleDistance] = useState(1);
  const [volReady, setVolReady] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [currentBodyPart, setCurrentBodyPart] = useState('');
  const [classification, setClassification] = useState(null);
  const [backendConnected, setBackendConnected] = useState(true);

  const vtkContainerRef = useRef(null);
  const baseSampleStepRef = useRef(1);
  const vtkRef = useRef({
    renderWindow: null,
    renderer: null,
    openGLRenderWindow: null,
    interactor: null,
    actor: null,
    mapper: null,
    ctfun: null,
    ofun: null,
  });

  const apiFetch = (url, opts = {}) => {
    const hdrs = { ...(opts.headers || {}) };
    if (token) hdrs['Authorization'] = `Bearer ${token}`;
    const fullUrl = url.startsWith('http') ? url : `${BACKEND_ORIGIN}${url}`;
    return fetch(fullUrl, { credentials: 'include', ...opts, headers: hdrs });
  };

  // Auth Status Check
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch('/api/auth/me');
        if (resp.ok) {
          const j = await resp.json();
          if (j.user) {
            setUser(j.user);
          } else {
            setUser(null);
          }
          setBackendConnected(true);
        } else {
          if (token) { 
            localStorage.removeItem('auth_token'); 
            setToken(''); 
          }
          setUser(null);
          setBackendConnected(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setUser(null);
        setBackendConnected(false);
      }
    })();
  }, []);

  // Keyboard navigation for slice viewer
  useEffect(() => {
    const onKey = (e) => {
      if (!sliceUrls.length || activeTab !== 'slice2d') return;
      if (e.key === 'ArrowRight') {
        setIdx((i) => (i + 1) % sliceUrls.length);
      } else if (e.key === 'ArrowLeft') {
        setIdx((i) => (i - 1 + sliceUrls.length) % sliceUrls.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sliceUrls.length, activeTab]);

  // Auth Functions
  const handleLogin = async (username, password) => {
    const resp = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, username, password })
    });
    const j = await resp.json();
    if (!resp.ok) throw new Error(j.error || 'Login failed');
    if (j.token) {
      localStorage.setItem('auth_token', j.token);
      setToken(j.token);
    }
    setUser(j.user);
  };

  const handleRegister = async (username, password) => {
    const resp = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, name: username, password })
    });
    const j = await resp.json();
    if (!resp.ok) throw new Error(j.error || 'Registration failed');
    if (j.token) {
      localStorage.setItem('auth_token', j.token);
      setToken(j.token);
    }
    setUser(j.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken('');
    setUser(null);
  };



  // VTK 3D Volume Mounting Effect
  useEffect(() => {
    if (!volumeUrl || !showVolume || activeTab !== 'volume3d') return;
    const container = vtkContainerRef.current;
    if (!container) return;

    let canceled = false;
    let rafId = null;

    const mount = async () => {
      setVolReady(false);
      try {
        const renderWindow = vtkRenderWindow.newInstance();
        const renderer = vtkRenderer.newInstance({ background: [0.043, 0.058, 0.09] });
        renderWindow.addRenderer(renderer);

        const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
        openGLRenderWindow.setContainer(container);
        renderWindow.addView(openGLRenderWindow);

        const interactor = vtkRenderWindowInteractor.newInstance();
        interactor.setView(openGLRenderWindow);
        interactor.initialize();
        interactor.bindEvents(container);

        const style = vtkInteractorStyleTrackballCamera.newInstance();
        interactor.setInteractorStyle(style);

        const resize = () => {
          if (!container || !vtkRef.current?.actor) return;
          const { clientWidth, clientHeight } = container;
          if (clientWidth && clientHeight) {
            try {
              openGLRenderWindow.setSize(clientWidth, clientHeight);
              renderWindow.render();
            } catch {}
          }
        };

        const reader = vtkXMLImageDataReader.newInstance();
        await reader.setUrl(volumeUrl);
        const imageData = reader.getOutputData(0);
        if (!imageData) throw new Error('VTI reader returned no image data');

        const mapper = vtkVolumeMapper.newInstance();
        mapper.setInputData(imageData);

        let step = 1.0;
        if (mapper.getSampleDistance) {
          step = mapper.getSampleDistance() || 1.0;
        }
        mapper.setSampleDistance(step);

        const actor = vtkVolume.newInstance();
        actor.setMapper(mapper);

        const scalars = imageData.getPointData()?.getScalars();
        if (!scalars) throw new Error('No scalar volume data found');

        const range = scalars.getRange();
        const low = range[0];
        const high = range[1];
        const mid = low + (high - low) * 0.5;

        const ctfun = vtkColorTransferFunction.newInstance();
        ctfun.addRGBPoint(low, 0.0, 0.0, 0.0);
        ctfun.addRGBPoint(mid, 1.0, 0.76, 0.65);
        ctfun.addRGBPoint(high, 1.0, 1.0, 1.0);

        const ofun = vtkPiecewiseFunction.newInstance();
        ofun.addPoint(low, 0.0);
        ofun.addPoint(mid, 0.2);
        ofun.addPoint(high, 1.0);

        actor.getProperty().setRGBTransferFunction(0, ctfun);
        actor.getProperty().setScalarOpacity(0, ofun);
        actor.getProperty().setInterpolationTypeToLinear();

        renderer.addVolume(actor);

        vtkRef.current = {
          renderWindow,
          renderer,
          openGLRenderWindow,
          interactor,
          actor,
          mapper,
          ctfun,
          ofun,
        };

        resize();
        renderer.resetCamera();
        try { renderWindow.render(); } catch {}

        baseSampleStepRef.current = step;
        setSampleDistance(step);
        setVolDomain({ low, high });
        setVolWC(mid);
        setVolWW(Math.max(1, high - low));
        setVolReady(true);

        const observer = new ResizeObserver(() => resize());
        observer.observe(container);

        return () => observer.disconnect();
      } catch (e) {
        console.error('VTK volume mounting error:', e);
        return () => {};
      }
    };

    const kick = (attempt = 0) => {
      if (canceled) return;
      const { clientWidth, clientHeight } = container;
      if ((clientWidth || 0) > 0 && (clientHeight || 0) > 0) {
        let cleanup;
        mount().then((fn) => { cleanup = fn; }).catch(() => {});
        return () => cleanup && cleanup();
      }
      if (attempt < 30) {
        rafId = requestAnimationFrame(() => kick(attempt + 1));
      }
    };

    const cleanupMaybe = kick();

    return () => {
      canceled = true;
      if (rafId) cancelAnimationFrame(rafId);
      const v = vtkRef.current;
      if (v && v.renderWindow) {
        try { v.interactor?.unbindEvents(); } catch {}
        try { v.interactor?.delete(); } catch {}
        try { if (v.actor && v.renderer) v.renderer.removeVolume(v.actor); } catch {}
        try { v.actor?.delete(); } catch {}
        try { v.mapper?.delete(); } catch {}
        try { v.ctfun?.delete(); } catch {}
        try { v.ofun?.delete(); } catch {}
        try { if (v.openGLRenderWindow && v.renderWindow) v.renderWindow.removeView(v.openGLRenderWindow); } catch {}
        try { v.openGLRenderWindow?.delete(); } catch {}
        try { v.renderer?.delete(); } catch {}
        try { v.renderWindow?.delete(); } catch {}
        vtkRef.current = {
          renderWindow: null,
          renderer: null,
          openGLRenderWindow: null,
          interactor: null,
          actor: null,
          mapper: null,
          ctfun: null,
          ofun: null,
        };
      }
      setVolReady(false);
    };
  }, [volumeUrl, showVolume, activeTab]);

  // Intercept VTK.js WebGL context warnings/errors to prevent React error overlays
  useEffect(() => {
    const handleErr = (e) => {
      const msg = e?.message || e?.reason?.message || e?.error?.message || '';
      if (msg.includes('setContext') || msg.includes('model.program') || msg.includes('WebGL')) {
        if (e.preventDefault) e.preventDefault();
        return true;
      }
    };
    window.addEventListener('error', handleErr);
    window.addEventListener('unhandledrejection', handleErr);
    return () => {
      window.removeEventListener('error', handleErr);
      window.removeEventListener('unhandledrejection', handleErr);
    };
  }, []);

  const handleResetCamera = () => {
    try {
      if (vtkRef.current.renderer && vtkRef.current.renderWindow) {
        vtkRef.current.renderer.resetCamera();
        vtkRef.current.renderWindow.render();
      }
    } catch (e) {
      console.warn('VTK resetCamera warning:', e);
    }
  };

  const handleSampleDistanceChange = (dist) => {
    setSampleDistance(dist);
    try {
      if (vtkRef.current.mapper && vtkRef.current.renderWindow) {
        vtkRef.current.mapper.setSampleDistance(dist);
        vtkRef.current.renderWindow.render();
      }
    } catch (e) {
      console.warn('VTK sampleDistance warning:', e);
    }
  };

  const loadDemoData = () => {
    const demo = {
      session_id: '3cb8fa29-0eed-4616-a3bf-75771bf476b1',
      slice_urls: [
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0000.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0001.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0002.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0003.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0004.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0005.png"
      ],
      model_url: "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/model/model.glb",
      volume_url: "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/volume/volume.vti",
      snapshot_url: "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/snapshot/preview.png"
    };

    setSessionId(demo.session_id);
    setSliceUrls(demo.slice_urls.map(toBackendUrl));
    setModelUrl(toBackendUrl(demo.model_url));
    setVolumeUrl(toBackendUrl(demo.volume_url));
    setSnapshotUrl(toBackendUrl(demo.snapshot_url));
    setShowVolume(true);
    setIdx(0);
    setActiveTab('slice2d');
  };


  const uploadFiles = async (fileList) => {
    console.log('=== UPLOAD DEBUG START ===');
    console.log('1. fileList received:', fileList);
    console.log('2. fileList length:', fileList.length);
    console.log('3. BACKEND_ORIGIN:', BACKEND_ORIGIN);
    console.log('4. token present:', !!token);
    console.log('4.1. current token value:', token);
    
    // Use manual body part if selected, otherwise auto-detect
    const detectedBodyPart = manualBodyPart || detectBodyPart(fileList);
    console.log('4.2. Body part:', detectedBodyPart, '(manual:', manualBodyPart, ')');
    setBodyPart(detectedBodyPart);
    
    setLoading(true);
    setProcessingStage('Uploading files...');
    setProcessingProgress(5);
    setError('');
    try {
      console.log('5. Calling api.uploadFiles...');
      let result = await api.uploadFiles(Array.from(fileList));
      console.log('6. API result received:', result);

      if (result.status === 'processing' && result.session_id) {
        setSessionId(result.session_id);
        setProcessingStage('Processing scan on server...');
        setProcessingProgress(15);
        result = await pollUploadStatus(result.session_id, {
          onProgress: (status, attempt, maxAttempts) => {
            setProcessingStage(status.stage || 'Processing scan...');
            const pct = 15 + Math.round((attempt / maxAttempts) * 75);
            setProcessingProgress(Math.min(pct, 90));
          },
        });
      }

      if (result.slice_urls?.length || result.model_url || result.volume_url || result.snapshot_url) {
        console.log('7. Upload successful - updating state');
        setSessionId(result.session_id);
        setSliceUrls((result.slice_urls || []).map(toBackendUrl));
        setModelUrl(toBackendUrl(result.model_url || ''));
        setVolumeUrl(toBackendUrl(result.volume_url || ''));
        setSnapshotUrl(toBackendUrl(result.snapshot_url || ''));
        setCurrentBodyPart(detectedBodyPart);
        setShowLabels(false);
        setShowVolume(!!result.volume_url);
        setIdx(0);
        setProcessingProgress(100);
        setProcessingStage('Complete');
        setActionMsg(`Processed ${result.slice_urls?.length || 0} slices`);
        
        try {
          const classificationResult = await api.classifyScan(result.session_id, detectedBodyPart);
          setClassification(classificationResult.classification);
        } catch (e) {
          console.error('Classification failed:', e);
          setClassification(null);
        }
      } else {
        throw new Error(result.error || 'Upload failed - no processed files returned');
      }
    } catch (e) {
      console.log('9. Upload error caught:', e);
      console.log('10. Error details:', {
        message: e.message,
        stack: e.stack,
        name: e.name
      });
      // Show full error message including backend details
      let errorMsg = fmtError(e) || 'Upload failed';
      if (e.message && e.message !== 'Processing failed') {
        errorMsg = e.message;
      }
      setError(errorMsg);
    } finally {
      console.log('11. Setting loading to false');
      setLoading(false);
      console.log('=== UPLOAD DEBUG END ===');
    }
  };

  const onFolderChange = (e) => {
    console.log('=== FOLDER CHANGE DEBUG START ===');
    console.log('1. Folder change event triggered');
    console.log('2. e.target:', e.target);
    const files = e.target.files;
    console.log('3. files from event:', files);
    console.log('4. files length:', files ? files.length : 0);
    if (files && files.length) {
      console.log('5. Files found, calling uploadFiles');
      console.log('6. File details:', Array.from(files).map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        webkitRelativePath: f.webkitRelativePath
      })));
      uploadFiles(files);
    } else {
      console.log('5. No files found');
    }
    console.log('=== FOLDER CHANGE DEBUG END ===');
  };

  const onZipChange = (e) => {
    const files = Array.from(e.target.files);
    if (files && files.length) {
      console.log('ZIP file selected:', files.length);
      console.log('File details:', files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })));
      // Send the ZIP as a single file
      uploadFiles(files);
    } else {
      setError('No ZIP file selected');
    }
  };

  const openNativeViewer = async () => {
    setActionMsg('');
    try {
      const resp = await apiFetch('/api/open_interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      const txt = await resp.text();
      let data;
      try { data = JSON.parse(txt); } catch { throw new Error(txt); }
      if (!resp.ok) throw new Error(data.error || txt);
      setActionMsg(`Launched native viewer (pid ${data.pid}). A separate window should open.`);
    } catch (e) {
      setError(`Failed to open native viewer: ${fmtError(e)}`);
    }
  };




  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        sessionId={sessionId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendConnected={backendConnected}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasScan={sliceUrls.length > 0}
        />

        {/* Workspace Display Area */}
        <main className="flex-1 space-y-6">
          
          {/* Global Alert Notification */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-sm">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-800 font-bold">Dismiss</button>
            </div>
          )}

          {/* TAB 1: OVERVIEW & DASHBOARD */}
          {activeTab === 'overview' && (
            <HeroSection
              onStartUpload={() => setActiveTab('upload')}
              onOpenDemo={loadDemoData}
            />
          )}

          {/* TAB 2: DICOM UPLOAD */}
          {activeTab === 'upload' && (
            <UploadZone
              onUpload={uploadFiles}
              isUploading={loading}
              uploadProgress={processingProgress}
              processingStatus={{ stage: processingStage }}
              error={error}
              onOpenDemo={loadDemoData}
            />
          )}

          {/* TAB 3: 2D SLICE VIEWER */}
          {activeTab === 'slice2d' && (
            <div className="space-y-6">
              <Dicom2DViewer
                sliceUrls={sliceUrls}
                currentSliceIdx={idx}
                onSliceChange={setIdx}
                metadata={{ sessionId, bodyPart }}
              />

              <Dicom2DDetailsPanel
                currentSliceIdx={idx}
                totalSlices={sliceUrls.length || 218}
                bodyPart={currentBodyPart || bodyPart || 'Chest'}
                sessionId={sessionId}
                onSliceChange={setIdx}
                onNavigateTo3D={() => setActiveTab('volume3d')}
                onNavigateToAI={() => setActiveTab('ai_results')}
              />
            </div>
          )}

          {/* TAB 4: 3D VOLUMETRIC EXPLORER */}
          {activeTab === 'volume3d' && (
            <div className="space-y-6">
              <ThreeDicomViewer
                sliceUrls={sliceUrls}
                snapshotUrl={snapshotUrl}
                modelUrl={modelUrl}
                volumeUrl={volumeUrl}
              />

              <Dicom3DDetailsPanel
                modelUrl={modelUrl}
                volumeUrl={volumeUrl}
                onNavigateTo2D={() => setActiveTab('slice2d')}
                onNavigateToAI={() => setActiveTab('ai_results')}
                onNavigateToCallouts={() => setActiveTab('organ_segmentation')}
              />
            </div>
          )}

          {/* TAB 4.5: 3D ORGAN SEGMENTATION & CALLOUTS */}
          {activeTab === 'organ_segmentation' && (
            <div className="space-y-6">
              <OrganSegmentationViewer
                sliceUrls={sliceUrls}
                snapshotUrl={snapshotUrl}
                modelUrl={modelUrl}
                bodyPart={currentBodyPart || bodyPart || (classification ? classification.body_part : 'chest')}
                classificationData={classification}
              />
            </div>
          )}

          {/* TAB 5: AI DIAGNOSTIC RESULTS */}
          {activeTab === 'ai_results' && (
            <div className="space-y-6">
              <AiDiagnosticCard
                classificationData={classification}
                onNavigateToCallouts={() => setActiveTab('organ_segmentation')}
              />
              <AiDiagnosticDetails
                classificationData={classification}
                onNavigateTo2D={() => setActiveTab('slice2d')}
                onNavigateTo3D={() => setActiveTab('volume3d')}
                onNavigateToCallouts={() => setActiveTab('organ_segmentation')}
              />
            </div>
          )}

          {/* TAB 6: ACCURACY COMPARISON BENCHMARK */}
          {activeTab === 'accuracy' && (
            <AccuracyComparison />
          )}

        </main>
      </div>

      {/* Login & Registration Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        authError={error}
      />

    </div>
  );
}

export default App;
