/**
 * Motion Hooks - Sprint S21
 *
 * Custom React hooks for animations and motion effects.
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAnimation, useMotionValue, useSpring, type AnimationControls } from 'framer-motion';
import { springs } from './timing';

// ============================================
// ANIMATION CONTROL HOOKS
// ============================================

/**
 * Hook for controlling animation sequences
 */
export function useAnimationSequence() {
  const controls = useAnimation();

  const sequence = useCallback(
    async (animations: Array<{ variants: string; delay?: number }>) => {
      for (const { variants, delay } of animations) {
        if (delay) await new Promise((r) => setTimeout(r, delay * 1000));
        await controls.start(variants);
      }
    },
    [controls]
  );

  return { controls, sequence };
}

/**
 * Hook for staggered animations with manual trigger
 */
export function useStaggerAnimation(itemCount: number, staggerDelay = 0.08) {
  const controls = useAnimation();

  const animate = useCallback(async () => {
    await controls.start((i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * staggerDelay },
    }));
  }, [controls, staggerDelay]);

  const reset = useCallback(() => {
    controls.set({ opacity: 0, y: 20 });
  }, [controls]);

  return { controls, animate, reset };
}

// ============================================
// MOUSE TRACKING HOOKS
// ============================================

interface MousePosition {
  x: number;
  y: number;
}

/**
 * Track mouse position relative to viewport
 * SSR-safe: returns {x: 0, y: 0} on server
 */
export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return position;
}

/**
 * Track mouse position relative to an element
 */
export function useRelativeMousePosition() {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { ref, position, isHovered };
}

/**
 * Smooth spring-based mouse tracking
 * SSR-safe: returns static values on server
 */
export function useSmoothMouse(springConfig = springs.smooth) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return { x: smoothX, y: smoothY };
}

// ============================================
// TILT / 3D EFFECT HOOKS
// ============================================

interface TiltValues {
  rotateX: number;
  rotateY: number;
}

/**
 * 3D tilt effect on hover
 */
export function useTilt(maxTilt = 10) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltValues>({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const percentX = (e.clientX - centerX) / (rect.width / 2);
      const percentY = (e.clientY - centerY) / (rect.height / 2);

      setTilt({
        rotateX: -percentY * maxTilt,
        rotateY: percentX * maxTilt,
      });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      setTilt({ rotateX: 0, rotateY: 0 });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt]);

  return { ref, tilt, isHovered };
}

/**
 * Smooth spring-based 3D tilt
 */
export function useSmoothTilt(maxTilt = 15, springConfig = springs.smooth) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothRotateX = useSpring(rotateX, springConfig);
  const smoothRotateY = useSpring(rotateY, springConfig);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const percentX = (e.clientX - centerX) / (rect.width / 2);
      const percentY = (e.clientY - centerY) / (rect.height / 2);

      rotateX.set(-percentY * maxTilt);
      rotateY.set(percentX * maxTilt);
    };

    const handleMouseLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt, rotateX, rotateY]);

  return { ref, rotateX: smoothRotateX, rotateY: smoothRotateY };
}

// ============================================
// MAGNETIC EFFECT HOOKS
// ============================================

/**
 * Magnetic attraction effect for buttons/elements
 */
export function useMagneticEffect(strength = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const smoothX = useSpring(x, springs.snappy);
  const smoothY = useSpring(y, springs.snappy);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      x.set(distanceX * strength);
      y.set(distanceY * strength);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, x, y]);

  return { ref, x: smoothX, y: smoothY };
}

// ============================================
// REDUCED MOTION HOOK
// ============================================

/**
 * Detect user's reduced motion preference
 * SSR-safe: returns false on server
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // SSR guard - only access window in browser
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns appropriate animation props based on reduced motion preference
 */
export function useAccessibleAnimation<T extends object>(
  normalAnimation: T,
  reducedAnimation: T
): T {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedAnimation : normalAnimation;
}

// ============================================
// ORCHESTRATION HOOKS
// ============================================

interface OrchestrationState {
  isReady: boolean;
  hasAnimated: boolean;
}

/**
 * Orchestrate complex multi-element animations
 */
export function useAnimationOrchestration(
  elementCount: number,
  options: {
    staggerDelay?: number;
    initialDelay?: number;
    direction?: 'forward' | 'reverse' | 'center';
  } = {}
) {
  const { staggerDelay = 0.1, initialDelay = 0, direction = 'forward' } = options;
  const [state, setState] = useState<OrchestrationState>({
    isReady: false,
    hasAnimated: false,
  });

  const controls: AnimationControls[] = Array.from({ length: elementCount }, () =>
    useAnimation()
  );

  const play = useCallback(async () => {
    setState((prev) => ({ ...prev, isReady: true }));

    await new Promise((r) => setTimeout(r, initialDelay * 1000));

    let indices: number[];
    switch (direction) {
      case 'reverse':
        indices = Array.from({ length: elementCount }, (_, i) => elementCount - 1 - i);
        break;
      case 'center':
        const center = Math.floor(elementCount / 2);
        indices = Array.from({ length: elementCount }, (_, i) =>
          i % 2 === 0 ? center + Math.floor(i / 2) : center - Math.ceil(i / 2)
        ).filter((i) => i >= 0 && i < elementCount);
        break;
      default:
        indices = Array.from({ length: elementCount }, (_, i) => i);
    }

    for (const index of indices) {
      controls[index].start('visible');
      await new Promise((r) => setTimeout(r, staggerDelay * 1000));
    }

    setState({ isReady: true, hasAnimated: true });
  }, [controls, elementCount, staggerDelay, initialDelay, direction]);

  const reset = useCallback(() => {
    controls.forEach((control) => control.set('hidden'));
    setState({ isReady: false, hasAnimated: false });
  }, [controls]);

  return { controls, play, reset, ...state };
}

// ============================================
// GESTURE HOOKS
// ============================================

interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

/**
 * Detect swipe gestures
 */
export function useSwipeGesture(threshold = 50) {
  const ref = useRef<HTMLDivElement>(null);
  const [swipe, setSwipe] = useState<SwipeDirection>({ direction: null, distance: 0 });
  const startPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      startPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startPos.current) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startPos.current.x;
      const deltaY = endY - startPos.current.y;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          setSwipe({
            direction: deltaX > 0 ? 'right' : 'left',
            distance: absX,
          });
        } else {
          setSwipe({
            direction: deltaY > 0 ? 'down' : 'up',
            distance: absY,
          });
        }
      }

      startPos.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold]);

  const resetSwipe = useCallback(() => {
    setSwipe({ direction: null, distance: 0 });
  }, []);

  return { ref, swipe, resetSwipe };
}

// ============================================
// LOADING STATE HOOKS
// ============================================

/**
 * Hook for handling loading animations
 */
export function useLoadingAnimation(isLoading: boolean, minDuration = 500) {
  const [showLoader, setShowLoader] = useState(false);
  const loadingStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      loadingStartTime.current = Date.now();
      setShowLoader(true);
    } else if (loadingStartTime.current) {
      const elapsed = Date.now() - loadingStartTime.current;
      const remaining = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        setShowLoader(false);
        loadingStartTime.current = null;
      }, remaining);
    }
  }, [isLoading, minDuration]);

  return showLoader;
}

// ============================================
// COUNT ANIMATION HOOK
// ============================================

/**
 * Animate counting up/down to a number
 */
export function useCountAnimation(
  target: number,
  options: {
    duration?: number;
    delay?: number;
    decimals?: number;
  } = {}
) {
  const { duration = 1000, delay = 0, decimals = 0 } = options;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const startValue = count;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (target - startValue) * easeProgress;

        setCount(Number(currentValue.toFixed(decimals)));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [target, duration, delay, decimals]);

  return count;
}
