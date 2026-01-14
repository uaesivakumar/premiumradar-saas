/**
 * PHASE 1 FINAL VERIFICATION SCRIPT - WITH LEAD CONTEXT
 * Sub-Vertical: Working Capital – Mid-Market – Infrastructure/EPC
 * Region: Maharashtra, India
 *
 * ARCHITECTURAL REQUIREMENT: State-level enforcement with Lead Context artifacts
 */

import {
  searchContactsWithContext,
  DiscoveryRegion,
  LeadContext,
} from '../lib/integrations/apollo';

// =============================================================================
// DISCOVERY CONTEXT (from OS Discovery V2)
// =============================================================================

const DISCOVERED_COMPANY = {
  name: 'Vikran Engineering',
  domain: null,
  discoveryId: 'v2-os-mkdgu5vw-vv5b4asqa-1',
  signal: 'Project Award (₹2035cr EPC order for 600MW solar)',
};

// CRITICAL: Discovery region with STATE-LEVEL granularity
const DISCOVERY_REGION: DiscoveryRegion = {
  country: 'India',
  state: 'Maharashtra', // STATE IS SPECIFIED - MUST BE ENFORCED
};

// =============================================================================
// ENRICHMENT POLICY v4 (APPROVED)
// =============================================================================

const POLICY_V4_PRIMARY_ROLES = [
  'Finance Manager',
  'Accounts Manager',
  'Treasury Manager',
  'Cash Management Manager',
  'Billing Manager',
  'Receivables Manager',
  'Collections Manager',
  'Project Finance Manager',
];

const POLICY_V4_SECONDARY_ROLES = [
  'Commercial Manager',
  'Contracts Manager',
  'Operations Manager',
];

const POLICY_V4_EXCLUSIONS = [
  'Managing Director', 'CEO', 'CFO', 'Promoter', 'Board Member', 'Group Finance Head'
];

// =============================================================================
// VERIFICATION EXECUTION
// =============================================================================

async function runVerification() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('  PHASE 1 VERIFICATION - LEAD CONTEXT (STATE-LEVEL ENFORCEMENT)');
  console.log('═'.repeat(80));
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: DISCOVERY CONTEXT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('┌' + '─'.repeat(78) + '┐');
  console.log('│ STEP 1: DISCOVERY CONTEXT' + ' '.repeat(52) + '│');
  console.log('└' + '─'.repeat(78) + '┘');
  console.log('');
  console.log('  Discovered Company:  ', DISCOVERED_COMPANY.name);
  console.log('  Discovery ID:        ', DISCOVERED_COMPANY.discoveryId);
  console.log('  Signal:              ', DISCOVERED_COMPANY.signal);
  console.log('');
  console.log('  Discovery Region (STATE-LEVEL):');
  console.log('    ├── country:', DISCOVERY_REGION.country);
  console.log('    └── state:  ', DISCOVERY_REGION.state, '<-- MUST BE ENFORCED');
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: ENRICHMENT POLICY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('┌' + '─'.repeat(78) + '┐');
  console.log('│ STEP 2: ENRICHMENT POLICY v4 (APPROVED)' + ' '.repeat(38) + '│');
  console.log('└' + '─'.repeat(78) + '┘');
  console.log('');
  console.log('  Policy Hash:   2292657f');
  console.log('  Policy Type:   tier_based');
  console.log('  Confidence:    95%');
  console.log('');
  console.log('  PRIMARY Roles (Tier 1):', POLICY_V4_PRIMARY_ROLES.length);
  POLICY_V4_PRIMARY_ROLES.forEach(r => console.log('    • ' + r));
  console.log('');
  console.log('  Exclusions:', POLICY_V4_EXCLUSIONS.length);
  POLICY_V4_EXCLUSIONS.forEach(r => console.log('    ✗ ' + r));
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: APOLLO EXECUTION WITH LEAD CONTEXT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('┌' + '─'.repeat(78) + '┐');
  console.log('│ STEP 3: APOLLO EXECUTION (STATE-LEVEL ENFORCEMENT)' + ' '.repeat(27) + '│');
  console.log('└' + '─'.repeat(78) + '┘');
  console.log('');

  try {
    // Execute Apollo search WITH Lead Context
    const result = await searchContactsWithContext({
      organizationName: DISCOVERED_COMPANY.name,
      discoveryRegion: DISCOVERY_REGION, // STATE-LEVEL
      titles: POLICY_V4_PRIMARY_ROLES,
      seniorities: ['manager', 'senior', 'director'],
      perPage: 15,
    });

    console.log('');
    console.log('  ╔' + '═'.repeat(76) + '╗');
    console.log('  ║ QUERY METADATA' + ' '.repeat(61) + '║');
    console.log('  ╠' + '═'.repeat(76) + '╣');
    console.log('  ║  Location Filter:  ' + result.query_metadata.location_filter.padEnd(55) + '║');
    console.log('  ║  Granularity:      ' + result.query_metadata.granularity.padEnd(55) + '║');
    console.log('  ║  Total Returned:   ' + String(result.query_metadata.total_returned).padEnd(55) + '║');
    console.log('  ║  Actionable:       ' + String(result.query_metadata.actionable_count).padEnd(55) + '║');
    console.log('  ║  Rejected:         ' + String(result.query_metadata.rejected_count).padEnd(55) + '║');
    console.log('  ╚' + '═'.repeat(76) + '╝');
    console.log('');

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 4: LEAD CONTEXT ARTIFACTS
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('┌' + '─'.repeat(78) + '┐');
    console.log('│ STEP 4: LEAD CONTEXT DECISION ARTIFACTS' + ' '.repeat(38) + '│');
    console.log('└' + '─'.repeat(78) + '┘');
    console.log('');

    // Show ACTIONABLE leads (max 3)
    console.log('  ✅ ACTIONABLE LEADS (' + result.actionable.length + ')');
    console.log('  ' + '─'.repeat(76));

    const actionableSample = result.actionable.slice(0, 3);
    actionableSample.forEach((item, idx) => {
      const c = item.contact;
      const ctx = item.lead_context;

      console.log('');
      console.log(`  [${idx + 1}] ${c.first_name || ''} ${c.last_name || ''}`);
      console.log(`      Title: ${c.title || 'Unknown'}`);
      console.log(`      Location: ${ctx.lead_location.city || '?'}, ${ctx.lead_location.state || '?'}, ${ctx.lead_location.country || '?'}`);
      console.log('');
      console.log('      LEAD CONTEXT:');
      console.log('      ┌──────────────────────────────────────────────────────────────────┐');
      console.log('      │ discovery_region: { country: "' + ctx.discovery_region.country + '", state: "' + (ctx.discovery_region.state || '') + '" }');
      console.log('      │ lead_location:    { city: "' + (ctx.lead_location.city || '') + '", state: "' + (ctx.lead_location.state || '') + '", country: "' + (ctx.lead_location.country || '') + '" }');
      console.log('      │ relevance:');
      console.log('      │   in_region:    ' + ctx.relevance.in_region);
      console.log('      │   match_level:  ' + ctx.relevance.match_level);
      console.log('      │   reason:       "' + ctx.relevance.reason + '"');
      console.log('      │ actionable:     ' + ctx.actionable);
      console.log('      │ query_granularity: ' + ctx.query_granularity);
      console.log('      └──────────────────────────────────────────────────────────────────┘');
    });

    // Show REJECTED leads (if any)
    if (result.rejected.length > 0) {
      console.log('');
      console.log('  ❌ REJECTED LEADS (' + result.rejected.length + ')');
      console.log('  ' + '─'.repeat(76));

      const rejectedSample = result.rejected.slice(0, 2);
      rejectedSample.forEach((item, idx) => {
        const c = item.contact;
        const ctx = item.lead_context;

        console.log('');
        console.log(`  [${idx + 1}] ${c.first_name || ''} ${c.last_name || ''}`);
        console.log(`      Title: ${c.title || 'Unknown'}`);
        console.log(`      Location: ${ctx.lead_location.city || '?'}, ${ctx.lead_location.state || '?'}, ${ctx.lead_location.country || '?'}`);
        console.log('');
        console.log('      LEAD CONTEXT (REJECTION):');
        console.log('      ┌──────────────────────────────────────────────────────────────────┐');
        console.log('      │ discovery_region: { country: "' + ctx.discovery_region.country + '", state: "' + (ctx.discovery_region.state || '') + '" }');
        console.log('      │ lead_location:    { city: "' + (ctx.lead_location.city || '') + '", state: "' + (ctx.lead_location.state || '') + '", country: "' + (ctx.lead_location.country || '') + '" }');
        console.log('      │ relevance:');
        console.log('      │   in_region:    ' + ctx.relevance.in_region + '  <-- FALSE');
        console.log('      │   match_level:  ' + ctx.relevance.match_level);
        console.log('      │   reason:       "' + ctx.relevance.reason + '"');
        console.log('      │ actionable:     ' + ctx.actionable + '  <-- REJECTED');
        console.log('      │ query_granularity: ' + ctx.query_granularity);
        console.log('      └──────────────────────────────────────────────────────────────────┘');
      });
    } else {
      console.log('');
      console.log('  ❌ REJECTED LEADS: 0');
      console.log('     (All contacts matched the state-level filter)');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STEP 5: VALIDATION SUMMARY
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('');
    console.log('┌' + '─'.repeat(78) + '┐');
    console.log('│ STEP 5: VALIDATION SUMMARY' + ' '.repeat(51) + '│');
    console.log('└' + '─'.repeat(78) + '┘');
    console.log('');

    // Check for executive leakage
    let executiveLeakage = 0;
    result.actionable.forEach(item => {
      const title = (item.contact.title || '').toLowerCase();
      if (POLICY_V4_EXCLUSIONS.some(excl => title.includes(excl.toLowerCase()))) {
        executiveLeakage++;
      }
    });

    const checks = [
      {
        name: 'State-level Apollo filter',
        pass: result.query_metadata.granularity === 'state',
        actual: result.query_metadata.location_filter,
        expected: 'Maharashtra, India',
      },
      {
        name: 'Lead Context artifacts exist',
        pass: result.actionable.every(a => a.lead_context !== undefined),
        actual: 'All leads have lead_context',
        expected: 'LeadContext per lead',
      },
      {
        name: 'No executive leakage',
        pass: executiveLeakage === 0,
        actual: String(executiveLeakage),
        expected: '0',
      },
      {
        name: 'Actionable leads returned',
        pass: result.actionable.length > 0,
        actual: String(result.actionable.length),
        expected: '>0',
      },
    ];

    checks.forEach(check => {
      const status = check.pass ? '✅' : '❌';
      console.log(`  ${status} ${check.name}`);
      console.log(`     Actual:   ${check.actual}`);
      console.log(`     Expected: ${check.expected}`);
      console.log('');
    });

    const allPassed = checks.every(c => c.pass);

    // ─────────────────────────────────────────────────────────────────────────────
    // FINAL VERDICT
    // ─────────────────────────────────────────────────────────────────────────────
    console.log('');
    console.log('═'.repeat(80));
    if (allPassed) {
      console.log('  ✅ PHASE 1 VERIFICATION: PASSED');
      console.log('');
      console.log('  Lead Context layer is operational with state-level enforcement.');
      console.log('  Control Plane declares Maharashtra → Apollo queries Maharashtra, India');
      console.log('  Every lead has an auditable decision artifact (LeadContext).');
    } else {
      console.log('  ❌ PHASE 1 VERIFICATION: FAILED');
      console.log('');
      console.log('  Some validation checks did not pass. Review the failures above.');
    }
    console.log('═'.repeat(80));
    console.log('');

  } catch (error) {
    console.error('Execution Error:', error);
  }
}

runVerification().catch(console.error);
