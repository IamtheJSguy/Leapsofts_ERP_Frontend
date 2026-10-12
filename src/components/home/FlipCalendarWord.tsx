import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface FlipCalendarWordProps {
  words?: string[];
  intervalMs?: number;
  gradient?: string;
}

export const FlipCalendarWord: React.FC<FlipCalendarWordProps> = ({
  words = ['Operations', 'Workflows', 'Execution', 'Performance', 'Delivery'],
  intervalMs = 3000,
  gradient = 'linear-gradient(135deg, #A855F7 0%, #FF7F11 100%)',
}) => {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'fold-out' | 'fold-in'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    if (words.length <= 1) return;

    const interval = setInterval(() => {
      if (isPaused) return;

      // Phase 1: Fold out top-to-bottom like a calendar page flipping down
      setPhase('fold-out');

      // Phase 2: Swap word and unfold from top at halfway point (240ms)
      const t1 = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setPhase('fold-in');
      }, 240);

      // Phase 3: Settle back to idle resting state (500ms total flip time)
      const t2 = window.setTimeout(() => {
        setPhase('idle');
      }, 520);

      timersRef.current.push(t1, t2);
    }, intervalMs);

    return () => {
      clearInterval(interval);
      clearAllTimers();
    };
  }, [words.length, intervalMs, isPaused]);

  const currentWord = words[index] || '';

  // 3D Calendar / Flip-Timer Transform Styles
  let transform = 'rotateX(0deg) scale(1)';
  let opacity = 1;
  let transition = 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease';

  if (phase === 'fold-out') {
    // Current page folds down/away (accelerates smoothly into fold)
    transform = 'rotateX(-90deg) scale(0.96)';
    opacity = 0;
    transition = 'transform 0.24s cubic-bezier(0.5, 0, 0.8, 0.2), opacity 0.18s ease';
  } else if (phase === 'fold-in') {
    // New page unfolds into place from top (decelerates smoothly into resting position)
    transform = 'rotateX(0deg) scale(1)';
    opacity = 1;
    transition = 'transform 0.28s cubic-bezier(0.18, 0.9, 0.32, 1.1), opacity 0.2s ease';
  }

  return (
    <Box
      component="span"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      sx={{
        display: 'inline-block',
        position: 'relative',
        verticalAlign: 'baseline',
        perspective: '600px',
        transformStyle: 'preserve-3d',
        cursor: 'default',
        userSelect: 'none',
      }}
      aria-live="polite"
      aria-label={currentWord}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          transformOrigin: '50% 60%',
          transform,
          opacity,
          transition,
          background: gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: phase === 'fold-out' ? 'blur(1px)' : 'none',
        }}
      >
        {currentWord}
      </Box>
    </Box>
  );
};
