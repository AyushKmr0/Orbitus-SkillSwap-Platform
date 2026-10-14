import React, { useRef, useState } from 'react';

/**
 * SpecularButton (React Bits JS+CSS)
 * High-contrast primary action button with subtle specular sheen effect on pointer move.
 */
export const SpecularButton = ({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  variant = 'primary',
  ...rest
}) => {
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x, y, opacity: 0.35 });
  };

  const handleMouseLeave = () => {
    setCoords((prev) => ({ ...prev, opacity: 0 }));
  };

  const baseStyles = 'relative inline-flex items-center justify-center font-bold text-sm rounded-xl overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed';
  const variantStyles = variant === 'primary'
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 focus:ring-indigo-500'
    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-400';

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...rest}
    >
      {/* Specular sheen layer */}
      <span
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: coords.opacity,
          background: `radial-gradient(circle 90px at ${coords.x}% ${coords.y}%, rgba(255,255,255,0.7), transparent)`
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default SpecularButton;
