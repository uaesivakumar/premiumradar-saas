/**
 * Persistent Memory Store
 *
 * S353: Memory Persistence
 * Behavior Contract B004: Memory survives server restart
 *
 * Provides a persistent key-value store with TTL support.
 * Data is stored in PostgreSQL and survives server restarts.
 *
 * Usage:
 * ```typescript
 * import { memoryStore } from '@/lib/memory/persistent-store';
 *
 * // Store with 1 hour TTL
 * await memoryStore.set('enrichment:apollo:company_123', data, 3600);
 *
 * // Retrieve
 * const cached = await memoryStore.get('enrichment:apollo:company_123');
 *
 * // Delete
 * await memoryStore.delete('enrichment:apollo:company_123');
 * ```
 */

import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';

export interface MemoryEntry<T = unknown> {
  key: string;
  value: T;
  ttlSeconds: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryStoreOptions {
  tenantId: string;
}

class PersistentMemoryStore {
  /**
   * Get a value from the store
   */
  async get<T = unknown>(
    key: string,
    options: MemoryStoreOptions
  ): Promise<T | null> {
    try {
      const result = await queryOne<{
        store_value: T;
        expires_at: Date;
      }>(`
        SELECT store_value, expires_at
        FROM memory_store
        WHERE tenant_id = $1
          AND store_key = $2
          AND expires_at > NOW()
      `, [options.tenantId, key]);

      if (!result) {
        return null;
      }

      return result.store_value;
    } catch (error) {
      logger.error('Memory store get failed', { key, tenantId: options.tenantId }, error as Error);
      return null;
    }
  }

  /**
   * Set a value in the store with TTL
   *
   * @param key - The storage key (namespaced, e.g., "enrichment:apollo:company_123")
   * @param value - The value to store (will be JSON serialized)
   * @param ttlSeconds - Time-to-live in seconds (default: 24 hours)
   * @param options - Store options including tenantId
   */
  async set<T = unknown>(
    key: string,
    value: T,
    ttlSeconds: number,
    options: MemoryStoreOptions
  ): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      await query(`
        INSERT INTO memory_store (tenant_id, store_key, store_value, ttl_seconds, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, store_key)
        DO UPDATE SET
          store_value = EXCLUDED.store_value,
          ttl_seconds = EXCLUDED.ttl_seconds,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()
      `, [options.tenantId, key, JSON.stringify(value), ttlSeconds, expiresAt]);

      logger.debug('Memory store set', { key, ttlSeconds, tenantId: options.tenantId });
      return true;
    } catch (error) {
      logger.error('Memory store set failed', { key, tenantId: options.tenantId }, error as Error);
      return false;
    }
  }

  /**
   * Delete a value from the store
   */
  async delete(key: string, options: MemoryStoreOptions): Promise<boolean> {
    try {
      await query(`
        DELETE FROM memory_store
        WHERE tenant_id = $1 AND store_key = $2
      `, [options.tenantId, key]);

      logger.debug('Memory store delete', { key, tenantId: options.tenantId });
      return true;
    } catch (error) {
      logger.error('Memory store delete failed', { key, tenantId: options.tenantId }, error as Error);
      return false;
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  async has(key: string, options: MemoryStoreOptions): Promise<boolean> {
    try {
      const result = await queryOne<{ exists: boolean }>(`
        SELECT EXISTS(
          SELECT 1 FROM memory_store
          WHERE tenant_id = $1
            AND store_key = $2
            AND expires_at > NOW()
        ) as exists
      `, [options.tenantId, key]);

      return result?.exists || false;
    } catch (error) {
      logger.error('Memory store has check failed', { key, tenantId: options.tenantId }, error as Error);
      return false;
    }
  }

  /**
   * Get all keys matching a pattern
   *
   * @param pattern - SQL LIKE pattern (e.g., "enrichment:apollo:%")
   */
  async keys(pattern: string, options: MemoryStoreOptions): Promise<string[]> {
    try {
      const result = await query<{ store_key: string }>(`
        SELECT store_key
        FROM memory_store
        WHERE tenant_id = $1
          AND store_key LIKE $2
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1000
      `, [options.tenantId, pattern]);

      return result.map(r => r.store_key);
    } catch (error) {
      logger.error('Memory store keys failed', { pattern, tenantId: options.tenantId }, error as Error);
      return [];
    }
  }

  /**
   * Get multiple values by keys
   */
  async mget<T = unknown>(
    keys: string[],
    options: MemoryStoreOptions
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    if (keys.length === 0) {
      return result;
    }

    try {
      const rows = await query<{ store_key: string; store_value: T }>(`
        SELECT store_key, store_value
        FROM memory_store
        WHERE tenant_id = $1
          AND store_key = ANY($2)
          AND expires_at > NOW()
      `, [options.tenantId, keys]);

      for (const row of rows) {
        result.set(row.store_key, row.store_value);
      }
    } catch (error) {
      logger.error('Memory store mget failed', { keys, tenantId: options.tenantId }, error as Error);
    }

    return result;
  }

  /**
   * Extend the TTL of an existing key
   */
  async touch(
    key: string,
    ttlSeconds: number,
    options: MemoryStoreOptions
  ): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      const result = await query(`
        UPDATE memory_store
        SET expires_at = $3, ttl_seconds = $4, updated_at = NOW()
        WHERE tenant_id = $1 AND store_key = $2
        RETURNING id
      `, [options.tenantId, key, expiresAt, ttlSeconds]);

      return result.length > 0;
    } catch (error) {
      logger.error('Memory store touch failed', { key, tenantId: options.tenantId }, error as Error);
      return false;
    }
  }

  /**
   * Clear all memory for a tenant (admin function)
   */
  async clearTenant(tenantId: string): Promise<number> {
    try {
      const result = await query<{ count: string }>(`
        WITH deleted AS (
          DELETE FROM memory_store
          WHERE tenant_id = $1
          RETURNING id
        )
        SELECT COUNT(*) as count FROM deleted
      `, [tenantId]);

      const count = parseInt(result[0]?.count || '0');
      logger.info('Memory store cleared for tenant', { tenantId, deletedCount: count });
      return count;
    } catch (error) {
      logger.error('Memory store clearTenant failed', { tenantId }, error as Error);
      return 0;
    }
  }

  /**
   * Cleanup expired entries (should be called by scheduled job)
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await queryOne<{ count: string }>(`
        SELECT cleanup_expired_memory() as count
      `);

      const count = parseInt(result?.count || '0');
      if (count > 0) {
        logger.info('Memory store cleanup', { deletedCount: count });
      }
      return count;
    } catch (error) {
      logger.error('Memory store cleanup failed', error as Error);
      return 0;
    }
  }
}

// Export singleton instance
export const memoryStore = new PersistentMemoryStore();

// Export class for testing
export { PersistentMemoryStore };

// Namespace helpers for consistent key generation
export const MemoryKeys = {
  enrichment: (provider: string, entityId: string) =>
    `enrichment:${provider}:${entityId}`,

  discovery: (tenantId: string, queryHash: string) =>
    `discovery:${tenantId}:${queryHash}`,

  score: (tenantId: string, entityId: string) =>
    `score:${tenantId}:${entityId}`,

  pattern: (domain: string) =>
    `pattern:email:${domain}`,

  user: (userId: string, key: string) =>
    `user:${userId}:${key}`,
};

// Default TTLs (in seconds)
export const MemoryTTL = {
  ENRICHMENT: 7 * 24 * 60 * 60,    // 7 days
  DISCOVERY: 24 * 60 * 60,          // 24 hours
  SCORE: 12 * 60 * 60,              // 12 hours
  PATTERN: 30 * 24 * 60 * 60,       // 30 days
  USER_PREF: 365 * 24 * 60 * 60,    // 1 year
  SHORT: 60 * 60,                   // 1 hour
  SESSION: 30 * 60,                 // 30 minutes
};
