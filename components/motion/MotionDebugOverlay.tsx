/**
 * Motion Debug Overlay - Sprint S21
 *
 * Development-only overlay for debugging animations.
 * Shows real-time motion values and performance metrics.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollProgress, useScrollDirection } from '@/lib/motion/scroll';
import { useMousePosition, useReducedMotion } from '@/lib/motion/hooks';

interface DebugData {
  fps: number;
  scrollProgress: number;
  scrollDirection: 'up' | 'down' | null;
  mouseX: number;
  mouseY: number;
  prefersReducedMotion: boolean;
}

export function MotionDebugOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState(60);
  const scrollProgress = useScrollProgress();
  const scrollDirection = useScrollDirection();
  const { x: mouseX, y: mouseY } = useMousePosition();
  const prefersReducedMotion = useReducedMotion();
  const [scrollValue, setScrollValue] = useState(0);

  // Track scroll progress value
  useEffect(() => {
    const unsubscribe = scrollProgress.on('change', (v) => {
      setScrollValue(Math.round(v * 100));
    });
    return () => unsubscribe();
  }, [scrollProgress]);

  // Calculate FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFps);
    };

    animationFrameId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center text-xs font-mono"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Motion Debug"
      >
        🎬
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-16 right-4 z-[9999] w-64 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Motion Debug</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono ${fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}
                >
                  {fps} FPS
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-3 space-y-3">
              {/* Scroll Progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">Scroll Progress</span>
                  <span className="text-xs font-mono text-white">{scrollValue}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    style={{ width: `${scrollValue}%` }}
                  />
                </div>
              </div>

              {/* Scroll Direction */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Scroll Direction</span>
                <span className="text-xs font-mono text-white">
                  {scrollDirection === 'up' && '↑ Up'}
                  {scrollDirection === 'down' && '↓ Down'}
                  {scrollDirection === null && '— Idle'}
                </span>
              </div>

              {/* Mouse Position */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Mouse Position</span>
                <span className="text-xs font-mono text-white">
                  ({mouseX}, {mouseY})
                </span>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Reduced Motion</span>
                <span
                  className={`text-xs font-mono ${prefersReducedMotion ? 'text-yellow-400' : 'text-green-400'}`}
                >
                  {prefersReducedMotion ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* Animation Status */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-lg font-bold text-white">✓</div>
                    <div className="text-[10px] text-zinc-500">Springs</div>
                  </div>
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-lg font-bold text-white">✓</div>
                    <div className="text-[10px] text-zinc-500">Easing</div>
                  </div>
                  <div className="bg-zinc-800 rounded p-2">
                    <div className="text-lg font-bold text-white">✓</div>
                    <div className="text-[10px] text-zinc-500">Scroll</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-zinc-700 bg-zinc-800/50">
              <span className="text-[10px] text-zinc-500">
                Sprint S21 • Motion Engine v1.0
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MotionDebugOverlay;
