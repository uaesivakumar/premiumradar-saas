/**
 * Replay Context
 * Sprint S52: Replay Engine
 *
 * Restore and diff context snapshots from run history.
 * Provides deterministic context reconstruction.
 */
import type {
  JourneyRunContextSnapshot,
  JourneyRunDetails,
} from '@/lib/journey-runs';
import type { ContextDiffEntry, StepContextDiff } from '@/lib/timeline-viewer';

// =============================================================================
// CONTEXT SNAPSHOT MANAGER
// =============================================================================

export interface ContextSnapshotManager {
  getSnapshotAtStep(stepId: string): Record<string, unknown> | null;
  getSnapshotBefore(stepId: string): Record<string, unknown> | null;
  getSnapshotAfter(stepId: string): Record<string, unknown> | null;
  getDiffForStep(stepId: string): StepContextDiff | null;
  getAllSnapshots(): Map<string, JourneyRunContextSnapshot>;
  getContextTimeline(): ContextTimelineEntry[];
}

export interface ContextTimelineEntry {
  stepId: string;
  stepName?: string;
  timestamp: Date;
  snapshotType: string;
  estimatedTokens: number;
  changeCount: number;
}

/**
 * Create a context snapshot manager from run details
 */
export function createContextSnapshotManager(
  details: JourneyRunDetails
): ContextSnapshotManager {
  const snapshotsByStep = new Map<string, JourneyRunContextSnapshot>();
  const orderedSnapshots: JourneyRunContextSnapshot[] = [];

  // Index snapshots by step ID
  for (const snapshot of details.contextSnapshots) {
    snapshotsByStep.set(snapshot.stepId, snapshot);
    orderedSnapshots.push(snapshot);
  }

  // Sort by creation time
  orderedSnapshots.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Create step order map
  const stepOrder = new Map<string, number>();
  details.steps.forEach((step, index) => {
    stepOrder.set(step.stepId, index);
  });

  return {
    getSnapshotAtStep(stepId: string): Record<string, unknown> | null {
      const snapshot = snapshotsByStep.get(stepId);
      return snapshot?.contextJson ?? null;
    },

    getSnapshotBefore(stepId: string): Record<string, unknown> | null {
      const stepIndex = stepOrder.get(stepId);
      if (stepIndex === undefined || stepIndex === 0) return null;

      // Find the previous step with a snapshot
      for (let i = stepIndex - 1; i >= 0; i--) {
        const step = details.steps[i];
        const snapshot = snapshotsByStep.get(step.stepId);
        if (snapshot) {
          return snapshot.contextJson;
        }
      }
      return null;
    },

    getSnapshotAfter(stepId: string): Record<string, unknown> | null {
      const stepIndex = stepOrder.get(stepId);
      if (stepIndex === undefined) return null;

      // Find the next step with a snapshot
      for (let i = stepIndex + 1; i < details.steps.length; i++) {
        const step = details.steps[i];
        const snapshot = snapshotsByStep.get(step.stepId);
        if (snapshot) {
          return snapshot.contextJson;
        }
      }
      return null;
    },

    getDiffForStep(stepId: string): StepContextDiff | null {
      const before = this.getSnapshotBefore(stepId);
      const after = this.getSnapshotAtStep(stepId);

      if (!after) return null;

      const changes = computeContextDiff(before || {}, after);
      return {
        stepId,
        changes,
        addedKeys: changes.filter(c => c.operation === 'added').map(c => c.path),
        removedKeys: changes.filter(c => c.operation === 'removed').map(c => c.path),
        changedKeys: changes.filter(c => c.operation === 'changed').map(c => c.path),
        totalChanges: changes.length,
      };
    },

    getAllSnapshots(): Map<string, JourneyRunContextSnapshot> {
      return new Map(snapshotsByStep);
    },

    getContextTimeline(): ContextTimelineEntry[] {
      return orderedSnapshots.map(snapshot => {
        const step = details.steps.find(s => s.stepId === snapshot.stepId);
        return {
          stepId: snapshot.stepId,
          stepName: step?.stepName,
          timestamp: snapshot.createdAt,
          snapshotType: snapshot.snapshotType,
          estimatedTokens: snapshot.estimatedTokens || 0,
          changeCount: Object.keys(snapshot.changesFromPrevious || {}).length,
        };
      });
    },
  };
}

// =============================================================================
// CONTEXT DIFF COMPUTATION
// =============================================================================

/**
 * Compute differences between two context objects
 */
export function computeContextDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  prefix = ''
): ContextDiffEntry[] {
  const changes: ContextDiffEntry[] = [];

  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = new Set(Object.keys(after));

  // Find added keys
  for (const key of afterKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!beforeKeys.has(key)) {
      changes.push({
        path,
        operation: 'added',
        newValue: after[key],
      });
    }
  }

  // Find removed keys
  for (const key of beforeKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!afterKeys.has(key)) {
      changes.push({
        path,
        operation: 'removed',
        oldValue: before[key],
      });
    }
  }

  // Find changed keys
  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) continue;

    const path = prefix ? `${prefix}.${key}` : key;
    const oldValue = before[key];
    const newValue = after[key];

    if (isObject(oldValue) && isObject(newValue)) {
      // Recursively diff nested objects
      const nestedChanges = computeContextDiff(
        oldValue as Record<string, unknown>,
        newValue as Record<string, unknown>,
        path
      );
      changes.push(...nestedChanges);
    } else if (!deepEqual(oldValue, newValue)) {
      changes.push({
        path,
        operation: 'changed',
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}

/**
 * Apply context diff to produce new context
 */
export function applyContextDiff(
  context: Record<string, unknown>,
  diff: ContextDiffEntry[]
): Record<string, unknown> {
  const result = deepClone(context);

  for (const change of diff) {
    const pathParts = change.path.split('.');

    switch (change.operation) {
      case 'added':
      case 'changed':
        setNestedValue(result, pathParts, change.newValue);
        break;
      case 'removed':
        deleteNestedValue(result, pathParts);
        break;
    }
  }

  return result;
}

/**
 * Reconstruct context at a specific point in time
 */
export function reconstructContextAtStep(
  initialContext: Record<string, unknown>,
  steps: Array<{ stepId: string; contextDiff?: ContextDiffEntry[] }>,
  targetStepId: string
): Record<string, unknown> {
  let context = deepClone(initialContext);

  for (const step of steps) {
    if (step.contextDiff) {
      context = applyContextDiff(context, step.contextDiff);
    }
    if (step.stepId === targetStepId) {
      break;
    }
  }

  return context;
}

// =============================================================================
// CONTEXT DIFF DISPLAY
// =============================================================================

export interface DiffDisplayEntry {
  path: string;
  operation: 'added' | 'removed' | 'changed';
  displayOld: string;
  displayNew: string;
  isNested: boolean;
  depth: number;
}

/**
 * Format context diff for display
 */
export function formatDiffForDisplay(diff: ContextDiffEntry[]): DiffDisplayEntry[] {
  return diff.map(entry => ({
    path: entry.path,
    operation: entry.operation,
    displayOld: formatValue(entry.oldValue),
    displayNew: formatValue(entry.newValue),
    isNested: entry.path.includes('.'),
    depth: entry.path.split('.').length - 1,
  }));
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === undefined) return '(undefined)';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${truncate(value, 100)}"`;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (isObject(value)) {
    const keys = Object.keys(value as object);
    return `{${keys.length} keys}`;
  }
  return String(value);
}

/**
 * Get context change summary
 */
export function getContextChangeSummary(diff: ContextDiffEntry[]): {
  added: number;
  removed: number;
  changed: number;
  total: number;
  summary: string;
} {
  const added = diff.filter(d => d.operation === 'added').length;
  const removed = diff.filter(d => d.operation === 'removed').length;
  const changed = diff.filter(d => d.operation === 'changed').length;
  const total = diff.length;

  const parts: string[] = [];
  if (added > 0) parts.push(`+${added}`);
  if (removed > 0) parts.push(`-${removed}`);
  if (changed > 0) parts.push(`~${changed}`);

  return {
    added,
    removed,
    changed,
    total,
    summary: parts.join(' ') || 'no changes',
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return false;
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as T;
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    result[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return result as T;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown
): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[path[path.length - 1]] = value;
}

function deleteNestedValue(obj: Record<string, unknown>, path: string[]): void {
  if (path.length === 1) {
    delete obj[path[0]];
    return;
  }

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      return;
    }
    current = current[key] as Record<string, unknown>;
  }
  delete current[path[path.length - 1]];
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
