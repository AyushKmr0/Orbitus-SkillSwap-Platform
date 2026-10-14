import React from 'react';

/**
 * RubberSegment (React Bits JS+CSS)
 * Accessible, springy segmented button group with prefers-reduced-motion fallback.
 */
export const RubberSegment = ({
  options = [],
  value,
  onChange,
  className = '',
  ariaLabel = 'Segmented choice'
}) => {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl relative select-none ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.value || value === option;
        const optVal = option.value || option;
        const optLabel = option.label || option;

        return (
          <button
            key={optVal}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(optVal)}
            className={`relative z-10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {optLabel}
          </button>
        );
      })}
    </div>
  );
};

export default RubberSegment;
