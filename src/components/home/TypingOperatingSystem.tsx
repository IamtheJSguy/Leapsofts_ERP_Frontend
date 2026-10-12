import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { tokens } from '@/styles/tokens';

interface TypingOperatingSystemProps {
  text?: string;
  isDark?: boolean;
  typingSpeed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
}

export const TypingOperatingSystem: React.FC<TypingOperatingSystemProps> = ({
  text = 'Enterprise Operating System',
  isDark = true,
  typingSpeed = 65,
  deleteSpeed = 30,
  pauseDuration = 3600,
}) => {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTyping = () => {
      if (!isDeleting) {
        // Typing forward
        if (displayedLength < text.length) {
          setDisplayedLength((prev) => prev + 1);
          timerRef.current = window.setTimeout(handleTyping, typingSpeed);
        } else {
          // Finished typing: pause before deleting
          timerRef.current = window.setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      } else {
        // Deleting backward
        if (displayedLength > 0) {
          setDisplayedLength((prev) => prev - 1);
          timerRef.current = window.setTimeout(handleTyping, deleteSpeed);
        } else {
          // Finished deleting: pause briefly before re-typing
          setIsDeleting(false);
          timerRef.current = window.setTimeout(handleTyping, 450);
        }
      }
    };

    timerRef.current = window.setTimeout(
      handleTyping,
      isDeleting ? deleteSpeed : typingSpeed
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayedLength, isDeleting, text, typingSpeed, deleteSpeed, pauseDuration]);

  const displayedText = text.slice(0, displayedLength);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 1.2, sm: 1.5 },
        py: 0.5,
      }}
    >
      {/* Live status radar dot */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          width: 8,
          height: 8,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            bgcolor: tokens.brand.accent,
            opacity: 0.5,
            animation: 'pulseRadar 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
            '@keyframes pulseRadar': {
              '0%': { transform: 'scale(1)', opacity: 0.7 },
              '70%': { transform: 'scale(2.6)', opacity: 0 },
              '100%': { transform: 'scale(2.6)', opacity: 0 },
            },
          }}
        />
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: tokens.brand.accent,
          }}
        />
      </Box>

      {/* Coding braces format with zero-jitter layout reservation */}
      <Typography
        component="div"
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: { xs: '0.82rem', sm: '0.88rem' },
          letterSpacing: '0.01em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {/* Left Brace */}
        <Box
          component="span"
          sx={{
            color: tokens.brand.accent,
            fontWeight: 800,
            fontSize: '1.05rem',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {'{'}
        </Box>

        {/* Stable text slot (CSS grid overlay ensures NO width shift or jitter) */}
        <Box
          component="span"
          sx={{
            display: 'inline-grid',
            alignItems: 'center',
            textAlign: 'left',
          }}
        >
          {/* Invisible placeholder that holds the exact full width so braces never shift */}
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              gridArea: '1 / 1',
              visibility: 'hidden',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'pre',
              fontWeight: 700,
              pr: '0.5ch',
            }}
          >
            {text}
          </Box>

          {/* Actual smoothly typed text + blinking cursor */}
          <Box
            component="span"
            sx={{
              gridArea: '1 / 1',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'pre',
              fontWeight: 700,
            }}
          >
            <Box
              component="span"
              sx={{
                background: isDark
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #E9D5FF 100%)'
                  : 'linear-gradient(135deg, #1E1B4B 0%, #5D1A89 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {displayedText}
            </Box>

            {/* Modern terminal blinking cursor */}
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: '2px',
                height: '1.15em',
                bgcolor: tokens.brand.accent,
                ml: '2px',
                borderRadius: '1px',
                animation: 'cursorBlink 0.9s infinite steps(2, start)',
                '@keyframes cursorBlink': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0 },
                },
              }}
            />
          </Box>
        </Box>

        {/* Right Brace */}
        <Box
          component="span"
          sx={{
            color: tokens.brand.accent,
            fontWeight: 800,
            fontSize: '1.05rem',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {'}'}
        </Box>
      </Typography>
    </Box>
  );
};
