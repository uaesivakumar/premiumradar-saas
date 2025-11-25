/**
 * Scroll-Triggered Animation Engine - Sprint S21
 *
 * Utilities for scroll-based animations using Framer Motion.
 */

import { useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

// ============================================
// SCROLL PROGRESS HOOKS
// ============================================

/**
 * Track scroll progress of the viewport
 */
export function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  return scrollYProgress;
}

/**
 * Track scroll progress within a container element
 */
export function useContainerScrollProgress(
  offset: ['start end' | 'center center' | 'end start', 'start end' | 'center center' | 'end start'] = ['start end', 'end start']
) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });
  return { ref, progress: scrollYProgress };
}

/**
 * Track scroll progress of an element relative to viewport
 */
export function useElementScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  return { ref, progress: scrollYProgress };
}

// ============================================
// SCROLL-LINKED TRANSFORMS
// ============================================

/**
 * Create a parallax effect with configurable speed
 */
export function useParallax(
  scrollProgress: MotionValue<number>,
  speed = 0.5,
  direction: 'up' | 'down' = 'up'
) {
  const multiplier = direction === 'up' ? -1 : 1;
  return useTransform(scrollProgress, [0, 1], [0, 300 * speed * multiplier]);
}

/**
 * Create a fade effect based on scroll
 */
export function useScrollFade(
  scrollProgress: MotionValue<number>,
  fadeIn = true
) {
  return useTransform(
    scrollProgress,
    fadeIn ? [0, 0.3, 0.7, 1] : [0, 0.3, 0.7, 1],
    fadeIn ? [0, 1, 1, 0] : [1, 1, 0, 0]
  );
}

/**
 * Create a scale effect based on scroll
 */
export function useScrollScale(
  scrollProgress: MotionValue<number>,
  scaleRange: [number, number] = [0.8, 1]
) {
  return useTransform(scrollProgress, [0, 0.5], scaleRange);
}

/**
 * Create a rotation effect based on scroll
 */
export function useScrollRotate(
  scrollProgress: MotionValue<number>,
  degrees = 360
) {
  return useTransform(scrollProgress, [0, 1], [0, degrees]);
}

/**
 * Create smooth spring-based scroll transforms
 */
export function useSmoothScrollTransform(
  scrollProgress: MotionValue<number>,
  inputRange: number[],
  outputRange: number[]
) {
  const transform = useTransform(scrollProgress, inputRange, outputRange);
  return useSpring(transform, { stiffness: 100, damping: 30 });
}

// ============================================
// VIEWPORT DETECTION
// ============================================

interface ViewportOptions {
  threshold?: number;
  once?: boolean;
  rootMargin?: string;
}

/**
 * Detect when element enters/exits viewport
 */
export function useInView(options: ViewportOptions = {}) {
  const { threshold = 0.1, once = true, rootMargin = '0px' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return { ref, isInView };
}

/**
 * Advanced viewport detection with progress
 * SSR-safe: returns default values on server
 */
export function useViewportProgress(rootMargin = '-10% 0px') {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate how far through the viewport the element is
      const elementTop = rect.top;
      const elementHeight = rect.height;

      // Progress from 0 (just entering) to 1 (just leaving)
      const rawProgress = (windowHeight - elementTop) / (windowHeight + elementHeight);
      const clampedProgress = Math.max(0, Math.min(1, rawProgress));

      setProgress(clampedProgress);
      setIsInView(clampedProgress > 0 && clampedProgress < 1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [rootMargin]);

  return { ref, progress, isInView };
}

// ============================================
// SCROLL DIRECTION
// ============================================

/**
 * Detect scroll direction
 * SSR-safe: returns null on server
 */
export function useScrollDirection() {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > prevScrollY) {
        setDirection('down');
      } else if (currentScrollY < prevScrollY) {
        setDirection('up');
      }

      setPrevScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY]);

  return direction;
}

/**
 * Hide element on scroll down, show on scroll up
 * SSR-safe: returns false on server
 */
export function useHideOnScroll(threshold = 50) {
  const [hidden, setHidden] = useState(false);
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - prevScrollY;

      if (diff > threshold) {
        setHidden(true);
      } else if (diff < -threshold) {
        setHidden(false);
      }

      setPrevScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY, threshold]);

  return hidden;
}

// ============================================
// SCROLL POSITION UTILITIES
// ============================================

/**
 * Get current scroll position as percentage
 * SSR-safe: returns 0 on server
 */
export function useScrollPercentage() {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollableHeight = documentHeight - windowHeight;
      const percent = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
      setPercentage(Math.round(percent));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return percentage;
}

/**
 * Scroll to top smoothly
 */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Scroll to element smoothly
 */
export function scrollToElement(elementId: string, offset = 0) {
  const element = document.getElementById(elementId);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// ============================================
// SCROLL ANIMATION CONFIGS
// ============================================

export const scrollAnimationConfigs = {
  /** Fade in when entering viewport */
  fadeOnScroll: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, margin: '-10%' },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },

  /** Rise up when entering viewport */
  riseOnScroll: {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-10%' },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },

  /** Scale up when entering viewport */
  scaleOnScroll: {
    initial: { opacity: 0, scale: 0.9 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: '-10%' },
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },

  /** Slide from left when entering viewport */
  slideLeftOnScroll: {
    initial: { opacity: 0, x: -50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: '-10%' },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },

  /** Slide from right when entering viewport */
  slideRightOnScroll: {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: '-10%' },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};
