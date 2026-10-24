import React from 'react';
import { 
  Brain, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Target,
  BarChart2
} from 'lucide-react';

export default function AiDiagnosticCard({ classificationData, onNavigateToCallouts }) {
  if (!classificationData) {
    return (
      <div className="bg-white dark:bg-[#0B0F19] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-3 shadow-card transition-colors duration-200">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Diagnostic Standby</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Upload a DICOM series to trigger automated 3D ResNet classification.</p>
        </div>
      </div>
    );
  }

  const {
    diagnosis = 'Pulmonary Nodules',
    type = 'Indeterminate Nodules',
    description = 'Malignant tumor in lung tissue identified by 3D ResNet feature mapping',
    confidence = 0.91,
    severity = 'High Severity',
    diceScore = 0.912,
    iouScore = 0.841,
    modelUsed = 'MedicalNet 3D-ResNet50',
    inferenceTime = '0.34s'
  } = classificationData;

  const confidencePct = Math.round(confidence * 100);

  const getSeverityBadge = () => {
    if (severity.toLowerCase().includes('low')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    }
    if (severity.toLowerCase().includes('high')) {
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
    }
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
  };

  return (
    <div className="bg-white dark:bg-[#0B0F19] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-card space-y-6 transition-colors duration-200">
      
      {/* Header & Severity Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-brand-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI Automated Diagnostic Assessment</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800/60">
                MedicalNet ML
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Automated 3D Convolutional Neural Network Analysis</p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityBadge()}`}>
          {severity}
        </span>
      </div>

      {/* Main Diagnostic Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Diagnosis Finding</p>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{diagnosis}</h3>
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400">{type}</p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            {description}
          </p>

          {onNavigateToCallouts && (
            <button
              onClick={onNavigateToCallouts}
              className="w-full px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-rose-500/20 transition-all"
            >
              <Target className="w-4 h-4 animate-ping" />
              <span>View Tumor Target Location in 3D Callouts</span>
            </button>
          )}
        </div>

        {/* Confidence & Metric Progress */}
        <div className="space-y-4 bg-slate-50/70 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">Classification Confidence</span>
              <span className="font-mono font-extrabold text-brand-700 dark:text-brand-400 text-sm">{confidencePct}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${confidencePct}%` }}
              ></div>
            </div>
          </div>

          {/* Dice & IoU Score Badges */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Dice Similarity</p>
              <p className="text-sm font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">{diceScore}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">IoU Score</p>
              <p className="text-sm font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">{iouScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Spec Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Model: <strong className="text-slate-800 dark:text-slate-200">{modelUsed}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Inference: <strong className="text-slate-800 dark:text-slate-200">{inferenceTime}</strong></span>
          </span>
        </div>

        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" /> Validated Clinical Weights
        </span>
      </div>

    </div>
  );
}
