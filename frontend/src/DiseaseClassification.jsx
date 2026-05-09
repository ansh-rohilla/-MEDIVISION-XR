import React from 'react';

const DiseaseClassification = ({ classification, visible }) => {
  if (!visible || !classification) return null;

  const { name, description, severity, confidence, subtype } = classification;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'none':
        return 'bg-emerald-500';
      case 'low':
        return 'bg-yellow-500';
      case 'medium':
        return 'bg-orange-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'none':
        return 'Normal';
      case 'low':
        return 'Low Severity';
      case 'medium':
        return 'Medium Severity';
      case 'high':
        return 'High Severity';
      default:
        return 'Unknown';
    }
  };

  const severityColor = getSeverityColor(severity);
  const severityText = getSeverityText(severity);

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">Disease Classification</h3>
        <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${severityColor}`}>
          {severityText}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="text-sm text-neutral-400 mb-1">Diagnosis</div>
          <div className="text-xl font-bold text-white">{name}</div>
          {subtype && (
            <div className="text-sm text-neutral-300 mt-1">Type: {subtype}</div>
          )}
        </div>
        
        <div>
          <div className="text-sm text-neutral-400 mb-1">Description</div>
          <div className="text-neutral-200">{description}</div>
        </div>
        
        <div>
          <div className="text-sm text-neutral-400 mb-1">Confidence</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-neutral-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${severityColor}`} 
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <div className="text-white font-semibold">{(confidence * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseClassification;
