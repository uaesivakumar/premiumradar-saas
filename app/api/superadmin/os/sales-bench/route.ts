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

      case 'scenarios': {
        if (!suiteKey) {
          return NextResponse.json({ error: 'suite_key required' }, { status: 400 });
        }
        // Fetch scenarios for this suite from OS
        const osBaseUrl = process.env.UPR_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app';
        const scenariosRes = await fetch(
          `${osBaseUrl}/api/os/sales-bench/suites/${suiteKey}/scenarios`,
          {
            headers: {
              'x-pr-os-token': process.env.PR_OS_TOKEN || '',
              'X-Request-Source': 'saas-superadmin',
            },
          }
        );
        const scenariosData = await scenariosRes.json();
        return NextResponse.json(scenariosData);
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

      case 'run-results': {
        if (!suiteKey) {
          return NextResponse.json({ error: 'suite_key required' }, { status: 400 });
        }
        const runId = searchParams.get('run_id');
        if (!runId) {
          return NextResponse.json({ error: 'run_id required' }, { status: 400 });
        }
        // Fetch run results from OS
        const osBaseUrl = process.env.UPR_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app';
        const resultsRes = await fetch(
          `${osBaseUrl}/api/os/sales-bench/suites/${suiteKey}/runs/${runId}/results`,
          {
            headers: {
              'x-pr-os-token': process.env.PR_OS_TOKEN || '',
              'X-Request-Source': 'saas-superadmin',
            },
          }
        );
        const resultsData = await resultsRes.json();
        return NextResponse.json(resultsData);
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
        // Accept either evaluator_emails array or evaluator_count
        const emails = body.evaluator_emails || [];
        const count = body.evaluator_count || emails.length;

        if (count < 2) {
          return NextResponse.json(
            { error: 'At least 2 evaluators required (provide evaluator_emails or evaluator_count)' },
            { status: 400 }
          );
        }
        const result = await salesBench.startHumanCalibration({
          suite_key,
          session_name: body.session_name,
          evaluator_count: count,
          evaluator_emails: emails,
          deadline_days: body.deadline_days || 7,
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
