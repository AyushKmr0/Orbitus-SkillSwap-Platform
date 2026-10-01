import React from 'react';
import { motion } from 'framer-motion';

/**
 * MorphingBlob
 * Ambient fluid morphing blob with organic border-radius transitions and floating motion.
 */
export const MorphingBlob = ({
  size = 380,
  color = 'rgba(59, 130, 246, 0.35)',
  duration = 14,
  blur = 100,
  className = '',
}) => {
  return (
    <motion.div
      animate={{
        borderRadius: [
          '60% 40% 30% 70% / 60% 30% 70% 40%',
          '30% 60% 70% 40% / 50% 60% 30% 60%',
          '60% 40% 60% 30% / 70% 40% 50% 60%',
          '40% 60% 30% 70% / 40% 60% 40% 70%',
          '60% 40% 30% 70% / 60% 30% 70% 40%',
        ],
        x: [0, 25, -20, 15, 0],
        y: [0, -30, 20, -15, 0],
        rotate: [0, 45, 90, 180, 360],
      }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'easeInOut',
      }}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        filter: `blur(${blur}px)`,
      }}
      className={`pointer-events-none absolute will-change-transform ${className}`}
    />
  );
};

export default MorphingBlob;
