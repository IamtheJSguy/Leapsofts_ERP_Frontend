import { createTheme, alpha, type ThemeOptions } from '@mui/material/styles';
import { brandPalette, tokens } from './tokens';

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
  const paint = brandPalette[mode];

  if (mode === 'light') {
    return {
      mode: 'light',
      primary: {
        main: paint.primary,
        light: paint.primaryLight,
        dark: paint.primaryDark,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: paint.primaryMuted,
        light: paint.primary50,
        dark: paint.primaryDark,
        contrastText: '#FFFFFF',
      },
      accent: {
        main: paint.accent,
        light: paint.accentLight,
        dark: paint.accentDark,
        contrastText: '#FFFFFF',
      },
      error: { main: '#C44545', light: '#FCEEED' },
      warning: { main: '#B8860B', light: '#FBF5E6' },
      success: { main: '#2D8A5E', light: '#E8F5EE' },
      info: { main: paint.primary, light: paint.primary50, dark: paint.primaryDark, contrastText: '#FFFFFF' },
      background: {
        default: paint.surfaceMain,
        paper: paint.surfaceCard,
      },
      surface: {
        sidebar: paint.surfaceSidebar,
        main: paint.surfaceMain,
        card: paint.surfaceCard,
        border: paint.surfaceBorder,
      },
      text: {
        primary: paint.textPrimary,
        secondary: paint.textSecondary,
        disabled: paint.textMuted,
      },
      divider: paint.surfaceBorder,
    };
  }

  return {
    mode: 'dark',
    primary: {
      main: paint.primary,
      light: paint.primaryLight,
      dark: paint.primaryDark,
      contrastText: '#1A1625',
    },
    secondary: {
      main: paint.primaryMuted,
      light: paint.primary50,
      dark: paint.primaryDark,
      contrastText: '#1A1625',
    },
    accent: {
      main: paint.accent,
      light: paint.accentLight,
      dark: paint.accentDark,
      contrastText: '#FFFFFF',
    },
    error: { main: '#E57373', light: alpha('#C44545', 0.15), dark: '#D32F2F' },
    warning: { main: '#FFB74D', light: alpha('#B8860B', 0.15), dark: '#F57C00' },
    success: { main: '#81C784', light: 'rgba(45, 138, 94, 0.15)', dark: '#388E3C' },
    info: {
      main: paint.primary,
      light: paint.primary50,
      dark: paint.primaryDark,
      contrastText: '#1A1625',
    },
    background: {
      default: paint.surfaceMain,
      paper: paint.surfaceCard,
    },
    surface: {
      sidebar: paint.surfaceSidebar,
      main: paint.surfaceMain,
      card: paint.surfaceCard,
      border: paint.surfaceBorder,
    },
    text: {
      primary: paint.textPrimary,
      secondary: paint.textSecondary,
      disabled: paint.textMuted,
    },
    divider: paint.surfaceBorder,
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
        backgroundColor: tokens.brand.solid,
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: tokens.brand.solidHover,
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
  MuiLink: {
    styleOverrides: {
      root: {
        color: tokens.brand.primary,
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
