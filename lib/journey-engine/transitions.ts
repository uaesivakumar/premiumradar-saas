/**
 * Journey Engine Transitions
 * Sprint S48: Step Transitions Engine
 *
 * Transition evaluation and step flow:
 * - Condition evaluation
 * - Transition selection
 * - Path determination
 */
import type {
  ConditionGroup,
  Condition,
  ConditionOperator,
} from '../journey-builder/types';
import type { ExecutionData } from './types';

// =============================================================================
// CONDITION EVALUATION
// =============================================================================

/**
 * Evaluate a condition group against data
 */
export async function evaluateCondition(
  conditionGroup: ConditionGroup,
  data: ExecutionData,
  stepResult?: unknown
): Promise<boolean> {
  const { logic, conditions } = conditionGroup;

  if (conditions.length === 0) {
    return true;
  }

  const results = await Promise.all(
    conditions.map((condition) => evaluateSingleCondition(condition, data, stepResult))
  );

  if (logic === 'and') {
    return results.every((r) => r);
  } else {
    return results.some((r) => r);
  }
}

/**
 * Evaluate a single condition
 */
async function evaluateSingleCondition(
  condition: Condition,
  data: ExecutionData,
  stepResult?: unknown
): Promise<boolean> {
  const { field, operator, value } = condition;

  // Get the field value from data
  const fieldValue = getFieldValue(field, data, stepResult);

  // Evaluate based on operator
  return evaluateOperator(operator, fieldValue, value);
}

/**
 * Get field value from data using dot notation
 */
function getFieldValue(
  field: string,
  data: ExecutionData,
  stepResult?: unknown
): unknown {
  // Special prefixes for different data sources
  if (field.startsWith('input.')) {
    return getNestedValue(data.input, field.slice(6));
  }
  if (field.startsWith('output.')) {
    const parts = field.slice(7).split('.');
    const stepId = parts[0];
    const path = parts.slice(1).join('.');
    const stepOutput = data.stepOutputs[stepId];
    return path ? getNestedValue(stepOutput, path) : stepOutput;
  }
  if (field.startsWith('var.') || field.startsWith('variable.')) {
    const varPath = field.startsWith('var.') ? field.slice(4) : field.slice(9);
    return getNestedValue(data.variables, varPath);
  }
  if (field.startsWith('result.') || field.startsWith('$result.')) {
    const resultPath = field.startsWith('result.') ? field.slice(7) : field.slice(8);
    return getNestedValue(stepResult, resultPath);
  }

  // Try each data source in order
  let value = getNestedValue(stepResult, field);
  if (value !== undefined) return value;

  value = getNestedValue(data.stepOutputs, field);
  if (value !== undefined) return value;

  value = getNestedValue(data.variables, field);
  if (value !== undefined) return value;

  value = getNestedValue(data.input, field);
  return value;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array indexing
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = (current as Record<string, unknown>)[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * Evaluate operator against values
 */
function evaluateOperator(
  operator: ConditionOperator,
  fieldValue: unknown,
  conditionValue: unknown
): boolean {
  switch (operator) {
    case 'equals':
      return deepEquals(fieldValue, conditionValue);

    case 'not_equals':
      return !deepEquals(fieldValue, conditionValue);

    case 'greater_than':
      return toNumber(fieldValue) > toNumber(conditionValue);

    case 'less_than':
      return toNumber(fieldValue) < toNumber(conditionValue);

    case 'contains':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((item) => deepEquals(item, conditionValue));
      }
      return false;

    case 'not_contains':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return !fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.some((item) => deepEquals(item, conditionValue));
      }
      return true;

    case 'is_empty':
      return isEmpty(fieldValue);

    case 'is_not_empty':
      return !isEmpty(fieldValue);

    case 'matches_regex':
      if (typeof fieldValue !== 'string' || typeof conditionValue !== 'string') {
        return false;
      }
      try {
        const regex = new RegExp(conditionValue);
        return regex.test(fieldValue);
      } catch {
        return false;
      }

    default:
      return false;
  }
}

/**
 * Deep equality check
 */
function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keysA = Object.keys(aObj);
    const keysB = Object.keys(bObj);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => deepEquals(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * Convert value to number
 */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return 0;
}

/**
 * Check if value is empty
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// =============================================================================
// TRANSITION SELECTION
// =============================================================================

/**
 * Options for transition selection
 */
export interface TransitionSelectionOptions {
  allowMultiple?: boolean; // Allow multiple transitions to be taken
  priorityField?: string; // Field to use for priority (default: 'priority')
}

/**
 * Select which transitions to take from a node
 */
export async function selectTransitions<T extends { id: string; condition?: ConditionGroup; priority?: number }>(
  transitions: T[],
  data: ExecutionData,
  stepResult?: unknown,
  options: TransitionSelectionOptions = {}
): Promise<T[]> {
  const { allowMultiple = false, priorityField = 'priority' } = options;

  // Sort by priority (higher priority first)
  const sorted = [...transitions].sort((a, b) => {
    const priorityA = (a as Record<string, unknown>)[priorityField] as number ?? 0;
    const priorityB = (b as Record<string, unknown>)[priorityField] as number ?? 0;
    return priorityB - priorityA;
  });

  const selected: T[] = [];

  for (const transition of sorted) {
    // If no condition, transition passes
    if (!transition.condition) {
      selected.push(transition);
      if (!allowMultiple) break;
      continue;
    }

    // Evaluate condition
    const passed = await evaluateCondition(transition.condition, data, stepResult);
    if (passed) {
      selected.push(transition);
      if (!allowMultiple) break;
    }
  }

  return selected;
}

// =============================================================================
// PATH UTILITIES
// =============================================================================

/**
 * Represents a path through the journey
 */
export interface JourneyPath {
  nodes: string[];
  edges: string[];
  complete: boolean;
}

/**
 * Find all possible paths from start to end
 */
export function findPaths(
  startNodeId: string,
  endNodeIds: string[],
  edges: Array<{ fromNodeId: string; toNodeId: string }>,
  maxDepth: number = 100
): JourneyPath[] {
  const paths: JourneyPath[] = [];

  function traverse(
    currentNode: string,
    visitedNodes: string[],
    visitedEdges: string[],
    depth: number
  ): void {
    if (depth > maxDepth) return;

    // Check if we reached an end node
    if (endNodeIds.includes(currentNode)) {
      paths.push({
        nodes: [...visitedNodes, currentNode],
        edges: visitedEdges,
        complete: true,
      });
      return;
    }

    // Prevent cycles
    if (visitedNodes.includes(currentNode)) return;

    const newVisitedNodes = [...visitedNodes, currentNode];

    // Find outgoing edges
    const outgoing = edges.filter((e) => e.fromNodeId === currentNode);

    if (outgoing.length === 0) {
      // Dead end - incomplete path
      paths.push({
        nodes: newVisitedNodes,
        edges: visitedEdges,
        complete: false,
      });
      return;
    }

    // Traverse each outgoing edge
    for (const edge of outgoing) {
      const edgeId = `${edge.fromNodeId}->${edge.toNodeId}`;
      traverse(edge.toNodeId, newVisitedNodes, [...visitedEdges, edgeId], depth + 1);
    }
  }

  traverse(startNodeId, [], [], 0);
  return paths;
}

/**
 * Check if a path is reachable
 */
export function isPathReachable(
  fromNodeId: string,
  toNodeId: string,
  edges: Array<{ fromNodeId: string; toNodeId: string }>,
  maxDepth: number = 100
): boolean {
  const visited = new Set<string>();

  function traverse(currentNode: string, depth: number): boolean {
    if (depth > maxDepth) return false;
    if (currentNode === toNodeId) return true;
    if (visited.has(currentNode)) return false;

    visited.add(currentNode);

    const outgoing = edges.filter((e) => e.fromNodeId === currentNode);
    return outgoing.some((edge) => traverse(edge.toNodeId, depth + 1));
  }

  return traverse(fromNodeId, 0);
}

/**
 * Get all nodes reachable from a given node
 */
export function getReachableNodes(
  fromNodeId: string,
  edges: Array<{ fromNodeId: string; toNodeId: string }>
): string[] {
  const reachable = new Set<string>();
  const queue = [fromNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;

    reachable.add(current);

    const outgoing = edges.filter((e) => e.fromNodeId === current);
    for (const edge of outgoing) {
      if (!reachable.has(edge.toNodeId)) {
        queue.push(edge.toNodeId);
      }
    }
  }

  return Array.from(reachable);
}

// =============================================================================
// EXPRESSION EVALUATION
// =============================================================================

/**
 * Evaluate a simple expression
 * Supports: ${field.path}, ${output.stepId.field}
 */
export function evaluateExpression(
  expression: string,
  data: ExecutionData,
  stepResult?: unknown
): string {
  return expression.replace(/\$\{([^}]+)\}/g, (match, path) => {
    const value = getFieldValue(path.trim(), data, stepResult);
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

/**
 * Evaluate all expressions in an object
 */
export function evaluateExpressions<T>(
  obj: T,
  data: ExecutionData,
  stepResult?: unknown
): T {
  if (typeof obj === 'string') {
    return evaluateExpression(obj, data, stepResult) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => evaluateExpressions(item, data, stepResult)) as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = evaluateExpressions(value, data, stepResult);
    }
    return result as T;
  }

  return obj;
}
