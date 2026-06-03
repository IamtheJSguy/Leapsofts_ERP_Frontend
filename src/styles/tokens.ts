/**
 * LEAP SOFTS brand design tokens — single source of truth for UI colors.
 * Primary purple #5D1A89, accent orange #FF7F11 (CTAs/highlights only).
 */

export const tokens = {
  brand: {
    primary: '#5D1A89',
    primaryLight: '#7B3DA8',
    primaryDark: '#451366',
    primaryMuted: '#9B6BB8',
    primary50: '#F5EFF9',
    primary100: '#E8D9F2',
    primary200: '#D4B8E8',
    accent: '#FF7F11',
    accentLight: '#FF9A44',
    accentDark: '#E66D00',
    accent50: '#FFF4EB',
  },
  surface: {
    sidebar: '#1E1B24',
    sidebarHover: '#2A2633',
    sidebarActive: '#352F42',
    main: '#FAF8F5',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    border: '#E8E4DF',
    borderLight: '#F0ECE7',
    input: '#FFFFFF',
  },
  text: {
    primary: '#1A1625',
    secondary: '#6B6578',
    muted: '#9A94A8',
    inverse: '#FFFFFF',
    inverseMuted: 'rgba(255,255,255,0.72)',
    sidebar: '#E8E4EF',
    sidebarMuted: '#9A94A8',
  },
  semantic: {
    success: '#2D8A5E',
    successBg: '#E8F5EE',
    warning: '#B8860B',
    warningBg: '#FBF5E6',
    error: '#C44545',
    errorBg: '#FCEEED',
    info: '#5D1A89',
    infoBg: '#F5EFF9',
    neutral: '#8A8499',
    neutralBg: '#F3F1EE',
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
  not_sent: { color: tokens.semantic.neutral, bg: tokens.semantic.neutralBg },
  sent: { color: tokens.brand.primary, bg: tokens.semantic.infoBg },
  accepted: { color: tokens.semantic.success, bg: tokens.semantic.successBg },
  declined: { color: tokens.semantic.error, bg: tokens.semantic.errorBg },
  no_response: { color: tokens.semantic.warning, bg: tokens.semantic.warningBg },
} as const;

/** Message status → semantic token keys */
export const messageStatusTokens = {
  not_sent: { color: tokens.semantic.neutral, bg: tokens.semantic.neutralBg },
  sent: { color: tokens.brand.primary, bg: tokens.semantic.infoBg },
  replied: { color: tokens.semantic.warning, bg: tokens.semantic.warningBg },
  follow_up: { color: tokens.brand.accentDark, bg: tokens.brand.accent50 },
  negative: { color: tokens.semantic.error, bg: tokens.semantic.errorBg },
  positive: { color: tokens.semantic.success, bg: tokens.semantic.successBg },
  future_lead: { color: tokens.brand.primaryDark, bg: tokens.brand.primary50 },
} as const;

export const kpiStatusTokens = {
  success: tokens.semantic.success,
  warning: tokens.semantic.warning,
  error: tokens.semantic.error,
} as const;
