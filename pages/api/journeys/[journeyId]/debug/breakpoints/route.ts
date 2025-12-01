/**
 * Debug Breakpoints API
 * Sprint S53: Journey Debugger
 *
 * GET - List breakpoints
 * POST - Add breakpoint
 * PUT - Update breakpoint
 * DELETE - Remove breakpoint
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Breakpoint, BreakpointType } from '@/lib/journey-debugger';
import { generateDebugId } from '@/lib/journey-debugger';

// In-memory breakpoint store (in production, persist to database)
const breakpointStore = new Map<string, Breakpoint[]>();

// =============================================================================
// API HANDLER
// =============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { journeyId } = req.query as { journeyId: string };

  if (!journeyId) {
    return res.status(400).json({ error: 'Journey ID required' });
  }

  switch (req.method) {
    case 'GET':
      return handleListBreakpoints(req, res, journeyId);
    case 'POST':
      return handleAddBreakpoint(req, res, journeyId);
    case 'PUT':
      return handleUpdateBreakpoint(req, res, journeyId);
    case 'DELETE':
      return handleRemoveBreakpoint(req, res, journeyId);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * List all breakpoints for journey
 */
async function handleListBreakpoints(
  req: NextApiRequest,
  res: NextApiResponse,
  journeyId: string
) {
  try {
    const { stepId, enabled } = req.query as {
      stepId?: string;
      enabled?: string;
    };

    let breakpoints = breakpointStore.get(journeyId) || [];

    // Filter by stepId if provided
    if (stepId) {
      breakpoints = breakpoints.filter((bp) => bp.stepId === stepId);
    }

    // Filter by enabled if provided
    if (enabled !== undefined) {
      const isEnabled = enabled === 'true';
      breakpoints = breakpoints.filter((bp) => bp.enabled === isEnabled);
    }

    return res.status(200).json({
      success: true,
      breakpoints: breakpoints.map(serializeBreakpoint),
      total: breakpoints.length,
    });
  } catch (error) {
    console.error('Failed to list breakpoints:', error);
    return res.status(500).json({
      error: 'Failed to list breakpoints',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Add a new breakpoint
 */
async function handleAddBreakpoint(
  req: NextApiRequest,
  res: NextApiResponse,
  journeyId: string
) {
  try {
    const {
      type,
      stepId,
      stepIndex,
      condition,
      logMessage,
      contextKey,
      hitCondition,
      enabled,
    } = req.body as {
      type: BreakpointType;
      stepId?: string;
      stepIndex?: number;
      condition?: string;
      logMessage?: string;
      contextKey?: string;
      hitCondition?: string;
      enabled?: boolean;
    };

    if (!type) {
      return res.status(400).json({ error: 'Breakpoint type required' });
    }

    // Validate type-specific requirements
    if (type === 'step' && !stepId) {
      return res.status(400).json({ error: 'Step ID required for step breakpoint' });
    }
    if (type === 'conditional' && !condition) {
      return res.status(400).json({ error: 'Condition required for conditional breakpoint' });
    }
    if (type === 'logpoint' && !logMessage) {
      return res.status(400).json({ error: 'Log message required for logpoint' });
    }
    if (type === 'context_change' && !contextKey) {
      return res.status(400).json({ error: 'Context key required for context change breakpoint' });
    }

    const breakpoint: Breakpoint = {
      id: generateDebugId('bp'),
      journeyId,
      type,
      stepId,
      stepIndex,
      condition,
      logMessage,
      contextKey,
      hitCondition,
      enabled: enabled ?? true,
      hitCount: 0,
      createdAt: new Date(),
    };

    // Add to store
    const journeyBreakpoints = breakpointStore.get(journeyId) || [];
    journeyBreakpoints.push(breakpoint);
    breakpointStore.set(journeyId, journeyBreakpoints);

    return res.status(201).json({
      success: true,
      breakpoint: serializeBreakpoint(breakpoint),
    });
  } catch (error) {
    console.error('Failed to add breakpoint:', error);
    return res.status(500).json({
      error: 'Failed to add breakpoint',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Update a breakpoint
 */
async function handleUpdateBreakpoint(
  req: NextApiRequest,
  res: NextApiResponse,
  journeyId: string
) {
  try {
    const { breakpointId } = req.query as { breakpointId?: string };
    const updates = req.body as Partial<Omit<Breakpoint, 'id' | 'journeyId' | 'createdAt'>>;

    if (!breakpointId) {
      return res.status(400).json({ error: 'Breakpoint ID required' });
    }

    const journeyBreakpoints = breakpointStore.get(journeyId) || [];
    const index = journeyBreakpoints.findIndex((bp) => bp.id === breakpointId);

    if (index === -1) {
      return res.status(404).json({ error: 'Breakpoint not found' });
    }

    // Update breakpoint
    journeyBreakpoints[index] = {
      ...journeyBreakpoints[index],
      ...updates,
    };
    breakpointStore.set(journeyId, journeyBreakpoints);

    return res.status(200).json({
      success: true,
      breakpoint: serializeBreakpoint(journeyBreakpoints[index]),
    });
  } catch (error) {
    console.error('Failed to update breakpoint:', error);
    return res.status(500).json({
      error: 'Failed to update breakpoint',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Remove a breakpoint
 */
async function handleRemoveBreakpoint(
  req: NextApiRequest,
  res: NextApiResponse,
  journeyId: string
) {
  try {
    const { breakpointId, all } = req.query as {
      breakpointId?: string;
      all?: string;
    };

    if (all === 'true') {
      // Remove all breakpoints for journey
      breakpointStore.delete(journeyId);
      return res.status(200).json({
        success: true,
        message: 'All breakpoints removed',
      });
    }

    if (!breakpointId) {
      return res.status(400).json({ error: 'Breakpoint ID required' });
    }

    const journeyBreakpoints = breakpointStore.get(journeyId) || [];
    const filtered = journeyBreakpoints.filter((bp) => bp.id !== breakpointId);

    if (filtered.length === journeyBreakpoints.length) {
      return res.status(404).json({ error: 'Breakpoint not found' });
    }

    breakpointStore.set(journeyId, filtered);

    return res.status(200).json({
      success: true,
      message: 'Breakpoint removed',
    });
  } catch (error) {
    console.error('Failed to remove breakpoint:', error);
    return res.status(500).json({
      error: 'Failed to remove breakpoint',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function serializeBreakpoint(breakpoint: Breakpoint) {
  return {
    ...breakpoint,
    createdAt: breakpoint.createdAt.toISOString(),
  };
}
