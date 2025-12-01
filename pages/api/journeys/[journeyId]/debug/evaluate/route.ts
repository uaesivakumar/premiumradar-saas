/**
 * Debug Expression Evaluation API
 * Sprint S53: Journey Debugger
 *
 * POST - Evaluate expression in context
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import type { WatchEvaluation } from '@/lib/journey-debugger';
import { createWatchEvaluator } from '@/lib/journey-debugger';

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

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  return handleEvaluate(req, res, journeyId);
}

// =============================================================================
// HANDLER
// =============================================================================

/**
 * Evaluate expression(s) in context
 */
async function handleEvaluate(
  req: NextApiRequest,
  res: NextApiResponse,
  journeyId: string
) {
  try {
    const {
      expression,
      expressions,
      context,
    } = req.body as {
      expression?: string;
      expressions?: string[];
      context: Record<string, unknown>;
    };

    if (!context) {
      return res.status(400).json({ error: 'Context required' });
    }

    if (!expression && (!expressions || expressions.length === 0)) {
      return res.status(400).json({ error: 'Expression(s) required' });
    }

    const evaluator = createWatchEvaluator();

    // Single expression
    if (expression) {
      const result = evaluator.evaluateSingle(expression, context);
      return res.status(200).json({
        success: true,
        evaluation: serializeEvaluation(result),
      });
    }

    // Multiple expressions
    if (expressions) {
      const results: WatchEvaluation[] = [];

      for (const expr of expressions) {
        const result = evaluator.evaluateSingle(expr, context);
        results.push(result);
      }

      return res.status(200).json({
        success: true,
        evaluations: results.map(serializeEvaluation),
      });
    }

    return res.status(400).json({ error: 'Expression(s) required' });
  } catch (error) {
    console.error('Failed to evaluate expression:', error);
    return res.status(500).json({
      error: 'Failed to evaluate expression',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function serializeEvaluation(evaluation: WatchEvaluation) {
  return {
    ...evaluation,
    evaluatedAt: evaluation.evaluatedAt.toISOString(),
    // Safely serialize value
    value: serializeValue(evaluation.value),
  };
}

function serializeValue(value: unknown): unknown {
  if (value === undefined) return { __type: 'undefined' };
  if (value === null) return null;
  if (typeof value === 'function') return { __type: 'function', name: value.name || 'anonymous' };
  if (value instanceof Date) return { __type: 'date', value: value.toISOString() };
  if (value instanceof Error) return { __type: 'error', message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeValue(v);
    }
    return result;
  }
  return value;
}
