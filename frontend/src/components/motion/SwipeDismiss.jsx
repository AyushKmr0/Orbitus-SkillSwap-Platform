import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SwipeDismiss
 * Gesture-driven drag-to-dismiss component with spring snap and fade-out.
 */
export const SwipeDismiss = ({
  children,
  onDismiss,
  direction = 'x', // 'x' | 'y'
  threshold = 120,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDragEnd = (_, info) => {
    const offset = direction === 'x' ? info.offset.x : info.offset.y;
    if (Math.abs(offset) > threshold) {
      setIsDismissed(true);
      if (onDismiss) {
        setTimeout(onDismiss, 200);
      }
    }
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          drag={direction}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.65}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            x: direction === 'x' ? 200 : 0,
            y: direction === 'y' ? 100 : 0,
            scale: 0.9,
            transition: { duration: 0.25 },
          }}
          whileDrag={{ scale: 0.98, cursor: 'grabbing' }}
          className={`cursor-grab active:cursor-grabbing will-change-transform ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SwipeDismiss;
