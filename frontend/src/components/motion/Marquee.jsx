import React from 'react';
import { motion } from 'framer-motion';

/**
 * Marquee
 * Seamless infinite ticker marquee with pause-on-hover and GPU acceleration.
 */
export const Marquee = ({
  children,
  speed = 28,
  direction = 'left',
  pauseOnHover = true,
  className = '',
}) => {
  return (
    <div
      className={`group relative flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}
    >
      <motion.div
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: speed,
        }}
        className={`flex shrink-0 items-center gap-4 ${
          pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
        }`}
      >
        <div className="flex shrink-0 items-center gap-4">{children}</div>
        <div className="flex shrink-0 items-center gap-4">{children}</div>
      </motion.div>
    </div>
  );
};

export default Marquee;
