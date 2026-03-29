import React, { useState } from 'react';

const LegendPanel = ({ visible, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const organCategories = [
    { name: 'Airways', color: '#06B6D4', icon: '🫁' },
    { name: 'Vascular', color: '#EF4444', icon: '❤️' },
    { name: 'Lungs', color: '#10B981', icon: '🫁' },
    { name: 'Bones', color: '#F59E0B', icon: '🦴' },
    { name: 'Organs', color: '#8B5CF6', icon: '🫀' },
    { name: 'GI', color: '#F97316', icon: '🍽️' },
    { name: 'Tumors', color: '#EF4444', icon: '⚠️' }
  ];

  if (!visible) return null;

  return (
    <div className="absolute bottom-2 right-2 z-50">
      <div className={`bg-neutral-900/95 border border-neutral-700 rounded-lg backdrop-blur-sm transition-all duration-300 ${
        isExpanded ? 'w-56' : 'w-10'
      }`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-1 right-1 w-6 h-6 bg-neutral-800 hover:bg-neutral-700 rounded flex items-center justify-center text-neutral-300 transition-colors"
        >
          <svg 
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Legend Content */}
        <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 max-h-80' : 'opacity-0 max-h-0'}`}>
          <div className="p-2">
            <h3 className="text-xs font-semibold text-neutral-200 mb-2">Categories</h3>
            <div className="space-y-1">
              {organCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full border border-neutral-600"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-300">{category.name}</span>
                      <span className="text-xs">{category.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsed State - Just show icon */}
        {!isExpanded && (
          <div className="p-1">
            <div className="w-6 h-6 bg-emerald-600/20 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegendPanel;
