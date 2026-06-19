// =============================================================================
// Rice Mill Express — Design Tokens (Slice 1: Design System Foundation)
// -----------------------------------------------------------------------------
// Centralized, additive design tokens for the customer experience.
// These tokens DO NOT replace the existing MUI theme in App.js. They are a
// single source of truth that future redesign slices (and the new ui/*
// components) compose from. Importing this file has no runtime side effects.
//
// Design quality target: Amazon Fresh / Blinkit / Zepto / BigBasket / Swiggy.
// =============================================================================

// ---------------------------------------------------------------------------
// COLOR TOKENS
// ---------------------------------------------------------------------------
export const colors = {
  // Primary — deep agricultural green
  primary: {
    main: '#2E7D32',
    light: '#4CAF50',
    lighter: '#66BB6A',
    lightest: '#81C784',
    dark: '#1B5E20',
    contrast: '#FFFFFF',
  },
  secondary: {
    main: '#16A34A', // teal accent (green)
    dark: '#15803D', // darker teal for hover
    contrastText: '#FFFFFF',
  },
  // Commerce accent — amber
  accent: {
    main: '#FFB300',
    dark: '#FF8F00',
    alt: '#F59E0B',
    contrast: '#1F2937',
  },
  // Neutrals
  neutral: {
    white: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    500: '#6B7280',
    700: '#374151',
    900: '#1F2937',
  },
  // Semantic
  success: '#16A34A',
  error: '#DC2626',
  info: '#2563EB',
  warning: '#F59E0B',
  // Surfaces
  surface: {
    default: '#F9FAFB',
    paper: '#FFFFFF',
  },
};

// Soft background tints used by category chips / badges
export const tints = {
  green: '#F0FDF4',
  amber: '#FFFBEB',
  blue: '#EFF6FF',
  purple: '#F5F3FF',
  orange: '#FFF7ED',
  red: '#FEF2F2',
  yellow: '#FEFCE8',
};

// ---------------------------------------------------------------------------
// TYPOGRAPHY SCALE
// ---------------------------------------------------------------------------
export const typography = {
  fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif',
  weights: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  // Display + heading + body scale (rem)
  scale: {
    display: { fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em' },
    h1: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em' },
    h2: { fontSize: '1.625rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 },
    h4: { fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35 },
    subtitle: { fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 },
    body: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.65 },
    bodySm: { fontSize: '0.9rem', fontWeight: 400, lineHeight: 1.6 },
    caption: { fontSize: '0.78rem', fontWeight: 500, lineHeight: 1.5 },
    overline: { fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.4, letterSpacing: '0.08em', textTransform: 'uppercase' },
  },
};

// ---------------------------------------------------------------------------
// SPACING SYSTEM (8pt grid, matches MUI spacing: 8)
// ---------------------------------------------------------------------------
export const spacing = {
  unit: 8,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64,
};

// ---------------------------------------------------------------------------
// BORDER RADIUS SYSTEM
// ---------------------------------------------------------------------------
export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
  circle: '50%',
};

// ---------------------------------------------------------------------------
// ELEVATION / SHADOW SYSTEM
// ---------------------------------------------------------------------------
export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
  sm: '0 2px 8px rgba(15, 23, 42, 0.06)',
  md: '0 8px 20px rgba(15, 23, 42, 0.07)',
  lg: '0 18px 40px rgba(15, 23, 42, 0.08)',
  xl: '0 28px 60px rgba(15, 23, 42, 0.12)',
  // Brand glow for primary CTAs / active states
  greenGlow: '0 8px 22px rgba(46, 125, 50, 0.28)',
  amberGlow: '0 8px 22px rgba(255, 143, 0, 0.28)',
};

// ---------------------------------------------------------------------------
// RESPONSIVE BREAKPOINTS (aligned to MUI defaults)
// ---------------------------------------------------------------------------
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

export const mediaUp = (key) => `@media (min-width:${breakpoints[key]}px)`;

// ---------------------------------------------------------------------------
// Z-INDEX SCALE
// ---------------------------------------------------------------------------
export const zIndex = {
  base: 0,
  card: 1,
  sticky: 1100,
  appBar: 1200,
  drawer: 1300,
  modal: 1400,
  toast: 1500,
};

const designTokens = {
  colors,
  tints,
  typography,
  spacing,
  radius,
  shadows,
  breakpoints,
  mediaUp,
  zIndex,
};

export default designTokens;
