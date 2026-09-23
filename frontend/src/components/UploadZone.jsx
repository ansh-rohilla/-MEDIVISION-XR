import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FolderArchive, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Box, 
  FileText,
  ShieldCheck,
  Play,
  Sparkles,
  Lock,
  Cpu,
  Layers,
  FileCode,
  ArrowRight,
  Database
} from 'lucide-react';

export default function UploadZone({ 
  onUpload, 
  isUploading, 
  uploadProgress, 
  processingStatus,
  error,
  onOpenDemo
}) {
  const [dragActive, setDragActive] = useState(false);
  const zipInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  const steps = [
    { label: 'Upload Archive' },
    { label: 'Decompress DICOM' },
    { label: '3D Reconstruction' },
    { label: 'AI Inference Completed' },
  ];

  const sampleDatasets = [
    {
      name: 'Chest CT Nodule Series',
      modality: 'CT',
      slices: 195,
      size: '24.5 MB',
      finding: 'Pulmonary Nodule / Pneumonia',
      tag: 'Recommended',
      bodyPart: 'Chest'
    },
    {
      name: 'Abdominal Soft Tissue CT',
      modality: 'CT',
      slices: 120,
      size: '18.2 MB',
      finding: 'Normal Abdominal Viscera',
      tag: 'Multi-Organ',
      bodyPart: 'Abdomen'
    },
    {
      name: 'Brain Cranial MRI Scan',
      modality: 'MRI',
      slices: 210,
      size: '32.1 MB',
      finding: 'Cortical Ventricular Surface',
      tag: 'Neural 3D',
      bodyPart: 'Brain'
    },
    {
      name: 'Human Neck Vertebrae CT',
      modality: 'CT',
      slices: 95,
      size: '14.8 MB',
      finding: 'Cervical Spine & Thyroid',
      tag: 'Vascular',
      bodyPart: 'HumanNeck'
    }
  ];

  const pipelinePhases = [
    {
      step: '01',
      title: 'DICOM File Ingestion',
      desc: 'Parses DICOM Part 10 tags, patient anonymization headers, slice spacing, and pixel data arrays.'
    },
    {
      step: '02',
      title: 'Windowing & Rescaling',
      desc: 'Applies Rescale Slope/Intercept to convert raw pixel data into calibrated Hounsfield Units (HU).'
    },
    {
      step: '03',
      title: 'Marching Cubes 3D Mesh',
      desc: 'Generates ISO-surface 3D geometry meshes for WebGL hardware-accelerated volume rendering.'
    },
    {
      step: '04',
      title: 'MedicalNet AI Feature Extraction',
      desc: 'Evaluates 3D convolutional feature maps via transfer-learned ResNet50 for automated classification.'
    }
  ];

  const getCurrentStepIndex = () => {
    if (!processingStatus) return 0;
    const stage = processingStatus.stage || processingStatus.status;
    if (stage === 'completed') return 3;
    if (stage?.includes('slices') || stage?.includes('3D')) return 2;
    if (stage?.includes('DICOM')) return 1;
    return 0;
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="space-y-8 py-2">
      
      {/* 1. Main Drag & Drop / Upload Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-6">
        
        {/* Title & Guidelines */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-brand-700" />
              <span>DICOM Scan Ingestion Pipeline</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload DICOM volumetric series (`.dcm`, `.nii`), compressed ZIP archives, or raw folders.
            </p>
          </div>

          {/* Format Badges */}
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
              .ZIP
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
              .DCM
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
              .NII
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Upload Processing Notice</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Drag & Drop View vs Progress View */}
        {isUploading || (processingStatus && processingStatus.status === 'processing') ? (
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/20 border border-slate-200 flex flex-col items-center justify-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Processing Volumetric DICOM Series...
              </h3>
              <p className="text-xs text-brand-700 font-mono font-semibold">
                {processingStatus?.stage || 'Uploading files to server...'}
              </p>
            </div>

            {/* Step Stepper */}
            <div className="w-full max-w-xl grid grid-cols-4 gap-2 pt-2">
              {steps.map((st, i) => {
                const isDone = i < currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={i} className="flex flex-col items-center text-center space-y-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrent 
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 ring-4 ring-brand-500/20' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${isCurrent ? 'text-brand-700 font-extrabold' : 'text-slate-500'}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`p-10 md:p-14 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center space-y-5 cursor-pointer ${
              dragActive 
                ? 'border-brand-500 bg-brand-50/60 scale-[1.005]' 
                : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,.dcm,.nii,.nii.gz"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory="true"
              directory="true"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center shadow-xs">
              <FolderArchive className="w-7 h-7" />
            </div>

            <div className="space-y-1 max-w-md">
              <p className="text-base font-bold text-slate-900">
                Drag & Drop DICOM Series or Archives Here
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Supports standard multi-slice DICOM folders, `.dcm` files, or compressed `.zip` packages up to 500MB
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Select ZIP / DICOM File</span>
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
              >
                <Box className="w-4 h-4 text-slate-600" />
                <span>Select DICOM Folder</span>
              </button>
            </div>
          </div>
        )}

        {/* Security & HIPAA Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> End-to-End HIPAA De-identification & Anonymization
          </span>
          <span className="font-mono text-[11px] text-slate-400">Max Payload: 500 MB / Series</span>
        </div>

      </div>

      {/* 2. One-Click Sample Clinical DICOM Datasets */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-700" />
              <span>One-Click Clinical DICOM Test Datasets</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Test 3D reconstruction and AI classification instantly without uploading local files</p>
          </div>

          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load Default Sample Dataset</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleDatasets.map((sample, idx) => (
            <div
              key={idx}
              onClick={onOpenDemo}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-brand-300 hover:bg-slate-100/60 transition-all duration-200 cursor-pointer space-y-3 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white border border-slate-200 text-slate-700">
                    {sample.modality}
                  </span>
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    {sample.tag}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-brand-700 transition-colors">{sample.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{sample.finding}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                <span className="font-mono text-slate-500 text-[11px]">{sample.slices} Slices ({sample.size})</span>
                <span className="text-brand-700 font-bold text-[11px] flex items-center group-hover:translate-x-0.5 transition-transform">
                  Load <ArrowRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Technical Specifications & DICOM 3.0 De-identification Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Specifications */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-brand-700" />
            <span>Supported DICOM & Volumetric Specs</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-800">DICOM Part 10 Standards</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Explicit/Implicit VR Little Endian, JPEG Lossless & Uncompressed Transfer Syntaxes</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] shrink-0">Supported</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-800">NIfTI Volumetric Format</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Single file `.nii` or compressed `.nii.gz` 3D spatial volumes</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] shrink-0">Supported</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between">
              <div>
                <p className="font-bold text-slate-800">Voxel Spacing & Calibration</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Automatic extraction of PixelSpacing $(dX, dY)$ and SliceThickness $(dZ)$</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-bold text-[10px] shrink-0">Auto-Calibrated</span>
            </div>
          </div>
        </div>

        {/* HIPAA Anonymization Checklist */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>Automated PHI De-identification Checklist</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 font-medium">Patient Name `(0010,0010)` scrubbed</span>
            </div>
            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 font-medium">Patient ID & SSN `(0010,0020)` randomized</span>
            </div>
            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 font-medium">Institution & Physician tags sanitized</span>
            </div>
            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700 font-medium">Voxel intensity & spatial dimensions retained</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
