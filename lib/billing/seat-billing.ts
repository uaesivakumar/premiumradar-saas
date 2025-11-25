/**
 * Seat-Based Billing
 *
 * Per-seat pricing and seat management for team plans.
 */

import { stripe } from './stripe-client';
import type { SeatAllocation, SeatChange, PlanTier } from './types';
import { getPlanLimits, getPlanByTier } from './plans';

// ============================================================
// SEAT PRICING
// ============================================================

// Price per additional seat by tier (monthly)
export const SEAT_PRICES: Record<PlanTier, number> = {
  free: 0, // No additional seats
  starter: 10, // $10/seat/month
  professional: 15, // $15/seat/month
  enterprise: 20, // $20/seat/month (volume discounts available)
};

// Base seats included in each tier
export const BASE_SEATS: Record<PlanTier, number> = {
  free: 2,
  starter: 5,
  professional: 10,
  enterprise: 25,
};

// ============================================================
// SEAT ALLOCATION (In-memory for demo)
// ============================================================

const seatAllocations = new Map<string, SeatAllocation>();

/**
 * Get seat allocation for a workspace
 */
export function getSeatAllocation(workspaceId: string): SeatAllocation | null {
  return seatAllocations.get(workspaceId) || null;
}

/**
 * Initialize seat allocation for a workspace
 */
export function initializeSeatAllocation(
  workspaceId: string,
  subscriptionId: string,
  tier: PlanTier,
  billingInterval: 'month' | 'year' = 'month'
): SeatAllocation {
  const baseSeats = BASE_SEATS[tier];
  const pricePerSeat = SEAT_PRICES[tier];

  const allocation: SeatAllocation = {
    workspaceId,
    subscriptionId,
    totalSeats: baseSeats,
    usedSeats: 1, // At least 1 seat used (owner)
    pricePerSeat,
    billingInterval,
  };

  seatAllocations.set(workspaceId, allocation);
  return allocation;
}

/**
 * Add seats to a workspace
 */
export async function addSeats(
  workspaceId: string,
  seatsToAdd: number
): Promise<SeatChange> {
  const allocation = seatAllocations.get(workspaceId);
  if (!allocation) {
    throw new Error('Seat allocation not found');
  }

  const previousSeats = allocation.totalSeats;
  const newSeats = previousSeats + seatsToAdd;

  // Calculate prorated amount
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate();
  const dailyRate = allocation.pricePerSeat / daysInMonth;
  const proratedAmount = Math.round(seatsToAdd * dailyRate * daysRemaining * 100) / 100;

  // Update Stripe subscription if configured
  if (stripe && allocation.subscriptionId) {
    try {
      // In a real implementation, update the subscription quantity
      console.log(`Would update Stripe subscription ${allocation.subscriptionId} to ${newSeats} seats`);
    } catch (err) {
      console.error('Failed to update Stripe subscription:', err);
    }
  }

  // Update local allocation
  allocation.totalSeats = newSeats;
  seatAllocations.set(workspaceId, allocation);

  return {
    workspaceId,
    previousSeats,
    newSeats,
    proratedAmount,
    effectiveDate: now,
  };
}

/**
 * Remove seats from a workspace
 */
export async function removeSeats(
  workspaceId: string,
  seatsToRemove: number
): Promise<SeatChange> {
  const allocation = seatAllocations.get(workspaceId);
  if (!allocation) {
    throw new Error('Seat allocation not found');
  }

  const previousSeats = allocation.totalSeats;
  const minSeats = allocation.usedSeats; // Can't go below used seats
  const newSeats = Math.max(minSeats, previousSeats - seatsToRemove);

  if (newSeats === previousSeats) {
    throw new Error(`Cannot remove seats: ${allocation.usedSeats} seats are currently in use`);
  }

  // Update local allocation
  allocation.totalSeats = newSeats;
  seatAllocations.set(workspaceId, allocation);

  return {
    workspaceId,
    previousSeats,
    newSeats,
    proratedAmount: 0, // Refund handled at period end
    effectiveDate: new Date(),
  };
}

/**
 * Use a seat (when adding a team member)
 */
export function useSeat(workspaceId: string): boolean {
  const allocation = seatAllocations.get(workspaceId);
  if (!allocation) return false;

  if (allocation.usedSeats >= allocation.totalSeats) {
    return false; // No available seats
  }

  allocation.usedSeats++;
  seatAllocations.set(workspaceId, allocation);
  return true;
}

/**
 * Release a seat (when removing a team member)
 */
export function releaseSeat(workspaceId: string): boolean {
  const allocation = seatAllocations.get(workspaceId);
  if (!allocation) return false;

  if (allocation.usedSeats <= 1) {
    return false; // Can't release last seat
  }

  allocation.usedSeats--;
  seatAllocations.set(workspaceId, allocation);
  return true;
}

/**
 * Get available seats
 */
export function getAvailableSeats(workspaceId: string): number {
  const allocation = seatAllocations.get(workspaceId);
  if (!allocation) return 0;
  return allocation.totalSeats - allocation.usedSeats;
}

/**
 * Check if workspace needs more seats
 */
export function needsMoreSeats(workspaceId: string): boolean {
  return getAvailableSeats(workspaceId) === 0;
}

/**
 * Calculate cost for additional seats
 */
export function calculateSeatCost(
  tier: PlanTier,
  additionalSeats: number,
  billingInterval: 'month' | 'year' = 'month'
): number {
  const pricePerSeat = SEAT_PRICES[tier];
  const monthlyTotal = additionalSeats * pricePerSeat;

  if (billingInterval === 'year') {
    return monthlyTotal * 12 * 0.8; // 20% discount for yearly
  }

  return monthlyTotal;
}

/**
 * Get seat usage percentage
 */
export function getSeatUsagePercentage(workspaceId: string): number {
  const allocation = seatAllocations.get(workspaceId);
  if (!allocation || allocation.totalSeats === 0) return 0;
  return Math.round((allocation.usedSeats / allocation.totalSeats) * 100);
}
