'use client';

/**
 * AI Orb Component - Central AI Interface
 * Sprint 1: AI Orb Interaction Model
 *
 * The orb is the primary interaction point on the landing page.
 * It pulses with ambient animations and responds to user interaction.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useIndustryStore, getIndustryConfig, Industry, INDUSTRY_CONFIGS } from '@/lib/stores/industry-store';
import { useTranslation } from '@/lib/stores/locale-store';
import { Mic, Send, Sparkles } from 'lucide-react';

type OrbState = 'idle' | 'listening' | 'thinking' | 'responding' | 'detected';

interface AIOrbProps {
  onIndustryDetected?: (industry: Industry) => void;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AIOrb({ onIndustryDetected, onClick, size = 'lg', className = '' }: AIOrbProps) {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [userInput, setUserInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const controls = useAnimation();

  const { detectedIndustry, confidence, isDetecting, detectFromInput, setSelectedIndustry } = useIndustryStore();
  const { t, isRTL, translations } = useTranslation();

  const industryConfig = getIndustryConfig(detectedIndustry);

  // Size configurations
  const sizes = {
    sm: { orb: 120, ring: 140, text: 'text-sm' },
    md: { orb: 180, ring: 210, text: 'text-base' },
    lg: { orb: 240, ring: 280, text: 'text-lg' },
  };

  const sizeConfig = sizes[size];

  // Orb animation variants
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
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    thinking: {
      scale: [1, 1.05, 1],
      rotate: [0, 180, 360],
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
    detected: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.5 },
    },
  };

  // Ring animation variants
  const ringVariants = {
    idle: {
      opacity: [0.3, 0.5, 0.3],
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    listening: {
      opacity: [0.5, 0.8, 0.5],
      scale: [1, 1.15, 1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    thinking: {
      opacity: 0.7,
      scale: 1.1,
      rotate: 360,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    responding: {
      opacity: 0.9,
      scale: 1.2,
    },
    detected: {
      opacity: 1,
      scale: 1.3,
      transition: { duration: 0.3 },
    },
  };

  // Handle orb click
  const handleOrbClick = () => {
    // If external onClick provided, use that (opens chat interface)
    if (onClick) {
      onClick();
      return;
    }
    // Otherwise use internal conversation
    if (!showInput) {
      setShowInput(true);
      setOrbState('listening');
      setMessages([{ role: 'ai', text: translations.orb.greeting }]);
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'ai', text: translations.orb.prompt }]);
      }, 1000);
    }
  };

  // Handle input submit
  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    const input = userInput.trim();
    setUserInput('');
    setMessages((prev) => [...prev, { role: 'user', text: input }]);
    setOrbState('thinking');

    // Detect industry
    await detectFromInput(input);

    setOrbState('detected');
    const config = getIndustryConfig(useIndustryStore.getState().detectedIndustry);
    const detectedMessage = translations.orb.detected.replace('{industry}', config.name);
    setMessages((prev) => [...prev, { role: 'ai', text: detectedMessage }]);

    if (onIndustryDetected) {
      onIndustryDetected(useIndustryStore.getState().detectedIndustry);
    }

    setTimeout(() => setOrbState('idle'), 2000);
  };

  // Handle suggestion click
  const handleSuggestionClick = (industry: Industry) => {
    setSelectedIndustry(industry);
    const config = getIndustryConfig(industry);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: config.name },
      { role: 'ai', text: translations.orb.detected.replace('{industry}', config.name) },
    ]);
    setOrbState('detected');

    if (onIndustryDetected) {
      onIndustryDetected(industry);
    }

    setTimeout(() => setOrbState('idle'), 2000);
  };

  // Update orb color based on detected industry
  useEffect(() => {
    if (detectedIndustry !== 'general') {
      controls.start({
        background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
      });
    }
  }, [detectedIndustry, industryConfig, controls]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Orb Container */}
      <div className="relative" style={{ width: sizeConfig.ring, height: sizeConfig.ring }}>
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${industryConfig.primaryColor}40, ${industryConfig.secondaryColor}40)`,
            filter: 'blur(20px)',
          }}
          variants={ringVariants}
          animate={orbState}
        />

        {/* Inner Ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            top: '50%',
            left: '50%',
            width: sizeConfig.ring - 20,
            height: sizeConfig.ring - 20,
            transform: 'translate(-50%, -50%)',
            border: `2px solid ${industryConfig.primaryColor}60`,
          }}
          variants={ringVariants}
          animate={orbState}
        />

        {/* Main Orb */}
        <motion.button
          className="absolute rounded-full cursor-pointer flex items-center justify-center"
          style={{
            top: '50%',
            left: '50%',
            width: sizeConfig.orb,
            height: sizeConfig.orb,
            transform: 'translate(-50%, -50%)',
            background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
            boxShadow: `0 0 60px ${industryConfig.primaryColor}40`,
          }}
          variants={orbVariants}
          animate={orbState}
          onClick={handleOrbClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="AI Assistant"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white"
          >
            {orbState === 'thinking' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={size === 'lg' ? 48 : size === 'md' ? 36 : 24} />
              </motion.div>
            ) : orbState === 'listening' ? (
              <Mic size={size === 'lg' ? 48 : size === 'md' ? 36 : 24} />
            ) : (
              <span className={`font-bold ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl'}`}>
                {industryConfig.icon}
              </span>
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Conversation Area */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 w-full max-w-md"
          >
            {/* Messages */}
            <div className="mb-4 space-y-3 max-h-48 overflow-y-auto">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[80%] ${sizeConfig.text} ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {orbState === 'thinking' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-600 rounded-bl-md">
                    {translations.orb.thinking}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={translations.orb.placeholder}
                className={`flex-1 px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none ${sizeConfig.text}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700"
                aria-label="Send"
              >
                <Send size={20} />
              </motion.button>
            </div>

            {/* Industry Suggestions */}
            {messages.length <= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex flex-wrap gap-2 justify-center"
              >
                {(['banking', 'healthcare', 'technology', 'retail'] as Industry[]).map((industry) => {
                  const config = INDUSTRY_CONFIGS[industry];
                  return (
                    <button
                      key={industry}
                      onClick={() => handleSuggestionClick(industry)}
                      className="px-4 py-2 rounded-full border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm"
                    >
                      {config.icon} {isRTL ? config.nameAr : config.name}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt when not expanded */}
      {!showInput && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`mt-4 text-gray-500 ${sizeConfig.text}`}
        >
          {t('orb.prompt')}
        </motion.p>
      )}
    </div>
  );
}

export default AIOrb;
