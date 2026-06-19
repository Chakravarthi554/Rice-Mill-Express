// src/theme/index.js
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import designTokens from './designTokens';

const theme = createTheme({
  palette: {
    primary: designTokens.colors.primary,
    secondary: designTokens.colors.secondary,
    error: { main: designTokens.colors.error },
    warning: { main: designTokens.colors.warning },
    info: { main: designTokens.colors.info },
    success: { main: designTokens.colors.success },
    background: {
      default: designTokens.colors.surface.default,
      paper: designTokens.colors.surface.paper,
    },
    text: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[500],
    },
  },
  spacing: designTokens.spacing.unit,
  shape: { borderRadius: designTokens.radius.md },
  typography: designTokens.typography,
  shadows: designTokens.shadows,
});

export { theme, ThemeProvider, CssBaseline };
