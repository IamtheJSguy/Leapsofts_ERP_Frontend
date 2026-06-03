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
        main: tokens.brand.primary,
        light: tokens.brand.primaryLight,
        dark: tokens.brand.primaryDark,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: tokens.brand.primaryMuted,
        light: tokens.brand.primary100,
        dark: tokens.brand.primaryDark,
        contrastText: '#FFFFFF',
      },
      accent: {
        main: tokens.brand.accent,
        light: tokens.brand.accentLight,
        dark: tokens.brand.accentDark,
        contrastText: '#FFFFFF',
      },
      error: { main: tokens.semantic.error, light: tokens.semantic.errorBg },
      warning: { main: tokens.semantic.warning, light: tokens.semantic.warningBg },
      success: { main: tokens.semantic.success, light: tokens.semantic.successBg },
      info: { main: tokens.semantic.info, light: tokens.semantic.infoBg },
      background: {
        default: tokens.surface.main,
        paper: tokens.surface.card,
      },
      surface: {
        sidebar: tokens.surface.sidebar,
        main: tokens.surface.main,
        card: tokens.surface.card,
        border: tokens.surface.border,
      },
      text: {
        primary: tokens.text.primary,
        secondary: tokens.text.secondary,
        disabled: tokens.text.muted,
      },
      divider: tokens.surface.border,
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
      contrastText: '#FFFFFF',
    },
    accent: {
      main: tokens.brand.accent,
      light: tokens.brand.accentLight,
      dark: tokens.brand.accentDark,
      contrastText: '#FFFFFF',
    },
    error: { main: '#E57373', light: alpha(tokens.semantic.error, 0.15) },
    warning: { main: '#FFB74D', light: alpha(tokens.semantic.warning, 0.15) },
    success: { main: '#81C784', light: alpha(tokens.semantic.success, 0.15) },
    info: { main: tokens.brand.primaryLight, light: alpha(tokens.brand.primary, 0.2) },
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
