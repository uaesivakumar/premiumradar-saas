/**
 * Timing Curves Library - Sprint S21
 *
 * Professional timing functions for premium animations.
 * Based on industry-standard easing curves.
 */

import { type Transition } from 'framer-motion';

// ============================================
// SPRING PHYSICS PRESETS
// ============================================

export const springs = {
  /** Snappy interaction response */
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as const,

  /** Smooth, fluid motion */
  smooth: { type: 'spring', stiffness: 200, damping: 25 } as const,

  /** Gentle, elegant movement */
  gentle: { type: 'spring', stiffness: 120, damping: 20 } as const,

  /** Bouncy, playful animation */
  bouncy: { type: 'spring', stiffness: 300, damping: 15 } as const,

  /** Heavy, weighty feel */
  heavy: { type: 'spring', stiffness: 150, damping: 35 } as const,

  /** Ultra-responsive for micro-interactions */
  instant: { type: 'spring', stiffness: 500, damping: 40 } as const,

  /** Slow reveal for dramatic effect */
  slow: { type: 'spring', stiffness: 80, damping: 20 } as const,
} as const;

// ============================================
// CUBIC BEZIER EASING
// ============================================

export const easings = {
  /** Standard easing for most animations */
  default: [0.4, 0, 0.2, 1] as const,

  /** Accelerating from zero velocity */
  easeIn: [0.4, 0, 1, 1] as const,

  /** Decelerating to zero velocity */
  easeOut: [0, 0, 0.2, 1] as const,

  /** Smooth acceleration and deceleration */
  easeInOut: [0.4, 0, 0.2, 1] as const,

  /** Sharp start, smooth end */
  sharp: [0.4, 0, 0.6, 1] as const,

  /** Linear motion (constant speed) */
  linear: [0, 0, 1, 1] as const,

  /** Apple-style smooth curve */
  apple: [0.25, 0.1, 0.25, 1] as const,

  /** Material Design standard */
  material: [0.4, 0, 0.2, 1] as const,

  /** Anticipation before motion */
  anticipate: [0.36, 0, 0.66, -0.56] as const,

  /** Overshoot and settle */
  overshoot: [0.34, 1.56, 0.64, 1] as const,

  /** Elastic bounce effect */
  elastic: [0.68, -0.55, 0.265, 1.55] as const,
} as const;

// ============================================
// DURATION SCALE
// ============================================

export const durations = {
  /** Instant feedback (50ms) */
  instant: 0.05,

  /** Quick micro-interactions (100ms) */
  quick: 0.1,

  /** Fast transitions (150ms) */
  fast: 0.15,

  /** Normal pace (200ms) */
  normal: 0.2,

  /** Medium transitions (300ms) */
  medium: 0.3,

  /** Slow, deliberate motion (400ms) */
  slow: 0.4,

  /** Dramatic reveal (500ms) */
  dramatic: 0.5,

  /** Page transitions (600ms) */
  page: 0.6,

  /** Long animations (800ms) */
  long: 0.8,

  /** Very slow for emphasis (1000ms) */
  emphasis: 1.0,
} as const;

// ============================================
// DELAY SCALE
// ============================================

export const delays = {
  none: 0,
  micro: 0.05,
  short: 0.1,
  normal: 0.2,
  medium: 0.3,
  long: 0.5,
  stagger: 0.08,
} as const;

// ============================================
// COMPOSITE TRANSITIONS
// ============================================

export const transitions = {
  /** Default smooth transition */
  default: {
    duration: durations.normal,
    ease: easings.default,
  } as Transition,

  /** Fast, snappy feedback */
  fast: {
    duration: durations.fast,
    ease: easings.easeOut,
  } as Transition,

  /** Smooth spring animation */
  spring: springs.smooth as Transition,

  /** Bouncy interaction */
  bouncy: springs.bouncy as Transition,

  /** Page transition */
  page: {
    duration: durations.page,
    ease: easings.apple,
  } as Transition,

  /** Modal overlay */
  modal: {
    duration: durations.medium,
    ease: easings.easeOut,
  } as Transition,

  /** Hover state */
  hover: {
    duration: durations.quick,
    ease: easings.easeOut,
  } as Transition,

  /** Press/tap state */
  tap: {
    duration: durations.instant,
    ease: easings.easeOut,
  } as Transition,

  /** Staggered children */
  stagger: {
    staggerChildren: delays.stagger,
    delayChildren: delays.short,
  } as Transition,
} as const;

// ============================================
// STAGGER CONFIGURATIONS
// ============================================

export const staggerConfigs = {
  /** Fast stagger for lists */
  fast: {
    staggerChildren: 0.05,
    delayChildren: 0,
  },

  /** Normal stagger pace */
  normal: {
    staggerChildren: 0.08,
    delayChildren: 0.1,
  },

  /** Slow, dramatic stagger */
  slow: {
    staggerChildren: 0.12,
    delayChildren: 0.2,
  },

  /** Reverse stagger direction */
  reverse: {
    staggerChildren: 0.08,
    staggerDirection: -1,
  },
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a staggered delay for child index
 */
export function staggerDelay(index: number, base = 0.08): number {
  return index * base;
}

/**
 * Creates custom spring physics
 */
export function customSpring(
  stiffness: number,
  damping: number,
  mass = 1
): Transition {
  return {
    type: 'spring',
    stiffness,
    damping,
    mass,
  };
}

/**
 * Creates custom bezier easing
 */
export function customEasing(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  duration = durations.normal
): Transition {
  return {
    duration,
    ease: [x1, y1, x2, y2],
  };
}
