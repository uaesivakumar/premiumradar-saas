/**
 * Premium Button Component - Sprint S25
 *
 * Elevated button component with premium visual treatments.
 * Includes magnetic effect, gradient backgrounds, and animations.
 */

'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { springs } from '@/lib/motion/timing';
import { useMagneticEffect, useReducedMotion } from '@/lib/motion/hooks';

// ============================================
// TYPES
// ============================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gradient' | 'outline' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  magnetic?: boolean;
  glow?: boolean;
  fullWidth?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
}

// ============================================
// STYLES
// ============================================

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  gradient: 'text-white shadow-lg',
  outline: 'bg-transparent border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs rounded',
  sm: 'px-3 py-2 text-sm rounded-md',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
  xl: 'px-8 py-4 text-lg rounded-xl',
};

const iconSizes: Record<ButtonSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
};

// ============================================
// LOADING SPINNER
// ============================================

function Spinner({ size }: { size: number }) {
  return (
    <motion.svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
}

// ============================================
// MAGNETIC BUTTON
// ============================================

interface MagneticButtonProps extends PremiumButtonProps {}

function MagneticButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  gradientFrom,
  gradientTo,
  glow,
  ...props
}: MagneticButtonProps) {
  const { ref, x, y } = useMagneticEffect(0.3);

  const gradientStyle = variant === 'gradient' && gradientFrom && gradientTo
    ? { backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }
    : {};

  return (
    <motion.button
      ref={ref}
      className={`${variantStyles[variant]} ${sizeStyles[size]} font-semibold transition-colors ${className}`}
      style={{ ...gradientStyle, x, y }}
      whileTap={{ scale: 0.95 }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  function PremiumButton(
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      magnetic = false,
      glow = false,
      fullWidth = false,
      gradientFrom = '#3B82F6',
      gradientTo = '#8B5CF6',
      className = '',
      disabled,
      ...props
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion();
    const iconSize = iconSizes[size];

    // Use magnetic button if enabled
    if (magnetic && !prefersReducedMotion && !disabled) {
      return (
        <MagneticButton
          variant={variant}
          size={size}
          gradientFrom={gradientFrom}
          gradientTo={gradientTo}
          glow={glow}
          className={`${fullWidth ? 'w-full' : ''} ${className}`}
          {...props}
        >
          {isLoading ? (
            <Spinner size={iconSize} />
          ) : (
            <>
              {leftIcon && <span className="mr-2">{leftIcon}</span>}
              {children}
              {rightIcon && <span className="ml-2">{rightIcon}</span>}
            </>
          )}
        </MagneticButton>
      );
    }

    const gradientStyle = variant === 'gradient'
      ? { backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }
      : {};

    const glowStyle = glow && !disabled
      ? { boxShadow: `0 0 20px ${variant === 'gradient' ? gradientFrom : '#3B82F6'}40` }
      : {};

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          font-semibold
          transition-colors
          inline-flex items-center justify-center gap-2
          ${fullWidth ? 'w-full' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        style={{ ...gradientStyle, ...glowStyle }}
        whileHover={!disabled && !prefersReducedMotion ? { scale: 1.02 } : {}}
        whileTap={!disabled && !prefersReducedMotion ? { scale: 0.98 } : {}}
        transition={springs.snappy}
        {...(props as any)}
      >
        {isLoading ? (
          <Spinner size={iconSize} />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </motion.button>
    );
  }
);

// ============================================
// ICON BUTTON
// ============================================

interface IconButtonProps extends Omit<PremiumButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: ReactNode;
  'aria-label': string;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
  };

  return (
    <PremiumButton
      variant={variant}
      className={`!px-0 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
    </PremiumButton>
  );
}

// ============================================
// BUTTON GROUP
// ============================================

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  attached?: boolean;
}

export function ButtonGroup({ children, className = '', attached = false }: ButtonGroupProps) {
  return (
    <div
      className={`
        flex
        ${attached ? '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:border-l-0' : 'gap-2'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ============================================
// FLOATING ACTION BUTTON
// ============================================

interface FABProps extends Omit<PremiumButtonProps, 'size'> {
  icon: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  'aria-label': string;
}

export function FAB({
  icon,
  position = 'bottom-right',
  variant = 'primary',
  className = '',
  ...props
}: FABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-50`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={springs.bouncy}
    >
      <PremiumButton
        variant={variant}
        className={`!p-4 !rounded-full shadow-xl ${className}`}
        {...props}
      >
        {icon}
      </PremiumButton>
    </motion.div>
  );
}

export default PremiumButton;
