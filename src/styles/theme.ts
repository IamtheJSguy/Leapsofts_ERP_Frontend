import { createTheme, alpha, type ThemeOptions } from '@mui/material/styles';
import { tokens } from './tokens';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    surface: {
      sidebar: string;
      main: string;
      card: string;
      border: string;
    };
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    surface?: {
      sidebar?: string;
      main?: string;
      card?: string;
      border?: string;
    };
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    accent: true;
  }
}

const buildPalette = (mode: 'light' | 'dark'): ThemeOptions['palette'] => {
  if (mode === 'light') {
    return {
      mode: 'light',
      primary: {
        main: '#5D1A89',
        light: '#7B3DA8',
        dark: '#451366',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#9B6BB8',
        light: '#E8D9F2',
        dark: '#451366',
        contrastText: '#FFFFFF',
      },
      accent: {
        main: '#FF7F11',
        light: '#FF9A44',
        dark: '#E66D00',
        contrastText: '#FFFFFF',
      },
      error: { main: '#C44545', light: '#FCEEED' },
      warning: { main: '#B8860B', light: '#FBF5E6' },
      success: { main: '#2D8A5E', light: '#E8F5EE' },
      info: { main: '#5D1A89', light: '#F5EFF9' },
      background: {
        default: '#FAF8F5',
        paper: '#FFFFFF',
      },
      surface: {
        sidebar: '#1E1B24',
        main: '#FAF8F5',
        card: '#FFFFFF',
        border: '#E8E4DF',
      },
      text: {
        primary: '#1A1625',
        secondary: '#6B6578',
        disabled: '#9A94A8',
      },
      divider: '#E8E4DF',
    };
  }

  return {
    mode: 'dark',
    primary: {
      main: tokens.brand.primaryLight,
      light: tokens.brand.primaryMuted,
      dark: tokens.brand.primary,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: tokens.brand.primaryMuted,
      light: tokens.brand.primary50,
      dark: tokens.brand.primaryDark,
      contrastText: '#FFFFFF',
    },
    accent: {
      main: tokens.brand.accent,
      light: tokens.brand.accentLight,
      dark: tokens.brand.accentDark,
      contrastText: '#FFFFFF',
    },
    error: { main: '#E57373', light: alpha(tokens.semantic.error, 0.15), dark: '#D32F2F' },
    warning: { main: '#FFB74D', light: alpha(tokens.semantic.warning, 0.15), dark: '#F57C00' },
    success: { main: '#81C784', light: 'color-mix(in srgb, var(--semantic-success, #2D8A5E) 15%, transparent)', dark: '#388E3C' },
    info: { main: tokens.brand.primaryLight, light: 'color-mix(in srgb, var(--brand-primary, #5D1A89) 20%, transparent)', dark: tokens.brand.primaryDark, contrastText: '#FFFFFF' },
    background: {
      default: '#141218',
      paper: '#1E1B24',
    },
    surface: {
      sidebar: '#12101A',
      main: '#141218',
      card: '#1E1B24',
      border: '#352F42',
    },
    text: {
      primary: '#F5F3F8',
      secondary: tokens.text.sidebarMuted,
      disabled: '#6B6578',
    },
    divider: '#352F42',
  };
};

const sharedComponents: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: tokens.surface.main,
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    variants: [
      {
        props: { variant: 'contained', color: 'accent' },
        style: {
          backgroundColor: tokens.brand.accent,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: tokens.brand.accentDark,
          },
        },
      },
    ],
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: tokens.radius.pill,
        paddingLeft: 20,
        paddingRight: 20,
      },
      containedPrimary: {
        '&:hover': {
          backgroundColor: tokens.brand.primaryDark,
        },
      },
      outlined: {
        borderColor: tokens.surface.border,
        color: tokens.text.primary,
        '&:hover': {
          borderColor: tokens.brand.primary,
          backgroundColor: tokens.brand.primary50,
        },
      },
    },
  },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.surface.border}`,
        boxShadow: tokens.shadow.card,
        backgroundImage: 'none',
      },
    },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        borderRadius: tokens.radius.lg,
        backgroundImage: 'none',
      },
      outlined: {
        borderColor: tokens.surface.border,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        borderRadius: tokens.radius.pill,
      },
    },
  },
  MuiTextField: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: tokens.radius.md,
          backgroundColor: tokens.surface.input,
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundImage: 'none',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: tokens.radius.pill,
        height: 8,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: tokens.radius.md,
      },
    },
  },
};

export const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: buildPalette(mode),
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600 },
    },
    shape: {
      borderRadius: tokens.radius.md,
    },
    components: sharedComponents,
  });

export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');
