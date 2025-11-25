/**
 * Motion Presets - Sprint S21
 *
 * Reusable animation variants for common UI patterns.
 * Import these into components for consistent animations.
 */

import { type Variants } from 'framer-motion';
import { springs, durations, easings, delays } from './timing';

// ============================================
// FADE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.medium, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.medium, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.medium, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.medium, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

// ============================================
// SCALE ANIMATIONS
// ============================================

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: durations.fast },
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: { duration: durations.fast },
  },
};

// ============================================
// SLIDE ANIMATIONS
// ============================================

export const slideInFromBottom: Variants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    y: '100%',
    transition: { duration: durations.medium, ease: easings.easeIn },
  },
};

export const slideInFromTop: Variants = {
  hidden: { y: '-100%' },
  visible: {
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    y: '-100%',
    transition: { duration: durations.medium, ease: easings.easeIn },
  },
};

export const slideInFromLeft: Variants = {
  hidden: { x: '-100%' },
  visible: {
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    x: '-100%',
    transition: { duration: durations.medium, ease: easings.easeIn },
  },
};

export const slideInFromRight: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    x: '100%',
    transition: { duration: durations.medium, ease: easings.easeIn },
  },
};

// ============================================
// RISE ANIMATIONS (Subtle vertical motion)
// ============================================

export const rise: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.medium,
      ease: easings.apple,
    },
  },
};

export const riseSpring: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
};

export const riseDramatic: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.apple,
    },
  },
};

// ============================================
// STAGGER CONTAINERS
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: delays.stagger,
      delayChildren: delays.short,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: delays.normal,
    },
  },
};

// ============================================
// STAGGER CHILDREN
// ============================================

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.medium,
      ease: easings.easeOut,
    },
  },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.smooth,
  },
};

export const staggerItemSlide: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
};

// ============================================
// HOVER & TAP STATES
// ============================================

export const hoverScale = {
  scale: 1.02,
  transition: springs.snappy,
};

export const hoverLift = {
  y: -2,
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  transition: springs.snappy,
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: durations.instant },
};

export const tapPress = {
  scale: 0.95,
  transition: { duration: durations.instant },
};

// ============================================
// MODAL & OVERLAY
// ============================================

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast, delay: delays.micro },
  },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: durations.fast },
  },
};

export const drawerSlide: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    },
  },
  exit: {
    x: '100%',
    transition: { duration: durations.medium, ease: easings.easeIn },
  },
};

// ============================================
// CARD ANIMATIONS
// ============================================

export const cardHover: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
  },
};

export const cardReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.smooth,
  },
};

// ============================================
// BUTTON ANIMATIONS
// ============================================

export const buttonMorph = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: { duration: durations.instant },
  },
};

export const buttonGlow = {
  rest: { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
  hover: {
    boxShadow: '0 0 20px 2px rgba(59, 130, 246, 0.3)',
    transition: { duration: durations.normal },
  },
};

// ============================================
// LOADING ANIMATIONS
// ============================================

export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulse: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spin: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
