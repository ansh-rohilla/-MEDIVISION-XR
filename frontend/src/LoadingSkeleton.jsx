import React from 'react';

const LoadingSkeleton = ({ type = 'card', height = 'h-32', width = 'w-full' }) => {
  const skeletons = {
    card: (
      <div className={`${width} ${height} bg-neutral-800 rounded-lg animate-pulse`}>
        <div className="h-4 bg-neutral-700 rounded w-3/4 m-4"></div>
        <div className="h-3 bg-neutral-700 rounded w-1/2 mx-4 mb-2"></div>
        <div className="h-3 bg-neutral-700 rounded w-2/3 mx-4"></div>
      </div>
    ),
    chart: (
      <div className={`${width} ${height} bg-neutral-800 rounded-lg animate-pulse`}>
        <div className="h-4 bg-neutral-700 rounded w-1/3 m-4"></div>
        <div className="px-4 pb-4">
          <div className="h-32 bg-neutral-700 rounded"></div>
        </div>
      </div>
    ),
    text: (
      <div className={`${width} space-y-2 animate-pulse`}>
        <div className="h-3 bg-neutral-700 rounded w-full"></div>
        <div className="h-3 bg-neutral-700 rounded w-5/6"></div>
        <div className="h-3 bg-neutral-700 rounded w-4/5"></div>
      </div>
    ),
    image: (
      <div className={`${width} ${height} bg-neutral-800 rounded-lg animate-pulse flex items-center justify-center`}>
        <svg className="w-12 h-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    ),
    list: (
      <div className={`${width} space-y-3 animate-pulse`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neutral-700 rounded"></div>
            <div className="flex-1">
              <div className="h-3 bg-neutral-700 rounded w-3/4 mb-1"></div>
              <div className="h-2 bg-neutral-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  };

  return skeletons[type] || skeletons.card;
};

export default LoadingSkeleton;
