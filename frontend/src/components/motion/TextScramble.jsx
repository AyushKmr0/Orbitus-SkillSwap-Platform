import React, { useState, useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><';

/**
 * TextScramble
 * Animates text with a cryptographic scramble decoding effect on hover or mount.
 */
export const TextScramble = ({
  text = '',
  speed = 30,
  scrambleOnHover = false,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);

  const startScramble = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    let iteration = 0;

    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }

      iteration += 1 / 2;
    }, speed);
  };

  useEffect(() => {
    if (!scrambleOnHover) {
      startScramble();
    }
  }, [text]);

  return (
    <span
      onMouseEnter={scrambleOnHover ? startScramble : undefined}
      className={`font-mono select-none ${className}`}
    >
      {displayText}
    </span>
  );
};

export default TextScramble;
