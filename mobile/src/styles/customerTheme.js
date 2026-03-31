// ============================================================
// Rice Mill Express — Customer Design System Tokens
// Figma-level premium theme for all customer screens
// ============================================================

export const COLORS = {
  // Brand Green
  greenPrimary: '#16A34A',
  greenDark: '#15803D',
  greenDeep: '#166534',
  greenLight: '#F0FDF4',
  greenMid: '#DCFCE7',

  // Orange Accent (discounts, CTAs)
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  orangeDark: '#EA580C',

  // Amber (ratings)
  amber: '#F59E0B',
  amberLight: '#FEFCE8',

  // Neutrals
  bgPage: '#F9FAFB',
  bgCard: '#FFFFFF',
  bgInput: '#F3F4F6',
  bgHover: '#F9FAFB',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#F3F4F6',
  borderStrong: '#E5E7EB',

  // Status
  red: '#EF4444',
  redLight: '#FEF2F2',
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
  indigo: '#4F46E5',
  indigoLight: '#EEF2FF',
  teal: '#0D9488',
  tealLight: '#F0FDFA',

  // Shadows
  shadowColor: '#000000',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 50,
  full: 999,
};

export const TYPOGRAPHY = {
  display: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  h3: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  h4: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  body: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  bodyStrong: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  caption: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  captionStrong: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
};

export const SHADOW = {
  sm: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  green: {
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Reusable component style presets
export const COMPONENTS = {
  // Base card
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },

  // Pill button (primary)
  pillBtnPrimary: {
    backgroundColor: COLORS.greenPrimary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOW.green,
  },

  // Outline pill button
  pillBtnOutline: {
    backgroundColor: 'transparent',
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: COLORS.greenPrimary,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm + 2,
  },

  // Status badges
  badgeGreen: {
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  badgeOrange: {
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  badgeRed: {
    backgroundColor: COLORS.redLight,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },

  // Section header
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },

  // Icon box (squircle)
  iconBox: (bg) => ({
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

export default {
  COLORS,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  SHADOW,
  COMPONENTS,
};
