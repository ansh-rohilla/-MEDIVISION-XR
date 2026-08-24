// Load VTK Rendering Profiles at root entrypoint to register WebGL factories
import 'vtk.js/Sources/Rendering/Profiles/All';
import 'vtk.js/Sources/Rendering/Profiles/Volume';
import vtkOpenGLVolumeMapper from 'vtk.js/Sources/Rendering/OpenGL/VolumeMapper';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

// Suppress ResizeObserver loop completed with undelivered notifications warning
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e?.message && (e.message.includes('ResizeObserver') || e.message.includes('undelivered notifications'))) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (e?.reason?.message && (e.reason.message.includes('ResizeObserver') || e.reason.message.includes('undelivered notifications'))) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  });
}

// Monkey patch VTK WebGL Volume Mapper forceRender to prevent null program.setContext crashes
try {
  if (vtkOpenGLVolumeMapper && vtkOpenGLVolumeMapper.extend) {
    const origExtend = vtkOpenGLVolumeMapper.extend;
    vtkOpenGLVolumeMapper.extend = function (publicAPI, model, initialValues = {}) {
      const res = origExtend(publicAPI, model, initialValues);
      const origForceRender = publicAPI.forceRender;
      if (origForceRender) {
        publicAPI.forceRender = function (...args) {
          try {
            return origForceRender.apply(this, args);
          } catch (err) {
            if (err?.message?.includes('setContext') || err?.message?.includes('model.program') || err?.message?.includes('null is not an object')) {
              console.warn('VTK VolumeMapper forceRender WebGL context suppressed:', err);
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
    const origRWExtend = vtkRenderWindow.extend;
    vtkRenderWindow.extend = function (publicAPI, model, initialValues = {}) {
      const res = origRWExtend(publicAPI, model, initialValues);
      const origRender = publicAPI.render;
      if (origRender) {
        publicAPI.render = function (...args) {
          try {
            return origRender.apply(this, args);
          } catch (err) {
            if (err?.message?.includes('setContext') || err?.message?.includes('model.program') || err?.message?.includes('null is not an object')) {
              console.warn('VTK RenderWindow render WebGL context suppressed:', err);
              return;
            }
            throw err;
          }
        };
      }
      return res;
    };
  }
} catch (e) {
  console.warn('VTK patch initialization warning:', e);
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
