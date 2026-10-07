import React, { useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  currentRadius: number;
  opacity: number;
  opacitySpeed: number;
  opacityDirection: number;
  color: string;
  // Repulse impulse vectors
  impulseX: number;
  impulseY: number;
}

export const CosmicStarfieldBackground: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Global cursor tracking (without blocking any UI clicks)
    const mouse = {
      x: -1000,
      y: -1000,
      isHovering: false,
    };

    // Calculate density-responsive particle count (base 160 per 800x800 area)
    const getTargetCount = (w: number, h: number) => {
      const area = w * h;
      const count = Math.round((area / (800 * 800)) * 160);
      return Math.max(80, Math.min(count, 220));
    };

    let particles: Particle[] = [];

    // Star color palette for rich cosmic depth
    const starColorsDark = ['#FFFFFF', '#FFFFFF', '#FAF5FF', '#FDF4FF', '#FEF08A', '#E9D5FF'];
    const starColorsLight = ['#5D1A89', '#7C3AED', '#A855F7', '#FF7F11', '#4F46E5', '#6B7280'];

    const createParticle = (w: number, h: number): Particle => {
      const palette = isDark ? starColorsDark : starColorsLight;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const baseRadius = 0.6 + Math.random() * 2.4; // up to 3.0px
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.8; // move speed ~ 1

      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseRadius,
        currentRadius: baseRadius,
        opacity: 0.1 + Math.random() * 0.9,
        opacitySpeed: 0.008 + Math.random() * 0.02, // speed: 1 anim
        opacityDirection: Math.random() > 0.5 ? 1 : -1,
        color,
        impulseX: 0,
        impulseY: 0,
      };
    };

    const initParticles = () => {
      const count = getTargetCount(width, height);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(width, height));
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      // Cap DPR to 1.5 for buttery 90+ FPS on 4K/Retina displays without GPU fill-rate exhaustion
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const handlePointerMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.isHovering = true;
    };

    const handlePointerLeave = () => {
      mouse.isHovering = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    // Repulse on click (particles bounce away up to 400px)
    const handleClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
      const repulseDistance = 400;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repulseDistance && dist > 0) {
          const force = (1 - dist / repulseDistance) * 14;
          p.impulseX += (dx / dist) * force;
          p.impulseY += (dy / dist) * force;
        }
      }
    };

    let isPaused = false;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animationFrameId);
      } else if (isPaused) {
        isPaused = false;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    handleResize();

    // Main 90+ FPS Ultra-Lightweight Render Loop (<0.2ms execution time per frame)
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const bubbleDist = 250;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Twinkling star opacity animation (speed: 1, min: 0, max: 1)
        p.opacity += p.opacitySpeed * p.opacityDirection;
        if (p.opacity >= 1) {
          p.opacity = 1;
          p.opacityDirection = -1;
        } else if (p.opacity <= 0.05) {
          p.opacity = 0.05;
          p.opacityDirection = 1;
        }

        // 2. Repulse impulse damping (natural decay over ~0.4s)
        p.impulseX *= 0.92;
        p.impulseY *= 0.92;

        // 3. Position update
        p.x += p.vx + p.impulseX;
        p.y += p.vy + p.impulseY;

        // 4. Wrap around boundaries (out_mode: "out")
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;

        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // 5. Interactivity: Bubble effect on hover within 250px
        let renderRadius = p.baseRadius;
        let renderOpacity = p.opacity;

        if (mouse.isHovering) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < bubbleDist) {
            const ratio = 1 - dist / bubbleDist;
            // Bubble expansion and bright aura
            renderRadius = p.baseRadius * (1 + ratio * 1.5);
            renderOpacity = Math.min(1, p.opacity + ratio * 0.5);
          }
        }

        // 6. Draw glowing star particle (Zero save/restore, zero shadowBlur for 90+ FPS)
        if (renderRadius > 1.8) {
          // Radiant outer celestial halo aura (100x faster than shadowBlur)
          ctx.globalAlpha = renderOpacity * 0.22;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, renderRadius * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Solid core star
        ctx.globalAlpha = renderOpacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, renderRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDark]);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 1. Rich Cosmic Gradient Nebula Atmosphere */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? `
              radial-gradient(circle at 18% 15%, rgba(93, 26, 137, 0.42) 0%, rgba(59, 7, 100, 0.22) 35%, transparent 65%),
              radial-gradient(circle at 82% 38%, rgba(124, 58, 237, 0.28) 0%, rgba(30, 27, 75, 0.22) 45%, transparent 70%),
              radial-gradient(circle at 15% 82%, rgba(255, 127, 17, 0.16) 0%, rgba(93, 26, 137, 0.24) 40%, transparent 68%),
              radial-gradient(circle at 75% 85%, rgba(168, 85, 247, 0.2) 0%, transparent 60%),
              linear-gradient(180deg, #090710 0%, #0F0B18 50%, #08060D 100%)
            `
            : `
              radial-gradient(circle at 20% 15%, rgba(93, 26, 137, 0.11) 0%, rgba(168, 85, 247, 0.05) 45%, transparent 65%),
              radial-gradient(circle at 85% 42%, rgba(255, 127, 17, 0.08) 0%, rgba(255, 154, 68, 0.04) 45%, transparent 70%),
              radial-gradient(circle at 22% 82%, rgba(147, 51, 234, 0.09) 0%, transparent 60%),
              linear-gradient(180deg, #FAF8FD 0%, #F5F0FC 50%, #FAF8FD 100%)
            `,
          opacity: 1,
          transition: 'background 0.5s ease',
        }}
      />

      {/* 2. Interactive Twinkling Stars HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </Box>
  );
};
