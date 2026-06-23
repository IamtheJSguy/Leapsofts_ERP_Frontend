import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animate floating particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number; y: number; r: number;
      dx: number; dy: number; alpha: number; color: string;
    }> = [];

    const colors = ['#7B3DA8', '#5D1A89', '#FF7F11', '#9B6BB8', '#c084fc'];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const bg = isDarkMode
    ? 'radial-gradient(ellipse at 20% 50%, rgba(93,26,137,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(123,61,168,0.25) 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, rgba(255,127,17,0.12) 0%, transparent 50%), #0D0B12'
    : 'radial-gradient(ellipse at 20% 50%, rgba(93,26,137,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(123,61,168,0.10) 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, rgba(255,127,17,0.06) 0%, transparent 50%), #F0EDF5';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        .nf-wrapper {
          position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', sans-serif; overflow: hidden;
          background: ${bg};
          transition: background 0.3s;
        }
        .nf-canvas {
          position: absolute; inset: 0; pointer-events: none;
        }

        /* Animated blobs */
        .nf-blob {
          position: absolute; border-radius: 50%; filter: blur(80px);
          animation: blobFloat 8s ease-in-out infinite;
        }
        .nf-blob-1 {
          width: 500px; height: 500px; left: -120px; top: -80px;
          background: ${isDarkMode ? 'rgba(93,26,137,0.35)' : 'rgba(93,26,137,0.12)'};
          animation-delay: 0s;
        }
        .nf-blob-2 {
          width: 400px; height: 400px; right: -100px; bottom: -80px;
          background: ${isDarkMode ? 'rgba(255,127,17,0.18)' : 'rgba(255,127,17,0.10)'};
          animation-delay: -3s;
        }
        .nf-blob-3 {
          width: 300px; height: 300px; right: 25%; top: 10%;
          background: ${isDarkMode ? 'rgba(155,107,184,0.20)' : 'rgba(155,107,184,0.10)'};
          animation-delay: -5s;
        }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.06); }
          66% { transform: translate(-20px, 20px) scale(0.96); }
        }

        /* Glass card */
        .nf-card {
          position: relative; z-index: 10;
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          background: ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)'};
          border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)'};
          border-radius: 32px;
          padding: 56px 64px;
          text-align: center;
          max-width: 560px; width: 90%;
          box-shadow: ${isDarkMode
            ? '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset'
            : '0 8px 32px rgba(93,26,137,0.10), 0 1px 0 rgba(255,255,255,1) inset'};
          animation: cardIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* 404 number */
        .nf-code {
          font-size: clamp(96px, 18vw, 140px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #7B3DA8 0%, #5D1A89 40%, #FF7F11 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          animation: fadeSlideUp 0.7s 0.15s cubic-bezier(0.16,1,0.3,1) both;
          position: relative;
        }
        /* Subtle shimmer on 404 */
        .nf-code::after {
          content: attr(data-text);
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% 100%;
          animation: shimmer 3s linear 1s infinite;
        }
        @keyframes shimmer {
          from { background-position: 200% center; }
          to   { background-position: -200% center; }
        }

        .nf-divider {
          width: 60px; height: 3px; margin: 0 auto 24px;
          border-radius: 99px;
          background: linear-gradient(90deg, #5D1A89, #FF7F11);
          animation: fadeSlideUp 0.7s 0.25s cubic-bezier(0.16,1,0.3,1) both;
        }

        .nf-title {
          font-size: 1.6rem; font-weight: 800; letter-spacing: -0.025em;
          color: ${isDarkMode ? '#fff' : '#1a1225'};
          margin: 0 0 12px;
          animation: fadeSlideUp 0.7s 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }

        .nf-desc {
          font-size: 1rem; font-weight: 500; line-height: 1.65;
          color: ${isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(26,18,37,0.5)'};
          margin: 0 0 40px;
          animation: fadeSlideUp 0.7s 0.38s cubic-bezier(0.16,1,0.3,1) both;
        }

        .nf-actions {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          animation: fadeSlideUp 0.7s 0.46s cubic-bezier(0.16,1,0.3,1) both;
        }

        .nf-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 99px;
          font-family: inherit; font-size: 0.95rem; font-weight: 700; cursor: pointer;
          border: none; outline: none;
          background: linear-gradient(135deg, #7B3DA8 0%, #5D1A89 100%);
          color: #fff;
          box-shadow: 0 4px 24px rgba(93,26,137,0.4);
          transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s;
        }
        .nf-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(93,26,137,0.55);
        }
        .nf-btn-primary:active { transform: scale(0.97); }

        .nf-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 99px;
          font-family: inherit; font-size: 0.95rem; font-weight: 700; cursor: pointer;
          background: transparent;
          color: ${isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(26,18,37,0.5)'};
          border: 1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(93,26,137,0.2)'};
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .nf-btn-ghost:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(93,26,137,0.06)'};
          color: ${isDarkMode ? '#fff' : '#5D1A89'};
          border-color: ${isDarkMode ? 'rgba(255,255,255,0.22)' : 'rgba(93,26,137,0.4)'};
          transform: translateY(-2px);
        }

        /* Status badge */
        .nf-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 99px; margin-bottom: 28px;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          background: ${isDarkMode ? 'rgba(93,26,137,0.2)' : 'rgba(93,26,137,0.08)'};
          color: ${isDarkMode ? '#c084fc' : '#5D1A89'};
          border: 1px solid ${isDarkMode ? 'rgba(155,107,184,0.3)' : 'rgba(93,26,137,0.2)'};
          animation: fadeSlideUp 0.7s 0.05s cubic-bezier(0.16,1,0.3,1) both;
        }
        .nf-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${isDarkMode ? '#c084fc' : '#5D1A89'};
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="nf-wrapper">
        {/* Animated blobs */}
        <div className="nf-blob nf-blob-1" />
        <div className="nf-blob nf-blob-2" />
        <div className="nf-blob nf-blob-3" />

        {/* Particle canvas */}
        <canvas ref={canvasRef} className="nf-canvas" />

        {/* Glass card */}
        <div className="nf-card">
          <div className="nf-badge">
            <span className="nf-badge-dot" />
            Error 404
          </div>

          <div className="nf-code" data-text="404">404</div>
          <div className="nf-divider" />

          <h1 className="nf-title">Page Not Found</h1>
          <p className="nf-desc">
            The page you're looking for doesn't exist or may have been moved.
            Let's get you back on track.
          </p>

          <div className="nf-actions">
            <button className="nf-btn-primary" onClick={() => navigate('/')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Go Home
            </button>
            <button className="nf-btn-ghost" onClick={() => navigate(-1)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
