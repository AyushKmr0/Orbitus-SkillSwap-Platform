import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * TiltCard
 * 3D interactive card tilt with physics-based spring return and dynamic specular lighting.
 */
export const TiltCard = ({
  children,
  className = '',
  maxTilt = 12,
  perspective = 1000,
  glare = true,
  scaleOnHover = 1.02,
  onClick,
  ...props
}) => {
  const cardRef = useRef(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 260, mass: 0.6 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [0, 1], [-maxTilt, maxTilt]);

  // Glare opacity and position
  const glareOpacity = useTransform(smoothY, [0, 0.5, 1], [0.15, 0.05, 0.15]);
  const glareX = useTransform(smoothX, [0, 1], ['0%', '100%']);
  const glareY = useTransform(smoothY, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = (e.clientX - rect.left) / rect.width;
    const clientY = (e.clientY - rect.top) / rect.height;
    x.set(clientX);
    y.set(clientY);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      className="relative will-change-transform"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: scaleOnHover }}
        whileTap={{ scale: 0.98 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        onClick={onClick}
        className={`relative overflow-hidden transition-shadow duration-300 ${className}`}
        {...props}
      >
        {children}

        {glare && (
          <motion.div
            style={{
              opacity: glareOpacity,
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 255, 255, 0.25) 0%, transparent 60%)`,
            }}
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          />
        )}
      </motion.div>
    </div>
  );
};

export default TiltCard;
