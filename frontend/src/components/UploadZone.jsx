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
  ShieldCheck
} from 'lucide-react';

export default function UploadZone({ 
  onUpload, 
  isUploading, 
  uploadProgress, 
  processingStatus,
  error 
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
      
      {/* Title & Guidelines */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <span>DICOM Scan Ingestion Pipeline</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload DICOM volumetric series (`.dcm`, `.nii`), compressed ZIP archives, or raw folders.
          </p>
        </div>

        {/* Format Badges */}
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-600">
            .ZIP
          </span>
          <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-600">
            .DCM
          </span>
          <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-600">
            .NII
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-900">Upload Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Drag & Drop View vs Progress View */}
      {isUploading || (processingStatus && processingStatus.status === 'processing') ? (
        <div className="p-8 md:p-12 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Processing Volumetric DICOM Series...
            </h3>
            <p className="text-xs text-slate-500 font-mono">
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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone 
                      ? 'bg-emerald-600 text-white' 
                      : isCurrent 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium ${isCurrent ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
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
          className={`p-8 md:p-12 rounded-xl border-2 border-dashed transition-colors text-center flex flex-col items-center justify-center space-y-4 cursor-pointer ${
            dragActive 
              ? 'border-blue-600 bg-blue-50/50' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
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

          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FolderArchive className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">
              Drag & Drop DICOM Series or Archives Here
            </p>
            <p className="text-xs text-slate-500">
              Supports standard multi-slice DICOM folders or compressed `.zip` packages up to 500MB
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => zipInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Select ZIP / DICOM File</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Box className="w-4 h-4 text-slate-600" />
              <span>Select DICOM Folder</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1 text-slate-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> End-to-End HIPAA De-identification Active
        </span>
        <span className="hidden sm:inline">Max Payload: 500 MB</span>
      </div>

    </div>
  );
}
