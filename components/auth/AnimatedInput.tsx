'use client';

/**
 * AnimatedInput - Sprint S31
 * Magnetic focus input fields with glow effects
 * 2030 AI-first form inputs
 */

import { useState, forwardRef, InputHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

interface AnimatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, onChange, type = 'text', value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);
    const { detectedIndustry } = useIndustryStore();
    const industryConfig = getIndustryConfig(detectedIndustry);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e.target.value);
    };

    const isActive = isFocused || hasValue;

    return (
      <div className="relative">
        <motion.div
          className="relative"
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Glow effect when focused */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -inset-1 rounded-xl blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${industryConfig.primaryColor}30, ${industryConfig.secondaryColor}30)`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Input container */}
          <div
            className={`
              relative bg-slate-800/50 border rounded-xl transition-all duration-300
              ${isFocused
                ? 'border-transparent'
                : error
                  ? 'border-red-500/50'
                  : 'border-white/10 hover:border-white/20'
              }
            `}
            style={{
              borderColor: isFocused ? industryConfig.primaryColor : undefined,
            }}
          >
            {/* Floating label */}
            <motion.label
              className={`
                absolute left-4 pointer-events-none transition-colors
                ${isActive ? 'text-xs' : 'text-base'}
                ${isFocused ? '' : 'text-gray-400'}
              `}
              animate={{
                y: isActive ? 8 : 16,
                scale: isActive ? 0.85 : 1,
                originX: 0,
              }}
              style={{
                color: isFocused ? industryConfig.primaryColor : undefined,
              }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.label>

            {/* Icon */}
            {icon && (
              <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                animate={{
                  color: isFocused ? industryConfig.primaryColor : '#6b7280',
                }}
              >
                {icon}
              </motion.div>
            )}

            {/* Actual input */}
            <input
              ref={ref}
              type={type}
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`
                w-full bg-transparent text-white px-4 pt-6 pb-3 rounded-xl
                focus:outline-none placeholder-transparent
                ${icon ? 'pr-12' : ''}
              `}
              {...props}
            />

            {/* Magnetic focus line */}
            <motion.div
              className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: isFocused ? 1 : 0,
                backgroundColor: industryConfig.primaryColor,
              }}
              transition={{ duration: 0.3 }}
              style={{ originX: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="text-red-400 text-sm mt-2 pl-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

export default AnimatedInput;
