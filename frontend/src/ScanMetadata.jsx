import React from 'react';

const ScanMetadata = ({ bodyPart, sliceCount, dimensions, scanId }) => {
  if (!bodyPart && !sliceCount && !dimensions) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 z-40">
      <div className="bg-neutral-900/95 border border-neutral-700 rounded-lg backdrop-blur-sm p-2 min-w-40">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-blue-500/20 rounded flex items-center justify-center">
            <svg className="w-2 h-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-xs font-medium text-neutral-200">Scan Info</div>
        </div>
        
        <div className="space-y-1 text-xs">
          {bodyPart && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Part:</span>
              <span className="text-neutral-200 font-medium capitalize">{bodyPart}</span>
            </div>
          )}
          
          {sliceCount && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Slices:</span>
              <span className="text-neutral-200 font-medium">{sliceCount}</span>
            </div>
          )}
          
          {scanId && (
            <div className="flex justify-between">
              <span className="text-neutral-400">ID:</span>
              <span className="text-neutral-200 font-mono text-xs">{scanId.slice(0, 6)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanMetadata;
