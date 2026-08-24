import React, { useState } from 'react';
import { 
  BarChart3, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Award
} from 'lucide-react';
import EnhancedChart from '../EnhancedChart';
import RadarChart from '../RadarChart';
import RadialChart from '../RadialChart';

export default function AccuracyComparison() {
  const [selectedMetric, setSelectedMetric] = useState('accuracy');

  const models = [
    {
      name: 'MedicalNet 3D-ResNet50',
      tag: 'Recommended / Deployed',
      isPrimary: true,
      accuracy: 94.8,
      precision: 93.5,
      recall: 94.2,
      f1: 93.8,
      latency: '0.34s',
      dice: 0.912,
      iou: 0.841,
      architecture: 'Pre-trained 3D Spatial Transfer ResNet',
    },
    {
      name: 'Baseline 3D-ResNet18',
      tag: 'Baseline Benchmark',
      isPrimary: false,
      accuracy: 91.2,
      precision: 89.4,
      recall: 90.8,
      f1: 90.1,
      latency: '0.85s',
      dice: 0.854,
      iou: 0.782,
      architecture: 'Standard 3D ResNet without Transfer Weights',
    },
  ];

  const chartData = [
    { label: 'Accuracy', ResNet18: 91.2, MedicalNet: 94.8 },
    { label: 'Precision', ResNet18: 89.4, MedicalNet: 93.5 },
    { label: 'Recall', ResNet18: 90.8, MedicalNet: 94.2 },
    { label: 'F1 Score', ResNet18: 90.1, MedicalNet: 93.8 },
  ];

  return (
    <div className="space-y-8 py-2">
      
      {/* Section Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-700" />
            <span>AI Model Accuracy & Benchmark Evaluation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Comparative performance analysis between standard 3D ResNet baseline and transfer-learned MedicalNet architecture.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>MedicalNet +3.6% Superior Accuracy</span>
        </div>
      </div>

      {/* Model Cards Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((m, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
              m.isPrimary 
                ? 'bg-gradient-to-br from-white via-brand-50/30 to-slate-50 border-brand-300 shadow-card-hover ring-2 ring-brand-500/20' 
                : 'bg-white border-slate-200 shadow-card'
            }`}
          >
            {m.isPrimary && (
              <div className="absolute top-0 right-0 bg-brand-700 text-white text-[10px] font-extrabold px-4 py-1 rounded-bl-2xl uppercase tracking-wider">
                Top Performer
              </div>
            )}

            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                m.isPrimary ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
                <p className="text-xs font-medium text-slate-500">{m.architecture}</p>
              </div>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Overall Accuracy</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{m.accuracy}%</p>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Inference Speed</p>
                <p className="text-2xl font-black text-brand-700 mt-0.5">{m.latency}</p>
              </div>
            </div>

            {/* Metric Bars */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Precision</span>
                  <span className="font-mono">{m.precision}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${m.precision}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Recall</span>
                  <span className="font-mono">{m.recall}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-500 rounded-full" style={{ width: `${m.recall}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>F1 Score</span>
                  <span className="font-mono">{m.f1}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${m.f1}%` }}></div>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Chart Visualizations Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-card space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Comparative Performance Visualizer</h3>
          <p className="text-xs text-slate-500">Multi-axis benchmark breakdown of baseline vs MedicalNet</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <EnhancedChart />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <RadarChart />
          </div>
        </div>
      </div>

    </div>
  );
}
