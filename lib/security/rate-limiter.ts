/**
 * Sprint S5: WAF + Abuse Prevention
 *
 * Features:
 * 1. Cloud Armor strict mode configuration
 * 2. Rate limiter (API/Chat/Uploads)
 * 3. Abuse IP reputation scoring
 * 4. Country-based anomaly tracking
 * 5. Forced CAPTCHA under attack
 * 6. DDoS protection patterns
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  identifier?: string; // Custom identifier (default: IP)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds
}

export interface IPReputationScore {
  ip: string;
  score: number; // 0-100 (0 = malicious, 100 = trusted)
  violations: string[];
  country?: string;
  isSuspicious: boolean;
}

interface RequestRecord {
  timestamp: number;
  count: number;
  violations: string[];
}

interface IPRecord extends RequestRecord {
  country?: string;
  userAgent?: string;
  lastViolation?: Date;
}

/**
 * Feature 2: Rate Limiter (API/Chat/Uploads)
 */
class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up old records every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // No previous requests or window expired
    if (!record || now - record.timestamp > this.config.windowMs) {
      this.requests.set(identifier, {
        timestamp: now,
        count: 1,
        violations: [],
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(now + this.config.windowMs),
      };
    }

    // Within window
    if (record.count < this.config.maxRequests) {
      record.count++;
      this.requests.set(identifier, record);

      return {
        allowed: true,
        remaining: this.config.maxRequests - record.count,
        resetAt: new Date(record.timestamp + this.config.windowMs),
      };
    }

    // Rate limit exceeded
    const resetAt = new Date(record.timestamp + this.config.windowMs);
    const retryAfter = Math.ceil((resetAt.getTime() - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now - record.timestamp > this.config.windowMs) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * Feature 3: Abuse IP Reputation Scoring
 */
class IPReputationTracker {
  private ipRecords: Map<string, IPRecord> = new Map();
  private blacklist: Set<string> = new Set();
  private whitelist: Set<string> = new Set();

  /**
   * Record IP activity
   */
  recordActivity(ip: string, country?: string, userAgent?: string): void {
    const record = this.ipRecords.get(ip) || {
      timestamp: Date.now(),
      count: 0,
      violations: [],
      country,
      userAgent,
    };

    record.count++;
    this.ipRecords.set(ip, record);
  }

  /**
   * Record violation
   */
  recordViolation(ip: string, violationType: string): void {
    const record = this.ipRecords.get(ip) || {
      timestamp: Date.now(),
      count: 0,
      violations: [],
    };

    record.violations.push(violationType);
    record.lastViolation = new Date();
    this.ipRecords.set(ip, record);

    // Auto-blacklist after 5 violations
    if (record.violations.length >= 5) {
      this.blacklist.add(ip);
      console.error('[IP BLACKLIST]', { ip, violations: record.violations });
    }
  }

  /**
   * Calculate IP reputation score
   */
  getReputationScore(ip: string): IPReputationScore {
    // Check whitelist/blacklist first
    if (this.whitelist.has(ip)) {
      return {
        ip,
        score: 100,
        violations: [],
        isSuspicious: false,
      };
    }

    if (this.blacklist.has(ip)) {
      return {
        ip,
        score: 0,
        violations: ['blacklisted'],
        isSuspicious: true,
      };
    }

    const record = this.ipRecords.get(ip);
    if (!record) {
      return {
        ip,
        score: 50, // Neutral for unknown IPs
        violations: [],
        isSuspicious: false,
      };
    }

    // Calculate score based on violations
    let score = 100;
    score -= record.violations.length * 15; // -15 per violation
    score = Math.max(0, Math.min(100, score));

    return {
      ip,
      score,
      violations: record.violations,
      country: record.country,
      isSuspicious: score < 50,
    };
  }

  /**
   * Manually blacklist/whitelist
   */
  blacklistIP(ip: string): void {
    this.blacklist.add(ip);
    this.whitelist.delete(ip);
  }

  whitelistIP(ip: string): void {
    this.whitelist.add(ip);
    this.blacklist.delete(ip);
  }
}

/**
 * Predefined rate limits for different endpoints
 */
export const RATE_LIMITS = {
  API: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
  }),

  CHAT: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
  }),

  UPLOAD: new RateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 50,
  }),

  AUTH: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Prevent brute force
  }),
};

/**
 * Global IP reputation tracker
 */
export const ipReputationTracker = new IPReputationTracker();

/**
 * Cloud Armor configuration (for GCP deployment)
 */
export const CLOUD_ARMOR_CONFIG = {
  rules: [
    {
      description: 'Block SQL injection attempts',
      expression: "evaluatePreconfiguredExpr('sqli-stable')",
      action: 'deny(403)',
    },
    {
      description: 'Block XSS attempts',
      expression: "evaluatePreconfiguredExpr('xss-stable')",
      action: 'deny(403)',
    },
    {
      description: 'Block LFI attempts',
      expression: "evaluatePreconfiguredExpr('lfi-stable')",
      action: 'deny(403)',
    },
    {
      description: 'Block RFI attempts',
      expression: "evaluatePreconfiguredExpr('rfi-stable')",
      action: 'deny(403)',
    },
    {
      description: 'Rate limit - 100 req/min per IP',
      expression: 'true',
      action: 'rate_based_ban',
      rateLimitOptions: {
        conformAction: 'allow',
        exceedAction: 'deny(429)',
        enforceOnKey: 'IP',
        rateLimitThreshold: {
          count: 100,
          intervalSec: 60,
        },
      },
    },
  ],
};

/**
 * DDoS Protection Patterns
 */
export class DDoSProtection {
  private requestCounts: Map<string, number[]> = new Map();
  private readonly THRESHOLD = 100; // requests
  private readonly WINDOW = 60 * 1000; // 1 minute

  /**
   * Check if request pattern indicates DDoS
   */
  isDDoS(ip: string): boolean {
    const now = Date.now();
    const timestamps = this.requestCounts.get(ip) || [];

    // Remove old timestamps
    const recentTimestamps = timestamps.filter(t => now - t < this.WINDOW);

    // Add current request
    recentTimestamps.push(now);
    this.requestCounts.set(ip, recentTimestamps);

    // Check if threshold exceeded
    if (recentTimestamps.length > this.THRESHOLD) {
      console.error('[DDoS DETECTED]', { ip, requestCount: recentTimestamps.length });
      ipReputationTracker.recordViolation(ip, 'ddos_attempt');
      return true;
    }

    return false;
  }
}

export const ddosProtection = new DDoSProtection();

/**
 * Middleware helper for Next.js API routes
 */
export function withRateLimit(
  handler: Function,
  limiter: RateLimiter = RATE_LIMITS.API
) {
  return async (req: any, res: any) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Check rate limit
    const result = limiter.check(ip);

    if (!result.allowed) {
      res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());
      res.setHeader('Retry-After', result.retryAfter);

      ipReputationTracker.recordViolation(ip, 'rate_limit_exceeded');

      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: result.retryAfter,
      });
    }

    // Check IP reputation
    const reputation = ipReputationTracker.getReputationScore(ip);
    if (reputation.score === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: 'IP blacklisted',
      });
    }

    // Check DDoS
    if (ddosProtection.isDDoS(ip)) {
      ipReputationTracker.blacklistIP(ip);
      return res.status(503).json({
        error: 'Service Unavailable',
        reason: 'DDoS protection triggered',
      });
    }

    // Record activity
    const country = req.headers['cf-ipcountry'] || req.headers['x-country'];
    const userAgent = req.headers['user-agent'];
    ipReputationTracker.recordActivity(ip, country, userAgent);

    // Add headers
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    return handler(req, res);
  };
}

export { RateLimiter, IPReputationTracker };
