import type { CSSProperties } from 'react';

export const nativeFieldStyle = (isDarkMode: boolean, error?: boolean): CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 10,
  border: error
    ? '2px solid #c62828'
    : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
  background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fff',
  color: isDarkMode ? '#fff' : '#111',
  fontSize: '0.8rem',
  padding: '8px 10px',
  outline: 'none',
  fontFamily: 'inherit',
});
