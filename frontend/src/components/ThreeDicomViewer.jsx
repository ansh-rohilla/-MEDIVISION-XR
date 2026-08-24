import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { 
  Box, 
  Maximize2, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Layers, 
  Orbit,
  Sun,
  ShieldCheck,
  Eye,
  Palette,
  HeartPulse,
  Activity,
  Scissors,
  EyeOff,
  ArrowUp,
  ArrowDown,
  EyeIcon
} from 'lucide-react';

const COLOR_PRESETS = [
  { id: 'cinematic_bronze', label: 'Radiologic Bronze & Silver', hex: 0xA06346, css: '#A06346', border: 'border-amber-700/50' },
  { id: 'copper_tissue', label: 'Cinematic Warm Copper', hex: 0xB47656, css: '#B47656', border: 'border-orange-600/50' },
  { id: 'silver_bone', label: 'Pearl Silver Bone', hex: 0xD1D5DB, css: '#D1D5DB', border: 'border-slate-300/50' },
  { id: 'organ', label: 'Visceral Organ Flesh', hex: 0xE88772, css: '#E88772', border: 'border-rose-300/40' },
  { id: 'pulmonary', label: 'Pulmonary Lung', hex: 0x38BDF8, css: '#38BDF8', border: 'border-sky-300/40' },
  { id: 'white', label: 'Clinical White', hex: 0xFAFAFA, css: '#FAFAFA', border: 'border-slate-200/40' },
];

export default function ThreeDicomViewer({ 
  sliceUrls = [], 
  snapshotUrl, 
  modelUrl, 
  volumeUrl 
}) {
  const mountRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [volumeDensity, setVolumeDensity] = useState(0.95);
  const [wireframe, setWireframe] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]); // Default Radiologic Bronze & Silver (#A06346)
  const [enableCutaway, setEnableCutaway] = useState(false); // Toggle 3D Cutaway Plane On/Off
  const [cutDirection, setCutDirection] = useState('upper'); // 'upper' (Chest/Lungs focus) | 'front' (Coronal front cut) | 'lower'
  const [clipCutaway, setClipCutaway] = useState(0.5); // 0.0 to 1.0

  // Three.js internal refs
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const groupRef = useRef(null);
  const clipPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 10.0));
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 480;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0B0F17);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.5);
    cameraRef.current = camera;

    // 3. Renderer setup with Local Clipping Enabled
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Radiologic Cinematic Lighting (High-Contrast Key + Metallic Silver Rim Light + Soft Ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff3e0, 2.5); // Warm bronze key light
    dirLight1.position.set(6, 12, 8);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd1d5db, 1.8); // Cool silver rim light for bones
    dirLight2.position.set(-6, -8, -6);
    scene.add(dirLight2);

    // 5. 3D Volumetric Mesh Group
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const autoScaleObject = (obj) => {
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      obj.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const scale = 2.4 / maxDim;
        obj.scale.set(scale, scale, scale);
      }
    };

    // A. Load 3D Internal Organ & Bone Anatomical Mesh Model via ArrayBuffer header inspection
    if (modelUrl) {
      fetch(modelUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then((buffer) => {
          if (!buffer || buffer.byteLength < 50) {
            throw new Error('Model buffer too small');
          }
          const dataView = new DataView(buffer);
          const magic = dataView.getUint32(0, true);

          // 0x46544C67 = 'glTF' in little endian
          if (magic === 0x46544c67) {
            const gltfLoader = new GLTFLoader();
            gltfLoader.parse(
              buffer,
              '',
              (gltf) => {
                const modelObj = gltf.scene || gltf.scenes[0];
                const organMat = new THREE.MeshStandardMaterial({
                  color: selectedColor.hex,
                  roughness: 0.38,
                  metalness: 0.28,
                  wireframe: wireframe,
                  side: THREE.DoubleSide,
                });

                modelObj.traverse((child) => {
                  if (child.isMesh) {
                    child.material = organMat;
                  }
                });
                autoScaleObject(modelObj);
                group.add(modelObj);
                setModelLoaded(true);
              },
              (err) => loadTextureFallback()
            );
          } else {
            // STL binary internal organ & bone mesh parser
            const stlLoader = new STLLoader();
            const geometry = stlLoader.parse(buffer);
            geometry.computeVertexNormals();
            geometry.center();

            const organMat = new THREE.MeshStandardMaterial({
              color: selectedColor.hex,
              roughness: 0.38,
              metalness: 0.28,
              wireframe: wireframe,
              side: THREE.DoubleSide,
            });

            const mesh = new THREE.Mesh(geometry, organMat);
            autoScaleObject(mesh);
            group.add(mesh);
            setModelLoaded(true);
          }
        })
        .catch((err) => {
          console.warn('Model fetch error, displaying volumetric stack:', err);
          loadTextureFallback();
        });
    } else {
      loadTextureFallback();
    }

    function loadTextureFallback() {
      const textureLoader = new THREE.TextureLoader();
      const primaryTextureUrl = (sliceUrls && sliceUrls.length > 0) ? sliceUrls[Math.floor(sliceUrls.length / 2)] : snapshotUrl;

      if (primaryTextureUrl) {
        textureLoader.load(
          primaryTextureUrl,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            const aspect = texture.image.width / texture.image.height;
            const widthVal = 1.8 * aspect;
            const heightVal = 1.8;
            const depthVal = 0.6;

            const boxGeometry = new THREE.BoxGeometry(widthVal, heightVal, depthVal);
            
            const faceMaterial = new THREE.MeshStandardMaterial({
              map: texture,
              transparent: true,
              opacity: volumeDensity,
              roughness: 0.3,
              metalness: 0.2,
              side: THREE.DoubleSide,
            });

            const sideMaterial = new THREE.MeshStandardMaterial({
              color: 0x1e293b,
              transparent: true,
              opacity: volumeDensity * 0.7,
              roughness: 0.5,
              metalness: 0.2,
              side: THREE.DoubleSide,
            });

            const materials = [
              sideMaterial, sideMaterial, sideMaterial, sideMaterial, faceMaterial, faceMaterial
            ];

            const solidVolumeMesh = new THREE.Mesh(boxGeometry, materials);
            group.add(solidVolumeMesh);

            const densePlaneCount = 20;
            const planeSpacing = depthVal / densePlaneCount;

            for (let i = 0; i < densePlaneCount; i++) {
              const innerPlaneGeo = new THREE.PlaneGeometry(widthVal * 0.98, heightVal * 0.98);
              const innerPlaneMat = new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true,
                opacity: (volumeDensity * 0.18),
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.NormalBlending,
              });
              const innerMesh = new THREE.Mesh(innerPlaneGeo, innerPlaneMat);
              innerMesh.position.z = -depthVal / 2 + (i + 0.5) * planeSpacing;
              group.add(innerMesh);
            }
          },
          undefined,
          (err) => console.warn('Texture load error:', err)
        );
      }
    }

    // 6. Animation Render Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // 7. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [sliceUrls, snapshotUrl, modelUrl]);

  // Dynamic Color, Wireframe, Opacity & 3D Cutaway Plane Updates
  useEffect(() => {
    if (enableCutaway) {
      if (cutDirection === 'upper') {
        // Upper Chest / Torso Focus: Normal vector points UP (0, 1, 0), keeping upper lungs & heart intact
        clipPlaneRef.current.normal.set(0, 1, 0);
        clipPlaneRef.current.constant = (clipCutaway * 1.8) - 0.9;
      } else if (cutDirection === 'front') {
        // Coronal Front Cutaway: Normal vector points OUT (0, 0, 1), peeling back front wall
        clipPlaneRef.current.normal.set(0, 0, 1);
        clipPlaneRef.current.constant = (clipCutaway * 1.8) - 0.9;
      } else {
        // Lower Focus
        clipPlaneRef.current.normal.set(0, -1, 0);
        clipPlaneRef.current.constant = (clipCutaway * 1.8) - 0.9;
      }
    } else {
      clipPlaneRef.current.constant = 10.0; // Disabled: plane outside scene
    }

    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          const activePlanes = enableCutaway ? [clipPlaneRef.current] : [];
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              m.wireframe = wireframe;
              m.opacity = volumeDensity;
              m.clippingPlanes = activePlanes;
              if (m.color && !m.map) {
                m.color.setHex(selectedColor.hex);
                m.roughness = 0.38;
                m.metalness = 0.28;
              }
            });
          } else {
            child.material.wireframe = wireframe;
            child.material.opacity = volumeDensity;
            child.material.clippingPlanes = activePlanes;
            if (child.material.color && !child.material.map) {
              child.material.color.setHex(selectedColor.hex);
              child.material.roughness = 0.38;
              child.material.metalness = 0.28;
            }
          }
        }
      });
    }
  }, [selectedColor, volumeDensity, wireframe, enableCutaway, cutDirection, clipCutaway]);

  // Mouse Orbit Controls
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !groupRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    groupRef.current.rotation.y += deltaX * 0.008;
    groupRef.current.rotation.x += deltaY * 0.008;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    cameraRef.current.position.z = Math.max(0.8, Math.min(8.0, cameraRef.current.position.z * zoomFactor));
  };

  const handleResetCamera = () => {
    if (groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 3.5);
    }
    setEnableCutaway(false);
    setCutDirection('upper');
    setClipCutaway(0.5);
  };

  return (
    <div className={`bg-obsidian-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
      fullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'relative'
    }`}>
      
      {/* 3D Header Glass Toolbar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-white z-30">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-700/20">
            <HeartPulse className="w-5 h-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span>3D Segmented Internal Organ Explorer</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                {modelLoaded ? 'Radiologic Bronze & Silver Active' : 'Solid 3D WebGL Volume'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive Radiologic Bronze & Metallic Silver Bone 3D Reconstruction
            </p>
          </div>
        </div>

        {/* Anatomical Color Selector & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Color Palette Switcher */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedColor(preset)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  selectedColor.id === preset.id
                    ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={`Set color to ${preset.label}`}
              >
                <span 
                  className="w-3 h-3 rounded-full border shadow-inner inline-block"
                  style={{ backgroundColor: preset.css }}
                />
                <span className="hidden sm:inline">{preset.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setEnableCutaway(!enableCutaway)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              enableCutaway ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle 3D Cross-Section Cutaway Plane"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>{enableCutaway ? '3D Cutaway ON' : '3D Cutaway OFF'}</span>
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              wireframe ? 'bg-accent-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{wireframe ? 'Wireframe ON' : 'Solid Render'}</span>
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset 3D View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="relative flex-1 min-h-[480px] bg-obsidian-950 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        <div ref={mountRef} className="w-full h-full min-h-[460px]" />

        {/* Controls Overlay - Bottom Left */}
        <div className="absolute bottom-4 left-4 p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-md text-xs text-slate-300 space-y-3 max-w-xs pointer-events-auto shadow-2xl z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Scissors className="w-4 h-4 text-amber-400" />
              <span>Upper Torso & Organ Slicer</span>
            </div>
            <button
              onClick={() => setEnableCutaway(!enableCutaway)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                enableCutaway ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {enableCutaway ? 'Active' : 'Disabled'}
            </button>
          </div>

          {/* Slicing Focus Buttons */}
          {enableCutaway && (
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono block">Cutaway Direction:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCutDirection('upper')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${
                    cutDirection === 'upper' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUp className="w-3 h-3" /> Upper Chest
                </button>
                <button
                  onClick={() => setCutDirection('front')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${
                    cutDirection === 'front' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <EyeIcon className="w-3 h-3" /> Coronal Front
                </button>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Slice Plane Offset:</span>
                  <span className="text-amber-400 font-bold">{Math.round(clipCutaway * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.02}
                  value={clipCutaway}
                  onChange={(e) => setClipCutaway(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          )}

          {/* Tissue Opacity */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <div className="flex justify-between text-[11px] font-mono">
              <span>Organ Opacity:</span>
              <span className="text-white font-bold">{Math.round(volumeDensity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.05}
              value={volumeDensity}
              onChange={(e) => setVolumeDensity(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>
        </div>

        {/* Orbit Instructions - Bottom Right */}
        <div className="absolute bottom-4 right-4 p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-md text-[11px] font-mono text-slate-300 space-y-1 pointer-events-none z-20 shadow-2xl">
          <p className="text-amber-400 font-bold flex items-center gap-1.5">
            <Orbit className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>360° BRONZE & SILVER ORGAN ORBIT</span>
          </p>
          <p className="text-slate-300">✦ Click & Drag: Rotate 3D Internal Chest & Organ Model</p>
          <p className="text-slate-300">✦ Mouse Wheel: Zoom In / Out</p>
        </div>
      </div>

    </div>
  );
}
