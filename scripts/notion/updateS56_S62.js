/**
 * Update Sprints S56-S62: Intelligence Suite
 * MEGA-SPRINT: Complete Intelligence Layer for PremiumRadar SaaS
 */
import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = new Date().toISOString().split('T')[0];

const SPRINT_DATA = [
  {
    number: 56,
    name: 'S56: Intelligence Explorer',
    goal: 'Build the primary Intelligence UI with persona effectiveness, journey optimization, time series analytics, and pattern exploration.',
    outcomes: 'IntelligenceDashboard, PersonaEffectiveness, JourneyOptimizer, KPIHeader, IntelligenceTimeSeries, PatternExplorer, IntelligenceTabs, IntelligenceSidebar components. Complete data layer with types, fetchers, transformers, hooks.',
    highlights: 'Persona ranking by conversion rate, journey drop-off analysis, time series metrics visualization, pattern detection display',
    businessValue: 'Enables sales teams to understand persona performance, optimize journeys, and identify patterns for better targeting',
    learnings: 'SWR-like patterns for hooks, deterministic transformers for UI state, graceful degradation for partial data',
  },
  {
    number: 57,
    name: 'S57: Permissions & Workspaces',
    goal: 'Define workspace types, permission models, and role-based access controls for multi-tenant intelligence access.',
    outcomes: 'Workspace types with roles (admin, analyst, viewer), workspace limits, settings, and member management. Permission validation hooks.',
    highlights: 'Role-based permissions, workspace limits, member invitation flow types',
    businessValue: 'Foundation for enterprise multi-tenant access control and team collaboration',
    learnings: 'Type-driven permission validation, workspace scoping patterns',
  },
  {
    number: 58,
    name: 'S58: Autonomous Safety UI',
    goal: 'Build read-only monitoring dashboard for autonomous agent operations from OS S66-S70.',
    outcomes: 'AutonomyDashboard, KillSwitchPanel, CostMonitor, CheckpointList, ErrorRateTrend, AutonomyLogViewer components.',
    highlights: 'Kill switch status display (read-only), cost tracking, checkpoint visualization, error trend charts, detailed log viewing',
    businessValue: 'Operational visibility into autonomous agent safety metrics without mutation capabilities',
    learnings: 'Read-only patterns for safety-critical displays, real-time metrics visualization',
  },
  {
    number: 59,
    name: 'S59: Audit Layer UI',
    goal: 'Build comprehensive audit log viewing interface with filtering and detail views.',
    outcomes: 'AuditTable with pagination, AuditFilters for action/resource filtering, AuditDetail for full entry inspection.',
    highlights: 'Paginated audit logs, action type filtering, resource type filtering, date range filters, full audit detail with before/after snapshots',
    businessValue: 'Compliance and transparency for all system actions, essential for enterprise audit requirements',
    learnings: 'Efficient pagination patterns, filter state management, date range handling',
  },
  {
    number: 60,
    name: 'S60: Intelligence Graph',
    goal: 'Build force-directed graph visualization for entity relationships in the intelligence network.',
    outcomes: 'IntelligenceGraph with node/edge rendering, GraphControls for zoom/navigation, GraphLegend for node types.',
    highlights: 'Force-directed layout, node type coloring, edge relationship display, hover tooltips, node selection with detail panel',
    businessValue: 'Visual understanding of entity relationships for pattern discovery and investigation',
    learnings: 'SVG-based graph rendering, force-directed layout approximation, connected node highlighting',
  },
  {
    number: 61,
    name: 'S61: Score Explanation Engine UI',
    goal: 'Build score breakdown interface showing factor contributions and explanations.',
    outcomes: 'ScoreExplanationPanel with factor breakdown, SignalCorrelationMatrix for signal relationships.',
    highlights: 'Score component breakdown, factor contribution bars, weight visualization, trend indicators',
    businessValue: 'Transparency into scoring decisions for trust and optimization',
    learnings: 'Score visualization patterns, factor importance display, trend calculation',
  },
  {
    number: 62,
    name: 'S62: Signal Correlation & Pattern Explorer',
    goal: 'Build interactive laboratory for exploring signal correlations and discovering patterns.',
    outcomes: 'SignalLab with tabs for signals/patterns/correlations, SignalTimeline for temporal visualization, CorrelationHeatmap matrix.',
    highlights: 'Interactive signal selection, correlation heatmap, pattern member display, signal timeline with markers',
    businessValue: 'Data science capabilities for understanding signal relationships and pattern discovery',
    learnings: 'Correlation matrix visualization, timeline rendering, pattern clustering display',
  },
];

async function findOrCreateSprint(sprintNum, sprintName) {
  // Try to find existing sprint
  const response = await notion.databases.query({
    database_id: dbIds.sprints_db_id,
    filter: {
      property: 'Sprint',
      title: { starts_with: `Sprint ${sprintNum}:` }
    }
  });

  if (response.results.length > 0) {
    return { id: response.results[0].id, exists: true };
  }

  // Create new sprint
  const newPage = await notion.pages.create({
    parent: { database_id: dbIds.sprints_db_id },
    properties: {
      'Sprint': { title: [{ text: { content: `Sprint ${sprintNum}: ${sprintName}` } }] },
    }
  });

  return { id: newPage.id, exists: false };
}

async function updateSprint(pageId, data) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      'Status': { select: { name: 'Done' } },
      'Goal': { rich_text: [{ text: { content: data.goal } }] },
      'Sprint Notes': { rich_text: [{ text: { content: `MEGA-SPRINT S56-S62: Intelligence Suite. ${data.name}` } }] },
      'Outcomes': { rich_text: [{ text: { content: data.outcomes } }] },
      'Highlights': { rich_text: [{ text: { content: data.highlights } }] },
      'Business Value': { rich_text: [{ text: { content: data.businessValue } }] },
      'Learnings': { rich_text: [{ text: { content: data.learnings } }] },
      'Branch': { rich_text: [{ text: { content: 'feat/s56-s62-intelligence-suite' } }] },
      'Commit': { rich_text: [{ text: { content: 'Implemented in feat/s56-s62-intelligence-suite, PR #12' } }] },
      'Git Tag': { rich_text: [{ text: { content: 'sprint-saas-s56-s62-certified' } }] },
      'Started At': { date: { start: TODAY } },
      'Completed At': { date: { start: TODAY } },
      'Synced At': { date: { start: TODAY } },
      'Phases Updated': { multi_select: [{ name: 'Done' }] },
    },
  });
}

async function main() {
  console.log('Updating Sprints S56-S62: Intelligence Suite\n');
  console.log('=' .repeat(60));

  for (const sprint of SPRINT_DATA) {
    try {
      const { id, exists } = await findOrCreateSprint(sprint.number, sprint.name.split(': ')[1]);

      if (exists) {
        console.log(`Found Sprint ${sprint.number}, updating...`);
      } else {
        console.log(`Created Sprint ${sprint.number}, populating...`);
      }

      await updateSprint(id, sprint);
      console.log(`✓ Sprint ${sprint.number}: ${sprint.name} → Done\n`);
    } catch (error) {
      console.error(`✗ Sprint ${sprint.number} failed:`, error.message);
    }
  }

  console.log('=' .repeat(60));
  console.log('\nAll sprints updated successfully!');
  console.log('Branch: feat/s56-s62-intelligence-suite');
  console.log('Tag: sprint-saas-s56-s62-certified');
  console.log('PR: https://github.com/uaesivakumar/premiumradar-saas/pull/12');
}

main().catch(console.error);
