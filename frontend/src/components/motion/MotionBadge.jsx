import React from 'react';
import { motion } from 'framer-motion';

/**
 * MotionBadge
 * Animated badge with pulse, bounce, shake, or glow effects.
 */
export const MotionBadge = ({
  children,
  animation = 'pulse', // 'pulse' | 'bounce' | 'shake' | 'glow'
  className = '',
  onClick,
}) => {
  const getAnimation = () => {
    switch (animation) {
      case 'bounce':
        return {
          y: [0, -4, 0],
          transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
        };
      case 'shake':
        return {
          rotate: [-3, 3, -3, 3, 0],
          transition: { repeat: Infinity, repeatDelay: 2.5, duration: 0.5 },
        };
      case 'glow':
        return {
          boxShadow: [
            '0 0 0px rgba(59, 130, 246, 0.4)',
            '0 0 14px rgba(59, 130, 246, 0.7)',
            '0 0 0px rgba(59, 130, 246, 0.4)',
          ],
          transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
        };
      case 'pulse':
      default:
        return {
          scale: [1, 1.06, 1],
          opacity: [0.9, 1, 0.9],
          transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
        };
    }
  };

  return (
    <motion.span
      animate={getAnimation()}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex items-center justify-center cursor-default ${className}`}
    >
      {children}
    </motion.span>
  );
};

export default MotionBadge;
