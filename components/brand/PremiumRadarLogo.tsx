'use client';

/**
 * PremiumRadar Logo - Official Brand Mark
 *
 * Design from Nano Banana Pro with Rolls Royce wheel animation:
 * - Dark circular background
 * - 4 concentric radar rings
 * - 4-pointed compass star (ROTATES like RR wheel)
 * - "P" letterform in center (STATIC - stays upright)
 * - 4 sparkles at diagonal corners (GLOW animation)
 *
 * Usage:
 * - <PremiumRadarLogo size="sm" /> - 28px (inline, buttons)
 * - <PremiumRadarLogo size="md" /> - 40px (sidebar, headers)
 * - <PremiumRadarLogo size="lg" /> - 72px (auth pages)
 * - <PremiumRadarLogo size="xl" /> - 100px (hero, center orb)
 */

import { motion } from 'framer-motion';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface PremiumRadarLogoProps {
  size?: LogoSize;
  color?: string;
  animate?: boolean;
  className?: string;
}

const SIZES: Record<LogoSize, number> = {
  sm: 28,
  md: 40,
  lg: 72,
  xl: 100,
};

export function PremiumRadarLogo({
  size = 'md',
  color = '#3B82F6',
  animate = false,
  className = '',
}: PremiumRadarLogoProps) {
  const px = SIZES[size];
  const uniqueId = `logo-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id={`bg_grad_${uniqueId}`} cx="250" cy="250" r="250" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1e293b"/>
          <stop offset="1" stopColor="#0f172a"/>
        </radialGradient>
        <linearGradient id={`brand_grad_${uniqueId}`} x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color}/>
          <stop offset="0.5" stopColor={color} stopOpacity="0.8"/>
          <stop offset="1" stopColor={color}/>
        </linearGradient>
        <radialGradient id={`shine_grad_${uniqueId}`} cx="350" cy="150" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.6"/>
          <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Dark circular background */}
      <circle cx="250" cy="250" r="245" fill={`url(#bg_grad_${uniqueId})`}/>

      {/* Concentric radar rings - STATIC */}
      <g stroke={color} strokeWidth="3" fill="none" opacity="0.4">
        <circle cx="250" cy="250" r="200"/>
        <circle cx="250" cy="250" r="175"/>
        <circle cx="250" cy="250" r="150"/>
        <circle cx="250" cy="250" r="125"/>
      </g>

      {/* 4-pointed compass star - ROTATES (Rolls Royce wheel effect) */}
      <motion.g
        animate={animate ? { rotate: 360 } : {}}
        transition={animate ? { repeat: Infinity, duration: 8, ease: 'linear' } : {}}
        style={{ transformOrigin: '250px 250px' }}
      >
        <path
          d="M250 50 L270 180 L450 250 L270 320 L250 450 L230 320 L50 250 L230 180 Z"
          fill={`url(#brand_grad_${uniqueId})`}
        />
      </motion.g>

      {/* P letterform - STATIC (stays upright like RR logo) */}
      {/* Dark cutout */}
      <circle cx="250" cy="250" r="80" fill="#0f172a"/>

      {/* P letter */}
      <path
        d="M230 200 L230 300 L245 300 L245 265 L270 265 C290 265 305 250 305 230 C305 210 290 195 270 195 L245 195 L245 200 Z M245 210 L265 210 C280 210 290 218 290 230 C290 242 280 250 265 250 L245 250 Z"
        fill={color}
      />

      {/* AI Sparkles - GLOW animation */}
      {/* Top-right sparkle */}
      <motion.path
        d="M360 160 L370 185 L395 195 L370 205 L360 230 L350 205 L325 195 L350 185 Z"
        fill={color}
        animate={animate ? {
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5],
          filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
        } : {}}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
        style={{ transformOrigin: '360px 195px' }}
      />

      {/* Bottom-right sparkle */}
      <motion.path
        d="M380 300 L390 325 L415 335 L390 345 L380 370 L370 345 L345 335 L370 325 Z"
        fill={color}
        animate={animate ? {
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5]
        } : {}}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
        style={{ transformOrigin: '380px 335px' }}
      />

      {/* Top-left sparkle */}
      <motion.path
        d="M180 160 L190 185 L215 195 L190 205 L180 230 L170 205 L145 195 L170 185 Z"
        fill={color}
        animate={animate ? {
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5]
        } : {}}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.8 }}
        style={{ transformOrigin: '180px 195px' }}
      />

      {/* Bottom-left sparkle */}
      <motion.path
        d="M180 300 L190 325 L215 335 L190 345 L180 370 L170 345 L145 335 L170 325 Z"
        fill={color}
        animate={animate ? {
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5]
        } : {}}
        transition={{ repeat: Infinity, duration: 1.5, delay: 1.2 }}
        style={{ transformOrigin: '180px 335px' }}
      />

      {/* Shine highlight */}
      <path
        d="M250 50 L350 150"
        stroke={`url(#shine_grad_${uniqueId})`}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export default PremiumRadarLogo;
