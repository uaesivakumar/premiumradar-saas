/**
 * Super Admin Sales-Bench Governance API
 *
 * Authority: OS (execution)
 * Visibility: Super Admin (read-only + trigger)
 *
 * Proxies governance commands to UPR OS Sales-Bench APIs.
 * Super Admin can:
 * - View suite status and history (read-only)
 * - Trigger validation runs (OS executes)
 * - Start human calibration (OS executes)
 * - Approve for GA (after human validation)
 *
 * Super Admin CANNOT:
 * - Modify scenarios (immutable)
 * - Edit run results (append-only)
 * - Bypass validation gates
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import { salesBench } from '@/lib/os/os-client';

async function verifyAuth(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return verifySession(ip, userAgent);
}

/**
 * GET /api/superadmin/os/sales-bench
 * Get governance dashboard, suite list, or specific suite details
 */
export async function GET(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const suiteKey = searchParams.get('suite_key');

    switch (action) {
      case 'dashboard': {
        const result = await salesBench.getDashboard();
        return NextResponse.json(result);
      }

      case 'status': {
        const result = await salesBench.getGovernanceStatus();
        return NextResponse.json(result);
      }

      case 'commands': {
        const result = await salesBench.getCommands();
        return NextResponse.json(result);
      }

      case 'suite': {
        if (!suiteKey) {
          return NextResponse.json({ error: 'suite_key required' }, { status: 400 });
        }
        const result = await salesBench.getSuite(suiteKey);
        return NextResponse.json(result);
      }

      case 'suite-status': {
        if (!suiteKey) {
          return NextResponse.json({ error: 'suite_key required' }, { status: 400 });
        }
        const result = await salesBench.getSuiteStatus(suiteKey);
        return NextResponse.json(result);
      }

      case 'history': {
        if (!suiteKey) {
          return NextResponse.json({ error: 'suite_key required' }, { status: 400 });
        }
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');
        const result = await salesBench.getSuiteHistory(suiteKey, {
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined,
        });
        return NextResponse.json(result);
      }

      case 'audit': {
        if (!suiteKey) {
          return NextResponse.json({ error: 'suite_key required' }, { status: 400 });
        }
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');
        const result = await salesBench.getSuiteAudit(suiteKey, {
          limit: limit ? parseInt(limit) : undefined,
          offset: offset ? parseInt(offset) : undefined,
        });
        return NextResponse.json(result);
      }

      default: {
        // Default: list all suites
        const vertical = searchParams.get('vertical') || undefined;
        const sub_vertical = searchParams.get('sub_vertical') || undefined;
        const region = searchParams.get('region') || undefined;
        const status = searchParams.get('status') || undefined;
        const frozen_only = searchParams.get('frozen_only') === 'true';

        const result = await salesBench.listSuites({
          vertical,
          sub_vertical,
          region,
          status,
          frozen_only,
        });
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error('[SuperAdmin:SalesBench] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Sales-Bench data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/os/sales-bench
 * Execute governance commands (Super Admin triggers, OS executes)
 */
export async function POST(request: NextRequest) {
  const session = await verifyAuth(request);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { command, suite_key } = body;

    if (!command) {
      return NextResponse.json(
        { error: 'Command required. Use: run-system-validation, start-human-calibration, approve-for-ga, deprecate-suite' },
        { status: 400 }
      );
    }

    if (!suite_key) {
      return NextResponse.json(
        { error: 'suite_key required' },
        { status: 400 }
      );
    }

    // Get actor from session
    const triggeredBy = session.session?.email || 'SUPER_ADMIN';

    switch (command) {
      case 'run-system-validation': {
        const result = await salesBench.runSystemValidation({
          suite_key,
          run_mode: body.run_mode || 'FULL',
          triggered_by: triggeredBy,
          environment: body.environment || 'PRODUCTION',
        });
        return NextResponse.json(result);
      }

      case 'start-human-calibration': {
        if (!body.evaluator_count || body.evaluator_count < 2) {
          return NextResponse.json(
            { error: 'evaluator_count required (minimum 2)' },
            { status: 400 }
          );
        }
        const result = await salesBench.startHumanCalibration({
          suite_key,
          session_name: body.session_name,
          evaluator_count: body.evaluator_count,
          triggered_by: triggeredBy,
        });
        return NextResponse.json(result);
      }

      case 'approve-for-ga': {
        if (!body.approval_notes) {
          return NextResponse.json(
            { error: 'approval_notes required' },
            { status: 400 }
          );
        }
        const result = await salesBench.approveForGA({
          suite_key,
          approved_by: triggeredBy,
          approval_notes: body.approval_notes,
        });
        return NextResponse.json(result);
      }

      case 'deprecate-suite': {
        if (!body.deprecation_reason) {
          return NextResponse.json(
            { error: 'deprecation_reason required' },
            { status: 400 }
          );
        }
        const result = await salesBench.deprecateSuite({
          suite_key,
          deprecated_by: triggeredBy,
          deprecation_reason: body.deprecation_reason,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown command: ${command}. Use: run-system-validation, start-human-calibration, approve-for-ga, deprecate-suite` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[SuperAdmin:SalesBench] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to execute Sales-Bench command' },
      { status: 500 }
    );
  }
}
