import React from 'react';
import { Box, useTheme } from '@mui/material';

export const EnterpriseDoodleBackground: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // WhatsApp-inspired stroke color & opacity (increased for clear, tasteful visibility)
  const strokeColor = isDark ? '#E9D5FF' : '#4C1D95';
  const opacity = isDark ? 0.12 : 0.095;

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        opacity,
        transition: 'opacity 0.4s ease',
      }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <defs>
          <pattern
            id="erp-whatsapp-doodles"
            width="420"
            height="420"
            patternUnits="userSpaceOnUse"
          >
            <g
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* ================= ROW 1 ================= */}
              {/* 1. Chat Bubble (Chat & Support) */}
              <g transform="translate(36, 32) rotate(-8)">
                <rect x="0" y="0" width="24" height="17" rx="4" />
                <path d="M4 17 L1 22 L9 17 Z" />
                <line x1="6" y1="6" x2="18" y2="6" />
                <line x1="6" y1="11" x2="14" y2="11" />
              </g>

              {/* 2. 4-point Sparkle Star */}
              <path
                d="M135 44 Q135 52 143 52 Q135 52 135 60 Q135 52 127 52 Q135 52 135 44 Z"
                fill={strokeColor}
              />

              {/* 3. KPI Analytics Bar Chart */}
              <g transform="translate(210, 30) rotate(6)">
                <line x1="0" y1="22" x2="26" y2="22" />
                <rect x="3" y="13" width="5" height="9" rx="1" />
                <rect x="11" y="7" width="5" height="15" rx="1" />
                <rect x="19" y="2" width="5" height="20" rx="1" />
              </g>

              {/* 4. Micro Twinkle Star */}
              <g transform="translate(320, 42)">
                <line x1="0" y1="-5" x2="0" y2="5" />
                <line x1="-5" y1="0" x2="5" y2="0" />
                <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" />
                <line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5" />
              </g>

              {/* 5. Currency / Invoice Token */}
              <g transform="translate(382, 36) rotate(-10)">
                <circle cx="10" cy="10" r="9" />
                <path d="M10 5 v10 M7.5 7.5 h3.5 a1.5 1.5 0 0 1 0 3 h-3 a1.5 1.5 0 0 0 0 3 H12" />
              </g>

              {/* ================= ROW 2 ================= */}
              {/* 6. RBAC Security Shield with Keyhole */}
              <g transform="translate(80, 115) rotate(7)">
                <path d="M11 2 L2 6 v6 c0 5.5 3.8 10.7 9 12 c5.2 -1.3 9 -6.5 9 -12 V6 Z" />
                <circle cx="11" cy="11" r="2.2" />
                <line x1="11" y1="13.2" x2="11" y2="16.5" />
              </g>

              {/* 7. Tiny Star Dot */}
              <circle cx="155" cy="120" r="1.5" fill={strokeColor} />

              {/* 8. Video Meeting Camera */}
              <g transform="translate(185, 116) rotate(-6)">
                <rect x="1" y="4" width="16" height="13" rx="2.5" />
                <path d="M17 8.5 L24 4.5 v12 L17 12.5 Z" />
                <circle cx="9" cy="10.5" r="2.5" />
              </g>

              {/* 9. 4-point Sparkle Star */}
              <path
                d="M275 118 Q275 125 282 125 Q275 125 275 132 Q275 125 268 125 Q275 125 275 118 Z"
                fill={strokeColor}
              />

              {/* 10. Team Collaboration / People */}
              <g transform="translate(345, 112) rotate(10)">
                <circle cx="8" cy="6" r="3.5" />
                <path d="M1.5 18 c0 -3.2 2.8 -5.2 6.5 -5.2 s6.5 2 6.5 5.2" />
                <circle cx="17.5" cy="8" r="2.8" />
                <path d="M15 18 c0 -2 1.5 -3.5 4 -3.5 s4 1.5 4 3.5" />
              </g>

              {/* ================= ROW 3 ================= */}
              {/* 11. Calendar & Meeting Scheduler */}
              <g transform="translate(30, 205) rotate(-5)">
                <rect x="2" y="4" width="20" height="17" rx="3" />
                <line x1="7" y1="1.5" x2="7" y2="5.5" />
                <line x1="17" y1="1.5" x2="17" y2="5.5" />
                <line x1="2" y1="9.5" x2="22" y2="9.5" />
                <path d="M8 14.5 l2.5 2.5 l5.5 -5" />
              </g>

              {/* 12. 4-point Star Sparkle */}
              <path
                d="M125 208 Q125 216 133 216 Q125 216 125 224 Q125 216 117 216 Q125 216 125 208 Z"
                fill={strokeColor}
              />

              {/* 13. Kanban / Task Board */}
              <g transform="translate(215, 202) rotate(8)">
                <rect x="1" y="2" width="24" height="20" rx="2.5" />
                <line x1="9" y1="2" x2="9" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="4" y1="7" x2="6.5" y2="7" />
                <line x1="4" y1="11" x2="6.5" y2="11" />
                <line x1="11.5" y1="7" x2="14.5" y2="7" />
                <line x1="19.5" y1="7" x2="22" y2="7" />
              </g>

              {/* 14. Micro Twinkle */}
              <g transform="translate(295, 218)">
                <line x1="0" y1="-4" x2="0" y2="4" />
                <line x1="-4" y1="0" x2="4" y2="0" />
              </g>

              {/* 15. Financial Invoice & Receipt */}
              <g transform="translate(355, 202) rotate(-8)">
                <path d="M3 2 L3 21 L6 19.5 L9 21 L12 19.5 L15 21 L18 19.5 L21 21 L21 2 Z" />
                <line x1="7" y1="6.5" x2="17" y2="6.5" />
                <line x1="7" y1="10.5" x2="17" y2="10.5" />
                <line x1="7" y1="14.5" x2="13" y2="14.5" />
              </g>

              {/* ================= ROW 4 ================= */}
              {/* 16. Security Padlock (RBAC) */}
              <g transform="translate(85, 295) rotate(-11)">
                <rect x="2" y="9" width="17" height="12" rx="2.5" />
                <path d="M5.5 9 V5.5 a5 5 0 0 1 10 0 V9" />
                <circle cx="10.5" cy="15" r="1.5" />
              </g>

              {/* 17. Telemetry Growth Trend Line */}
              <g transform="translate(175, 298) rotate(5)">
                <polyline points="2,16 8,10 13,13.5 21,4" />
                <polyline points="15.5,4 21,4 21,9.5" />
              </g>

              {/* 18. 4-point Sparkle Star */}
              <path
                d="M260 295 Q260 303 268 303 Q260 303 260 311 Q260 303 252 303 Q260 303 260 295 Z"
                fill={strokeColor}
              />

              {/* 19. Support Headset / Customer Success */}
              <g transform="translate(340, 290) rotate(12)">
                <path d="M3 13 A9 9 0 0 1 21 13 v4 a2 2 0 0 1 -2 2 h-1 v-6 h3" />
                <rect x="1.5" y="13" width="3.5" height="6.5" rx="1.5" />
              </g>

              {/* 20. Tiny Star Dot */}
              <circle cx="400" cy="305" r="1.5" fill={strokeColor} />

              {/* ================= ROW 5 ================= */}
              {/* 21. 4-point Star Sparkle */}
              <path
                d="M45 375 Q45 383 53 383 Q45 383 45 391 Q45 383 37 383 Q45 383 45 375 Z"
                fill={strokeColor}
              />

              {/* 22. Meeting Clock / Timekeeper */}
              <g transform="translate(125, 372) rotate(6)">
                <circle cx="11" cy="11" r="9.5" />
                <polyline points="11,5.5 11,11 15,13" />
              </g>

              {/* 23. Task Checklist with Checkmarks */}
              <g transform="translate(235, 368) rotate(-7)">
                <rect x="2" y="2" width="20" height="20" rx="3.5" />
                <path d="M5.5 8 l2 2 l4.5 -4.5" />
                <line x1="6" y1="15" x2="16" y2="15" />
              </g>

              {/* 24. Target / KPI Bullseye */}
              <g transform="translate(355, 372) rotate(-4)">
                <circle cx="11" cy="11" r="10" />
                <circle cx="11" cy="11" r="6" />
                <circle cx="11" cy="11" r="2" fill={strokeColor} />
              </g>
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#erp-whatsapp-doodles)" />
      </svg>
    </Box>
  );
};
