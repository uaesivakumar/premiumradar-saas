/**
 * AI Timing Recommendations
 *
 * Recommends optimal outreach timing based on signals and context.
 */

import type { OutreachTiming, OutreachChannel } from './types';
import type { Signal, BankingSignal } from '../scoring/types';

interface TimingFactors {
  signalRecency: number; // 0-100
  signalUrgency: number; // 0-100
  channelOptimality: number; // 0-100
  calendarFit: number; // 0-100
}

/**
 * Optimal send times by channel (UAE timezone UTC+4)
 */
const OPTIMAL_SEND_TIMES: Record<OutreachChannel, { days: number[]; hours: number[] }> = {
  email: {
    days: [0, 1, 2, 3], // Sun-Wed (UAE work week)
    hours: [9, 10, 11, 14, 15], // 9-11 AM, 2-3 PM
  },
  linkedin: {
    days: [0, 1, 2, 3],
    hours: [8, 9, 10, 17, 18], // Early morning or after work
  },
  phone: {
    days: [0, 1, 2], // Sun-Tue (earlier in week)
    hours: [10, 11, 14, 15], // Mid-morning or mid-afternoon
  },
};

/**
 * Signal urgency mappings
 */
const SIGNAL_URGENCY: Record<string, 'immediate' | 'this-week' | 'this-month' | 'nurture'> = {
  // Critical - Act Now
  'regulatory-deadline-approaching': 'immediate',
  'c-level-change': 'immediate',
  'legacy-modernization-initiative': 'immediate',

  // High - This Week
  'digital-banking-launch': 'this-week',
  'competitor-product-launch': 'this-week',
  'website-visit-high-intent': 'this-week',
  'budget-cycle-q4': 'this-week',

  // Medium - This Month
  'cloud-migration-program': 'this-month',
  'market-expansion-announced': 'this-month',
  'banking-event-attended': 'this-month',

  // Low - Nurture
  'whitepaper-download': 'nurture',
  'open-banking-compliance': 'nurture',
};

/**
 * Calculate timing recommendation
 */
export function calculateTiming(
  signals: (Signal | BankingSignal)[],
  channel: OutreachChannel
): OutreachTiming {
  const factors = calculateTimingFactors(signals, channel);
  const urgencyLevel = determineUrgency(signals);
  const recommendedTime = calculateOptimalTime(channel, urgencyLevel);
  const reason = generateTimingReason(signals, urgencyLevel);
  const confidence = calculateConfidence(factors);

  return {
    recommendedTime,
    urgencyLevel,
    reason,
    confidence,
  };
}

function calculateTimingFactors(
  signals: (Signal | BankingSignal)[],
  channel: OutreachChannel
): TimingFactors {
  const now = new Date();

  // Signal recency (newer = higher score)
  const avgAge = signals.reduce((sum, s) => {
    const age = (now.getTime() - new Date(s.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return sum + age;
  }, 0) / (signals.length || 1);
  const signalRecency = Math.max(0, 100 - avgAge * 2);

  // Signal urgency (based on signal types)
  const urgentSignals = signals.filter((s) => {
    const urgency = SIGNAL_URGENCY[s.id];
    return urgency === 'immediate' || urgency === 'this-week';
  });
  const signalUrgency = (urgentSignals.length / (signals.length || 1)) * 100;

  // Channel optimality (is now a good time?)
  const optimal = OPTIMAL_SEND_TIMES[channel];
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const dayMatch = optimal.days.includes(currentDay) ? 50 : 0;
  const hourMatch = optimal.hours.includes(currentHour) ? 50 : 0;
  const channelOptimality = dayMatch + hourMatch;

  // Calendar fit (avoid holidays, Ramadan, etc.)
  const calendarFit = checkCalendarFit(now);

  return {
    signalRecency,
    signalUrgency,
    channelOptimality,
    calendarFit,
  };
}

function determineUrgency(
  signals: (Signal | BankingSignal)[]
): 'immediate' | 'this-week' | 'this-month' | 'nurture' {
  const urgencies = signals.map((s) => SIGNAL_URGENCY[s.id] || 'nurture');

  if (urgencies.includes('immediate')) return 'immediate';
  if (urgencies.includes('this-week')) return 'this-week';
  if (urgencies.includes('this-month')) return 'this-month';
  return 'nurture';
}

function calculateOptimalTime(
  channel: OutreachChannel,
  urgency: 'immediate' | 'this-week' | 'this-month' | 'nurture'
): Date {
  const now = new Date();
  const optimal = OPTIMAL_SEND_TIMES[channel];

  // If immediate, find next optimal slot
  if (urgency === 'immediate') {
    // Try today first
    if (optimal.days.includes(now.getDay())) {
      const nextHour = optimal.hours.find((h) => h > now.getHours());
      if (nextHour) {
        const time = new Date(now);
        time.setHours(nextHour, 0, 0, 0);
        return time;
      }
    }
    // Otherwise next optimal day
    return getNextOptimalDay(now, optimal);
  }

  // For other urgencies, spread out
  const daysToAdd = urgency === 'this-week' ? 2 : urgency === 'this-month' ? 7 : 14;
  const future = new Date(now);
  future.setDate(future.getDate() + daysToAdd);

  return getNextOptimalDay(future, optimal);
}

function getNextOptimalDay(
  from: Date,
  optimal: { days: number[]; hours: number[] }
): Date {
  const result = new Date(from);

  // Find next optimal day
  for (let i = 0; i < 7; i++) {
    const checkDay = (result.getDay() + i) % 7;
    if (optimal.days.includes(checkDay)) {
      result.setDate(result.getDate() + i);
      break;
    }
  }

  // Set optimal hour
  result.setHours(optimal.hours[0], 0, 0, 0);

  return result;
}

function checkCalendarFit(date: Date): number {
  // Check for UAE public holidays, Ramadan, etc.
  // This is a simplified version - in production would use a calendar API

  const month = date.getMonth();
  const day = date.getDate();

  // UAE National Day (Dec 2-3)
  if (month === 11 && (day === 2 || day === 3)) return 20;

  // Eid periods (approximate - would use Islamic calendar)
  // For now, return full score
  return 100;
}

function generateTimingReason(
  signals: (Signal | BankingSignal)[],
  urgency: 'immediate' | 'this-week' | 'this-month' | 'nurture'
): string {
  const urgentSignals = signals.filter((s) => {
    const signalUrgency = SIGNAL_URGENCY[s.id];
    return signalUrgency === 'immediate' || signalUrgency === 'this-week';
  });

  if (urgentSignals.length > 0) {
    const signalNames = urgentSignals.map((s) => s.name).slice(0, 2).join(' and ');
    return `${signalNames} detected - high engagement window`;
  }

  switch (urgency) {
    case 'immediate':
      return 'Critical timing signal detected - act now';
    case 'this-week':
      return 'Strong timing signals suggest reaching out soon';
    case 'this-month':
      return 'Good timing based on market activity';
    case 'nurture':
      return 'Building awareness - no urgent trigger detected';
  }
}

function calculateConfidence(factors: TimingFactors): number {
  const weights = {
    signalRecency: 0.3,
    signalUrgency: 0.3,
    channelOptimality: 0.2,
    calendarFit: 0.2,
  };

  const score =
    factors.signalRecency * weights.signalRecency +
    factors.signalUrgency * weights.signalUrgency +
    factors.channelOptimality * weights.channelOptimality +
    factors.calendarFit * weights.calendarFit;

  return Math.round(score);
}

/**
 * Get timing explanation for UI
 */
export function getTimingExplanation(timing: OutreachTiming): string[] {
  const explanations: string[] = [];

  explanations.push(timing.reason);

  switch (timing.urgencyLevel) {
    case 'immediate':
      explanations.push('Send within 24-48 hours for best results');
      break;
    case 'this-week':
      explanations.push('Optimal window: next 3-5 business days');
      break;
    case 'this-month':
      explanations.push('Good opportunity - schedule within 2 weeks');
      break;
    case 'nurture':
      explanations.push('No rush - focus on building relationship');
      break;
  }

  if (timing.confidence >= 80) {
    explanations.push('High confidence in timing recommendation');
  } else if (timing.confidence < 50) {
    explanations.push('Limited signals - consider gathering more data');
  }

  return explanations;
}
