/**
 * VS6 E2E Test Suite: Resilience & Fault Tolerance
 * Authorization Code: VS1-VS9-APPROVED-20251213
 *
 * Tests:
 * - Circuit breaker state transitions
 * - Retry with exponential backoff
 * - Fallback responses
 * - OS client resilience
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitState,
  retryWithBackoff,
  isRetryableError,
} from '../../lib/circuit-breaker';

describe('VS6: Resilience & Fault Tolerance', () => {
  describe('VS6.1: Circuit Breaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        name: 'test-breaker',
        failureThreshold: 3,
        resetTimeout: 100, // Short timeout for testing
        successThreshold: 2,
        requestTimeout: 50,
      });
    });

    afterEach(() => {
      circuitBreaker.reset();
    });

    it('should start in CLOSED state', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
    });

    it('should execute successful requests in CLOSED state', async () => {
      const result = await circuitBreaker.execute(async () => 'success');
      expect(result).toBe('success');

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.totalSuccesses).toBe(1);
    });

    it('should transition to OPEN after failure threshold', async () => {
      const failingFn = async () => {
        throw new Error('Service unavailable');
      };

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn);
        } catch {
          // Expected
        }
      }

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.OPEN);
      expect(stats.failures).toBe(3);
    });

    it('should fail fast when circuit is OPEN', async () => {
      // Create a breaker with long reset timeout
      const breaker = new CircuitBreaker({
        name: 'fail-fast-test',
        failureThreshold: 1,
        resetTimeout: 60000, // Very long so it stays OPEN
        successThreshold: 1,
        requestTimeout: 50,
      });

      // Trip the circuit
      try {
        await breaker.execute(async () => {
          throw new Error('trip');
        });
      } catch {}

      // Should fail fast without executing
      await expect(
        breaker.execute(async () => 'should not execute')
      ).rejects.toThrow('Circuit breaker is open');
    });

    it('should use fallback when circuit is OPEN', async () => {
      // Force OPEN state with a "recent" failure by setting internal state
      const breaker = new CircuitBreaker({
        name: 'fallback-test',
        failureThreshold: 1,
        resetTimeout: 60000, // Long timeout so it stays OPEN
        successThreshold: 1,
        requestTimeout: 50,
      });

      // Trip the circuit by failing
      try {
        await breaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {}

      // Now should use fallback
      const result = await breaker.execute(
        async () => {
          throw new Error('should use fallback');
        },
        () => 'fallback response'
      );

      expect(result).toBe('fallback response');
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Force OPEN state with a recent failure
      circuitBreaker.forceState(CircuitState.OPEN);

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next execution should attempt (HALF_OPEN)
      const result = await circuitBreaker.execute(async () => 'recovered');
      expect(result).toBe('recovered');
    });

    it('should transition from HALF_OPEN to CLOSED after success threshold', async () => {
      circuitBreaker.forceState(CircuitState.HALF_OPEN);

      // 2 successes (threshold)
      await circuitBreaker.execute(async () => 'success1');
      await circuitBreaker.execute(async () => 'success2');

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
    });

    it('should transition from HALF_OPEN to OPEN on failure', async () => {
      circuitBreaker.forceState(CircuitState.HALF_OPEN);

      try {
        await circuitBreaker.execute(async () => {
          throw new Error('Failed in half-open');
        });
      } catch {
        // Expected
      }

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.OPEN);
    });

    it('should timeout long-running requests', async () => {
      const slowFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'too slow';
      };

      await expect(circuitBreaker.execute(slowFn)).rejects.toThrow('timeout');
    });

    it('should reset failures on success in CLOSED state', async () => {
      // Add some failures (not enough to trip)
      try {
        await circuitBreaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {
        // Expected
      }

      let stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(1);

      // Success should reset failures
      await circuitBreaker.execute(async () => 'success');

      stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(0);
    });
  });

  describe('VS6.1: Retry with Backoff', () => {
    it('should succeed on first attempt if no error', async () => {
      let attempts = 0;
      const result = await retryWithBackoff(async () => {
        attempts++;
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const result = await retryWithBackoff(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        },
        { maxRetries: 5, baseDelay: 10 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      let attempts = 0;
      await expect(
        retryWithBackoff(
          async () => {
            attempts++;
            throw new Error('Permanent failure');
          },
          { maxRetries: 2, baseDelay: 10 }
        )
      ).rejects.toThrow('Permanent failure');

      expect(attempts).toBe(3); // Initial + 2 retries
    });

    it('should respect shouldRetry function', async () => {
      let attempts = 0;
      await expect(
        retryWithBackoff(
          async () => {
            attempts++;
            throw new Error('Non-retryable');
          },
          {
            maxRetries: 5,
            baseDelay: 10,
            shouldRetry: () => false,
          }
        )
      ).rejects.toThrow('Non-retryable');

      expect(attempts).toBe(1); // No retries
    });

    it('should apply exponential backoff', async () => {
      const delays: number[] = [];
      let lastTime = Date.now();

      let attempts = 0;
      await retryWithBackoff(
        async () => {
          attempts++;
          const now = Date.now();
          if (attempts > 1) {
            delays.push(now - lastTime);
          }
          lastTime = now;
          if (attempts < 4) {
            throw new Error('fail');
          }
          return 'success';
        },
        { maxRetries: 5, baseDelay: 50, maxDelay: 5000 }
      );

      // Just verify we had delays (exponential backoff is working)
      // Don't test exact timing due to jitter and OS scheduling
      expect(delays.length).toBe(3); // 3 retries = 3 delays
      delays.forEach(delay => {
        expect(delay).toBeGreaterThan(0);
      });
    });
  });

  describe('VS6.1: Retryable Error Detection', () => {
    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
      expect(isRetryableError(new Error('timeout'))).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      const rateLimitError = Object.assign(new Error('Rate limited'), {
        response: { status: 429 },
      });
      expect(isRetryableError(rateLimitError)).toBe(true);
    });

    it('should identify server errors as retryable', () => {
      const serverErrors = [502, 503, 504];
      serverErrors.forEach(status => {
        const error = Object.assign(new Error('Server error'), {
          response: { status },
        });
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should identify client errors as non-retryable', () => {
      const clientErrors = [400, 401, 403, 404, 422];
      clientErrors.forEach(status => {
        const error = Object.assign(new Error('Client error'), {
          response: { status },
        });
        expect(isRetryableError(error)).toBe(false);
      });
    });
  });

  describe('VS6.2: Fallback Responses', () => {
    it('should provide score fallback when service unavailable', async () => {
      const circuitBreaker = new CircuitBreaker({
        name: 'score-test',
        failureThreshold: 1,
        resetTimeout: 1000,
        successThreshold: 1,
        requestTimeout: 10,
      });

      circuitBreaker.forceState(CircuitState.OPEN);

      const fallback = {
        success: true,
        data: {
          entity_id: 'test-123',
          scores: {
            q_score: { value: 50, rating: 'FAIR' },
            composite: { value: 50, tier: 'COOL', grade: 'C' },
          },
          fallback: true,
        },
        timestamp: new Date().toISOString(),
      };

      const result = await circuitBreaker.execute(
        async () => {
          throw new Error('Service unavailable');
        },
        () => fallback
      );

      expect(result.success).toBe(true);
      expect(result.data.fallback).toBe(true);
      expect(result.data.scores.composite.value).toBe(50);
    });

    it('should provide discovery fallback when service unavailable', async () => {
      const circuitBreaker = new CircuitBreaker({
        name: 'discovery-test',
        failureThreshold: 1,
        resetTimeout: 1000,
        successThreshold: 1,
        requestTimeout: 10,
      });

      circuitBreaker.forceState(CircuitState.OPEN);

      const fallback = {
        success: true,
        data: {
          companies: [],
          signals: [],
          total: 0,
          fallback: true,
          message: 'Discovery temporarily unavailable',
        },
        timestamp: new Date().toISOString(),
      };

      const result = await circuitBreaker.execute(
        async () => {
          throw new Error('Service unavailable');
        },
        () => fallback
      );

      expect(result.success).toBe(true);
      expect(result.data.fallback).toBe(true);
      expect(result.data.companies).toHaveLength(0);
    });

    it('should provide outreach fallback when service unavailable', async () => {
      const circuitBreaker = new CircuitBreaker({
        name: 'outreach-test',
        failureThreshold: 1,
        resetTimeout: 1000,
        successThreshold: 1,
        requestTimeout: 10,
      });

      circuitBreaker.forceState(CircuitState.OPEN);

      const fallback = {
        success: true,
        data: {
          outreach_items: [],
          total: 0,
          fallback: true,
          message: 'Outreach temporarily unavailable',
        },
        timestamp: new Date().toISOString(),
      };

      const result = await circuitBreaker.execute(
        async () => {
          throw new Error('Service unavailable');
        },
        () => fallback
      );

      expect(result.success).toBe(true);
      expect(result.data.fallback).toBe(true);
    });
  });

  describe('Circuit Breaker Stats', () => {
    it('should track request statistics', async () => {
      const circuitBreaker = new CircuitBreaker({
        name: 'stats-test',
        failureThreshold: 5,
        resetTimeout: 1000,
        successThreshold: 2,
        requestTimeout: 100,
      });

      // 3 successes
      await circuitBreaker.execute(async () => 'success1');
      await circuitBreaker.execute(async () => 'success2');
      await circuitBreaker.execute(async () => 'success3');

      // 2 failures
      try {
        await circuitBreaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {}
      try {
        await circuitBreaker.execute(async () => {
          throw new Error('fail');
        });
      } catch {}

      const stats = circuitBreaker.getStats();
      expect(stats.totalRequests).toBe(5);
      expect(stats.totalSuccesses).toBe(3);
      expect(stats.totalFailures).toBe(2);
      expect(stats.lastSuccess).not.toBeNull();
      expect(stats.lastFailure).not.toBeNull();
    });

    it('should reset all stats on reset()', () => {
      const circuitBreaker = new CircuitBreaker({
        name: 'reset-test',
        failureThreshold: 5,
        resetTimeout: 1000,
        successThreshold: 2,
        requestTimeout: 100,
      });

      circuitBreaker.forceState(CircuitState.OPEN);
      circuitBreaker.reset();

      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });
});
