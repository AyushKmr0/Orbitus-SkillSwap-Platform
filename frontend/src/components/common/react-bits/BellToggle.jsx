import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

/**
 * BellToggle (React Bits JS+CSS)
 * Accessible notification toggle with subtle ring animation and status feedback.
 */
export const BellToggle = ({
  enabled = true,
  onChange,
  disabled = false,
  className = '',
  size = 18,
  ariaLabel = 'Toggle notifications'
}) => {
  const [ringing, setRinging] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setRinging(true);
    setTimeout(() => setRinging(false), 500);
    if (onChange) onChange(!enabled);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 select-none ${
        enabled
          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
      } ${className}`}
    >
      {enabled ? (
        <Bell
          size={size}
          className={`transition-transform duration-300 ${
            ringing ? 'rotate-12 scale-110 motion-reduce:rotate-0' : 'rotate-0'
          }`}
        />
      ) : (
        <BellOff size={size} />
      )}
      <span>{enabled ? 'Alerts On' : 'Muted'}</span>
    </button>
  );
};

export default BellToggle;
