// =============================================================================
// Rice Mill Express — Framer Motion Animation Presets (Slice 1)
// -----------------------------------------------------------------------------
// Reusable, performance-conscious motion variants. Prefer transform/opacity
// (GPU-friendly) and short, spring-based transitions. Import where needed:
//   import { fadeInUp, staggerContainer, cardHover } from '../../theme/animations';
// =============================================================================

// Standard easing curves
export const easing = {
  standard: [0.4, 0, 0.2, 1],
  emphasized: [0.2, 0, 0, 1],
  spring: { type: 'spring', stiffness: 320, damping: 28 },
};

// Fade in + rise (cards, sections)
export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easing.standard },
  },
};

// Simple fade
export const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: easing.standard } },
};

// Scale-in (modals, badges, quick views)
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: easing.spring },
};

// Stagger container — animate children sequentially
export const staggerContainer = (stagger = 0.06, delayChildren = 0.05) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger, delayChildren },
  },
});

// Child item to use inside a staggerContainer
export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easing.standard } },
};

// Hover lift for cards — apply via whileHover
export const cardHover = {
  rest: { y: 0, transition: easing.spring },
  hover: { y: -6, transition: easing.spring },
};

// Tap feedback for interactive elements
export const tap = { scale: 0.97 };

// Shimmer keyframes (used by LoadingSkeleton; CSS handled in component)
export const skeletonPulse = {
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
};

const animations = {
  easing,
  fade,
  fadeInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  cardHover,
  tap,
  skeletonPulse,
};

export default animations;
