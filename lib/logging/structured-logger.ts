/**
 * Structured Logger
 *
 * S350: Security Hole Remediation & Auth Enforcement
 * Behavior Contract B003: No silent failures - all errors logged
 *
 * Provides structured logging that integrates with Google Cloud Logging.
 * All logs include severity, context, and structured data for searchability.
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logging/structured-logger';
 *
 * logger.info('User logged in', { userId: '123', ip: '1.2.3.4' });
 * logger.warn('Rate limit approaching', { userId: '123', remaining: 5 });
 * logger.error('Database query failed', { error, query: 'SELECT...' });
 * ```
 *
 * In Cloud Run, these logs are automatically picked up by Cloud Logging
 * with proper severity levels and structured data.
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface LogEntry {
  severity: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  // GCP-specific fields
  'logging.googleapis.com/labels'?: Record<string, string>;
  'logging.googleapis.com/trace'?: string;
}

interface LoggerOptions {
  service?: string;
  version?: string;
  environment?: string;
}

class StructuredLogger {
  private options: LoggerOptions;
  private isProduction: boolean;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      service: options.service || 'premiumradar-saas',
      version: options.version || process.env.K_REVISION || 'local',
      environment: options.environment || process.env.NODE_ENV || 'development',
    };
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      severity: level,
      message,
      timestamp: new Date().toISOString(),
      'logging.googleapis.com/labels': {
        service: this.options.service!,
        version: this.options.version!,
        environment: this.options.environment!,
      },
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry = this.formatEntry(level, message, context, error);

    // In production, output JSON for Cloud Logging
    if (this.isProduction) {
      const output = level === 'ERROR' || level === 'CRITICAL'
        ? console.error
        : level === 'WARNING'
        ? console.warn
        : console.log;

      output(JSON.stringify(entry));
    } else {
      // In development, use readable format
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      const errorStr = error ? `\n  Error: ${error.message}\n  Stack: ${error.stack}` : '';

      const colorMap: Record<LogLevel, string> = {
        DEBUG: '\x1b[90m',    // gray
        INFO: '\x1b[36m',     // cyan
        WARNING: '\x1b[33m',  // yellow
        ERROR: '\x1b[31m',    // red
        CRITICAL: '\x1b[35m', // magenta
      };
      const reset = '\x1b[0m';
      const color = colorMap[level];

      console.log(`${color}[${timestamp}] [${level}]${reset} ${message}${contextStr}${errorStr}`);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('WARNING', message, context);
  }

  error(message: string, contextOrError?: Record<string, unknown> | Error, maybeError?: Error): void {
    let context: Record<string, unknown> | undefined;
    let error: Error | undefined;

    if (contextOrError instanceof Error) {
      error = contextOrError;
    } else {
      context = contextOrError;
      error = maybeError;
    }

    this.log('ERROR', message, context, error);
  }

  critical(message: string, contextOrError?: Record<string, unknown> | Error, maybeError?: Error): void {
    let context: Record<string, unknown> | undefined;
    let error: Error | undefined;

    if (contextOrError instanceof Error) {
      error = contextOrError;
    } else {
      context = contextOrError;
      error = maybeError;
    }

    this.log('CRITICAL', message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Record<string, string>): StructuredLogger {
    return new StructuredLogger({
      ...this.options,
      // Merge labels
    });
  }

  /**
   * Log API request/response for audit trail
   */
  auditRequest(params: {
    method: string;
    path: string;
    userId?: string;
    tenantId?: string;
    statusCode: number;
    durationMs: number;
    error?: string;
  }): void {
    const level: LogLevel = params.statusCode >= 500 ? 'ERROR' :
                            params.statusCode >= 400 ? 'WARNING' : 'INFO';

    this.log(level, `API ${params.method} ${params.path}`, {
      http_request: {
        method: params.method,
        path: params.path,
        status_code: params.statusCode,
        duration_ms: params.durationMs,
      },
      user_id: params.userId,
      tenant_id: params.tenantId,
      error: params.error,
    });
  }

  /**
   * Log security-relevant events
   */
  security(event: string, context: Record<string, unknown>): void {
    this.log('WARNING', `[SECURITY] ${event}`, {
      ...context,
      security_event: true,
    });
  }
}

// Export singleton instance
export const logger = new StructuredLogger();

// Export class for custom instances
export { StructuredLogger };

// Export types
export type { LogLevel, LogEntry, LoggerOptions };
