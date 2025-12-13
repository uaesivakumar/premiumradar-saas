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

/**
 * Parse Cloud SQL socket connection string
 * Format: postgresql://user:pass@/dbname?host=/cloudsql/instance-connection-name
 */
function parseCloudSQLConfig(url: string): PoolConfig {
  // Check if this is a Cloud SQL socket URL
  const isCloudSQL = url.includes('/cloudsql/');

  if (isCloudSQL) {
    // Extract components from Cloud SQL URL
    // postgresql://user:pass@/dbname?host=/cloudsql/project:region:instance
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@\/([^?]+)\?host=(.+)/);
    if (match) {
      const [, user, encodedPassword, database, host] = match;
      // Decode URL-encoded password (handles special chars like / = + etc.)
      const password = decodeURIComponent(encodedPassword);
      return {
        user,
        password,
        database,
        host, // Unix socket path
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        // No SSL for Unix socket connections
      };
    }
  }

  // Standard connection string
  return {
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  };
}

const poolConfig: PoolConfig = DATABASE_URL
  ? parseCloudSQLConfig(DATABASE_URL)
  : {
      host: 'localhost',
      port: 5432,
      database: 'premiumradar_saas',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
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
