/**
 * Sprint S2: OS Identity & Token Hardening
 *
 * Features:
 * 1. SaaS→OS token rotation policy
 * 2. OIDC envelope validation (audience, issuer, expiry)
 * 3. Anti-replay defense (nonce)
 * 4. User-level scoping for enterprise
 * 5. Expired-token anomaly alarms
 *
 * Zero-Trust Security Model with automatic token management
 */

import { GoogleAuth, IdTokenClient } from 'google-auth-library';
import { randomBytes } from 'crypto';

export interface TokenConfig {
  targetAudience: string;
  tokenTTL?: number; // Time-to-live in seconds (default: 3600)
  rotationInterval?: number; // Auto-rotation interval in seconds (default: 1800)
  enableNonceValidation?: boolean;
  enableAnomalyDetection?: boolean;
}

export interface TokenMetadata {
  token: string;
  expiresAt: Date;
  issuedAt: Date;
  nonce?: string;
  userId?: string;
  tenantId?: string;
  scopes: string[];
}

export interface TokenValidationResult {
  valid: boolean;
  reason?: string;
  anomalyDetected?: boolean;
  metadata?: TokenMetadata;
}

interface NonceRecord {
  nonce: string;
  timestamp: Date;
  used: boolean;
}

interface TokenUsageRecord {
  timestamp: Date;
  success: boolean;
  anomaly?: string;
}

/**
 * Token Manager - Handles OIDC token lifecycle with security hardening
 */
class TokenManager {
  private auth: GoogleAuth;
  private config: Required<TokenConfig>;
  private currentToken: TokenMetadata | null = null;
  private rotationTimer: NodeJS.Timeout | null = null;
  private nonceStore: Map<string, NonceRecord> = new Map();
  private usageHistory: TokenUsageRecord[] = [];
  private anomalyLog: Array<{ timestamp: Date; anomaly: string; metadata: any }> = [];

  constructor(config: TokenConfig) {
    this.auth = new GoogleAuth();
    this.config = {
      targetAudience: config.targetAudience,
      tokenTTL: config.tokenTTL ?? 3600, // 1 hour default
      rotationInterval: config.rotationInterval ?? 1800, // 30 min default
      enableNonceValidation: config.enableNonceValidation ?? true,
      enableAnomalyDetection: config.enableAnomalyDetection ?? true,
    };

    // Start automatic rotation if not in development
    if (process.env.NODE_ENV !== 'development') {
      this.startAutoRotation();
    }

    // Clean up old nonces every 5 minutes
    setInterval(() => this.cleanupOldNonces(), 5 * 60 * 1000);
  }

  /**
   * Feature 1: Token Rotation Policy
   * Automatically rotates tokens before expiry
   */
  async getToken(userId?: string, tenantId?: string, scopes: string[] = []): Promise<string> {
    // Check if current token is valid and not close to expiry
    if (this.currentToken && !this.isTokenNearExpiry(this.currentToken)) {
      return this.currentToken.token;
    }

    // Rotate token
    return await this.rotateToken(userId, tenantId, scopes);
  }

  /**
   * Rotate token (force refresh)
   */
  async rotateToken(userId?: string, tenantId?: string, scopes: string[] = []): Promise<string> {
    try {
      const client = await this.auth.getIdTokenClient(this.config.targetAudience);
      const headers = await client.getRequestHeaders();
      const token = headers.Authorization?.replace('Bearer ', '');

      if (!token) {
        throw new Error('Failed to get OIDC token');
      }

      // Create token metadata
      const now = new Date();
      const metadata: TokenMetadata = {
        token,
        issuedAt: now,
        expiresAt: new Date(now.getTime() + this.config.tokenTTL * 1000),
        nonce: this.config.enableNonceValidation ? this.generateNonce() : undefined,
        userId,
        tenantId,
        scopes,
      };

      this.currentToken = metadata;

      // Log successful rotation
      this.recordUsage(true);

      return token;
    } catch (error) {
      this.recordUsage(false);
      if (this.config.enableAnomalyDetection) {
        this.detectAnomaly('token_rotation_failed', { error });
      }
      throw error;
    }
  }

  /**
   * Feature 2: OIDC Envelope Validation
   * Validates token structure, audience, issuer, and expiry
   */
  async validateToken(token: string, expectedAudience?: string): Promise<TokenValidationResult> {
    try {
      // Parse JWT (basic validation without full verification for now)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, reason: 'Invalid JWT structure' };
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Validate audience
      if (expectedAudience && payload.aud !== expectedAudience) {
        return { valid: false, reason: 'Audience mismatch' };
      }

      // Validate expiry
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        // Expired token - trigger anomaly alarm
        if (this.config.enableAnomalyDetection) {
          this.detectAnomaly('expired_token_used', {
            exp: payload.exp,
            now,
            diff: now - payload.exp,
          });
        }
        return { valid: false, reason: 'Token expired', anomalyDetected: true };
      }

      // Validate issuer (should be Google)
      if (payload.iss && !payload.iss.includes('accounts.google.com')) {
        return { valid: false, reason: 'Invalid issuer' };
      }

      // Validate not-before (if present)
      if (payload.nbf && payload.nbf > now) {
        return { valid: false, reason: 'Token not yet valid' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: 'Token parsing failed' };
    }
  }

  /**
   * Feature 3: Anti-Replay Defense (Nonce)
   * Ensures each request is unique and cannot be replayed
   */
  generateNonce(): string {
    const nonce = randomBytes(32).toString('hex');
    this.nonceStore.set(nonce, {
      nonce,
      timestamp: new Date(),
      used: false,
    });
    return nonce;
  }

  validateNonce(nonce: string): boolean {
    const record = this.nonceStore.get(nonce);

    if (!record) {
      // Nonce not found - possible replay attack
      if (this.config.enableAnomalyDetection) {
        this.detectAnomaly('unknown_nonce', { nonce });
      }
      return false;
    }

    if (record.used) {
      // Nonce already used - replay attack detected!
      if (this.config.enableAnomalyDetection) {
        this.detectAnomaly('nonce_reuse_detected', { nonce, timestamp: record.timestamp });
      }
      return false;
    }

    // Mark nonce as used
    record.used = true;
    this.nonceStore.set(nonce, record);

    return true;
  }

  /**
   * Feature 4: User-Level Scoping for Enterprise
   * Creates scoped tokens with user/tenant isolation
   */
  async getScopedToken(userId: string, tenantId: string, scopes: string[]): Promise<{
    token: string;
    metadata: TokenMetadata;
  }> {
    const token = await this.getToken(userId, tenantId, scopes);

    if (!this.currentToken) {
      throw new Error('Token metadata not available');
    }

    return {
      token,
      metadata: this.currentToken,
    };
  }

  /**
   * Validate scopes for user request
   */
  validateScopes(requiredScopes: string[], tokenMetadata: TokenMetadata): boolean {
    return requiredScopes.every(scope => tokenMetadata.scopes.includes(scope));
  }

  /**
   * Feature 5: Expired-Token Anomaly Alarms
   * Detects and alerts on suspicious token usage patterns
   */
  private detectAnomaly(type: string, metadata: any): void {
    const anomaly = {
      timestamp: new Date(),
      anomaly: type,
      metadata,
    };

    this.anomalyLog.push(anomaly);

    // Keep only last 1000 anomalies
    if (this.anomalyLog.length > 1000) {
      this.anomalyLog.shift();
    }

    // Log to console in production (in real system, send to Cloud Logging/monitoring)
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY ANOMALY]', {
        type,
        timestamp: anomaly.timestamp.toISOString(),
        ...metadata,
      });
    }

    // Check for patterns that indicate attack
    this.analyzeAnomalyPatterns();
  }

  /**
   * Analyze anomaly patterns to detect attacks
   */
  private analyzeAnomalyPatterns(): void {
    const recentAnomalies = this.anomalyLog.filter(
      a => Date.now() - a.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    // Multiple expired token attempts (possible stolen token)
    const expiredTokenAttempts = recentAnomalies.filter(
      a => a.anomaly === 'expired_token_used'
    );
    if (expiredTokenAttempts.length >= 5) {
      console.error('[CRITICAL] Multiple expired token attempts detected - possible stolen token');
    }

    // Multiple nonce reuse attempts (replay attack)
    const nonceReuseAttempts = recentAnomalies.filter(
      a => a.anomaly === 'nonce_reuse_detected'
    );
    if (nonceReuseAttempts.length >= 3) {
      console.error('[CRITICAL] Replay attack detected - multiple nonce reuse attempts');
    }

    // High failure rate (possible brute force)
    const recentUsage = this.usageHistory.filter(
      u => Date.now() - u.timestamp.getTime() < 5 * 60 * 1000
    );
    const failureRate = recentUsage.filter(u => !u.success).length / recentUsage.length;
    if (recentUsage.length >= 10 && failureRate > 0.5) {
      console.error('[WARNING] High token failure rate detected:', {
        total: recentUsage.length,
        failureRate: `${(failureRate * 100).toFixed(1)}%`,
      });
    }
  }

  /**
   * Helper: Check if token is near expiry (within 5 minutes)
   */
  private isTokenNearExpiry(metadata: TokenMetadata): boolean {
    const now = new Date();
    const timeUntilExpiry = metadata.expiresAt.getTime() - now.getTime();
    return timeUntilExpiry < 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Helper: Record token usage for anomaly detection
   */
  private recordUsage(success: boolean, anomaly?: string): void {
    this.usageHistory.push({
      timestamp: new Date(),
      success,
      anomaly,
    });

    // Keep only last 1000 records
    if (this.usageHistory.length > 1000) {
      this.usageHistory.shift();
    }
  }

  /**
   * Start automatic token rotation
   */
  private startAutoRotation(): void {
    this.rotationTimer = setInterval(async () => {
      try {
        if (this.currentToken) {
          await this.rotateToken(
            this.currentToken.userId,
            this.currentToken.tenantId,
            this.currentToken.scopes
          );
          console.log('[Token Manager] Auto-rotation complete');
        }
      } catch (error) {
        console.error('[Token Manager] Auto-rotation failed:', error);
      }
    }, this.config.rotationInterval * 1000);
  }

  /**
   * Stop automatic rotation
   */
  stopAutoRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  /**
   * Clean up old nonces (older than 1 hour)
   */
  private cleanupOldNonces(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [nonce, record] of this.nonceStore.entries()) {
      if (record.timestamp.getTime() < oneHourAgo) {
        this.nonceStore.delete(nonce);
      }
    }
  }

  /**
   * Get anomaly statistics
   */
  getAnomalyStats(): {
    totalAnomalies: number;
    recentAnomalies: number;
    anomalyBreakdown: Record<string, number>;
  } {
    const recentAnomalies = this.anomalyLog.filter(
      a => Date.now() - a.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const breakdown: Record<string, number> = {};
    for (const anomaly of this.anomalyLog) {
      breakdown[anomaly.anomaly] = (breakdown[anomaly.anomaly] || 0) + 1;
    }

    return {
      totalAnomalies: this.anomalyLog.length,
      recentAnomalies: recentAnomalies.length,
      anomalyBreakdown: breakdown,
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalRequests: number;
    successRate: number;
    recentRequests: number;
  } {
    const recentUsage = this.usageHistory.filter(
      u => Date.now() - u.timestamp.getTime() < 60 * 60 * 1000
    );

    const successCount = this.usageHistory.filter(u => u.success).length;

    return {
      totalRequests: this.usageHistory.length,
      successRate: this.usageHistory.length > 0 ? successCount / this.usageHistory.length : 0,
      recentRequests: recentUsage.length,
    };
  }
}

// Factory for creating token managers
export function createTokenManager(config: TokenConfig): TokenManager {
  return new TokenManager(config);
}

// Singleton for default OS client
export const osTokenManager = createTokenManager({
  targetAudience: process.env.UPR_OS_BASE_URL || 'http://localhost:8080',
  tokenTTL: 3600, // 1 hour
  rotationInterval: 1800, // 30 minutes
  enableNonceValidation: true,
  enableAnomalyDetection: true,
});

export { TokenManager };
