import React, { useEffect, useRef, useState } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';

export type ScrollRevealVariant =
  | 'fade-up'
  | 'fade-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up'
  | 'perspective-tilt'
  | 'blur-reveal';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: ScrollRevealVariant;
  delay?: number; // milliseconds
  duration?: number; // seconds
  distance?: number; // pixels
  threshold?: number;
  rootMargin?: string;
  className?: string;
  sx?: SxProps<Theme>;
  once?: boolean;
  style?: React.CSSProperties;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 0.75,
  distance = 36,
  threshold = 0.1,
  rootMargin = '0px 0px -40px 0px',
  className = '',
  sx,
  once = true,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.unobserve(node);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [once, threshold, rootMargin]);

  // Compute CSS Transform for each custom trajectory
  const getHiddenTransform = (): string => {
    switch (variant) {
      case 'fade-up':
        return `translate3d(0, ${distance}px, 0)`;
      case 'fade-down':
        return `translate3d(0, -${distance}px, 0)`;
      case 'slide-left':
        return `translate3d(-${distance}px, 0, 0)`;
      case 'slide-right':
        return `translate3d(${distance}px, 0, 0)`;
      case 'scale-up':
        return `translate3d(0, ${Math.round(distance * 0.5)}px, 0) scale(0.94)`;
      case 'perspective-tilt':
        return `perspective(1200px) rotateX(4deg) translate3d(0, ${distance}px, 0) scale(0.97)`;
      case 'blur-reveal':
        return `translate3d(0, ${Math.round(distance * 0.4)}px, 0) scale(0.98)`;
      default:
        return `translate3d(0, ${distance}px, 0)`;
    }
  };

  const getVisibleTransform = (): string => {
    switch (variant) {
      case 'perspective-tilt':
        return 'perspective(1200px) rotateX(0deg) translate3d(0, 0, 0) scale(1)';
      default:
        return 'translate3d(0, 0, 0) scale(1)';
    }
  };

  return (
    <Box
      ref={containerRef}
      className={className}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? getVisibleTransform() : getHiddenTransform(),
        filter: variant === 'blur-reveal' ? (isVisible ? 'blur(0px)' : 'blur(6px)') : undefined,
        transition: `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        backfaceVisibility: 'hidden',
        transformStyle: variant === 'perspective-tilt' ? 'preserve-3d' : 'flat',
        willChange: isVisible ? 'auto' : 'transform, opacity',
        ...sx,
      }}
      style={style}
    >
      {children}
    </Box>
  );
};
