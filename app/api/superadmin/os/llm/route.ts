/**
 * Super Admin LLM Config API
 *
 * Proxies to UPR OS LLM Router APIs (S51).
 * Provides Super Admin with control over:
 * - LLM Providers & Models
 * - Model Selection (selectModel)
 * - Fallback Chains
 * - Task Mappings
 * - Cost Tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { llm } from '@/lib/os/os-client';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/os/llm
 * Get LLM overview - providers, models, costs
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'models': {
        const result = await llm.listModels();
        return NextResponse.json(result);
      }

      case 'model': {
        const slug = searchParams.get('slug');
        if (!slug) {
          return NextResponse.json({ error: 'Model slug required' }, { status: 400 });
        }
        const result = await llm.getModel(slug);
        return NextResponse.json(result);
      }

      case 'fallback-chains': {
        const taskType = searchParams.get('task_type') || undefined;
        const vertical = searchParams.get('vertical') || undefined;
        const result = await llm.getFallbackChains(taskType, vertical);
        return NextResponse.json(result);
      }

      case 'task-mappings': {
        const result = await llm.getTaskMappings();
        return NextResponse.json(result);
      }

      case 'costs': {
        const result = await llm.getCosts({
          start_date: searchParams.get('start_date') || undefined,
          end_date: searchParams.get('end_date') || undefined,
          group_by: searchParams.get('group_by') || undefined,
        });
        return NextResponse.json(result);
      }

      case 'benchmarks': {
        const model = searchParams.get('model') || undefined;
        const result = await llm.getBenchmarks(model);
        return NextResponse.json(result);
      }

      case 'health': {
        const checkProviders = searchParams.get('check_providers') === 'true';
        const result = await llm.health(checkProviders);
        return NextResponse.json(result);
      }

      default: {
        // Return overview
        const [models, costs, health] = await Promise.all([
          llm.listModels(),
          llm.getCosts(),
          llm.health(true),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            models: models.data,
            costs: costs.data,
            health: health.data,
          },
        });
      }
    }
  } catch (error) {
    console.error('[SuperAdmin:LLM] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LLM config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/os/llm
 * Execute LLM operations - select model, complete, etc.
 */
export async function POST(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'select': {
        const result = await llm.selectModel({
          task_type: body.task_type,
          vertical: body.vertical,
          prefer_quality: body.prefer_quality,
          max_cost_per_1k: body.max_cost_per_1k,
          requires_vision: body.requires_vision,
          requires_functions: body.requires_functions,
          requires_json: body.requires_json,
        });
        return NextResponse.json(result);
      }

      case 'complete': {
        const result = await llm.complete({
          messages: body.messages,
          task_type: body.task_type,
          vertical: body.vertical,
          model: body.model,
          options: body.options,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: select, complete' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[SuperAdmin:LLM] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute LLM operation' },
      { status: 500 }
    );
  }
}
