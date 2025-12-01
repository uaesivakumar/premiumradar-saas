/**
 * Watch Expression Evaluator
 * Sprint S53: Journey Debugger
 *
 * Evaluates watch expressions in journey context.
 */
import type { WatchExpression, WatchEvaluation, Variable, VariableScope } from './types';
import { generateDebugId, createVariable, getVariableChildren } from './types';

// =============================================================================
// WATCH EVALUATOR CLASS
// =============================================================================

export class WatchEvaluator {
  private expressions: Map<string, WatchExpression> = new Map();
  private onUpdate?: (evaluation: WatchEvaluation) => void;

  constructor(onUpdate?: (evaluation: WatchEvaluation) => void) {
    this.onUpdate = onUpdate;
  }

  // ===========================================================================
  // EXPRESSION MANAGEMENT
  // ===========================================================================

  /**
   * Add a new watch expression
   */
  addExpression(expression: string, name?: string): WatchExpression {
    const watchExpr: WatchExpression = {
      id: generateDebugId('watch'),
      expression,
      name: name || expression,
      enabled: true,
    };

    this.expressions.set(watchExpr.id, watchExpr);
    return watchExpr;
  }

  /**
   * Remove a watch expression
   */
  removeExpression(expressionId: string): boolean {
    return this.expressions.delete(expressionId);
  }

  /**
   * Update a watch expression
   */
  updateExpression(
    expressionId: string,
    updates: Partial<Omit<WatchExpression, 'id'>>
  ): WatchExpression | null {
    const expr = this.expressions.get(expressionId);
    if (!expr) return null;

    const updated = { ...expr, ...updates };
    this.expressions.set(expressionId, updated);
    return updated;
  }

  /**
   * Toggle expression enabled state
   */
  toggleExpression(expressionId: string): WatchExpression | null {
    const expr = this.expressions.get(expressionId);
    if (!expr) return null;

    return this.updateExpression(expressionId, { enabled: !expr.enabled });
  }

  /**
   * Get an expression by ID
   */
  getExpression(expressionId: string): WatchExpression | null {
    return this.expressions.get(expressionId) || null;
  }

  /**
   * Get all expressions
   */
  getAllExpressions(): WatchExpression[] {
    return Array.from(this.expressions.values());
  }

  /**
   * Get enabled expressions
   */
  getEnabledExpressions(): WatchExpression[] {
    return this.getAllExpressions().filter((e) => e.enabled);
  }

  /**
   * Clear all expressions
   */
  clearAllExpressions(): void {
    this.expressions.clear();
  }

  // ===========================================================================
  // EVALUATION
  // ===========================================================================

  /**
   * Evaluate all enabled expressions
   */
  evaluateAll(context: Record<string, unknown>): WatchEvaluation[] {
    const results: WatchEvaluation[] = [];

    for (const expr of this.getEnabledExpressions()) {
      const evaluation = this.evaluate(expr, context);
      results.push(evaluation);

      // Update expression with last value
      this.updateExpression(expr.id, {
        lastValue: evaluation.value,
        lastError: evaluation.error,
        lastEvaluatedAt: evaluation.evaluatedAt,
      });

      // Notify listener
      if (this.onUpdate) {
        this.onUpdate(evaluation);
      }
    }

    return results;
  }

  /**
   * Evaluate a single expression
   */
  evaluate(
    expression: WatchExpression,
    context: Record<string, unknown>
  ): WatchEvaluation {
    const evaluation: WatchEvaluation = {
      expressionId: expression.id,
      expression: expression.expression,
      value: undefined,
      type: 'undefined',
      evaluatedAt: new Date(),
    };

    try {
      const value = this.evaluateExpression(expression.expression, context);
      evaluation.value = value;
      evaluation.type = this.getTypeName(value);
    } catch (error) {
      evaluation.error = error instanceof Error ? error.message : String(error);
    }

    return evaluation;
  }

  /**
   * Evaluate a single expression string
   */
  evaluateSingle(
    expressionStr: string,
    context: Record<string, unknown>
  ): WatchEvaluation {
    const tempExpr: WatchExpression = {
      id: 'temp',
      expression: expressionStr,
      enabled: true,
    };
    return this.evaluate(tempExpr, context);
  }

  /**
   * Internal expression evaluation
   */
  private evaluateExpression(
    expression: string,
    context: Record<string, unknown>
  ): unknown {
    // Handle simple property access (e.g., "company.name")
    if (/^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*)*$/.test(expression)) {
      return this.getNestedValue(context, expression);
    }

    // Handle array access (e.g., "items[0]")
    if (/^[a-zA-Z_$][\w$]*(\[[^\]]+\])+$/.test(expression)) {
      return this.evaluateArrayAccess(expression, context);
    }

    // Handle complex expressions with safe evaluation
    try {
      const keys = Object.keys(context);
      const values = Object.values(context);

      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `return (${expression})`);
      return fn(...values);
    } catch (error) {
      throw new Error(`Cannot evaluate: ${expression}`);
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Evaluate array access expression
   */
  private evaluateArrayAccess(
    expression: string,
    context: Record<string, unknown>
  ): unknown {
    const match = expression.match(/^([a-zA-Z_$][\w$]*)((?:\[[^\]]+\])+)$/);
    if (!match) return undefined;

    const [, baseName, accessors] = match;
    let current: unknown = context[baseName];

    const indexMatches = accessors.matchAll(/\[([^\]]+)\]/g);
    for (const indexMatch of indexMatches) {
      if (current === null || current === undefined) {
        return undefined;
      }

      const indexStr = indexMatch[1];
      let index: string | number;

      // Try to parse as number
      const numIndex = parseInt(indexStr, 10);
      if (!isNaN(numIndex)) {
        index = numIndex;
      } else {
        // Try as string key (remove quotes if present)
        index = indexStr.replace(/^['"]|['"]$/g, '');
      }

      if (Array.isArray(current)) {
        current = current[index as number];
      } else if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[index];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Get type name for value
   */
  private getTypeName(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Export expressions to JSON
   */
  toJSON(): WatchExpression[] {
    return this.getAllExpressions();
  }

  /**
   * Import expressions from JSON
   */
  fromJSON(expressions: WatchExpression[]): void {
    this.clearAllExpressions();
    for (const expr of expressions) {
      this.expressions.set(expr.id, {
        ...expr,
        lastEvaluatedAt: expr.lastEvaluatedAt
          ? new Date(expr.lastEvaluatedAt)
          : undefined,
      });
    }
  }
}

// =============================================================================
// VARIABLE INSPECTOR
// =============================================================================

export class VariableInspector {
  /**
   * Create scopes from context
   */
  static createScopes(
    context: Record<string, unknown>,
    additionalScopes?: Record<string, Record<string, unknown>>
  ): VariableScope[] {
    const scopes: VariableScope[] = [];

    // Main context scope
    scopes.push({
      name: 'Context',
      variables: this.createVariables(context, 'context'),
      expandable: Object.keys(context).length > 0,
    });

    // Additional scopes
    if (additionalScopes) {
      for (const [name, scopeData] of Object.entries(additionalScopes)) {
        scopes.push({
          name,
          variables: this.createVariables(scopeData, name.toLowerCase()),
          expandable: Object.keys(scopeData).length > 0,
        });
      }
    }

    return scopes;
  }

  /**
   * Create variables from an object
   */
  static createVariables(
    obj: Record<string, unknown>,
    basePath: string
  ): Variable[] {
    return Object.entries(obj).map(([key, value]) =>
      createVariable(key, value, `${basePath}.${key}`)
    );
  }

  /**
   * Expand a variable (get children)
   */
  static expandVariable(variable: Variable): Variable[] {
    return getVariableChildren(variable);
  }

  /**
   * Get value at path
   */
  static getValueAtPath(
    context: Record<string, unknown>,
    path: string
  ): unknown {
    const parts = path.split('.').slice(1); // Remove scope prefix
    let current: unknown = context;

    for (const part of parts) {
      // Handle array index
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[key];
          if (Array.isArray(current)) {
            current = current[parseInt(index, 10)];
          }
        } else {
          return undefined;
        }
      } else {
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
    }

    return current;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

export function createWatchEvaluator(
  onUpdate?: (evaluation: WatchEvaluation) => void
): WatchEvaluator {
  return new WatchEvaluator(onUpdate);
}
