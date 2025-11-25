/**
 * Route Transition System - Sprint S21
 *
 * Page transition animations for Next.js App Router.
 */

import { type Variants } from 'framer-motion';
import { springs, durations, easings } from './timing';

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================

/**
 * Default fade transition
 */
export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.medium, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

/**
 * Slide up transition
 */
export const pageTransitionSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.medium, ease: easings.apple },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

/**
 * Slide from right transition (for forward navigation)
 */
export const pageTransitionSlideRight: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: { duration: durations.fast },
  },
};

/**
 * Slide from left transition (for back navigation)
 */
export const pageTransitionSlideLeft: Variants = {
  initial: { opacity: 0, x: -50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: { duration: durations.fast },
  },
};

/**
 * Scale transition
 */
export const pageTransitionScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    transition: { duration: durations.fast },
  },
};

/**
 * Premium cinematic transition
 */
export const pageTransitionCinematic: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: durations.slow,
      ease: easings.apple,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: 'blur(5px)',
    transition: { duration: durations.medium },
  },
};

// ============================================
// DRAWER TRANSITIONS
// ============================================

/**
 * Drawer slide from right
 */
export const drawerTransitionRight: Variants = {
  initial: { x: '100%' },
  animate: {
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    x: '100%',
    transition: { duration: durations.medium, ease: easings.easeIn },
  },
};

/**
 * Drawer slide from left
 */
export const drawerTransitionLeft: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    x: '-100%',
    transition: { duration: durations.medium, ease: easings.easeIn },
  },
};

/**
 * Drawer slide from bottom (bottom sheet)
 */
export const drawerTransitionBottom: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    y: '100%',
    transition: { duration: durations.medium, ease: easings.easeIn },
  },
};

// ============================================
// MODAL TRANSITIONS
// ============================================

/**
 * Modal overlay backdrop
 */
export const modalOverlayTransition: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast, delay: 0.1 },
  },
};

/**
 * Modal content - scale in
 */
export const modalContentTransition: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
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

/**
 * Modal content - slide up
 */
export const modalSlideUpTransition: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: 30,
    transition: { duration: durations.fast },
  },
};

// ============================================
// SIDEBAR TRANSITIONS
// ============================================

/**
 * Sidebar collapse/expand
 */
export const sidebarTransition = {
  collapsed: {
    width: 80,
    transition: springs.smooth,
  },
  expanded: {
    width: 256,
    transition: springs.smooth,
  },
};

/**
 * Sidebar item text reveal
 */
export const sidebarItemTextTransition: Variants = {
  hidden: { opacity: 0, width: 0 },
  visible: {
    opacity: 1,
    width: 'auto',
    transition: { duration: durations.fast, ease: easings.easeOut },
  },
};

// ============================================
// CARD TRANSITIONS
// ============================================

/**
 * Card loading animation
 */
export const cardLoadingTransition: Variants = {
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

/**
 * Card stagger container
 */
export const cardStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ============================================
// NOTIFICATION TRANSITIONS
// ============================================

/**
 * Toast notification slide in
 */
export const toastTransition: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
};

/**
 * Dropdown menu transition
 */
export const dropdownTransition: Variants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: durations.fast, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: -5,
    scale: 0.98,
    transition: { duration: durations.instant },
  },
};

// ============================================
// HERO SECTION TRANSITIONS
// ============================================

/**
 * Hero title reveal
 */
export const heroTitleTransition: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow,
      ease: easings.apple,
    },
  },
};

/**
 * Hero subtitle reveal (delayed)
 */
export const heroSubtitleTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.medium,
      ease: easings.apple,
      delay: 0.1,
    },
  },
};

/**
 * Hero CTA reveal (delayed more)
 */
export const heroCtaTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.medium,
      ease: easings.apple,
      delay: 0.2,
    },
  },
};

/**
 * Hero orb reveal (special animation)
 */
export const heroOrbTransition: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.dramatic,
      ease: easings.apple,
      delay: 0.3,
    },
  },
};

// ============================================
// LANDING SECTION STAGGER
// ============================================

/**
 * Stagger container for landing sections
 */
export const landingSectionStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Individual section item
 */
export const landingSectionItem: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.medium,
      ease: easings.apple,
    },
  },
};

// ============================================
// FLOATING CTA ANIMATIONS
// ============================================

/**
 * Floating button pulse
 */
export const floatingCtaPulse: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Floating button glow
 */
export const floatingCtaGlow: Variants = {
  initial: { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' },
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(59, 130, 246, 0.4)',
      '0 0 0 15px rgba(59, 130, 246, 0)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
};
