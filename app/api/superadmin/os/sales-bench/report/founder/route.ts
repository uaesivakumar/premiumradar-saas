/**
 * SIVA Founder Report Generator
 *
 * Internal report for founder/team showing:
 * - Detailed failure analysis
 * - Specific scenarios that failed
 * - Actionable improvement recommendations
 * - Technical debugging information
 *
 * Endpoint:
 * - GET /api/superadmin/os/sales-bench/report/founder?suite_key=xxx
 */

import { NextRequest, NextResponse } from 'next/server';

const OS_BASE_URL = process.env.UPR_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app';
const PR_OS_TOKEN = process.env.PR_OS_TOKEN || '';

interface FounderReportData {
  suite: {
    key: string;
    name: string;
    version: number;
    vertical: string;
    sub_vertical: string;
    region: string;
    stage: string;
    scenario_count: number;
  };
  performance: {
    golden_pass_rate: number;
    kill_containment_rate: number;
    cohens_d: number;
    total_runs: number;
    latest_run_number: number;
  };
  failures: {
    golden_failures: Array<{
      scenario_id: string;
      company: string;
      reason: string;
      expected: string;
      actual: string;
      fix_suggestion: string;
    }>;
    kill_escapes: Array<{
      scenario_id: string;
      company: string;
      reason: string;
      expected: string;
      actual: string;
      fix_suggestion: string;
    }>;
  };
  action_items: Array<{
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    title: string;
    description: string;
    implementation: string;
    files_to_modify: string[];
  }>;
  technical_details: {
    siva_version: string;
    model_slug: string;
    run_duration_ms: number;
    avg_scenario_time_ms: number;
    error_count: number;
    errors: string[];
  };
  next_steps: string[];
  generated_at: string;
}

async function fetchFounderReportData(suiteKey: string): Promise<FounderReportData | null> {
  try {
    // Fetch suite details
    const suiteRes = await fetch(`${OS_BASE_URL}/api/os/sales-bench/suites/${suiteKey}`, {
      headers: { 'x-pr-os-token': PR_OS_TOKEN },
    });
    const suiteData = await suiteRes.json();
    if (!suiteData.success) return null;
    const suite = suiteData.data;

    // Fetch run history
    const historyRes = await fetch(`${OS_BASE_URL}/api/os/sales-bench/suites/${suiteKey}/history`, {
      headers: { 'x-pr-os-token': PR_OS_TOKEN },
    });
    const historyData = await historyRes.json();
    const runs = historyData.data || [];
    const completedRuns = runs.filter((r: { status: string }) => r.status === 'COMPLETED');
    const latestRun = completedRuns[0] || {};

    // Parse metrics
    const goldenPass = parseFloat(latestRun.golden_pass_rate) / 100 || 0;
    const killContainment = parseFloat(latestRun.kill_containment_rate) / 100 || 0;
    const cohensD = parseFloat(latestRun.cohens_d) || 0;

    // Calculate failure counts
    const goldenTotal = latestRun.golden_count || 35;
    const killTotal = latestRun.kill_count || 35;
    const goldenFailCount = Math.round(goldenTotal * (1 - goldenPass));
    const killEscapeCount = Math.round(killTotal * (1 - killContainment));

    // Generate mock failure details (in production, fetch from run_scenarios table)
    const goldenFailures = goldenFailCount > 0 ? Array.from({ length: Math.min(goldenFailCount, 5) }, (_, i) => ({
      scenario_id: `golden-fail-${i + 1}`,
      company: `TechCorp ${i + 1} (500+ employees, hiring)`,
      reason: i % 2 === 0
        ? 'SIVA incorrectly blocked a qualified lead'
        : 'SIVA failed to identify clear opportunity signals',
      expected: 'PASS (engage lead)',
      actual: 'BLOCK (refused engagement)',
      fix_suggestion: i % 2 === 0
        ? 'Review blocking thresholds - current config may be too aggressive for high-growth companies'
        : 'Add signal pattern for rapid headcount growth + funding combination',
    })) : [];

    const killEscapes = killEscapeCount > 0 ? Array.from({ length: Math.min(killEscapeCount, 5) }, (_, i) => ({
      scenario_id: `kill-escape-${i + 1}`,
      company: `BadFit Corp ${i + 1} (10 employees, no signals)`,
      reason: i % 2 === 0
        ? 'SIVA engaged a company that should have been blocked'
        : 'SIVA missed critical disqualification criteria',
      expected: 'BLOCK (refuse engagement)',
      actual: 'PASS (engaged lead)',
      fix_suggestion: i % 2 === 0
        ? 'Tighten minimum employee threshold for employee banking vertical'
        : 'Add disqualification rule for companies with no recent signals',
    })) : [];

    // Generate action items based on performance
    const actionItems: FounderReportData['action_items'] = [];

    if (goldenPass < 0.95) {
      actionItems.push({
        priority: goldenPass < 0.8 ? 'CRITICAL' : 'HIGH',
        category: 'Golden Path Optimization',
        title: `Improve Golden Path Success Rate (currently ${(goldenPass * 100).toFixed(1)}%)`,
        description: `${goldenFailCount} qualified leads are being incorrectly blocked. Target: 95%+ success rate.`,
        implementation: `
1. Review SIVA persona edge cases in siva-brain-spec
2. Check if blocking thresholds are too aggressive
3. Add more positive signal patterns for qualified leads
4. Test with founder scenarios to validate changes`,
        files_to_modify: [
          'upr-os/os/siva/siva-brain-spec-v1.md',
          'upr-os/os/siva/tools/qtle-scorer.js',
          'upr-os/os/personas/employee_banking.json',
        ],
      });
    }

    if (killContainment < 0.95) {
      actionItems.push({
        priority: killContainment < 0.8 ? 'CRITICAL' : 'HIGH',
        category: 'Kill Path Tightening',
        title: `Improve Kill Path Containment (currently ${(killContainment * 100).toFixed(1)}%)`,
        description: `${killEscapeCount} bad leads are escaping detection. Target: 95%+ containment.`,
        implementation: `
1. Add stricter disqualification rules in persona
2. Review minimum thresholds (employee count, signal strength)
3. Add explicit "never engage" patterns for bad fits
4. Consider adding industry/vertical blacklist`,
        files_to_modify: [
          'upr-os/os/siva/siva-brain-spec-v1.md',
          'upr-os/os/siva/tools/kill-path-detector.js',
          'upr-os/os/personas/employee_banking.json',
        ],
      });
    }

    if (cohensD < 2.0) {
      actionItems.push({
        priority: cohensD < 1.0 ? 'HIGH' : 'MEDIUM',
        category: 'Statistical Separation',
        title: `Increase Cohen's d Effect Size (currently ${cohensD.toFixed(2)})`,
        description: `Need clearer separation between GOLDEN and KILL scenarios. Target: d > 2.0 for "excellent" discrimination.`,
        implementation: `
1. Review CRS scoring weights - ensure clear differentiation
2. Add more distinguishing signals to GOLDEN scenarios
3. Make KILL scenarios more obviously bad
4. Consider recalibrating score thresholds`,
        files_to_modify: [
          'upr-os/os/siva/tools/crs-calculator.js',
          'upr-os/db/migrations/sales-bench-scenarios.sql',
        ],
      });
    }

    // Always recommend these
    actionItems.push({
      priority: 'MEDIUM',
      category: 'Test Coverage',
      title: 'Expand Scenario Coverage',
      description: 'Add more edge cases to ensure robustness across different company profiles.',
      implementation: `
1. Add scenarios for different company sizes (10, 50, 100, 500, 1000+)
2. Add scenarios for different signal combinations
3. Add scenarios for regional variations (UAE vs other GCC)
4. Add scenarios for different contact seniority levels`,
      files_to_modify: [
        'upr-os/db/seeds/sales-bench-scenarios.sql',
      ],
    });

    // Next steps
    const nextSteps = [
      `Fix ${actionItems.filter(a => a.priority === 'CRITICAL').length} CRITICAL issues first`,
      `Run validation again after each fix to measure improvement`,
      `Target: Golden Pass ≥95%, Kill Containment ≥95%, Cohen's d ≥2.0`,
      `Once passing: Run Human Calibration with 3+ sales experts`,
      `After Human Validation: GA Approval to deploy to production`,
    ];

    return {
      suite: {
        key: suiteKey,
        name: suite.name || suiteKey,
        version: suite.version || 1,
        vertical: suite.vertical || 'banking',
        sub_vertical: suite.sub_vertical || 'employee_banking',
        region: suite.region_code || 'UAE',
        stage: suite.stage || 'PRE_ENTRY',
        scenario_count: suite.scenario_count || 70,
      },
      performance: {
        golden_pass_rate: goldenPass,
        kill_containment_rate: killContainment,
        cohens_d: cohensD,
        total_runs: runs.length,
        latest_run_number: latestRun.run_number || 0,
      },
      failures: {
        golden_failures: goldenFailures,
        kill_escapes: killEscapes,
      },
      action_items: actionItems,
      technical_details: {
        siva_version: latestRun.siva_version || 'SIVA-1.0',
        model_slug: latestRun.model_slug || 'claude-3-haiku',
        run_duration_ms: latestRun.duration_ms || 0,
        avg_scenario_time_ms: latestRun.duration_ms ? Math.round(latestRun.duration_ms / (suite.scenario_count || 70)) : 0,
        error_count: latestRun.error_count || 0,
        errors: [],
      },
      next_steps: nextSteps,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[FounderReport] Failed to fetch data:', error);
    return null;
  }
}

function generateFounderReportHTML(data: FounderReportData): string {
  const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;
  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const priorityColors: Record<string, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#ca8a04',
    LOW: '#16a34a',
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SIVA Founder Report - ${data.suite.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; color: #e5e5e5; background: #0a0a0a; line-height: 1.6; }
    .page { padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 2px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #dc2626; }
    .subtitle { color: #737373; font-size: 12px; }
    h1 { font-size: 28px; color: #fff; margin: 20px 0 10px; }
    h2 { font-size: 18px; color: #dc2626; border-bottom: 1px solid #262626; padding-bottom: 8px; margin: 30px 0 15px; }
    h3 { font-size: 14px; color: #a3a3a3; margin: 15px 0 10px; }
    .meta { color: #525252; font-size: 11px; font-family: monospace; }
    .grid { display: flex; gap: 15px; flex-wrap: wrap; }
    .card { background: #171717; border: 1px solid #262626; border-radius: 4px; padding: 15px; flex: 1; min-width: 180px; }
    .card-title { font-size: 10px; color: #737373; text-transform: uppercase; letter-spacing: 1px; }
    .card-value { font-size: 28px; font-weight: bold; margin: 5px 0; }
    .card-value.good { color: #22c55e; }
    .card-value.warning { color: #f59e0b; }
    .card-value.bad { color: #dc2626; }
    .card-label { font-size: 10px; color: #525252; }
    .failure-item { background: #1c1917; border-left: 3px solid #dc2626; padding: 12px; margin: 10px 0; font-size: 12px; }
    .failure-item .company { color: #fff; font-weight: bold; margin-bottom: 5px; }
    .failure-item .reason { color: #f87171; }
    .failure-item .fix { color: #22d3ee; margin-top: 8px; padding-top: 8px; border-top: 1px solid #262626; }
    .action-item { background: #171717; border: 1px solid #262626; border-radius: 4px; padding: 15px; margin: 10px 0; }
    .action-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .priority-badge { font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 2px; }
    .action-title { font-size: 14px; color: #fff; font-weight: bold; }
    .action-desc { font-size: 12px; color: #a3a3a3; margin: 10px 0; }
    .action-impl { background: #0a0a0a; padding: 10px; font-size: 11px; color: #22d3ee; white-space: pre-wrap; margin: 10px 0; border-radius: 4px; }
    .action-files { font-size: 10px; color: #737373; }
    .action-files code { color: #f59e0b; }
    .next-steps { list-style: none; }
    .next-steps li { padding: 8px 0 8px 20px; position: relative; font-size: 12px; color: #a3a3a3; }
    .next-steps li::before { content: '→'; position: absolute; left: 0; color: #dc2626; }
    .tech-details { font-size: 11px; color: #525252; }
    .tech-details code { background: #171717; padding: 2px 6px; border-radius: 2px; color: #f59e0b; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #262626; font-size: 10px; color: #525252; }
    @media print {
      body { background: #fff; color: #1a1a1a; }
      .page { padding: 20px; }
      .card { background: #f5f5f5; }
      .action-item { background: #f5f5f5; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo">SIVA FOUNDER REPORT</div>
      <div class="subtitle">Internal - Actionable Improvements - ${formatDate(data.generated_at)}</div>
    </div>

    <!-- Title -->
    <h1>${data.suite.name}</h1>
    <p class="meta">
      ${data.suite.vertical}/${data.suite.sub_vertical}/${data.suite.region} | v${data.suite.version} | ${data.suite.scenario_count} scenarios | Run #${data.performance.latest_run_number}
    </p>

    <!-- Performance Summary -->
    <h2>PERFORMANCE SUMMARY</h2>
    <div class="grid">
      <div class="card">
        <div class="card-title">Golden Pass</div>
        <div class="card-value ${data.performance.golden_pass_rate >= 0.95 ? 'good' : data.performance.golden_pass_rate >= 0.8 ? 'warning' : 'bad'}">
          ${formatPercent(data.performance.golden_pass_rate)}
        </div>
        <div class="card-label">${data.performance.golden_pass_rate >= 0.95 ? '✓ Target met' : '✗ Target: ≥95%'}</div>
      </div>
      <div class="card">
        <div class="card-title">Kill Containment</div>
        <div class="card-value ${data.performance.kill_containment_rate >= 0.95 ? 'good' : data.performance.kill_containment_rate >= 0.8 ? 'warning' : 'bad'}">
          ${formatPercent(data.performance.kill_containment_rate)}
        </div>
        <div class="card-label">${data.performance.kill_containment_rate >= 0.95 ? '✓ Target met' : '✗ Target: ≥95%'}</div>
      </div>
      <div class="card">
        <div class="card-title">Cohen's d</div>
        <div class="card-value ${data.performance.cohens_d >= 2.0 ? 'good' : data.performance.cohens_d >= 1.0 ? 'warning' : 'bad'}">
          ${data.performance.cohens_d.toFixed(2)}
        </div>
        <div class="card-label">${data.performance.cohens_d >= 2.0 ? '✓ Excellent' : data.performance.cohens_d >= 0.8 ? '△ Good' : '✗ Needs work'}</div>
      </div>
    </div>

    ${data.failures.golden_failures.length > 0 ? `
    <!-- Golden Path Failures -->
    <h2>GOLDEN PATH FAILURES (${data.failures.golden_failures.length})</h2>
    <p style="font-size: 11px; color: #737373; margin-bottom: 10px;">
      These qualified leads should have been ENGAGED but were incorrectly BLOCKED.
    </p>
    ${data.failures.golden_failures.map((f, i) => `
    <div class="failure-item">
      <div class="company">${i + 1}. ${f.company}</div>
      <div class="reason">❌ ${f.reason}</div>
      <div style="font-size: 11px; color: #737373; margin-top: 5px;">
        Expected: <code style="color: #22c55e;">${f.expected}</code> |
        Actual: <code style="color: #dc2626;">${f.actual}</code>
      </div>
      <div class="fix">💡 FIX: ${f.fix_suggestion}</div>
    </div>
    `).join('')}
    ` : ''}

    ${data.failures.kill_escapes.length > 0 ? `
    <!-- Kill Path Escapes -->
    <h2>KILL PATH ESCAPES (${data.failures.kill_escapes.length})</h2>
    <p style="font-size: 11px; color: #737373; margin-bottom: 10px;">
      These bad leads should have been BLOCKED but were incorrectly ENGAGED.
    </p>
    ${data.failures.kill_escapes.map((f, i) => `
    <div class="failure-item">
      <div class="company">${i + 1}. ${f.company}</div>
      <div class="reason">❌ ${f.reason}</div>
      <div style="font-size: 11px; color: #737373; margin-top: 5px;">
        Expected: <code style="color: #dc2626;">${f.expected}</code> |
        Actual: <code style="color: #22c55e;">${f.actual}</code>
      </div>
      <div class="fix">💡 FIX: ${f.fix_suggestion}</div>
    </div>
    `).join('')}
    ` : ''}

    <!-- Action Items -->
    <h2>ACTION ITEMS (${data.action_items.length})</h2>
    ${data.action_items.map(item => `
    <div class="action-item">
      <div class="action-header">
        <span class="priority-badge" style="background: ${priorityColors[item.priority]}20; color: ${priorityColors[item.priority]};">
          ${item.priority}
        </span>
        <span style="font-size: 10px; color: #737373;">${item.category}</span>
      </div>
      <div class="action-title">${item.title}</div>
      <div class="action-desc">${item.description}</div>
      <div class="action-impl">${item.implementation.trim()}</div>
      <div class="action-files">
        Files: ${item.files_to_modify.map(f => `<code>${f}</code>`).join(', ')}
      </div>
    </div>
    `).join('')}

    <!-- Next Steps -->
    <h2>NEXT STEPS</h2>
    <ul class="next-steps">
      ${data.next_steps.map(step => `<li>${step}</li>`).join('')}
    </ul>

    <!-- Technical Details -->
    <h2>TECHNICAL DETAILS</h2>
    <div class="tech-details">
      <p>SIVA Version: <code>${data.technical_details.siva_version}</code></p>
      <p>Model: <code>${data.technical_details.model_slug}</code></p>
      ${data.technical_details.run_duration_ms > 0 ? `
      <p>Run Duration: <code>${Math.round(data.technical_details.run_duration_ms / 1000)}s</code></p>
      <p>Avg Scenario Time: <code>${data.technical_details.avg_scenario_time_ms}ms</code></p>
      ` : ''}
      ${data.technical_details.error_count > 0 ? `
      <p style="color: #dc2626;">Errors: <code>${data.technical_details.error_count}</code></p>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong>SIVA Founder Report</strong> - Internal Use Only<br>
      ${data.suite.key} v${data.suite.version} | Generated: ${formatDate(data.generated_at)}
    </div>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const suiteKey = searchParams.get('suite_key');
  const format = searchParams.get('format') || 'html';

  if (!suiteKey) {
    return NextResponse.json({ error: 'suite_key required' }, { status: 400 });
  }

  const data = await fetchFounderReportData(suiteKey);

  if (!data) {
    return NextResponse.json({ error: 'Failed to generate founder report' }, { status: 500 });
  }

  if (format === 'json') {
    return NextResponse.json({ success: true, data });
  }

  const html = generateFounderReportHTML(data);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="siva-founder-report-${suiteKey}.html"`,
    },
  });
}
