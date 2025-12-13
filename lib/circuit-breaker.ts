/**
 * Circuit Breaker Implementation
 * VS6.1: Circuit Breakers & Fallbacks
 *
 * Implements the circuit breaker pattern for resilient OS client calls:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit tripped, requests fail fast with fallback
 * - HALF-OPEN: Testing recovery, limited requests allowed
 *
 * Authorization Code: VS1-VS9-APPROVED-20251213
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms before attempting recovery */
  resetTimeout: number;
  /** Number of successful calls in HALF_OPEN to close circuit */
  successThreshold: number;
  /** Timeout for individual requests in ms */
  requestTimeout: number;
  /** Name for logging */
  name: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  requestTimeout: 10000, // 10 seconds
  name: 'default',
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        // Circuit is open, fail fast
        console.warn(`[CircuitBreaker:${this.config.name}] Circuit OPEN - failing fast`);
        if (fallback) {
          return fallback();
        }
        throw new CircuitBreakerError('Circuit breaker is open', this.config.name);
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);

      // Try fallback if available
      if (fallback) {
        console.warn(`[CircuitBreaker:${this.config.name}] Using fallback after failure`);
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${this.config.requestTimeout}ms`)),
          this.config.requestTimeout
        )
      ),
    ]);
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      console.log(
        `[CircuitBreaker:${this.config.name}] HALF_OPEN success ${this.successes}/${this.config.successThreshold}`
      );

      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failures = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.lastFailureTime = new Date();
    this.totalFailures++;
    this.failures++;

    console.error(
      `[CircuitBreaker:${this.config.name}] Failure ${this.failures}/${this.config.failureThreshold}: ${error.message}`
    );

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN reopens the circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.config.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.resetTimeout;
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    console.log(
      `[CircuitBreaker:${this.config.name}] State transition: ${this.state} → ${newState}`
    );

    this.state = newState;

    if (newState === CircuitState.CLOSED) {
      this.failures = 0;
      this.successes = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successes = 0;
    }
  }

  /**
   * Get current stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailureTime,
      lastSuccess: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Force circuit to specific state (for testing/admin)
   */
  forceState(state: CircuitState): void {
    console.warn(`[CircuitBreaker:${this.config.name}] Force state: ${state}`);
    this.transitionTo(state);
  }

  /**
   * Reset circuit to initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    console.log(`[CircuitBreaker:${this.config.name}] Circuit reset`);
  }
}

/**
 * Custom error for circuit breaker
 */
export class CircuitBreakerError extends Error {
  constructor(message: string, public circuitName: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );

      console.log(
        `[RetryWithBackoff] Attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${Math.round(delay)}ms`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Helper: Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors
  if (error.message.includes('ECONNREFUSED')) return true;
  if (error.message.includes('ETIMEDOUT')) return true;
  if (error.message.includes('ENOTFOUND')) return true;
  if (error.message.includes('timeout')) return true;

  // HTTP status codes (from axios errors)
  const axiosError = error as { response?: { status?: number } };
  if (axiosError.response?.status) {
    const status = axiosError.response.status;
    // Retry on 429 (rate limit), 502, 503, 504 (server errors)
    return status === 429 || status === 502 || status === 503 || status === 504;
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
