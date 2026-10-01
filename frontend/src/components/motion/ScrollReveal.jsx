import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const getVariants = (direction, distance) => {
  const d = distance || 16;
  switch (direction) {
    case 'down':
      return {
        hidden: { opacity: 0, y: -d },
        visible: { opacity: 1, y: 0 },
      };
    case 'left':
      return {
        hidden: { opacity: 0, x: d },
        visible: { opacity: 1, x: 0 },
      };
    case 'right':
      return {
        hidden: { opacity: 0, x: -d },
        visible: { opacity: 1, x: 0 },
      };
    case 'scale':
      return {
        hidden: { opacity: 0, scale: 0.96 },
        visible: { opacity: 1, scale: 1 },
      };
    case 'rotate':
      return {
        hidden: { opacity: 0, scale: 0.96, rotate: -2 },
        visible: { opacity: 1, scale: 1, rotate: 0 },
      };
    case 'up':
    default:
      return {
        hidden: { opacity: 0, y: d },
        visible: { opacity: 1, y: 0 },
      };
  }
};

/**
 * ScrollReveal
 * Fluid entrance animation with robust fallback so content is never hidden.
 */
export const ScrollReveal = ({
  children,
  direction = 'up',
  distance = 16,
  delay = 0,
  duration = 0.35,
  className = '',
  style = {},
  cascade = false,
  staggerChildren = 0.06,
}) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Safety fallback: ensure content is fully visible even if container scroll intercepts intersection
    const timer = setTimeout(() => {
      setRevealed(true);
    }, 150 + delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const variants = getVariants(direction, distance);

  if (cascade) {
    return (
      <motion.div
        initial="hidden"
        animate={revealed ? 'visible' : undefined}
        whileInView="visible"
        viewport={{ once: true, amount: 0 }}
        transition={{
          staggerChildren,
          delayChildren: delay,
        }}
        className={className}
        style={style}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate={revealed ? 'visible' : undefined}
      whileInView="visible"
      viewport={{ once: true, amount: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
