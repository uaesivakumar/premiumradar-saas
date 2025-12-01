/**
 * Journey Debug API
 * Sprint S53: Journey Debugger
 *
 * POST - Start debug session
 * GET - Get session status
 * DELETE - Stop session
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import type { DebugSession, DebugSessionConfig } from '@/lib/journey-debugger';
import { generateDebugId, DEFAULT_DEBUG_CONFIG } from '@/lib/journey-debugger';

// In-memory session store (in production, use Redis or similar)
const sessions = new Map<string, DebugSession>();

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
    case 'POST':
      return handleStartSession(req, res, journeyId);
    case 'GET':
      return handleGetSession(req, res, journeyId);
    case 'DELETE':
      return handleStopSession(req, res, journeyId);
    default:
      res.setHeader('Allow', ['POST', 'GET', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * Start a new debug session
 */
async function handleStartSession(
  req: NextApiRequest,
  res: NextApiResponse,
  journeyId: string
) {
  try {
    const {
      runId,
      config,
      initialContext,
    } = req.body as {
      runId?: string;
      config?: Partial<DebugSessionConfig>;
      initialContext?: Record<string, unknown>;
    };

    // Check for existing session
    const existingSession = findSessionByJourney(journeyId);
    if (existingSession) {
      return res.status(409).json({
        error: 'Session already exists',
        sessionId: existingSession.id,
      });
    }

    // Create new session
    const session: DebugSession = {
      id: generateDebugId('session'),
      journeyId,
      runId,
      status: 'starting',
      currentStepId: null,
      currentStepIndex: -1,
      callStack: [],
      breakpoints: [],
      watchExpressions: [],
      context: initialContext || {},
      startedAt: new Date(),
    };

    sessions.set(session.id, session);

    // In real implementation, would load journey steps here
    // and initialize the debug engine

    // Update status to paused (ready for debugging)
    session.status = 'paused';
    session.pausedAt = new Date();

    return res.status(201).json({
      success: true,
      session: serializeSession(session),
    });
  } catch (error) {
    console.error('Failed to start debug session:', error);
    return res.status(500).json({
      error: 'Failed to start debug session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get debug session status
 */
async function handleGetSession(
  req: NextApiRequest,
  res: NextApiResponse,
  journeyId: string
) {
  try {
    const { sessionId } = req.query as { sessionId?: string };

    let session: DebugSession | undefined;

    if (sessionId) {
      session = sessions.get(sessionId);
    } else {
      session = findSessionByJourney(journeyId);
    }

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json({
      success: true,
      session: serializeSession(session),
    });
  } catch (error) {
    console.error('Failed to get debug session:', error);
    return res.status(500).json({
      error: 'Failed to get debug session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Stop debug session
 */
async function handleStopSession(
  req: NextApiRequest,
  res: NextApiResponse,
  journeyId: string
) {
  try {
    const { sessionId } = req.query as { sessionId?: string };

    let session: DebugSession | undefined;
    let sessionKey: string | undefined;

    if (sessionId) {
      session = sessions.get(sessionId);
      sessionKey = sessionId;
    } else {
      session = findSessionByJourney(journeyId);
      sessionKey = session?.id;
    }

    if (!session || !sessionKey) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update status and remove
    session.status = 'completed';
    sessions.delete(sessionKey);

    return res.status(200).json({
      success: true,
      message: 'Session stopped',
    });
  } catch (error) {
    console.error('Failed to stop debug session:', error);
    return res.status(500).json({
      error: 'Failed to stop debug session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function findSessionByJourney(journeyId: string): DebugSession | undefined {
  for (const session of sessions.values()) {
    if (session.journeyId === journeyId && session.status !== 'completed') {
      return session;
    }
  }
  return undefined;
}

function serializeSession(session: DebugSession) {
  return {
    ...session,
    startedAt: session.startedAt.toISOString(),
    pausedAt: session.pausedAt?.toISOString(),
  };
}

// =============================================================================
// DEBUG ACTIONS API
// =============================================================================

export async function handleDebugAction(
  sessionId: string,
  action: 'continue' | 'step_over' | 'step_into' | 'step_out' | 'restart' | 'pause'
): Promise<DebugSession | null> {
  const session = sessions.get(sessionId);
  if (!session) return null;

  switch (action) {
    case 'continue':
      session.status = 'running';
      break;
    case 'pause':
      session.status = 'paused';
      session.pausedAt = new Date();
      break;
    case 'step_over':
    case 'step_into':
    case 'step_out':
      session.status = 'stepping';
      break;
    case 'restart':
      session.currentStepIndex = -1;
      session.currentStepId = null;
      session.callStack = [];
      session.status = 'paused';
      session.pausedAt = new Date();
      break;
  }

  return session;
}
