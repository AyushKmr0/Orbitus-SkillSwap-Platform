import React from 'react';

export const BrandLogo = ({ size = 32, className = '', alt = 'Orbitus SkillSwap Platform' }) => {
  return (
    <img
      src="/favicon.svg"
      alt={alt}
      width={size}
      height={size}
      className={`object-contain shrink-0 select-none ${className}`}
      loading="eager"
    />
  );
};

export default BrandLogo;
