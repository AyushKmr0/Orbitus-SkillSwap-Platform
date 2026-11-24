import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const SlidingSegment = ({
  options = [],
  value,
  onChange,
  ariaLabel,
  className = '',
  buttonClassName = '',
  activeTextClassName = 'text-white',
  inactiveTextClassName = 'text-muted hover:text-app',
  indicatorClassName = 'bg-indigo-600 shadow-md shadow-indigo-600/25'
}) => {
  const id = useId();
  const layoutId = `sliding-segment-${id}`;
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative flex items-center gap-1 p-1 ${className}`}
    >
      {options.map((option) => {
        const optionValue = option.value ?? option;
        const label = option.label ?? option;
        const Icon = option.icon;
        const selected = value === optionValue;

        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(optionValue)}
            className={`relative flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 ${buttonClassName} ${
              selected ? `z-20 ${activeTextClassName}` : `z-0 ${inactiveTextClassName}`
            }`}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                initial={false}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 30, mass: 0.85 }
                }
                className={`absolute inset-0 z-0 rounded-xl ${indicatorClassName}`}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5 pointer-events-none">
              {Icon && <Icon size={13} aria-hidden="true" />}
              <span>{label}</span>
              {option.badge > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SlidingSegment;
