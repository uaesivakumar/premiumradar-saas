/**
 * Animated Section Component - Sprint S21
 *
 * Wrapper component for scroll-triggered section animations.
 * Automatically animates content when it enters the viewport.
 */

'use client';

import { type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { rise, scaleIn, staggerContainer, staggerItem } from '@/lib/motion/presets';

type AnimationType = 'fade' | 'rise' | 'scale' | 'slideLeft' | 'slideRight' | 'none';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  once?: boolean;
  margin?: string;
  stagger?: boolean;
}

const animationVariants: Record<AnimationType, Variants | null> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  rise: rise,
  scale: scaleIn,
  slideLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  none: null,
};

export function AnimatedSection({
  children,
  className = '',
  animation = 'rise',
  delay = 0,
  duration = 0.6,
  once = true,
  margin = '-10%',
  stagger = false,
}: AnimatedSectionProps) {
  const variants = animationVariants[animation];

  if (!variants) {
    return <motion.section className={className}>{children}</motion.section>;
  }

  const containerVariants = stagger ? staggerContainer : variants;

  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={containerVariants}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.section>
  );
}

/**
 * Animated Item for use within staggered containers
 */
interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'span';
}

export function AnimatedItem({
  children,
  className = '',
  as = 'div',
}: AnimatedItemProps) {
  const Component = motion[as];

  return (
    <Component className={className} variants={staggerItem}>
      {children}
    </Component>
  );
}

/**
 * Pre-configured animated sections
 */
export function FadeInSection({
  children,
  className = '',
  ...props
}: Omit<AnimatedSectionProps, 'animation'>) {
  return (
    <AnimatedSection animation="fade" className={className} {...props}>
      {children}
    </AnimatedSection>
  );
}

export function RiseSection({
  children,
  className = '',
  ...props
}: Omit<AnimatedSectionProps, 'animation'>) {
  return (
    <AnimatedSection animation="rise" className={className} {...props}>
      {children}
    </AnimatedSection>
  );
}

export function ScaleSection({
  children,
  className = '',
  ...props
}: Omit<AnimatedSectionProps, 'animation'>) {
  return (
    <AnimatedSection animation="scale" className={className} {...props}>
      {children}
    </AnimatedSection>
  );
}

export default AnimatedSection;
