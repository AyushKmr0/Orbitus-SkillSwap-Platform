import React from 'react';
import { motion } from 'framer-motion';

/**
 * TextReveal
 * Renders text with word-by-word or character-by-character spring entrance and blur-to-sharp animation.
 */
export const TextReveal = ({
  text = '',
  type = 'words', // 'words' | 'chars'
  delay = 0,
  stagger = 0.04,
  className = '',
  once = true,
}) => {
  const items = type === 'chars' ? Array.from(text) : text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 14,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once }}
      className={`inline-flex flex-wrap ${className}`}
    >
      {items.map((item, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          className="inline-block"
          style={{ marginRight: type === 'words' ? '0.28em' : '0' }}
        >
          {item}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default TextReveal;
