/**
 * Dynamic AI Orb Component - Sprint S22
 *
 * 2D animated gradient orb with state-based animations.
 * SSR-safe: No Three.js dependencies.
 */

'use client';

import { motion } from 'framer-motion';
import { springs } from '@/lib/motion/timing';

type OrbMode = '2d' | '3d' | 'auto';
type OrbState = 'idle' | 'listening' | 'thinking' | 'responding' | 'active';

interface DynamicOrbProps {
  primaryColor?: string;
  secondaryColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mode?: OrbMode;
  state?: OrbState;
  onClick?: () => void;
  className?: string;
  showParticles?: boolean;
  showConnections?: boolean;
  icon?: React.ReactNode;
}

// Size configurations
const sizeConfigs = {
  sm: { dimension: 120, iconSize: 24 },
  md: { dimension: 180, iconSize: 36 },
  lg: { dimension: 240, iconSize: 48 },
  xl: { dimension: 320, iconSize: 64 },
};

// Orb animation variants for 2D fallback
const orbVariants = {
  idle: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  listening: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  thinking: {
    scale: [1, 1.05, 1],
    rotate: [0, 360],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  responding: {
    scale: 1.1,
    transition: { duration: 0.3 },
  },
  active: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.4 },
  },
};

// Ring animation variants
const ringVariants = {
  idle: {
    opacity: [0.3, 0.5, 0.3],
    scale: [1, 1.08, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  listening: {
    opacity: [0.5, 0.9, 0.5],
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  thinking: {
    opacity: 0.7,
    scale: 1.15,
    rotate: 360,
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  responding: {
    opacity: 0.9,
    scale: 1.25,
    transition: { duration: 0.3 },
  },
  active: {
    opacity: 1,
    scale: 1.35,
    transition: { duration: 0.3 },
  },
};

function Orb2D({
  primaryColor,
  secondaryColor,
  dimension,
  state,
  onClick,
  icon,
}: {
  primaryColor: string;
  secondaryColor: string;
  dimension: number;
  state: OrbState;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  const ringSize = dimension * 1.2;

  return (
    <div className="relative" style={{ width: ringSize, height: ringSize }}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        variants={ringVariants}
        animate={state}
      />

      {/* Outer ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '50%',
          left: '50%',
          width: ringSize - 20,
          height: ringSize - 20,
          transform: 'translate(-50%, -50%)',
          border: `2px solid ${primaryColor}40`,
        }}
        variants={ringVariants}
        animate={state}
      />

      {/* Main orb */}
      <motion.button
        className="absolute rounded-full cursor-pointer flex items-center justify-center"
        style={{
          top: '50%',
          left: '50%',
          width: dimension,
          height: dimension,
          transform: 'translate(-50%, -50%)',
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          boxShadow: `0 0 60px ${primaryColor}40`,
        }}
        variants={orbVariants}
        animate={state}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springs.snappy}
      >
        {icon && (
          <motion.div
            className="text-white"
            animate={state === 'thinking' ? { rotate: 360 } : {}}
            transition={
              state === 'thinking'
                ? { duration: 1, repeat: Infinity, ease: 'linear' }
                : {}
            }
          >
            {icon}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}

function OrbLoader({ dimension, primaryColor }: { dimension: number; primaryColor: string }) {
  return (
    <div
      className="animate-pulse rounded-full"
      style={{
        width: dimension,
        height: dimension,
        background: `linear-gradient(135deg, ${primaryColor}50, ${primaryColor}30)`,
      }}
    />
  );
}

export function DynamicOrb({
  primaryColor = '#3B82F6',
  secondaryColor = '#8B5CF6',
  size = 'lg',
  mode = 'auto',
  state = 'idle',
  onClick,
  className = '',
  showParticles = true,
  showConnections = true,
  icon,
}: DynamicOrbProps) {
  const { dimension } = sizeConfigs[size];

  // TEMPORARILY FORCE 2D MODE
  // Three.js/React Three Fiber causes client-side crashes due to SSR/hydration issues
  // TODO: Re-enable 3D mode when Three.js issues are resolved
  return (
    <div className={`relative ${className}`}>
      <Orb2D
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        dimension={dimension}
        state={state}
        onClick={onClick}
        icon={icon}
      />
    </div>
  );
}

export default DynamicOrb;
