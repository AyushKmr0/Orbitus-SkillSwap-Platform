import React from 'react';
import { motion } from 'framer-motion';

/**
 * SvgDraw
 * SVG path drawing animation with pathLength transition.
 */
export const SvgDraw = ({
  d = '',
  duration = 1.2,
  delay = 0,
  stroke = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  className = '',
  viewBox = '0 0 100 100',
  width = 100,
  height = 100,
}) => {
  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={height}
      className={`overflow-visible ${className}`}
    >
      <motion.path
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          pathLength: { duration, delay, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.2, delay },
        }}
      />
    </svg>
  );
};

export default SvgDraw;
