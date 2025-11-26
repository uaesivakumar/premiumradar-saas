/**
 * Object Inspector - S46
 *
 * Provides detailed inspection capabilities for Live Objects.
 * Shows signals, reasoning, history, and enables deep exploration.
 */

import type {
  LiveObject,
  ObjectInspectorData,
  ObjectHistoryEntry,
  SourceAttribution,
  ObjectAction,
} from './types';
import type { Evidence } from '../evidence/types';

// =============================================================================
// Inspector Views
// =============================================================================

/**
 * Get overview data for object inspector
 */
export function getInspectorOverview(object: LiveObject): {
  id: string;
  title: string;
  type: string;
  state: string;
  createdAt: Date;
  lastUpdate: Date;
  signalCount: number;
  historyCount: number;
  sourceCount: number;
  linkedCount: number;
  threadCount: number;
} {
  return {
    id: object.id,
    title: object.title,
    type: object.type,
    state: object.state,
    createdAt: object.timestamp,
    lastUpdate: object.lastUpdate,
    signalCount: object.inspectorData.signals.length,
    historyCount: object.inspectorData.history.length,
    sourceCount: object.inspectorData.sources.length,
    linkedCount: object.linkedObjects.length,
    threadCount: object.threads.length,
  };
}

/**
 * Get signals view for inspector
 */
export function getSignalsView(object: LiveObject): {
  signals: Evidence[];
  byType: Record<string, Evidence[]>;
  topSignals: Evidence[];
  averageConfidence: number;
} {
  const signals = object.inspectorData.signals;

  // Group by type
  const byType: Record<string, Evidence[]> = {};
  for (const signal of signals) {
    const type = signal.type;
    if (!byType[type]) byType[type] = [];
    byType[type].push(signal);
  }

  // Get top signals by relevance
  const topSignals = [...signals]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5);

  // Calculate average confidence
  const averageConfidence = signals.length > 0
    ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    : 0;

  return {
    signals,
    byType,
    topSignals,
    averageConfidence,
  };
}

/**
 * Get reasoning view for inspector
 */
export function getReasoningView(object: LiveObject): {
  conclusion: string;
  confidence: number;
  steps: {
    stage: string;
    summary: string;
    evidenceCount: number;
  }[];
  duration: number;
} {
  const reasoning = object.inspectorData.reasoning;

  const steps = reasoning.steps.map(step => ({
    stage: step.stage,
    summary: step.output.slice(0, 200) + (step.output.length > 200 ? '...' : ''),
    evidenceCount: step.evidence.length,
  }));

  return {
    conclusion: reasoning.conclusion,
    confidence: reasoning.confidence,
    steps,
    duration: reasoning.duration,
  };
}

/**
 * Get history view for inspector
 */
export function getHistoryView(object: LiveObject): {
  entries: ObjectHistoryEntry[];
  byAction: Record<ObjectAction, ObjectHistoryEntry[]>;
  timeline: { date: string; count: number }[];
} {
  const entries = object.inspectorData.history;

  // Group by action
  const byAction: Record<ObjectAction, ObjectHistoryEntry[]> = {
    created: [],
    updated: [],
    enriched: [],
    linked: [],
    unlinked: [],
    archived: [],
    restored: [],
    refreshed: [],
  };

  for (const entry of entries) {
    byAction[entry.action].push(entry);
  }

  // Create timeline (group by date)
  const dateMap = new Map<string, number>();
  for (const entry of entries) {
    const date = entry.timestamp.toISOString().split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  }

  const timeline = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    entries,
    byAction,
    timeline,
  };
}

/**
 * Get sources view for inspector
 */
export function getSourcesView(object: LiveObject): {
  sources: SourceAttribution[];
  byType: Record<string, SourceAttribution[]>;
  averageConfidence: number;
  primarySource: SourceAttribution | null;
} {
  const sources = object.inspectorData.sources;

  // Group by type
  const byType: Record<string, SourceAttribution[]> = {};
  for (const source of sources) {
    if (!byType[source.type]) byType[source.type] = [];
    byType[source.type].push(source);
  }

  // Calculate average confidence
  const averageConfidence = sources.length > 0
    ? sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length
    : 0;

  // Find primary source (highest confidence)
  const primarySource = sources.length > 0
    ? [...sources].sort((a, b) => b.confidence - a.confidence)[0]
    : null;

  return {
    sources,
    byType,
    averageConfidence,
    primarySource,
  };
}

// =============================================================================
// Inspector Utilities
// =============================================================================

/**
 * Search within inspector data
 */
export function searchInspectorData(
  object: LiveObject,
  query: string
): {
  signals: Evidence[];
  history: ObjectHistoryEntry[];
  metadata: string[];
} {
  const queryLower = query.toLowerCase();

  // Search signals
  const signals = object.inspectorData.signals.filter(s =>
    s.title.toLowerCase().includes(queryLower) ||
    s.content.toLowerCase().includes(queryLower)
  );

  // Search history
  const history = object.inspectorData.history.filter(h =>
    h.details.toLowerCase().includes(queryLower)
  );

  // Search metadata keys
  const metadata = Object.keys(object.inspectorData.metadata).filter(key =>
    key.toLowerCase().includes(queryLower) ||
    String(object.inspectorData.metadata[key]).toLowerCase().includes(queryLower)
  );

  return { signals, history, metadata };
}

/**
 * Get confidence breakdown for object
 */
export function getConfidenceBreakdown(object: LiveObject): {
  overall: number;
  signals: number;
  reasoning: number;
  sources: number;
} {
  const { signals, reasoning, sources } = object.inspectorData;

  const signalConfidence = signals.length > 0
    ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
    : 0;

  const sourceConfidence = sources.length > 0
    ? sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length
    : 0;

  const overall = (
    signalConfidence * 0.4 +
    reasoning.confidence * 0.4 +
    sourceConfidence * 0.2
  );

  return {
    overall,
    signals: signalConfidence,
    reasoning: reasoning.confidence,
    sources: sourceConfidence,
  };
}

/**
 * Get data freshness assessment
 */
export function getDataFreshness(object: LiveObject): {
  status: 'fresh' | 'recent' | 'stale' | 'outdated';
  ageMs: number;
  ageText: string;
  recommendation: string;
} {
  const ageMs = Date.now() - object.lastUpdate.getTime();
  const ageMinutes = ageMs / 60000;
  const ageHours = ageMinutes / 60;
  const ageDays = ageHours / 24;

  let status: 'fresh' | 'recent' | 'stale' | 'outdated';
  let recommendation: string;

  if (ageMinutes < 5) {
    status = 'fresh';
    recommendation = 'Data is current';
  } else if (ageHours < 1) {
    status = 'recent';
    recommendation = 'Data is relatively fresh';
  } else if (ageDays < 1) {
    status = 'stale';
    recommendation = 'Consider refreshing data';
  } else {
    status = 'outdated';
    recommendation = 'Data should be refreshed';
  }

  // Format age text
  let ageText: string;
  if (ageMinutes < 1) {
    ageText = 'just now';
  } else if (ageMinutes < 60) {
    ageText = `${Math.floor(ageMinutes)} minutes ago`;
  } else if (ageHours < 24) {
    ageText = `${Math.floor(ageHours)} hours ago`;
  } else {
    ageText = `${Math.floor(ageDays)} days ago`;
  }

  return { status, ageMs, ageText, recommendation };
}

/**
 * Export inspector data as JSON
 */
export function exportInspectorData(object: LiveObject): string {
  const exportData = {
    object: {
      id: object.id,
      title: object.title,
      type: object.type,
      state: object.state,
      createdAt: object.timestamp,
      lastUpdate: object.lastUpdate,
    },
    metadata: object.inspectorData.metadata,
    signals: object.inspectorData.signals,
    reasoning: object.inspectorData.reasoning,
    history: object.inspectorData.history,
    sources: object.inspectorData.sources,
    linkedObjects: object.linkedObjects,
    threads: object.threads.map(t => ({
      id: t.id,
      title: t.title,
      messageCount: t.messages.length,
      status: t.status,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate inspector summary text
 */
export function generateInspectorSummary(object: LiveObject): string {
  const overview = getInspectorOverview(object);
  const confidence = getConfidenceBreakdown(object);
  const freshness = getDataFreshness(object);

  const lines = [
    `# ${object.title}`,
    '',
    `**Type:** ${object.type}`,
    `**State:** ${object.state}`,
    `**Last Updated:** ${freshness.ageText}`,
    `**Overall Confidence:** ${(confidence.overall * 100).toFixed(0)}%`,
    '',
    '## Statistics',
    `- Signals: ${overview.signalCount}`,
    `- History entries: ${overview.historyCount}`,
    `- Sources: ${overview.sourceCount}`,
    `- Linked objects: ${overview.linkedCount}`,
    `- Threads: ${overview.threadCount}`,
    '',
    '## Reasoning',
    object.inspectorData.reasoning.conclusion,
  ];

  return lines.join('\n');
}
