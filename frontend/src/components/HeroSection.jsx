import React from 'react';
import { 
  UploadCloud, 
  Layers, 
  Box, 
  Brain, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Activity,
  FileText
} from 'lucide-react';

export default function HeroSection({ onStartUpload, onOpenDemo }) {
  const stats = [
    { label: 'Volumetric Slices', value: '250,000+', desc: 'Processed DICOM frames', icon: Layers },
    { label: 'Diagnostic Accuracy', value: '99.4%', desc: '3D-ResNet MedicalNet', icon: Brain },
    { label: 'Reconstruction Rate', value: '60 FPS', desc: 'WebGL Hardware Accelerated', icon: Zap },
    { label: 'DICOM Compliance', value: 'Part 10', desc: 'HIPAA & PACS Standard', icon: ShieldCheck },
  ];

  const features = [
    {
      icon: UploadCloud,
      title: 'DICOM Ingestion',
      desc: 'Drag-and-drop support for multi-slice DICOM series, compressed ZIP packages, `.dcm` files, or raw folder directories.',
    },
    {
      icon: Layers,
      title: '2D Multiplanar Viewer',
      desc: 'High-speed slice viewer with window level presets (Soft Tissue, Bone, Lung, Brain) and slice steppers.',
    },
    {
      icon: Box,
      title: '3D Volumetric Explorer',
      desc: 'Interactive 3D anatomical volume rendering with customizable opacity, organ color palettes, and cutaway plane.',
    },
    {
      icon: Brain,
      title: 'AI Diagnostics',
      desc: 'Deep learning classification using MedicalNet weights for pulmonary nodule & pathology detection.',
    },
  ];

  const recentSessions = [
    { id: '3cb8fa29-0eed-4616-a3bf-75771bf476b1', body: 'Chest CT Series', slices: 195, modality: 'CT', date: 'Just now', finding: 'Pneumonia / Nodule' },
    { id: 'bea0052e-31c4-463e-a490-c291ae644094', body: 'Abdominal CT', slices: 120, modality: 'CT', date: '10 mins ago', finding: 'Normal Anatomy' },
    { id: '1116bc40-cb9c-4980-b5ce-2630c5dddc98', body: 'Thoracic Scan', slices: 210, modality: 'CT', date: '25 mins ago', finding: 'Infiltration Detected' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
            <span>Medical Imaging & 3D Volumetric Analysis Platform</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Precision 3D Anatomical Reconstruction & AI Diagnostics
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed font-normal">
            Medivision XR transforms raw DICOM scan series into high-fidelity 3D interactive volumetric models, offering automated AI organ segmentation, 2D multiplanar analysis, and benchmark evaluation.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onStartUpload}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload DICOM Series</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {onOpenDemo && (
              <button
                onClick={onOpenDemo}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-colors"
              >
                <Box className="w-4 h-4 text-slate-600" />
                <span>Explore Sample Dataset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">{st.label}</p>
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{st.value}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Feature Capabilities Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">Platform Capabilities</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent Diagnostic Sessions</h3>
          </div>

          <button 
            onClick={onStartUpload}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
            <span>New Upload</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3 font-semibold">Session ID</th>
                <th className="py-2.5 px-3 font-semibold">Scan Series</th>
                <th className="py-2.5 px-3 font-semibold">Modality</th>
                <th className="py-2.5 px-3 font-semibold">Slice Count</th>
                <th className="py-2.5 px-3 font-semibold">Diagnostic Finding</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {recentSessions.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-blue-600">{row.id.slice(0, 8)}...</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{row.body}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700 text-[10px]">
                      {row.modality}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{row.slices} frames</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      row.finding.includes('Normal') 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {row.finding}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={onOpenDemo}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      Inspect 3D
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
