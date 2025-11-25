/**
 * Micro-Demo Cinematic Experience - Sprint S24
 *
 * Interactive product demo with cinematic animations.
 * Step-by-step feature showcase with premium transitions.
 */

'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { springs, easings, durations } from '@/lib/motion/timing';
import { fadeIn, scaleIn, rise } from '@/lib/motion/presets';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface DemoStep {
  id: string;
  title: string;
  description: string;
  content: ReactNode;
  duration?: number;
  highlight?: string[];
}

type DemoState = 'idle' | 'playing' | 'paused' | 'completed';

// ============================================
// DEMO STEP COMPONENT
// ============================================

interface DemoStepDisplayProps {
  step: DemoStep;
  isActive: boolean;
  isPrevious: boolean;
  direction: number;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easings.apple,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.3,
    },
  }),
};

function DemoStepDisplay({ step, isActive, direction }: DemoStepDisplayProps) {
  return (
    <motion.div
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 flex items-center justify-center"
    >
      {step.content}
    </motion.div>
  );
}

// ============================================
// TIMELINE INDICATOR
// ============================================

interface TimelineProps {
  steps: DemoStep[];
  currentStep: number;
  progress: number;
  onStepClick: (index: number) => void;
}

function Timeline({ steps, currentStep, progress, onStepClick }: TimelineProps) {
  return (
    <div className="flex items-center justify-center gap-2 w-full max-w-2xl mx-auto">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step dot */}
            <motion.button
              onClick={() => onStepClick(index)}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCompleted ? (
                <Check size={18} />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}

              {/* Progress ring for current step */}
              {isCurrent && (
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray={`${progress * 113} 113`}
                  />
                </svg>
              )}
            </motion.button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="w-12 h-0.5 bg-gray-200 mx-1 overflow-hidden">
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// CONTROLS
// ============================================

interface DemoControlsProps {
  state: DemoState;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

function DemoControls({
  state,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onRestart,
  canGoNext,
  canGoPrevious,
}: DemoControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Previous */}
      <motion.button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={`p-3 rounded-full ${
          canGoPrevious
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
        }`}
        whileHover={canGoPrevious ? { scale: 1.1 } : {}}
        whileTap={canGoPrevious ? { scale: 0.95 } : {}}
      >
        <SkipBack size={20} />
      </motion.button>

      {/* Play/Pause */}
      <motion.button
        onClick={state === 'playing' ? onPause : onPlay}
        className="p-4 rounded-full bg-blue-500 text-white hover:bg-blue-600"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {state === 'playing' ? <Pause size={24} /> : <Play size={24} />}
      </motion.button>

      {/* Next */}
      <motion.button
        onClick={onNext}
        disabled={!canGoNext}
        className={`p-3 rounded-full ${
          canGoNext
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
        }`}
        whileHover={canGoNext ? { scale: 1.1 } : {}}
        whileTap={canGoNext ? { scale: 0.95 } : {}}
      >
        <SkipForward size={20} />
      </motion.button>
    </div>
  );
}

// ============================================
// STEP INFO PANEL
// ============================================

interface StepInfoProps {
  step: DemoStep;
  stepNumber: number;
  totalSteps: number;
}

function StepInfo({ step, stepNumber, totalSteps }: StepInfoProps) {
  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center"
    >
      <span className="text-sm text-blue-500 font-medium mb-2 block">
        Step {stepNumber} of {totalSteps}
      </span>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
      <p className="text-gray-600 max-w-md mx-auto">{step.description}</p>
    </motion.div>
  );
}

// ============================================
// COMPLETION SCREEN
// ============================================

interface CompletionScreenProps {
  onRestart: () => void;
  onClose?: () => void;
}

function CompletionScreen({ onRestart, onClose }: CompletionScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10 text-green-500" />
      </motion.div>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">Demo Complete!</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        You&apos;ve seen all the key features. Ready to get started?
      </p>

      <div className="flex gap-4">
        <motion.button
          onClick={onRestart}
          className="px-6 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Watch Again
        </motion.button>
        <motion.button
          onClick={onClose}
          className="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN MICRO-DEMO COMPONENT
// ============================================

export interface MicroDemoProps {
  steps: DemoStep[];
  autoPlay?: boolean;
  defaultStepDuration?: number;
  onComplete?: () => void;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

export function MicroDemo({
  steps,
  autoPlay = false,
  defaultStepDuration = 5000,
  onComplete,
  onStepChange,
  className = '',
}: MicroDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<DemoState>(autoPlay ? 'playing' : 'idle');
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  const progressRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  const currentStepData = steps[currentStep];
  const stepDuration = currentStepData?.duration || defaultStepDuration;

  // Handle auto-play progress
  useEffect(() => {
    if (state !== 'playing') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const startTime = Date.now();
    const startProgress = progressRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = startProgress + elapsed / stepDuration;

      if (newProgress >= 1) {
        // Move to next step
        if (currentStep < steps.length - 1) {
          setDirection(1);
          setCurrentStep((prev) => prev + 1);
          progressRef.current = 0;
          setProgress(0);
        } else {
          // Demo complete
          setState('completed');
          onComplete?.();
        }
      } else {
        progressRef.current = newProgress;
        setProgress(newProgress);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, currentStep, stepDuration, steps.length, onComplete]);

  // Notify step changes
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const handlePlay = () => setState('playing');
  const handlePause = () => setState('paused');

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      progressRef.current = 0;
      setProgress(0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
      progressRef.current = 0;
      setProgress(0);
    }
  };

  const handleStepClick = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
    progressRef.current = 0;
    setProgress(0);
    setState('paused');
  };

  const handleRestart = () => {
    setDirection(1);
    setCurrentStep(0);
    progressRef.current = 0;
    setProgress(0);
    setState('idle');
  };

  return (
    <div
      className={`relative w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <AnimatePresence mode="wait">
          {state !== 'completed' && currentStepData && (
            <StepInfo
              key={currentStepData.id}
              step={currentStepData}
              stepNumber={currentStep + 1}
              totalSteps={steps.length}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Content Area */}
      <div className="relative h-96 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          {state !== 'completed' ? (
            <DemoStepDisplay
              key={currentStep}
              step={currentStepData}
              isActive={true}
              isPrevious={false}
              direction={direction}
            />
          ) : (
            <CompletionScreen onRestart={handleRestart} onClose={onComplete} />
          )}
        </AnimatePresence>
      </div>

      {/* Footer with controls */}
      {state !== 'completed' && (
        <div className="px-8 py-6 border-t border-gray-100 space-y-6">
          <Timeline
            steps={steps}
            currentStep={currentStep}
            progress={progress}
            onStepClick={handleStepClick}
          />
          <DemoControls
            state={state}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onRestart={handleRestart}
            canGoNext={currentStep < steps.length - 1}
            canGoPrevious={currentStep > 0}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// SPOTLIGHT HIGHLIGHT
// ============================================

interface SpotlightProps {
  targetRef: React.RefObject<HTMLElement>;
  isActive: boolean;
  padding?: number;
}

export function Spotlight({ targetRef, isActive, padding = 16 }: SpotlightProps) {
  const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!targetRef.current || !isActive) return;

    const updateRect = () => {
      const el = targetRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({
          x: r.left - padding,
          y: r.top - padding,
          width: r.width + padding * 2,
          height: r.height + padding * 2,
        });
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [targetRef, isActive, padding]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 pointer-events-none"
    >
      {/* Overlay with cutout */}
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect fill="white" width="100%" height="100%" />
            <motion.rect
              fill="black"
              initial={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
              animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
              rx="8"
            />
          </mask>
        </defs>
        <rect
          fill="rgba(0,0,0,0.7)"
          width="100%"
          height="100%"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight border */}
      <motion.div
        className="absolute border-2 border-blue-500 rounded-lg shadow-lg"
        style={{
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
        }}
        initial={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
        animate={{ x: rect.x, y: rect.y, width: rect.width, height: rect.height }}
      />
    </motion.div>
  );
}

// ============================================
// TOOLTIP GUIDE
// ============================================

interface TooltipGuideProps {
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  targetRef: React.RefObject<HTMLElement>;
  isVisible: boolean;
}

export function TooltipGuide({
  text,
  position,
  targetRef,
  isVisible,
}: TooltipGuideProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!targetRef.current || !isVisible) return;

    const updateCoords = () => {
      const el = targetRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        switch (position) {
          case 'top':
            setCoords({ x: r.left + r.width / 2, y: r.top - 10 });
            break;
          case 'bottom':
            setCoords({ x: r.left + r.width / 2, y: r.bottom + 10 });
            break;
          case 'left':
            setCoords({ x: r.left - 10, y: r.top + r.height / 2 });
            break;
          case 'right':
            setCoords({ x: r.right + 10, y: r.top + r.height / 2 });
            break;
        }
      }
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [targetRef, isVisible, position]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed z-50 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
          style={{
            left: coords.x,
            top: coords.y,
            transform: `translate(${position === 'left' ? '-100%' : position === 'right' ? '0' : '-50%'}, ${
              position === 'top' ? '-100%' : position === 'bottom' ? '0' : '-50%'
            })`,
          }}
        >
          {text}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top'
                ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
                : position === 'bottom'
                  ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
                  : position === 'left'
                    ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'
                    : 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MicroDemo;
