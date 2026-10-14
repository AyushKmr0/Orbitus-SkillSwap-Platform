import React from 'react';

/**
 * BorderGlow (React Bits JS+CSS)
 * Restrained highlight border for premier podium cards and feature highlights.
 */
export const BorderGlow = ({
  children,
  className = '',
  glowColor = 'rgba(245, 158, 11, 0.4)',
  borderColor = 'rgba(245, 158, 11, 0.6)'
}) => {
  return (
    <div className={`relative group p-[2px] rounded-3xl transition-all duration-300 ${className}`}>
      {/* Subtle outer ambient glow */}
      <div
        className="absolute inset-0 rounded-3xl opacity-40 group-hover:opacity-75 blur-md transition-opacity duration-300 -z-10 pointer-events-none"
        style={{ background: glowColor }}
      />
      {/* Crisp highlight border */}
      <div
        className="absolute inset-0 rounded-3xl -z-10 pointer-events-none"
        style={{ border: `2px solid ${borderColor}` }}
      />
      {children}
    </div>
  );
};

export default BorderGlow;
