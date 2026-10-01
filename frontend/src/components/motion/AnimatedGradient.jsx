import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedGradient
 * Flowing multi-stop gradient animation for accent headers, cards, and borders.
 */
export const AnimatedGradient = ({
  children,
  className = '',
  speed = 8,
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#3b82f6'],
}) => {
  return (
    <motion.div
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        repeat: Infinity,
        duration: speed,
        ease: 'linear',
      }}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: '200% 200%',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedGradient;
