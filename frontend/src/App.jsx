import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const BACKEND_ORIGIN = process.env.REACT_APP_BACKEND_ORIGIN || `${window.location.protocol}//localhost:5050`;
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
      setEvalRes(data);
    } catch (e) {
      setError(fmtError(e));
    } finally {
      setEvalLoading(false);
    }
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
  const [modelUrl, setModelUrl] = useState('');
  const [volumeUrl, setVolumeUrl] = useState('');
  const [showVolume, setShowVolume] = useState(false); // default to GLB for stability
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    return fetch(url, { credentials: 'include', ...opts, headers: hdrs });
  };

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch('/api/auth/me');
        if (resp.ok) {
          const j = await resp.json();
          setUser(j.user);
        } else {
          if (token) { localStorage.removeItem('auth_token'); setToken(''); }
          setAuthOpen(true);
        }
      } catch {}
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

  const uploadFiles = async (fileList) => {
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      // Send as 'files', preserving relative path if available
      Array.from(fileList).forEach((f) => {
        const rel = f.webkitRelativePath && f.webkitRelativePath.length > 0 ? f.webkitRelativePath : f.name;
        form.append('files', f, rel);
      });

      const resp = await apiFetch('/api/upload', { method: 'POST', body: form });
      if (!resp.ok) {
        const txt = await resp.text();
        try {
          const j = JSON.parse(txt);
          const msg = j.error || j.details || fmtError(j);
          setError(msg);
          if ((j.error || '').includes('unauthenticated')) setAuthOpen(true);
          return;
        } catch {
          throw new Error(txt);
        }
      }
      const data = await resp.json();
      const mappedSlices = (data.slice_urls || []).map(toBackendUrl);
      const stamp = Date.now();
      const model = data.model_url ? `${toBackendUrl(data.model_url)}?t=${stamp}` : '';
      const vti = data.volume_url ? `${toBackendUrl(data.volume_url)}?t=${stamp}` : '';
      const snap = data.snapshot_url ? `${toBackendUrl(data.snapshot_url)}?t=${stamp}` : '';
      setSliceUrls(mappedSlices);
      setModelUrl(model);
      setVolumeUrl(vti);
      setSnapshotUrl(snap);
      setSessionId(data.session_id || '');
      setIdx(0);
      // Default to GLB; user can enable Volume with the toggle
      setShowVolume(false);
    } catch (e) {
      setError(fmtError(e) || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const onFolderChange = (e) => {
    const files = e.target.files;
    if (files && files.length) {
      uploadFiles(files);
    }
  };

  const onZipChange = (e) => {
    const files = e.target.files;
    if (files && files.length) {
      // Send the ZIP as a single file
      uploadFiles(files);
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
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Medivision XR</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-sm text-neutral-300">{user.email}</div>
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
            ) : (
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
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-neutral-700 rounded cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-100">
              <span>Upload ZIP</span>
              <input type="file" accept=".zip" className="hidden" onChange={onZipChange} disabled={!user} />
            </label>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-neutral-700 rounded cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-100">
              <span>Upload Folder / DICOMs</span>
              <input type="file" multiple webkitdirectory="" directory="" className="hidden" onChange={onFolderChange} disabled={!user} />
            </label>
          </div>
        </div>
        {!user && (
          <div className="max-w-6xl mx-auto px-4 pb-3 text-sm text-neutral-400">Login to upload and process volumes.</div>
        )}
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
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {loading && (
          <div className="mb-4 p-3 rounded border border-blue-800 bg-blue-950 text-blue-200">Processing... This may take a minute.</div>
        )}
        {user && error && (
          <div className="mb-2 p-3 rounded border border-red-800 bg-red-950 text-red-200 whitespace-pre-wrap">{error}</div>
        )}
        <div className="mb-4 flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded border border-neutral-700 ${activeTab==='viewer' ? 'bg-neutral-800 text-white' : 'bg-neutral-800/30 text-neutral-200 hover:bg-neutral-700'}`}
            onClick={()=>setActiveTab('viewer')}
          >Viewer</button>
          <button
            className={`px-3 py-1 rounded border border-neutral-700 ${activeTab==='accuracy' ? 'bg-neutral-800 text-white' : 'bg-neutral-800/30 text-neutral-200 hover:bg-neutral-700'}`}
            onClick={()=>setActiveTab('accuracy')}
          >Accuracy</button>
        </div>

        {activeTab === 'viewer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col">
            <h2 className="font-semibold mb-3">2D Slice Viewer</h2>
            <div className="flex-1 flex items-center justify-center border border-neutral-800 rounded bg-black">
              {sliceUrls.length ? (
                <img src={sliceUrls[idx]} alt={`Slice ${idx+1}`} className="max-h-[480px] object-contain" />
              ) : (
                <div className="text-neutral-400">Upload to view slices</div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded disabled:opacity-50"
                onClick={() => setIdx((i) => (i - 1 + sliceUrls.length) % (sliceUrls.length || 1))}
                disabled={!sliceUrls.length}
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">
                {sliceUrls.length ? `Slice ${idx + 1} / ${sliceUrls.length}` : 'No slices'}
              </div>
              <button
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded disabled:opacity-50"
                onClick={() => setIdx((i) => (i + 1) % (sliceUrls.length || 1))}
                disabled={!sliceUrls.length}
              >
                Next
              </button>
            </div>
            <div className="mt-2 text-xs text-neutral-500">Tip: Use ← and → keys</div>
          </section>

          <section className="bg-neutral-900 border border-neutral-800 rounded p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">3D Viewer</h2>
              <div className="flex items-center gap-2 text-sm">
                <button
                  className="px-2 py-1 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
                  onClick={openNativeViewer}
                  disabled={!sessionId}
                  title={!sessionId ? 'Upload first to get a session' : 'Open VTK native window'}
                >Open Native Viewer</button>
              </div>
            </div>
            <div className="border border-neutral-800 rounded overflow-hidden bg-black">
              {showVolume && volumeUrl ? (
                <div ref={vtkContainerRef} style={{ width: '100%', height: 480 }} />
              ) : snapshotUrl ? (
                <img src={snapshotUrl} alt="Volume snapshot" className="w-full h-auto rounded" />
              ) : (
                <div className="w-full h-[480px] flex items-center justify-center text-neutral-400">Upload to view 3D model</div>
              )}
            </div>
            {actionMsg && (
              <div className="mt-2 text-xs text-emerald-400">{actionMsg}</div>
            )}
          </section>
        </div>
        )}

        {activeTab === 'accuracy' && (
          <section className="bg-neutral-900 border border-neutral-800 rounded p-4">
            <h2 className="font-semibold mb-3">Accuracy</h2>
            {!sessionId ? (
              <div className="text-neutral-400">Upload a study first to enable evaluation.</div>
            ) : (
              <div>
                <button
                  className="px-3 py-2 border border-neutral-700 rounded bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                  onClick={runEvaluation}
                  disabled={evalLoading}
                >{evalLoading ? 'Running…' : 'Run Evaluation'}</button>
                {evalRes && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-neutral-800 rounded p-3 bg-neutral-900/50">
                      <div className="font-semibold mb-2">2D (ResNet50)</div>
                      {evalRes.two_d ? (
                        <>
                          <div className="text-sm text-neutral-300">Pretrained: {String(!!evalRes.two_d.pretrained)}</div>
                          <div className="text-sm text-neutral-300">Mean confidence: {typeof evalRes.two_d.mean_top1_confidence === 'number' ? evalRes.two_d.mean_top1_confidence.toFixed(3) : '—'}</div>
                          <div className="text-sm text-neutral-300 mb-2">Mean entropy: {typeof evalRes.two_d.mean_entropy === 'number' ? evalRes.two_d.mean_entropy.toFixed(3) : '—'}</div>
                          {Array.isArray(evalRes.two_d.slice_scores) && evalRes.two_d.slice_scores.length > 0 ? (
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-neutral-400 mb-1">Slice confidence</div>
                                {(() => {
                                  const scores = evalRes.two_d.slice_scores;
                                  const n = scores.length;
                                  const pts = scores.map((s, i) => {
                                    const x = (n > 1 ? (i / (n - 1)) : 0) * 100;
                                    const y = (1 - Math.max(0, Math.min(1, s.confidence || 0))) * 100;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  return (
                                    <svg viewBox="0 0 100 100" className="w-full h-24 bg-neutral-950 rounded border border-neutral-800">
                                      <polyline points={pts} fill="none" stroke="#0ea5e9" strokeWidth="2" />
                                    </svg>
                                  );
                                })()}
                              </div>
                              <div>
                                <div className="text-xs text-neutral-400 mb-1">Slice entropy (normalized)</div>
                                {(() => {
                                  const scores = evalRes.two_d.slice_scores;
                                  const n = scores.length;
                                  const maxE = Math.max(1e-6, ...scores.map(s => (s.entropy || 0)));
                                  const pts = scores.map((s, i) => {
                                    const x = (n > 1 ? (i / (n - 1)) : 0) * 100;
                                    const norm = Math.max(0, (s.entropy || 0) / maxE);
                                    const y = (1 - norm) * 100;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  return (
                                    <svg viewBox="0 0 100 100" className="w-full h-24 bg-neutral-950 rounded border border-neutral-800">
                                      <polyline points={pts} fill="none" stroke="#f97316" strokeWidth="2" />
                                    </svg>
                                  );
                                })()}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-neutral-400">No per-slice scores available.</div>
                          )}
                          <details className="mt-2">
                            <summary className="text-xs text-neutral-400 cursor-pointer">Raw JSON</summary>
                            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(evalRes.two_d, null, 2)}</pre>
                          </details>
                        </>
                      ) : (
                        <div className="text-sm text-neutral-400">No result</div>
                      )}
                    </div>
                    <div className="border border-neutral-800 rounded p-3 bg-neutral-900/50">
                      <div className="font-semibold mb-2">3D (MedicalNet)</div>
                      {evalRes.three_d ? (
                        <>
                          <div className="text-sm text-neutral-300">Pretrained: {String(!!evalRes.three_d.pretrained)}</div>
                          <div className="text-sm text-neutral-300 mb-2">Top-1: {typeof evalRes.three_d.top1_confidence === 'number' ? evalRes.three_d.top1_confidence.toFixed(3) : '—'} ({String(evalRes.three_d.top1_class)})</div>
                          <div className="w-full h-3 bg-neutral-800 rounded">
                            <div className="h-3 bg-emerald-500 rounded" style={{ width: `${Math.round(100 * (evalRes.three_d.top1_confidence || 0))}%` }}></div>
                          </div>
                          <details className="mt-2">
                            <summary className="text-xs text-neutral-400 cursor-pointer">Raw JSON</summary>
                            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(evalRes.three_d, null, 2)}</pre>
                          </details>
                        </>
                      ) : (
                        <div className="text-sm text-neutral-400">No result</div>
                      )}
                    </div>

                    <div className="border border-neutral-800 rounded p-3 bg-neutral-900/50">
                      <div className="font-semibold mb-2">Model Comparision</div>
                      {evalRes.comparison ? (
                        <>
                          <div className="text-sm text-neutral-300 mb-2">
                            Summary: 3D confidence {evalRes.comparison.three_d_confidence != null ? Math.round(100 * evalRes.comparison.three_d_confidence) : '—'}% vs 2D {evalRes.comparison.two_d_confidence != null ? Math.round(100 * evalRes.comparison.two_d_confidence) : '—'}% ({(() => {
                              const two = evalRes.comparison.two_d_confidence ?? null;
                              const three = evalRes.comparison.three_d_confidence ?? null;
                              if (two == null || three == null) return '—';
                              const gap = Math.round(100 * (three - two));
                              const sign = gap >= 0 ? '+' : '';
                              return `${sign}${gap} pts`;
                            })()})
                          </div>
                          <div className="space-y-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16 text-xs text-neutral-400">2D</div>
                              <div className="flex-1 w-full h-3 bg-neutral-800 rounded">
                                <div className="h-3 bg-sky-500 rounded" style={{ width: `${Math.round(100 * (evalRes.comparison.two_d_confidence || 0))}%` }}></div>
                              </div>
                              <div className="w-10 text-right text-xs text-neutral-300">{evalRes.comparison.two_d_confidence != null ? Math.round(100 * evalRes.comparison.two_d_confidence) : '—'}%</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 text-xs text-neutral-400">3D</div>
                              <div className="flex-1 w-full h-3 bg-neutral-800 rounded">
                                <div className="h-3 bg-emerald-500 rounded" style={{ width: `${Math.round(100 * (evalRes.comparison.three_d_confidence || 0))}%` }}></div>
                              </div>
                              <div className="w-10 text-right text-xs text-neutral-300">{evalRes.comparison.three_d_confidence != null ? Math.round(100 * evalRes.comparison.three_d_confidence) : '—'}%</div>
                            </div>
                          </div>
                          <div className="text-sm text-neutral-300">Confidence gap (3D-2D): {evalRes.comparison.confidence_gap != null ? `${Math.round(100 * evalRes.comparison.confidence_gap)}%` : '—'}</div>
                          <div className="text-xs text-neutral-500 mt-1">{evalRes.comparison.notes}</div>
                        </>
                      ) : (
                        <div className="text-sm text-neutral-400">Run evaluation to see comparison.</div>
                      )}
                    </div>
                  </div>
                )}
                {!evalRes && (
                  <div className="mt-2 text-xs text-neutral-500">First run may download pretrained weights (a few hundred MB). Please wait if it takes a bit longer.</div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
      <footer className="py-4 text-center text-xs text-neutral-500 border-t border-neutral-800 bg-neutral-900"> Medivision XR</footer>
    </div>
  );
}

export default App;
