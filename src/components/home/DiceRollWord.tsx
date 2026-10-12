import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface DiceRollWordProps {
  words?: string[];
  intervalMs?: number;
  gradient?: string;
}

export const DiceRollWord: React.FC<DiceRollWordProps> = ({
  words = ['Operations', 'Workflows', 'Execution', 'Performance', 'Delivery'],
  intervalMs = 2800,
  gradient = 'linear-gradient(135deg, #A855F7 0%, #FF7F11 100%)',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Find longest word to reserve exact width and prevent horizontal layout shift (CLS)
  const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b), words[0] || 'Performance');

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      if (isPaused) return;

      setCurrentIndex((prev) => {
        setOutgoingIndex(prev);
        setIsAnimating(true);

        const next = (prev + 1) % words.length;

        // Clear outgoing state after animation finishes
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          setOutgoingIndex(null);
          setIsAnimating(false);
        }, 600);

        return next;
      });
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [words.length, intervalMs, isPaused]);

  const currentWord = words[currentIndex] || '';
  const outgoingWord = outgoingIndex !== null ? words[outgoingIndex] || '' : null;

  const gradientStyle = {
    background: gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block',
  };

  return (
    <Box
      component="span"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        verticalAlign: 'baseline',
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'default',
        px: 0.25,
      }}
      aria-live="polite"
      aria-label={currentWord}
    >
      {/* 1. Invisible Sizer: Guarantees zero horizontal bouncing or layout shift */}
      <Box
        component="span"
        sx={{
          visibility: 'hidden',
          display: 'inline-block',
          height: 0,
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 'inherit',
          fontWeight: 'inherit',
          fontSize: 'inherit',
          letterSpacing: 'inherit',
        }}
        aria-hidden="true"
      >
        {longestWord}
      </Box>

      {/* 2. Outgoing Word Rolling Up and Away */}
      {isAnimating && outgoingWord && (
        <Box
          component="span"
          sx={{
            ...gradientStyle,
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            transformOrigin: '50% 50% -25px',
            animation: 'diceRollOut 0.58s cubic-bezier(0.25, 1, 0.5, 1) forwards',
            '@keyframes diceRollOut': {
              '0%': {
                transform: 'translateY(0%) rotateX(0deg)',
                opacity: 1,
                filter: 'blur(0px)',
              },
              '100%': {
                transform: 'translateY(-110%) rotateX(85deg)',
                opacity: 0,
                filter: 'blur(2px)',
              },
            },
          }}
          aria-hidden="true"
        >
          {outgoingWord}
        </Box>
      )}

      {/* 3. Incoming / Active Word Rolling into Place */}
      <Box
        key={currentWord}
        component="span"
        sx={{
          ...gradientStyle,
          position: isAnimating ? 'absolute' : 'relative',
          left: 0,
          right: 0,
          textAlign: 'center',
          transformOrigin: '50% 50% -25px',
          animation: isAnimating ? 'diceRollIn 0.58s cubic-bezier(0.18, 0.9, 0.32, 1.15) forwards' : 'none',
          '@keyframes diceRollIn': {
            '0%': {
              transform: 'translateY(110%) rotateX(-85deg)',
              opacity: 0,
              filter: 'blur(2px)',
            },
            '100%': {
              transform: 'translateY(0%) rotateX(0deg)',
              opacity: 1,
              filter: 'blur(0px)',
            },
          },
        }}
      >
        {currentWord}
      </Box>
    </Box>
  );
};
