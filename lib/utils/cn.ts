import { clsx, type ClassValue } from 'clsx';

/**
 * Utility for conditionally joining classNames
 * Uses clsx for optimal performance
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
