import React, { useState } from 'react';
import { Heart } from 'lucide-react';

/**
 * PulseHeart (React Bits JS+CSS)
 * Accessible like toggle with subtle spring pulse animation and reduced-motion fallback.
 */
export const PulseHeart = ({
  liked = false,
  count = 0,
  onToggle,
  onCountClick,
  disabled = false,
  className = '',
  size = 18,
  ariaLabel = 'Like post',
  countAriaLabel = 'View who liked this'
}) => {
  const [animating, setAnimating] = useState(false);

  const handleHeartClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    if (onToggle) onToggle();
  };

  const handleCountClick = (e) => {
    e.stopPropagation();
    if (onCountClick) {
      onCountClick(e);
    } else if (onToggle && !disabled) {
      handleHeartClick(e);
    }
  };

  return (
    <div className={`inline-flex items-center rounded-lg text-xs font-medium select-none ${className}`}>
      <button
        type="button"
        onClick={handleHeartClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={liked}
        className={`inline-flex items-center justify-center p-1.5 rounded-lg border-0 ring-0 shadow-none transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 ${
          liked
            ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
            : 'text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={liked ? 'Unlike' : 'Like'}
      >
        <Heart
          size={size}
          className={`transition-transform duration-200 ${
            liked ? 'fill-rose-500 text-rose-500' : 'text-current'
          } ${animating ? 'scale-125 motion-reduce:scale-100' : 'scale-100'}`}
        />
      </button>

      {typeof count === 'number' && count >= 0 && (
        <button
          type="button"
          onClick={handleCountClick}
          className={`px-1.5 py-0.5 text-xs font-semibold rounded border-0 ring-0 shadow-none transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 ${
            onCountClick
              ? 'text-slate-500 dark:text-slate-400 hover:text-app hover:underline cursor-pointer'
              : 'text-slate-500 dark:text-slate-400 cursor-default'
          }`}
          title={onCountClick ? countAriaLabel : undefined}
          aria-label={countAriaLabel}
        >
          {count}
        </button>
      )}
    </div>
  );
};

export default PulseHeart;
