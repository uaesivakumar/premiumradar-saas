/**
 * Financials Service
 *
 * Aggregates all costs and revenue for the founder dashboard:
 * - GCP Infrastructure costs
 * - API costs (OpenAI, Apollo, SERP)
 * - Revenue (subscriptions, one-time)
 * - Burn rate calculations
 * - Runway projections
 */

import { query, queryOne, insert } from '@/lib/db/client';
import { getGCPCostSummary, type GCPCostSummary } from './gcp-costs';
import { getAPICostSummary, type APICostSummary } from './api-costs';

// =============================================================================
// TYPES
// =============================================================================

export interface RevenueEntry {
  id: string;
  date: string;
  type: 'subscription' | 'one-time' | 'pilot' | 'other';
  description: string;
  amount: number;
  currency: string;
  customerId?: string;
  recurring: boolean;
}

export interface FinancialSummary {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    history: Array<{ date: string; amount: number }>;
  };
  expenses: {
    thisMonth: number;
    lastMonth: number;
    infrastructure: number; // GCP
    apis: number; // OpenAI + Apollo + SERP
    other: number;
    history: Array<{ date: string; amount: number }>;
  };
  profit: {
    thisMonth: number;
    lastMonth: number;
    margin: number; // percentage
  };
  burnRate: {
    monthly: number;
    daily: number;
  };
  runway: {
    months: number;
    cashBalance: number;
  };
  breakdown: {
    gcp: GCPCostSummary;
    api: APICostSummary;
  };
}

// =============================================================================
// DATABASE TABLE SQL
// =============================================================================

export const REVENUE_TABLE_SQL = `
-- Revenue Table
-- Tracks all revenue entries for financial dashboard

CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('subscription', 'one-time', 'pilot', 'other')),
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  customer_id UUID,
  customer_name VARCHAR(200),
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON revenue(type);
CREATE INDEX IF NOT EXISTS idx_revenue_recurring ON revenue(recurring);

-- Other expenses table (beyond GCP and APIs)
CREATE TABLE IF NOT EXISTS other_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  vendor VARCHAR(200),
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_other_expenses_date ON other_expenses(date DESC);
`;

// =============================================================================
// REVENUE TRACKING
// =============================================================================

/**
 * Record a revenue entry
 */
export async function recordRevenue(entry: {
  date: string;
  type: 'subscription' | 'one-time' | 'pilot' | 'other';
  description: string;
  amount: number;
  customerId?: string;
  customerName?: string;
  recurring?: boolean;
}): Promise<string | null> {
  try {
    const result = await insert<{ id: string }>(`
      INSERT INTO revenue (date, type, description, amount, customer_id, customer_name, recurring)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      entry.date,
      entry.type,
      entry.description,
      entry.amount,
      entry.customerId || null,
      entry.customerName || null,
      entry.recurring || false,
    ]);

    return result.id;
  } catch (error) {
    console.error('[Financials] Failed to record revenue:', error);
    return null;
  }
}

/**
 * Record an expense (non-GCP, non-API)
 */
export async function recordExpense(entry: {
  date: string;
  category: string;
  description: string;
  amount: number;
  vendor?: string;
  recurring?: boolean;
}): Promise<string | null> {
  try {
    const result = await insert<{ id: string }>(`
      INSERT INTO other_expenses (date, category, description, amount, vendor, recurring)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      entry.date,
      entry.category,
      entry.description,
      entry.amount,
      entry.vendor || null,
      entry.recurring || false,
    ]);

    return result.id;
  } catch (error) {
    console.error('[Financials] Failed to record expense:', error);
    return null;
  }
}

// =============================================================================
// FINANCIAL SUMMARY
// =============================================================================

/**
 * Get comprehensive financial summary
 */
export async function getFinancialSummary(days: number = 30): Promise<FinancialSummary> {
  try {
    // Get GCP and API cost breakdowns
    const [gcp, api] = await Promise.all([
      getGCPCostSummary(days),
      getAPICostSummary(days),
    ]);

    // Get revenue data
    const revenue = await getRevenueSummary();

    // Get other expenses
    const otherExpenses = await getOtherExpenses();

    // Calculate totals
    const infrastructureCost = gcp.thisMonth;
    const apiCost = api.thisMonth;
    const totalExpenses = infrastructureCost + apiCost + otherExpenses.thisMonth;

    const profit = {
      thisMonth: revenue.thisMonth - totalExpenses,
      lastMonth: revenue.lastMonth - (gcp.lastMonth + api.lastMonth + otherExpenses.lastMonth),
      margin: revenue.thisMonth > 0 ? ((revenue.thisMonth - totalExpenses) / revenue.thisMonth) * 100 : 0,
    };

    // Calculate burn rate (expenses minus revenue)
    const netBurn = Math.max(0, totalExpenses - revenue.thisMonth);
    const daysInMonth = new Date().getDate();

    const burnRate = {
      monthly: netBurn,
      daily: daysInMonth > 0 ? netBurn / daysInMonth : 0,
    };

    // Runway calculation (assuming some cash balance)
    // In production, this would come from actual bank balance
    const cashBalance = 50000; // Default starting cash (would be configurable)
    const runway = {
      months: burnRate.monthly > 0 ? cashBalance / burnRate.monthly : Infinity,
      cashBalance,
    };

    // Build expense history
    const expenseHistory = buildExpenseHistory(gcp.history, api.history, days);

    return {
      revenue: {
        ...revenue,
        history: revenue.history,
      },
      expenses: {
        thisMonth: totalExpenses,
        lastMonth: gcp.lastMonth + api.lastMonth + otherExpenses.lastMonth,
        infrastructure: infrastructureCost,
        apis: apiCost,
        other: otherExpenses.thisMonth,
        history: expenseHistory,
      },
      profit,
      burnRate,
      runway,
      breakdown: {
        gcp,
        api,
      },
    };
  } catch (error) {
    console.error('[Financials] Failed to get summary:', error);

    // Return empty summary
    return {
      revenue: {
        thisMonth: 0,
        lastMonth: 0,
        mrr: 0,
        arr: 0,
        history: [],
      },
      expenses: {
        thisMonth: 0,
        lastMonth: 0,
        infrastructure: 0,
        apis: 0,
        other: 0,
        history: [],
      },
      profit: { thisMonth: 0, lastMonth: 0, margin: 0 },
      burnRate: { monthly: 0, daily: 0 },
      runway: { months: Infinity, cashBalance: 0 },
      breakdown: {
        gcp: {
          today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0,
          byService: {}, history: [], breakdown: [],
        },
        api: {
          today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0,
          byProvider: {
            openai: { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 },
            apollo: { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 },
            serp: { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, callCount: 0 },
          },
          history: [],
          topOperations: [],
        },
      },
    };
  }
}

/**
 * Get revenue summary
 */
async function getRevenueSummary(): Promise<{
  thisMonth: number;
  lastMonth: number;
  mrr: number;
  arr: number;
  history: Array<{ date: string; amount: number }>;
}> {
  try {
    // This month revenue
    const thisMonth = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM revenue
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Last month revenue
    const lastMonth = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM revenue
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND date < DATE_TRUNC('month', CURRENT_DATE)
    `);

    // MRR (recurring revenue this month)
    const mrr = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM revenue
      WHERE recurring = true
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Daily history
    const history = await query<{ date: Date; total: string }>(`
      SELECT date, SUM(amount) as total
      FROM revenue
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    const mrrValue = parseFloat(mrr?.total || '0');

    return {
      thisMonth: parseFloat(thisMonth?.total || '0'),
      lastMonth: parseFloat(lastMonth?.total || '0'),
      mrr: mrrValue,
      arr: mrrValue * 12,
      history: history.map(h => ({
        date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : String(h.date),
        amount: parseFloat(h.total) || 0,
      })),
    };
  } catch (error) {
    console.log('[Financials] Revenue query failed:', error);
    return { thisMonth: 0, lastMonth: 0, mrr: 0, arr: 0, history: [] };
  }
}

/**
 * Get other expenses (non-GCP, non-API)
 */
async function getOtherExpenses(): Promise<{
  thisMonth: number;
  lastMonth: number;
}> {
  try {
    const thisMonth = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM other_expenses
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    const lastMonth = await queryOne<{ total: string }>(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM other_expenses
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND date < DATE_TRUNC('month', CURRENT_DATE)
    `);

    return {
      thisMonth: parseFloat(thisMonth?.total || '0'),
      lastMonth: parseFloat(lastMonth?.total || '0'),
    };
  } catch (error) {
    console.log('[Financials] Other expenses query failed:', error);
    return { thisMonth: 0, lastMonth: 0 };
  }
}

/**
 * Build combined expense history from GCP and API histories
 */
function buildExpenseHistory(
  gcpHistory: Array<{ date: string; amount: number }>,
  apiHistory: Array<{ date: string; openai: number; apollo: number; serp: number; total: number }>,
  days: number
): Array<{ date: string; amount: number }> {
  const dateMap = new Map<string, number>();

  // Add GCP costs
  gcpHistory.forEach(h => {
    dateMap.set(h.date, (dateMap.get(h.date) || 0) + h.amount);
  });

  // Add API costs
  apiHistory.forEach(h => {
    dateMap.set(h.date, (dateMap.get(h.date) || 0) + h.total);
  });

  // Fill missing dates
  const result: Array<{ date: string; amount: number }> = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    result.push({
      date: dateStr,
      amount: dateMap.get(dateStr) || 0,
    });
  }

  return result;
}

// =============================================================================
// SEED DATA
// =============================================================================

/**
 * Seed sample revenue for demo
 */
export async function seedSampleRevenue(): Promise<void> {
  const today = new Date();

  // Sample pilot/early customer revenue
  const entries = [
    { daysAgo: 25, type: 'pilot', description: 'Pilot - Bank Alpha (EB)', amount: 2500, recurring: true },
    { daysAgo: 20, type: 'pilot', description: 'Pilot - Bank Beta (CB)', amount: 3000, recurring: true },
    { daysAgo: 15, type: 'one-time', description: 'Setup fee - Bank Alpha', amount: 1000, recurring: false },
    { daysAgo: 10, type: 'subscription', description: 'Subscription - Bank Gamma', amount: 5000, recurring: true },
    { daysAgo: 5, type: 'subscription', description: 'Subscription - Bank Alpha (upgrade)', amount: 5000, recurring: true },
  ];

  for (const entry of entries) {
    const date = new Date(today);
    date.setDate(date.getDate() - entry.daysAgo);

    await recordRevenue({
      date: date.toISOString().split('T')[0],
      type: entry.type as 'pilot' | 'subscription' | 'one-time',
      description: entry.description,
      amount: entry.amount,
      recurring: entry.recurring,
    });
  }

  console.log('[Financials] Seeded sample revenue');
}
