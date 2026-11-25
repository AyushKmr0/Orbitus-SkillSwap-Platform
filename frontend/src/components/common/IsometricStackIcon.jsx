import React from 'react';

/**
 * Three stacked isometric plates used on course cards.
 */
export const IsometricStackIcon = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="24" cy="36" rx="14" ry="5.2" fill="#312e81" />
      <path d="M10 31.2c0 2.9 6.3 5.2 14 5.2s14-2.3 14-5.2V36c0 2.9-6.3 5.2-14 5.2S10 38.9 10 36v-4.8Z" fill="#3730a3" />
      <ellipse cx="24" cy="31" rx="14" ry="5.2" fill="#4f46e5" />

      <ellipse cx="24" cy="25.2" rx="14" ry="5.2" fill="#4338ca" />
      <path d="M10 20.4c0 2.9 6.3 5.2 14 5.2s14-2.3 14-5.2v4.8c0 2.9-6.3 5.2-14 5.2S10 28.1 10 25.2v-4.8Z" fill="#6366f1" />
      <ellipse cx="24" cy="20.2" rx="14" ry="5.2" fill="#818cf8" />

      <ellipse cx="24" cy="14.4" rx="14" ry="5.2" fill="#6366f1" />
      <path d="M10 9.6C10 12.5 16.3 14.8 24 14.8S38 12.5 38 9.6v4.8c0 2.9-6.3 5.2-14 5.2S10 17.3 10 14.4V9.6Z" fill="#a5b4fc" />
      <ellipse cx="24" cy="9.4" rx="14" ry="5.2" fill="#e0e7ff" />
      <ellipse cx="24" cy="8.6" rx="9" ry="2.6" fill="#ffffff" fillOpacity="0.85" />
    </svg>
  );
};

export default IsometricStackIcon;
