/**
 * Dynamic Vertical Landing Engine - Sprint S23
 *
 * Full-page vertical scrolling sections with premium animations.
 * Each section reveals progressively as user scrolls.
 */

'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useInView, useViewportProgress, useScrollDirection } from '@/lib/motion/scroll';
import { springs, easings, durations } from '@/lib/motion/timing';
import { rise, fadeIn, scaleIn } from '@/lib/motion/presets';

// ============================================
// SECTION WRAPPER
// ============================================

interface VerticalSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  background?: 'light' | 'dark' | 'gradient' | 'transparent';
  parallaxStrength?: number;
  animationType?: 'fade' | 'rise' | 'scale' | 'none';
}

const backgroundStyles = {
  light: 'bg-white',
  dark: 'bg-gray-900 text-white',
  gradient: 'bg-gradient-to-b from-gray-50 to-white',
  transparent: 'bg-transparent',
};

export function VerticalSection({
  children,
  id,
  className = '',
  background = 'light',
  parallaxStrength = 0,
  animationType = 'rise',
}: VerticalSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { ref: inViewRef, isInView } = useInView({ threshold: 0.2, once: true });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100 * parallaxStrength]);
  const springY = useSpring(y, springs.smooth);

  const animationVariants = {
    fade: fadeIn,
    rise: rise,
    scale: scaleIn,
    none: {},
  };

  return (
    <motion.section
      ref={sectionRef}
      id={id}
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${backgroundStyles[background]} ${className}`}
      style={{ y: parallaxStrength ? springY : 0 }}
    >
      <motion.div
        ref={inViewRef}
        className="w-full"
        variants={animationType !== 'none' ? animationVariants[animationType] : undefined}
        initial={animationType !== 'none' ? 'hidden' : undefined}
        animate={isInView ? 'visible' : 'hidden'}
      >
        {children}
      </motion.div>
    </motion.section>
  );
}

// ============================================
// SCROLL INDICATOR
// ============================================

interface ScrollIndicatorProps {
  className?: string;
}

export function ScrollIndicator({ className = '' }: ScrollIndicatorProps) {
  const scrollDirection = useScrollDirection();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-sm text-gray-500 font-medium">Scroll</span>
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-gray-300 flex justify-center pt-2"
              animate={{ borderColor: ['#d1d5db', '#9ca3af', '#d1d5db'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-1.5 h-3 bg-gray-400 rounded-full"
                animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

interface ScrollProgressBarProps {
  className?: string;
  color?: string;
}

export function ScrollProgressBar({
  className = '',
  color = '#3B82F6',
}: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, springs.smooth);

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 h-1 origin-left z-50 ${className}`}
      style={{ scaleX, backgroundColor: color }}
    />
  );
}

// ============================================
// SECTION NAV DOTS
// ============================================

interface NavDotsProps {
  sections: string[];
  activeSection: number;
  onNavigate: (index: number) => void;
  className?: string;
}

export function NavDots({
  sections,
  activeSection,
  onNavigate,
  className = '',
}: NavDotsProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-50 ${className}`}
    >
      <div className="flex flex-col gap-3">
        {sections.map((section, index) => (
          <motion.button
            key={section}
            onClick={() => onNavigate(index)}
            className="group relative flex items-center justify-end"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Label */}
            <motion.span
              className="absolute right-6 text-sm font-medium text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ x: 10 }}
              whileHover={{ x: 0 }}
            >
              {section}
            </motion.span>

            {/* Dot */}
            <motion.div
              className={`w-3 h-3 rounded-full transition-colors ${
                activeSection === index ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              animate={{
                scale: activeSection === index ? 1.3 : 1,
              }}
              transition={springs.snappy}
            />
          </motion.button>
        ))}
      </div>
    </motion.nav>
  );
}

// ============================================
// STICKY TEXT REVEAL
// ============================================

interface StickyTextRevealProps {
  text: string;
  className?: string;
}

export function StickyTextReveal({ text, className = '' }: StickyTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const words = text.split(' ');

  return (
    <div ref={containerRef} className={`relative h-[300vh] ${className}`}>
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <p className="text-4xl md:text-6xl lg:text-7xl font-bold text-center max-w-5xl px-8 leading-tight">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = (i + 1) / words.length;

            return (
              <Word key={i} progress={scrollYProgress} start={start} end={end}>
                {word}
              </Word>
            );
          })}
        </p>
      </div>
    </div>
  );
}

interface WordProps {
  children: string;
  progress: any;
  start: number;
  end: number;
}

function Word({ children, progress, start, end }: WordProps) {
  const opacity = useTransform(progress, [start, end], [0.2, 1]);

  return (
    <motion.span style={{ opacity }} className="inline-block mr-3">
      {children}
    </motion.span>
  );
}

// ============================================
// PARALLAX IMAGE
// ============================================

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
}

export function ParallaxImage({
  src,
  alt,
  className = '',
  speed = 0.5,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 30}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ y }}
      />
    </div>
  );
}

// ============================================
// HORIZONTAL SCROLL SECTION
// ============================================

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);

  return (
    <div ref={containerRef} className={`relative h-[300vh] ${className}`}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div className="flex gap-8 px-8" style={{ x }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================
// COUNTER ANIMATION
// ============================================

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
  className = '',
}: AnimatedCounterProps) {
  const { ref, isInView } = useInView({ once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
    >
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </motion.span>
  );
}

// ============================================
// MAIN LANDING CONTAINER
// ============================================

interface VerticalLandingProps {
  children: ReactNode;
  className?: string;
  showProgress?: boolean;
  showNav?: boolean;
  showScrollIndicator?: boolean;
  sections?: string[];
}

export function VerticalLanding({
  children,
  className = '',
  showProgress = true,
  showNav = true,
  showScrollIndicator = true,
  sections = [],
}: VerticalLandingProps) {
  const [activeSection, setActiveSection] = useState(0);

  const handleNavigate = (index: number) => {
    const section = document.getElementById(`section-${index}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      sections.forEach((_, index) => {
        const section = document.getElementById(`section-${index}`);
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <div className={`relative ${className}`}>
      {showProgress && <ScrollProgressBar />}
      {showScrollIndicator && <ScrollIndicator />}
      {showNav && sections.length > 0 && (
        <NavDots
          sections={sections}
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />
      )}
      {children}
    </div>
  );
}

export default VerticalLanding;
