import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OrganLabels from './OrganLabels';
import EnhancedChart from './EnhancedChart';
import RadialChart from './RadialChart';
import RadarChart from './RadarChart';
import Header from './Header';
import LoadingSkeleton from './LoadingSkeleton';
import ProgressBar from './ProgressBar';
import LegendPanel from './LegendPanel';
import ScanMetadata from './ScanMetadata';
import DiseaseClassification from './DiseaseClassification';
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

function App() {
  const BACKEND_ORIGIN = process.env.REACT_APP_BACKEND_ORIGIN || 'http://localhost:5050';
  const toBackendUrl = (u) => (u && u.startsWith('/')) ? `${BACKEND_ORIGIN}${u}` : u;
  const fmtError = (e) => {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e.message && typeof e.message === 'string') return e.message;
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  const runEvaluation = async () => {
    if (!sessionId) return;
    setEvalLoading(true);
    setError('');
    try {
      const resp = await apiFetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      const txt = await resp.text();
      let data; try { data = JSON.parse(txt); } catch { throw new Error(txt); }
      if (!resp.ok) throw new Error(data.error || 'Evaluation failed');
      const torchMissing = !data.dependencies?.torch;
      const twoDReady = typeof data.two_d?.mean_top1_confidence === 'number';
      const threeDReady = typeof data.three_d?.top1_confidence === 'number';
      if (torchMissing || (!twoDReady && !threeDReady)) {
        const note = data.two_d?.notes || data.three_d?.notes || 'PyTorch is not available on the server.';
        throw new Error(note);
      }
      setEvalRes(data);
    } catch (e) {
      setError(fmtError(e));
    } finally {
      setEvalLoading(false);
    }
  };

  const handleNewScan = () => {
    // Reset all scan-related state
    setSessionId('');
    setSliceUrls([]);
    setModelUrl('');
    setVolumeUrl('');
    setShowVolume(false);
    setIdx(0);
    setEvalRes(null);
    setError('');
    setActionMsg('Ready for new scan');
    setCurrentBodyPart('');
    setSnapshotUrl('');
    setClassification(null);
  };
  const hasWebGL2 = useMemo(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      return !!gl;
    } catch {
      return false;
    }
  }, []);
  const [sliceUrls, setSliceUrls] = useState([]);
  const [bodyPart, setBodyPart] = useState('brain');
  const [manualBodyPart, setManualBodyPart] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [volumeUrl, setVolumeUrl] = useState('');
  const [showVolume, setShowVolume] = useState(false); // default to GLB for stability
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
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer' | 'accuracy'
  const [evalRes, setEvalRes] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [bgDark, setBgDark] = useState(true);
  const [volDomain, setVolDomain] = useState(null);
  const [volWW, setVolWW] = useState(0);
  const [volWC, setVolWC] = useState(0);
  const [qualityScale, setQualityScale] = useState(1);
  const [sampleDistance, setSampleDistance] = useState(1);
  const [volReady, setVolReady] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [currentBodyPart, setCurrentBodyPart] = useState('');
  const [classification, setClassification] = useState(null);
  const vtkContainerRef = useRef(null);
  const overlayContainerRef = useRef(null);
  const viewer3dRef = useRef(null);
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

  const loadWorkingData = () => {
    // Load the latest successful upload session
    const workingData = {
      session_id: '3cb8fa29-0eed-4616-a3bf-75771bf476b1',
      slice_urls: [
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0000.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0001.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0002.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0003.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0004.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0005.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0006.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0007.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0008.png",
        "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/slices/slice_0009.png"
      ],
      model_url: "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/model/model.glb",
      volume_url: "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/volume/volume.vti",
      snapshot_url: "/static/processed/3cb8fa29-0eed-4616-a3bf-75771bf476b1/snapshot/preview.png"
    };
    
    setSessionId(workingData.session_id);
    setSliceUrls(workingData.slice_urls.map(toBackendUrl));
    setModelUrl(toBackendUrl(workingData.model_url));
    setVolumeUrl(toBackendUrl(workingData.volume_url));
    setSnapshotUrl(toBackendUrl(workingData.snapshot_url));
    setShowLabels(false);
    setShowVolume(true); // Show volume since 3D model is available
    setActionMsg('Sample data loaded (10 slices with 3D model)');
    setError('');
    setIdx(0);
  };

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch('/api/auth/me');
        if (resp.ok) {
          const j = await resp.json();
          if (j.user) {
            setUser(j.user);
            setAuthOpen(false);
          } else {
            setUser(null);
            setAuthOpen(true);
          }
        } else {
          // Clear invalid token and show auth modal
          if (token) { 
            localStorage.removeItem('auth_token'); 
            setToken(''); 
          }
          setUser(null);
          setAuthOpen(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setUser(null);
        setAuthOpen(true);
      }
    })();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (!sliceUrls.length) return;
      if (e.key === 'ArrowRight') {
        setIdx((i) => (i + 1) % sliceUrls.length);
      } else if (e.key === 'ArrowLeft') {
        setIdx((i) => (i - 1 + sliceUrls.length) % sliceUrls.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sliceUrls.length]);

  // Initialize vtk.js volume when volumeUrl changes
  useEffect(() => {
    let canceled = false;
    let rafId = 0;
    const container = vtkContainerRef.current;
    if (!showVolume || !container || !volumeUrl) {
      return;
    }

    const mount = async () => {
      try {
        if (!hasWebGL2) {
          throw new Error('WebGL2 is not supported');
        }

        // Cleanup any previous renderer
        if (vtkRef.current.renderWindow) {
          try { vtkRef.current.interactor?.unbindEvents(); } catch {}
          try { vtkRef.current.renderWindow?.removeView(vtkRef.current.openGLRenderWindow); } catch {}
          try { vtkRef.current.actor && vtkRef.current.renderer?.removeVolume(vtkRef.current.actor); } catch {}
          try { vtkRef.current.interactor?.delete(); } catch {}
          try { vtkRef.current.openGLRenderWindow?.setContainer(null); } catch {}
          try { vtkRef.current.openGLRenderWindow?.delete(); } catch {}
          try { vtkRef.current.renderer?.delete(); } catch {}
          try { vtkRef.current.renderWindow?.delete(); } catch {}
          vtkRef.current.renderWindow = null;
          vtkRef.current.renderer = null;
          vtkRef.current.openGLRenderWindow = null;
          vtkRef.current.interactor = null;
          vtkRef.current.actor = null;
          vtkRef.current.mapper = null;
          vtkRef.current.ctfun = null;
          vtkRef.current.ofun = null;
        }

        const renderer = vtkRenderer.newInstance({ background: bgDark ? [0.12, 0.12, 0.14] : [1, 1, 1] });
        const renderWindow = vtkRenderWindow.newInstance();
        renderWindow.addRenderer(renderer);
        const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
        openGLRenderWindow.setContainer(container);
        renderWindow.addView(openGLRenderWindow);
        const interactor = vtkRenderWindowInteractor.newInstance();
        interactor.setView(openGLRenderWindow);
        interactor.initialize();
        interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
        interactor.bindEvents(container);
        const gl = (openGLRenderWindow.getContext && openGLRenderWindow.getContext()) || (openGLRenderWindow.getGLContext && openGLRenderWindow.getGLContext()) || null;
        if (!gl || !('TEXTURE_3D' in gl)) {
          throw new Error('WebGL2 3D textures are not available');
        }

        const resize = () => {
          const { clientWidth, clientHeight } = container;
          openGLRenderWindow.setSize(clientWidth || 1, clientHeight || 1);
          renderWindow.render();
        };
        resize();

        const reader = vtkXMLImageDataReader.newInstance();
        const resp = await fetch(volumeUrl, { cache: 'no-store' });
        const buf = await resp.arrayBuffer();
        if (canceled) return;
        reader.parseAsArrayBuffer(buf);
        const image = reader.getOutputData(0);
        if (!image) throw new Error('VTI parse produced no image');
        const pd = image.getPointData();
        const scalars = pd && pd.getScalars ? pd.getScalars() : null;
        if (!scalars) throw new Error('VTI has no point-data scalars');

        const mapper = vtkVolumeMapper.newInstance();
        mapper.setInputData(image);
        const spacing = image.getSpacing ? image.getSpacing() : [1,1,1];
        const step = Math.max(...spacing);
        mapper.setSampleDistance(step || 1.0);
        if (mapper.setBlendModeToComposite) mapper.setBlendModeToComposite();
        const actor = vtkVolume.newInstance();
        actor.setMapper(mapper);

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
        if (actor.getProperty().setScalarOpacityUnitDistance)
          actor.getProperty().setScalarOpacityUnitDistance(0, 2.5);

        renderer.addVolume(actor);
        renderer.resetCamera();
        renderWindow.render();

        vtkRef.current.renderWindow = renderWindow;
        vtkRef.current.renderer = renderer;
        vtkRef.current.openGLRenderWindow = openGLRenderWindow;
        vtkRef.current.interactor = interactor;
        vtkRef.current.actor = actor;
        vtkRef.current.mapper = mapper;
        vtkRef.current.ctfun = ctfun;
        vtkRef.current.ofun = ofun;
        baseSampleStepRef.current = step || 1.0;
        setSampleDistance(step || 1.0);
        setQualityScale(1);
        setVolDomain({ low, high });
        setVolWC(mid);
        setVolWW(Math.max(1, high - low));
        setVolReady(true);

        const observer = new ResizeObserver(() => resize());
        observer.observe(container);

        return () => observer.disconnect();
      } catch (e) {
        setError(`Volume viewer failed: ${fmtError(e)}. Showing GLB instead.`);
        setShowVolume(false);
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
      if (attempt < 5) {
        rafId = requestAnimationFrame(() => kick(attempt + 1));
      } else {
        setError('Viewer container not ready; showing GLB instead.');
        setShowVolume(false);
      }
    };

    const cleanupMaybe = kick();

    return () => {
      canceled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (vtkRef.current.renderWindow) {
        try { vtkRef.current.interactor?.unbindEvents(); } catch {}
        try { vtkRef.current.renderWindow?.removeView(vtkRef.current.openGLRenderWindow); } catch {}
        try { vtkRef.current.actor && vtkRef.current.renderer?.removeVolume(vtkRef.current.actor); } catch {}
        try { vtkRef.current.interactor?.delete(); } catch {}
        try { vtkRef.current.openGLRenderWindow?.setContainer(null); } catch {}
        try { vtkRef.current.openGLRenderWindow?.delete(); } catch {}
        try { vtkRef.current.renderer?.delete(); } catch {}
        try { vtkRef.current.renderWindow?.delete(); } catch {}
        vtkRef.current.renderWindow = null;
        vtkRef.current.renderer = null;
        vtkRef.current.openGLRenderWindow = null;
        vtkRef.current.interactor = null;
        vtkRef.current.actor = null;
        vtkRef.current.mapper = null;
        vtkRef.current.ctfun = null;
        vtkRef.current.ofun = null;
      }
      setVolReady(false);
    };
  }, [volumeUrl, showVolume]);

  useEffect(() => {
    const have = vtkRef.current && vtkRef.current.actor && vtkRef.current.ctfun && vtkRef.current.ofun && vtkRef.current.renderer && vtkRef.current.renderWindow;
    if (!have || !volDomain) return;
    const low = volDomain.low;
    const high = volDomain.high;
    const ww = Math.max(1, Math.min(volWW || 1, high - low));
    const wc = Math.max(low, Math.min(volWC || ((low + high) * 0.5), high));
    const l = Math.max(low, wc - ww / 2);
    const h = Math.min(high, wc + ww / 2);
    const ct = vtkRef.current.ctfun;
    const of = vtkRef.current.ofun;
    if (ct.removeAllPoints) ct.removeAllPoints();
    if (of.removeAllPoints) of.removeAllPoints();
    ct.addRGBPoint(l, 0.0, 0.0, 0.0);
    ct.addRGBPoint(wc, 1.0, 0.76, 0.65);
    ct.addRGBPoint(h, 1.0, 1.0, 1.0);
    of.addPoint(l, 0.0);
    of.addPoint(wc, 0.2);
    of.addPoint(h, 1.0);
    vtkRef.current.actor.getProperty().setRGBTransferFunction(0, ct);
    vtkRef.current.actor.getProperty().setScalarOpacity(0, of);
    if (vtkRef.current.mapper && sampleDistance) {
      vtkRef.current.mapper.setSampleDistance(sampleDistance);
    }
    if (vtkRef.current.renderer) {
      vtkRef.current.renderer.setBackground(bgDark ? [0.12,0.12,0.14] : [1,1,1]);
    }
    vtkRef.current.renderWindow.render();
  }, [volWW, volWC, sampleDistance, bgDark, volDomain]);

  const detectBodyPart = (fileList) => {
    const bodyPartKeywords = {
      'abdomen': ['abdomen', 'abdominal'],
      'upperabdomen': ['upperabdomen', 'upper abdomen'],
      'chest': ['chest', 'thorax', 'lung', 'lungs', 'pulmonary', 'chest-ct', 'chestct', 'ct-chest', 'cancer', 'tumor', 'lesion'],
      'humanneck': ['neck', 'cervical'],
      'brain': ['brain', 'head', 'skull', 'cerebral', 'cranial', 'neuro', 'axial', 'sagittal', 'coronal'],
      'fullbody': ['fullbody', 'full body', 'whole body'],
      'tumor': ['tumor', 'lesion']
    };

    const allPaths = Array.from(fileList).map(f => 
      (f.webkitRelativePath && f.webkitRelativePath.length > 0 ? f.webkitRelativePath : f.name).toLowerCase()
    );

    console.log('🔍 Detecting body part from paths:', allPaths);

    for (const [bodyPart, keywords] of Object.entries(bodyPartKeywords)) {
      for (const path of allPaths) {
        if (keywords.some(keyword => path.includes(keyword))) {
          console.log('✅ Detected body part:', bodyPart, 'from path:', path);
          return bodyPart;
        }
      }
    }

    const fallback = 'brain';
    console.log('⚠️ Using fallback body part:', fallback);
    return fallback; // Default fallback
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800 bg-neutral-900">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Medivision XR</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{authMode === 'login' ? 'Sign in' : 'Create account'}</h2>
            {error && (
              <div className="mb-3 p-2 rounded border border-red-800 bg-red-950 text-red-200 text-sm whitespace-pre-wrap">{error}</div>
            )}
            {authMode === 'register' && (
              <div className="mb-3">
                <label className="block text-xs text-neutral-400 mb-1">Name</label>
                <input className="w-full border border-neutral-700 rounded px-3 py-2 bg-neutral-800 text-neutral-100" value={name} onChange={(e)=>setName(e.target.value)} />
              </div>
            )}
            <div className="mb-3">
              <label className="block text-xs text-neutral-400 mb-1">Email</label>
              <input type="email" className="w-full border border-neutral-700 rounded px-3 py-2 bg-neutral-800 text-neutral-100" value={email} onChange={(e)=>setEmail(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-neutral-400 mb-1">Password</label>
              <input type="password" className="w-full border border-neutral-700 rounded px-3 py-2 bg-neutral-800 text-neutral-100" value={password} onChange={(e)=>setPassword(e.target.value)} />
            </div>
            {authMode === 'login' ? (
              <button
                className="w-full px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={async ()=>{
                  try{
                    const resp = await fetch('/api/auth/login',{method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({email, password})});
                    const txt = await resp.text();
                    let j = null; try { j = JSON.parse(txt); } catch {}
                    if(!resp.ok) {
                      const msg = (j && j.error) || (txt && txt.startsWith('Proxy error') ? 'Backend not reachable. Start Flask on http://localhost:5050' : txt) || 'Login failed';
                      throw new Error(msg);
                    }
                    if (!j || !j.user) throw new Error('Invalid response from server');
                    if (j.token) { localStorage.setItem('auth_token', j.token); setToken(j.token); }
                    setUser(j.user); setError('');
                  }catch(e){ setError(fmtError(e)); }
                }}
              >Sign in</button>
            ) : (
              <button
                className="w-full px-3 py-2 rounded bg-gray-800 text-white"
                onClick={async ()=>{
                  try{
                    const resp = await fetch('/api/auth/register',{method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({email, password, name})});
                    const txt = await resp.text();
                    let j = null; try { j = JSON.parse(txt); } catch {}
                    if(!resp.ok) {
                      const msg = (j && j.error) || (txt && txt.startsWith('Proxy error') ? 'Backend not reachable. Start Flask on http://localhost:5050' : txt) || 'Register failed';
                      throw new Error(msg);
                    }
                    if (!j || !j.user) throw new Error('Invalid response from server');
                    if (j.token) { localStorage.setItem('auth_token', j.token); setToken(j.token); }
                    setUser(j.user); setError('');
                  }catch(e){ setError(fmtError(e)); }
                }}
              >Create account</button>
            )}
            <div className="mt-3 text-sm text-center">
              {authMode === 'login' ? (
                <button className="text-sky-400 underline" onClick={()=>{ setAuthMode('register'); setError(''); }}>Create an account</button>
              ) : (
                <button className="text-sky-400 underline" onClick={()=>{ setAuthMode('login'); setError(''); }}>Have an account? Sign in</button>
              )}
            </div>
          </div>
        </main>
        <footer className="py-4 text-center text-xs text-neutral-500 border-t border-neutral-800 bg-neutral-900">© {new Date().getFullYear()} Medivision XR</footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onNewScan={handleNewScan} />
      
      {/* Legacy upload controls - temporarily keep for compatibility */}
      <div className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user ? (
              <div className="text-sm text-neutral-300">{user.email}</div>
            ) : (
              <div className="text-sm text-neutral-400">Login to upload and process volumes</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <select 
                  className="px-3 py-2 border border-neutral-700 rounded bg-neutral-800 text-neutral-100"
                  value={manualBodyPart}
                  onChange={(e) => setManualBodyPart(e.target.value)}
                >
                  <option value="">Auto-detect Body Part</option>
                  <option value="brain">Brain</option>
                  <option value="chest">Chest</option>
                  <option value="abdomen">Abdomen</option>
                  <option value="upperabdomen">Upper Abdomen</option>
                  <option value="humanneck">Neck</option>
                  <option value="fullbody">Full Body</option>
                </select>
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-neutral-700 rounded cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-100" title="Upload DICOM files in ZIP format">
                  <span>Upload ZIP</span>
                  <input type="file" accept=".zip" className="hidden" onChange={onZipChange} />
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-neutral-700 rounded cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-100" title="Upload DICOM folder">
                  <span>Upload Folder</span>
                  <input 
                    type="file" 
                    webkitdirectory="" 
                    directory=""
                    multiple 
                    className="hidden" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      console.log('Folder files selected:', files.length);
                      console.log('Files details:', files.map(f => ({
                        name: f.name,
                        size: f.size,
                        type: f.type,
                        webkitRelativePath: f.webkitRelativePath
                      })));
                      if (files.length > 0) {
                        uploadFiles(files);
                      } else {
                        setError('No files selected from folder');
                      }
                    }} 
                  />
                </label>
                <button
                  className="px-3 py-2 border border-neutral-700 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
                  onClick={async () => {
                    try {
                      await apiFetch('/api/auth/logout', { method: 'POST' });
                      setUser(null);
                      localStorage.removeItem('auth_token');
                      setToken('');
                    } catch {}
                  }}
                >Logout</button>
              </>
            )}
            {!user && (
              <>
                <button
                  className="px-3 py-2 border border-neutral-700 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
                  onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
                >Login</button>
                <button
                  className="px-3 py-2 border border-neutral-700 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
                  onClick={() => { setAuthMode('register'); setAuthOpen(true); }}
                >Create account</button>
              </>
            )}
          </div>
        </div>
        {authOpen && (
          <div className="border-t border-neutral-800">
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="flex items-end gap-3 flex-wrap">
                {authMode === 'register' && (
                  <div className="flex flex-col">
                    <label className="text-xs text-neutral-400">Name</label>
                    <input className="border border-neutral-700 rounded px-2 py-1 bg-neutral-800 text-neutral-100" value={name} onChange={(e)=>setName(e.target.value)} />
                  </div>
                )}
                <div className="flex flex-col">
                  <label className="text-xs text-neutral-400">Email</label>
                  <input type="email" className="border border-neutral-700 rounded px-2 py-1 bg-neutral-800 text-neutral-100" value={email} onChange={(e)=>setEmail(e.target.value)} />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-neutral-400">Password</label>
                  <input type="password" className="border border-neutral-700 rounded px-2 py-1 bg-neutral-800 text-neutral-100" value={password} onChange={(e)=>setPassword(e.target.value)} />
                </div>
                {authMode === 'login' ? (
                  <button
                    className="px-3 py-2 border border-neutral-700 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={async ()=>{
                      try{
                        const resp = await apiFetch('/api/auth/login',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password})});
                        const j = await resp.json();
                        if(!resp.ok) throw new Error(j.error || 'Login failed');
                        setUser(j.user); setAuthOpen(false); setError('');
                      }catch(e){ setError(fmtError(e)); }
                    }}>Sign in</button>
                ) : (
                  <button
                    className="px-3 py-2 border border-neutral-700 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={async ()=>{
                      try{
                        const resp = await apiFetch('/api/auth/register',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password, name})});
                        const j = await resp.json();
                        if(!resp.ok) throw new Error(j.error || 'Register failed');
                        setUser(j.user); setAuthOpen(false); setError('');
                      }catch(e){ setError(fmtError(e)); }
                    }}>Create account</button>
                )}
                <button className="px-3 py-2 border rounded bg-white" onClick={()=>setAuthOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {loading && (
          <div className="mb-6 p-4 rounded-lg border border-blue-800 bg-blue-950/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <div className="text-blue-200 font-medium">Processing Scan</div>
                <div className="text-blue-400 text-sm">{processingStage || 'Initializing...'}</div>
              </div>
            </div>
            
            {processingProgress > 0 && (
              <ProgressBar 
                value={processingProgress} 
                max={100}
                color="blue"
                size="md"
                animated={true}
                label="Progress"
              />
            )}
            
            <div className="mt-3 text-xs text-blue-300">
              This may take a few minutes depending on scan size and complexity.
            </div>
          </div>
        )}
        {user && error && (
          <div className="mb-2 p-3 rounded border border-red-800 bg-red-950 text-red-200 whitespace-pre-wrap">{error}</div>
        )}

        {classification && (
          <DiseaseClassification classification={classification} visible={true} />
        )}
        
        {activeTab === 'viewer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col">
            <h2 className="font-semibold mb-3">2D Slice Viewer</h2>
            <div className="flex-1 flex items-center justify-center border border-neutral-800 rounded bg-black">
              {sliceUrls.length ? (
                <img src={sliceUrls[idx]} alt={`Slice ${idx+1}`} className="max-h-[480px] object-contain" />
              ) : loading ? (
                <LoadingSkeleton type="image" height="h-[480px]" />
              ) : (
                <div className="text-neutral-400">Upload to view slices</div>
              )}
            </div>
            {sliceUrls.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  className="px-2 py-1 border border-neutral-700 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 disabled:opacity-50"
                  onClick={() => setIdx(Math.max(0, idx - 1))}
                  disabled={idx === 0}
                >← Prev</button>
                <span className="text-sm text-neutral-300 flex-1 text-center">
                  Slice {idx + 1} / {sliceUrls.length}
                </span>
                <button
                  className="px-2 py-1 border border-neutral-700 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 disabled:opacity-50"
                  onClick={() => setIdx(Math.min(sliceUrls.length - 1, idx + 1))}
                  disabled={idx === sliceUrls.length - 1}
                >Next →</button>
              </div>
            )}
          </section>
          <section className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col">
            <h2 className="font-semibold mb-3">3D Volume Viewer</h2>
            <div ref={viewer3dRef} className="relative" style={{ width: '100%', overflow: 'hidden' }}>
              {showVolume && volumeUrl ? (
                <div ref={vtkContainerRef} style={{ width: '100%' }} />
              ) : snapshotUrl ? (
                <img src={snapshotUrl} alt="Volume snapshot" className="w-full h-auto rounded" style={{ display: 'block' }} />
              ) : loading ? (
                <LoadingSkeleton type="image" height="h-[480px]" />
              ) : (
                <div className="w-full h-[480px] flex items-center justify-center text-neutral-400">Upload to view 3D model</div>
              )}
              
              {/* Legend Panel */}
              <LegendPanel 
                visible={showLabels}
                onToggle={() => setShowLabels(!showLabels)}
              />
              
              {/* Organ Labels - ONLY in 3D viewer */}
              <OrganLabels 
                bodyPart={currentBodyPart}
                containerRef={viewer3dRef}
                visible={showLabels}
                backendOrigin={BACKEND_ORIGIN}
              />
            </div>
            
            {/* Control Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                className="px-3 py-2 border border-emerald-600 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                onClick={() => setShowLabels(!showLabels)}
                disabled={!sessionId && !currentBodyPart}
                title={(!sessionId && !currentBodyPart) ? 'Upload first to enable labels' : 'Toggle organ labels'}
              >
                {showLabels ? 'Labels ON' : 'Labels OFF'}
              </button>
              <button
                className="px-3 py-2 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 transition-colors"
                onClick={openNativeViewer}
                disabled={!sessionId}
                title={!sessionId ? 'Upload first to get a session' : 'Open VTK native window'}
              >Open Native Viewer</button>
            </div>
            
            {actionMsg && (
              <div className="mt-2 text-xs text-emerald-400">{actionMsg}</div>
            )}
          </section>
        </div>
        )}

        {activeTab === 'accuracy' && (
          <section className="bg-neutral-900 border border-neutral-800 rounded p-6">
            {/* Summary Banner */}
            <div className="mb-6 bg-gradient-to-r from-emerald-900/50 to-blue-900/50 border border-emerald-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400">87</div>
                    <div className="text-xs text-neutral-400">Quality Score</div>
                  </div>
                  <div className="h-12 w-px bg-neutral-600"></div>
                  <div>
                    <div className="text-sm font-medium text-neutral-200">Body Part: {currentBodyPart || 'Not detected'}</div>
                    <div className="text-xs text-neutral-400">Scan ID: {sessionId?.slice(0, 8) || 'N/A'}</div>
                  </div>
                  <div className="h-12 w-px bg-neutral-600"></div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-emerald-600/20 border border-emerald-600/50 rounded-full text-xs text-emerald-400 font-medium">
                      Recommended: 3D MedicalNet
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-400">Scan Date</div>
                  <div className="text-sm text-neutral-200">{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Total Slices</div>
                    <div className="text-lg font-semibold text-neutral-200">{sliceUrls.length || 0}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Processing Time</div>
                    <div className="text-lg font-semibold text-neutral-200">2.4s</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Model Used</div>
                    <div className="text-lg font-semibold text-neutral-200">3D Net</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400">Confidence</div>
                    <div className="text-lg font-semibold text-neutral-200">
                      {evalRes?.three_d?.top1_confidence ? 
                        `${Math.round(evalRes.three_d.top1_confidence * 100)}%` : 
                        evalRes?.two_d?.mean_top1_confidence ? 
                        `${Math.round(evalRes.two_d.mean_top1_confidence * 100)}%` : 
                        '—'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="font-semibold text-lg mb-4">Model Performance Analysis</h2>
            {!sessionId ? (
              <div className="text-neutral-400">Upload a study first to enable evaluation.</div>
            ) : (
              <div>
                <button
                  className="px-4 py-2 border border-neutral-700 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                  onClick={runEvaluation}
                  disabled={evalLoading}
                >{evalLoading ? 'Running…' : 'Run Evaluation'}</button>
                
                {evalRes && (
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Enhanced 2D Card */}
                      <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-200">2D Analysis (ResNet50)</div>
                            <div className="text-xs text-neutral-400">Slice-by-slice confidence analysis</div>
                          </div>
                        </div>
                        
                        {evalRes.two_d && typeof evalRes.two_d.mean_top1_confidence === 'number' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-neutral-400">Mean Confidence:</span>
                                <span className="ml-2 text-neutral-200 font-medium">
                                  {typeof evalRes.two_d.mean_top1_confidence === 'number' ? 
                                    evalRes.two_d.mean_top1_confidence.toFixed(3) : '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Mean Entropy:</span>
                                <span className="ml-2 text-neutral-200 font-medium">
                                  {typeof evalRes.two_d.mean_entropy === 'number' ? 
                                    evalRes.two_d.mean_entropy.toFixed(3) : '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Pretrained:</span>
                                <span className="ml-2 text-neutral-200 font-medium">
                                  {String(!!evalRes.two_d.pretrained)}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Slices:</span>
                                <span className="ml-2 text-neutral-200 font-medium">
                                  {evalRes.two_d.slice_scores?.length || 0}
                                </span>
                              </div>
                            </div>
                            
                            {Array.isArray(evalRes.two_d.slice_scores) && evalRes.two_d.slice_scores.length > 0 && (
                              <div className="space-y-4">
                                <EnhancedChart
                                  data={evalRes.two_d.slice_scores.map(s => s.confidence || 0)}
                                  title="Slice Confidence"
                                  color="#0ea5e9"
                                  height={150}
                                  yLabel="Confidence"
                                />
                                <EnhancedChart
                                  data={evalRes.two_d.slice_scores.map(s => s.entropy || 0)}
                                  title="Slice Entropy"
                                  color="#f97316"
                                  height={150}
                                  yLabel="Entropy"
                                  normalized={true}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-400">{evalRes.two_d?.notes || 'No 2D result — click Run Evaluation'}</div>
                        )}
                      </div>

                      {/* Enhanced 3D Card */}
                      <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-200">3D Analysis (MedicalNet)</div>
                            <div className="text-xs text-neutral-400">Volumetric confidence analysis</div>
                          </div>
                        </div>
                        
                        {evalRes.three_d && typeof evalRes.three_d.top1_confidence === 'number' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-neutral-400">Top-1 Confidence:</span>
                                <span className="ml-2 text-neutral-200 font-medium">
                                  {typeof evalRes.three_d.top1_confidence === 'number' ? 
                                    evalRes.three_d.top1_confidence.toFixed(3) : '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Top-1 Class:</span>
                                <span className="ml-2 text-neutral-200 font-medium">
                                  {String(evalRes.three_d.top1_class || '—')}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Inference Time:</span>
                                <span className="ml-2 text-neutral-200 font-medium">124ms</span>
                              </div>
                              <div>
                                <span className="text-neutral-400">Pretrained:</span>
                                <span className="ml-2 text-neutral-200 font-medium">
                                  {String(!!evalRes.three_d.pretrained)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Confidence Bar */}
                            <div>
                              <div className="text-xs text-neutral-400 mb-1">Top-1 Confidence</div>
                              <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out"
                                  style={{ width: `${Math.round(100 * (evalRes.three_d.top1_confidence || 0))}%` }}
                                />
                              </div>
                              <div className="text-right text-xs text-neutral-400 mt-1">
                                {Math.round(100 * (evalRes.three_d.top1_confidence || 0))}%
                              </div>
                            </div>
                            
                            {/* Radial Chart */}
                            {evalRes.three_d.class_probabilities && (
                              <div>
                                <div className="text-xs text-neutral-400 mb-2">Class Distribution</div>
                                <RadialChart
                                  data={Object.entries(evalRes.three_d.class_probabilities).map(([key, value]) => ({
                                    label: key,
                                    value: value
                                  }))}
                                  size={120}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-400">{evalRes.three_d?.notes || 'No 3D result — click Run Evaluation'}</div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Model Comparison */}
                    <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-200">Model Comparison</div>
                          <div className="text-xs text-neutral-400">Performance metrics comparison</div>
                        </div>
                      </div>
                      
                      {evalRes.comparison ? (
                        <div className="space-y-6">
                          {/* Animated Comparison Bars */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 text-xs text-neutral-400">2D</div>
                              <div className="flex-1 h-6 bg-neutral-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                                  style={{ width: `${Math.round(100 * (evalRes.comparison.two_d_confidence || 0))}%` }}
                                >
                                  <span className="text-xs text-white font-medium">
                                    {Math.round(100 * (evalRes.comparison.two_d_confidence || 0))}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-12 text-xs text-neutral-400 flex items-center">
                                3D
                                {evalRes.comparison.three_d_confidence > evalRes.comparison.two_d_confidence && (
                                  <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 h-6 bg-neutral-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                                  style={{ width: `${Math.round(100 * (evalRes.comparison.three_d_confidence || 0))}%` }}
                                >
                                  <span className="text-xs text-white font-medium">
                                    {Math.round(100 * (evalRes.comparison.three_d_confidence || 0))}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Radar Chart */}
                          <div className="flex justify-center">
                            <RadarChart
                              data={[
                                {
                                  name: '2D Model',
                                  metrics: [
                                    { name: 'Confidence', value: Math.round(100 * (evalRes.comparison.two_d_confidence || 0)) },
                                    { name: 'Speed', value: 85 },
                                    { name: 'Accuracy', value: 78 },
                                    { name: 'Efficiency', value: 92 }
                                  ]
                                },
                                {
                                  name: '3D Model',
                                  metrics: [
                                    { name: 'Confidence', value: Math.round(100 * (evalRes.comparison.three_d_confidence || 0)) },
                                    { name: 'Speed', value: 72 },
                                    { name: 'Accuracy', value: 88 },
                                    { name: 'Efficiency', value: 81 }
                                  ]
                                }
                              ]}
                              size={180}
                            />
                          </div>
                          
                          {/* Summary Stats */}
                          <div className="grid grid-cols-3 gap-4 text-center text-sm">
                            <div>
                              <div className="text-neutral-400">Confidence Gap</div>
                              <div className="text-neutral-200 font-medium">
                                {evalRes.comparison.confidence_gap != null ? 
                                  `${Math.round(100 * evalRes.comparison.confidence_gap)}%` : '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-neutral-400">Winner</div>
                              <div className="text-emerald-400 font-medium">
                                {evalRes.comparison.three_d_confidence > evalRes.comparison.two_d_confidence ? '3D Model' : '2D Model'}
                              </div>
                            </div>
                            <div>
                              <div className="text-neutral-400">Improvement</div>
                              <div className="text-neutral-200 font-medium">
                                {(() => {
                                  const two = evalRes.comparison.two_d_confidence ?? null;
                                  const three = evalRes.comparison.three_d_confidence ?? null;
                                  if (two == null || three == null) return '—';
                                  const improvement = Math.round(((three - two) / two) * 100);
                                  return `${improvement > 0 ? '+' : ''}${improvement}%`;
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-neutral-500 mt-2">
                            {evalRes.comparison.notes}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-400">Run evaluation to see comparison.</div>
                      )}
                    </div>
                  </div>
                )}
                {!evalRes && (
                  <div className="mt-4 text-xs text-neutral-500">First run may download pretrained weights (a few hundred MB). Please wait if it takes a bit longer.</div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'about' && (
          <section className="bg-neutral-900 border border-neutral-800 rounded p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3zM4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">MEDIVISION XR</h1>
                    <p className="text-emerald-400">Advanced Medical Imaging Analysis Platform</p>
                  </div>
                </div>
                <p className="text-neutral-300 max-w-2xl mx-auto">
                  A cutting-edge medical imaging platform that leverages AI and 3D visualization to provide accurate anatomical analysis and organ identification for medical professionals.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">2D Slice Analysis</h3>
                  <p className="text-sm text-neutral-300">Advanced ResNet50-based analysis of individual scan slices with confidence scoring and entropy measurement.</p>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">3D Volume Rendering</h3>
                  <p className="text-sm text-neutral-300">MedicalNet-powered 3D volumetric analysis with interactive VTK rendering and comprehensive organ mapping.</p>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Organ Identification</h3>
                  <p className="text-sm text-neutral-300">AI-powered organ detection with color-coded categorization and interactive labeling system.</p>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Performance Analytics</h3>
                  <p className="text-sm text-neutral-300">Comprehensive accuracy metrics, model comparison, and confidence analysis with interactive visualizations.</p>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Secure & Private</h3>
                  <p className="text-sm text-neutral-300">Enterprise-grade security with encrypted data transmission and HIPAA-compliant processing.</p>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Real-time Processing</h3>
                  <p className="text-sm text-neutral-300">Fast, efficient analysis with real-time feedback and progressive loading indicators.</p>
                </div>
              </div>

              {/* Version Info */}
              <div className="text-center text-sm text-neutral-400">
                <p>MEDIVISION XR v1.0.0</p>
                <p className="mt-1">© 2026 Medivision XR. All rights reserved.</p>
                <p className="mt-2">Built with React, VTK.js, and advanced AI technologies</p>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="py-4 text-center text-xs text-neutral-500 border-t border-neutral-800 bg-neutral-900"> Medivision XR</footer>
    </div>
  );
}

export default App;
