/**
 * LEAP SOFTS brand design tokens — runtime values live in src/styles/global.css.
 * --brand-primary is the on-surface accent (links, icons, text) and lightens in dark mode.
 * --brand-primary-solid is the filled brand paint for buttons and avatars.
 *
 * brandPalette is the same colors as hex so MUI createTheme can parse them.
 * Do not pass CSS variables into palette.primary / secondary / info.
 */

export const brandPalette = {
  light: {
    primary: '#5D1A89',
    primaryLight: '#7B3DA8',
    primaryDark: '#451366',
    primaryMuted: '#9563B8',
    primary50: '#FAF5FF',
    solid: '#5D1A89',
    solidHover: '#451366',
    accent: '#FF7F11',
    accentLight: '#FF9A44',
    accentDark: '#E66D00',
    surfaceMain: '#FAF8F5',
    surfaceCard: '#FFFFFF',
    surfaceSidebar: '#1E1B24',
    surfaceBorder: '#E8E4DF',
    textPrimary: '#1A1625',
    textSecondary: '#6B6578',
    textMuted: '#9A94A8',
  },
  dark: {
    primary: '#D4A6F0',
    primaryLight: '#E4C4F7',
    primaryDark: '#C084E8',
    primaryMuted: '#DCB6F3',
    primary50: 'rgba(212, 166, 240, 0.14)',
    solid: '#5D1A89',
    solidHover: '#7B3DA8',
    accent: '#FF7F11',
    accentLight: '#FF9A44',
    accentDark: '#E66D00',
    surfaceMain: '#141218',
    surfaceCard: '#1E1B24',
    surfaceSidebar: '#12101A',
    surfaceBorder: '#352F42',
    textPrimary: '#F5F3F8',
    textSecondary: '#9A94A8',
    textMuted: '#6B6578',
  },
} as const;

export const tokens = {
  brand: {
    primary: 'var(--brand-primary)',
    primaryLight: 'var(--brand-primary-light)',
    primaryDark: 'var(--brand-primary-dark)',
    primaryMuted: 'var(--brand-primary-muted)',
    primary50: 'var(--brand-primary-50)',
    primary100: 'var(--brand-primary-100)',
    primary200: 'var(--brand-primary-200)',
    solid: 'var(--brand-primary-solid)',
    solidHover: 'var(--brand-primary-solid-hover)',
    accent: 'var(--brand-accent)',
    accentLight: 'var(--brand-accent-light)',
    accentDark: 'var(--brand-accent-dark)',
    accent50: 'var(--brand-accent-50)',
  },
  surface: {
    sidebar: 'var(--surface-sidebar)',
    sidebarHover: 'var(--surface-sidebar-hover)',
    sidebarActive: 'var(--surface-sidebar-active)',
    main: 'var(--surface-main)',
    card: 'var(--surface-card)',
    elevated: 'var(--surface-elevated)',
    border: 'var(--surface-border)',
    borderLight: 'var(--surface-border-light)',
    input: 'var(--surface-input)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    inverse: '#FFFFFF',
    inverseMuted: 'rgba(255,255,255,0.72)',
    sidebar: '#E8E4EF',
    sidebarMuted: '#9A94A8',
  },
  semantic: {
    success: 'var(--semantic-success)',
    successBg: 'var(--semantic-success-bg)',
    warning: 'var(--semantic-warning)',
    warningBg: 'var(--semantic-warning-bg)',
    error: 'var(--semantic-error)',
    errorBg: 'var(--semantic-error-bg)',
    info: 'var(--brand-primary)',
    infoBg: 'var(--brand-primary-50)',
    neutral: 'var(--semantic-neutral)',
    neutralBg: 'var(--semantic-neutral-bg)',
  },
  shadow: {
    card: '0 1px 3px rgba(26, 22, 37, 0.06), 0 8px 24px rgba(26, 22, 37, 0.06)',
    cardHover: '0 4px 12px rgba(26, 22, 37, 0.08), 0 12px 32px rgba(26, 22, 37, 0.08)',
    sidebar: '4px 0 24px rgba(0, 0, 0, 0.12)',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 9999,
  },
} as const;

/** Chart series — brand + semantic, no random Material defaults */
export const chartColors = [
  tokens.brand.primary,
  tokens.brand.accent,
  tokens.brand.primaryLight,
  tokens.semantic.success,
  tokens.semantic.warning,
  tokens.semantic.error,
] as const;

export const chartSeries = {
  connections: tokens.brand.primary,
  messages: tokens.brand.accent,
  primary: tokens.brand.primary,
  secondary: tokens.brand.accent,
} as const;

/** Connection status → semantic token keys */
export const connectionStatusTokens = {
  pending: { color: tokens.semantic.neutral, bg: tokens.semantic.neutralBg },
  sent: { color: tokens.brand.primary, bg: tokens.semantic.infoBg },
  accepted: { color: tokens.semantic.success, bg: tokens.semantic.successBg },
  declined: { color: tokens.semantic.error, bg: tokens.semantic.errorBg },
} as const;

/** Message status → semantic token keys */
export const messageStatusTokens = {
  not_sent: { color: tokens.semantic.neutral, bg: tokens.semantic.neutralBg },
  sent: { color: tokens.brand.primary, bg: tokens.semantic.infoBg },
  in_conversation: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  replied: { color: tokens.semantic.warning, bg: tokens.semantic.warningBg },
  follow_up: { color: tokens.brand.accentDark, bg: tokens.brand.accent50 },
  negative: { color: tokens.semantic.error, bg: tokens.semantic.errorBg },
  positive: { color: tokens.semantic.success, bg: tokens.semantic.successBg },
  future_lead: { color: tokens.brand.primaryDark, bg: tokens.brand.primary50 },
  invalid_lead: { color: tokens.semantic.error, bg: tokens.semantic.errorBg },
} as const;

export const coldOutreachStatusTokens = {
  pending: { color: tokens.semantic.neutral, bg: tokens.semantic.neutralBg },
  dialed_1: { color: tokens.brand.primary, bg: tokens.semantic.infoBg },
  dialed_2: { color: tokens.brand.primaryDark, bg: tokens.brand.primary50 },
  dialed_3: { color: tokens.brand.accentDark, bg: tokens.brand.accent50 },
  declined: { color: tokens.semantic.error, bg: tokens.semantic.errorBg },
} as const;

export const coldResponseStatusTokens = {
  no_response: { color: tokens.semantic.neutral, bg: tokens.semantic.neutralBg },
  positive: { color: tokens.semantic.success, bg: tokens.semantic.successBg },
  negative: { color: tokens.semantic.error, bg: tokens.semantic.errorBg },
  in_conversation: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  future_lead: { color: tokens.brand.primaryDark, bg: tokens.brand.primary50 },
  follow_up_1: { color: tokens.brand.accentDark, bg: tokens.brand.accent50 },
  follow_up_2: { color: tokens.brand.accentDark, bg: tokens.brand.accent50 },
  follow_up_3: { color: tokens.brand.accentDark, bg: tokens.brand.accent50 },
  invalid_lead: { color: tokens.semantic.error, bg: tokens.semantic.errorBg },
} as const;

/** Lead comment severity level → dot/icon color */
export const leadCommentLevelTokens = {
  red: tokens.semantic.error,
  yellow: tokens.semantic.warning,
  green: tokens.semantic.success,
} as const;

export const kpiStatusTokens = {
  success: tokens.semantic.success,
  warning: tokens.semantic.warning,
  error: tokens.semantic.error,
} as const;
