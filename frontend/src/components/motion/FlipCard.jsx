import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * FlipCard
 * 3D perspective flip card that rotates 180 degrees on hover or click.
 */
export const FlipCard = ({
  front,
  back,
  trigger = 'hover', // 'hover' | 'click'
  perspective = 1000,
  duration = 0.6,
  className = '',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleToggle = () => {
    if (trigger === 'click') {
      setIsFlipped((prev) => !prev);
    }
  };

  const isHover = trigger === 'hover';

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      onClick={handleToggle}
      onMouseEnter={isHover ? () => setIsFlipped(true) : undefined}
      onMouseLeave={isHover ? () => setIsFlipped(false) : undefined}
      className={`relative cursor-pointer select-none ${className}`}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="w-full h-full"
        >
          {front}
        </div>

        {/* Back */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 w-full h-full"
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
};

export default FlipCard;
