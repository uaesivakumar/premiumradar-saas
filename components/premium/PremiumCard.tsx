/**
 * Premium Card Component - Sprint S25
 *
 * Elevated card component with premium visual treatments.
 * Includes hover effects, gradients, and premium animations.
 */

'use client';

import { forwardRef, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { springs } from '@/lib/motion/timing';
import { useTilt, useReducedMotion } from '@/lib/motion/hooks';

// ============================================
// TYPES
// ============================================

type CardVariant = 'default' | 'elevated' | 'gradient' | 'glass' | 'outline';
type CardSize = 'sm' | 'md' | 'lg';

interface PremiumCardProps {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  hover?: 'lift' | 'glow' | 'scale' | 'tilt' | 'none';
  onClick?: () => void;
  isInteractive?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

// ============================================
// STYLES
// ============================================

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 shadow-sm',
  elevated: 'bg-white shadow-lg shadow-gray-200/50',
  gradient: 'bg-gradient-to-br text-white border-0',
  glass: 'bg-white/80 backdrop-blur-lg border border-white/20 shadow-lg',
  outline: 'bg-transparent border-2 border-gray-200',
};

const sizeStyles: Record<CardSize, string> = {
  sm: 'p-4 rounded-lg',
  md: 'p-6 rounded-xl',
  lg: 'p-8 rounded-2xl',
};

const hoverVariants: Record<string, Variants> = {
  lift: {
    rest: {
      y: 0,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    hover: {
      y: -8,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transition: springs.snappy,
    },
  },
  glow: {
    rest: {
      boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
    },
    hover: {
      boxShadow: '0 0 30px 5px rgba(59, 130, 246, 0.3)',
      transition: springs.snappy,
    },
  },
  scale: {
    rest: {
      scale: 1,
    },
    hover: {
      scale: 1.02,
      transition: springs.snappy,
    },
  },
};

// ============================================
// TILT CARD VARIANT
// ============================================

interface TiltCardProps extends PremiumCardProps {}

function TiltCard({ children, variant, size, className, onClick, gradientFrom, gradientTo }: TiltCardProps) {
  const { ref, tilt, isHovered } = useTilt(10);

  const gradientStyle = variant === 'gradient' && gradientFrom && gradientTo
    ? { backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }
    : {};

  return (
    <motion.div
      ref={ref}
      className={`${variantStyles[variant || 'default']} ${sizeStyles[size || 'md']} ${className} transform-gpu cursor-pointer`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transformStyle: 'preserve-3d',
        ...gradientStyle,
      }}
      onClick={onClick}
      animate={{
        boxShadow: isHovered
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}
      transition={springs.snappy}
    >
      <div style={{ transform: 'translateZ(20px)' }}>{children}</div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  function PremiumCard(
    {
      children,
      variant = 'default',
      size = 'md',
      className = '',
      hover = 'lift',
      onClick,
      isInteractive = true,
      gradientFrom = '#3B82F6',
      gradientTo = '#8B5CF6',
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion();

    // Use tilt card for tilt hover effect
    if (hover === 'tilt' && !prefersReducedMotion) {
      return (
        <TiltCard
          variant={variant}
          size={size}
          className={className}
          onClick={onClick}
          gradientFrom={gradientFrom}
          gradientTo={gradientTo}
        >
          {children}
        </TiltCard>
      );
    }

    const gradientStyle = variant === 'gradient'
      ? { backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }
      : {};

    const hoverEffect = hover !== 'none' && isInteractive && !prefersReducedMotion
      ? hoverVariants[hover]
      : undefined;

    return (
      <motion.div
        ref={ref}
        className={`${variantStyles[variant]} ${sizeStyles[size]} ${className} ${isInteractive ? 'cursor-pointer' : ''}`}
        style={gradientStyle}
        variants={hoverEffect}
        initial="rest"
        whileHover={isInteractive ? 'hover' : undefined}
        whileTap={isInteractive ? { scale: 0.98 } : undefined}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }
);

// ============================================
// FEATURE CARD
// ============================================

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({
  icon,
  title,
  description,
  className = '',
  onClick,
}: FeatureCardProps) {
  return (
    <PremiumCard variant="elevated" hover="lift" className={className} onClick={onClick}>
      <div className="flex flex-col items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </PremiumCard>
  );
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  value: string | number;
  label: string;
  trend?: { value: number; isPositive: boolean };
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ value, label, trend, icon, className = '' }: StatCardProps) {
  return (
    <PremiumCard variant="default" size="sm" hover="scale" className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            {icon}
          </div>
        )}
      </div>
    </PremiumCard>
  );
}

// ============================================
// PRICING CARD
// ============================================

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaText: string;
  onCta?: () => void;
  isPopular?: boolean;
  isEnterprise?: boolean;
  className?: string;
}

export function PricingCard({
  name,
  price,
  period = '/month',
  description,
  features,
  ctaText,
  onCta,
  isPopular = false,
  isEnterprise = false,
  className = '',
}: PricingCardProps) {
  return (
    <PremiumCard
      variant={isPopular ? 'gradient' : isEnterprise ? 'glass' : 'elevated'}
      hover={isPopular ? 'glow' : 'lift'}
      className={`relative ${className}`}
      gradientFrom={isPopular ? '#3B82F6' : undefined}
      gradientTo={isPopular ? '#8B5CF6' : undefined}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className={`text-xl font-semibold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-4xl font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
            {price}
          </span>
          <span className={`text-sm ${isPopular ? 'text-white/70' : 'text-gray-500'}`}>
            {period}
          </span>
        </div>
        <p className={`mt-2 text-sm ${isPopular ? 'text-white/80' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 text-sm ${isPopular ? 'text-white' : 'text-gray-600'}`}
          >
            <svg
              className={`w-5 h-5 ${isPopular ? 'text-white' : 'text-green-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <motion.button
        onClick={onCta}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isPopular
            ? 'bg-white text-blue-600 hover:bg-white/90'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {ctaText}
      </motion.button>
    </PremiumCard>
  );
}

export default PremiumCard;
