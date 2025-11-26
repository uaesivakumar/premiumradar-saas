/**
 * PostgreSQL Database Client
 *
 * Single connection pool for the entire application.
 * Uses DATABASE_URL from environment (GCP PostgreSQL).
 */

import { Pool, PoolConfig } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.error('[DB] DATABASE_URL not set in production!');
}

const poolConfig: PoolConfig = {
  connectionString: DATABASE_URL,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Fail connection after 10s
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false } // GCP Cloud SQL requires SSL
    : false,
};

// Singleton pool instance
let pool: Pool | null = null;

/**
 * Get the database connection pool
 * Creates pool on first call, reuses on subsequent calls
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);

    // Log connection events in development
    if (process.env.NODE_ENV !== 'production') {
      pool.on('connect', () => {
        console.log('[DB] New client connected');
      });

      pool.on('error', (err) => {
        console.error('[DB] Pool error:', err);
      });
    }
  }

  return pool;
}

/**
 * Execute a query using the pool
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const db = getPool();
  const result = await db.query(text, params);
  return result.rows as T[];
}

/**
 * Execute a single-row query
 */
export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Execute an insert and return the inserted row
 */
export async function insert<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T> {
  const db = getPool();
  const result = await db.query(text, params);
  return result.rows[0] as T;
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: Pool) => Promise<T>
): Promise<T> {
  const db = getPool();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(db);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check - verify database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query<{ now: Date }>('SELECT NOW()');
    return !!result[0]?.now;
  } catch (error) {
    console.error('[DB] Health check failed:', error);
    return false;
  }
}

/**
 * Close the pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Pool closed');
  }
}
