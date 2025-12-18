/**
 * OS Control Plane Config Health Diagnostic Endpoint
 *
 * GET /api/superadmin/controlplane/config-health
 *
 * This is the "is it real?" truth endpoint.
 *
 * Returns:
 * - Tables exist (true/false)
 * - Row counts per table
 * - Latest updated_at per table
 * - Overall health status
 *
 * If any table missing → ok:false with list of missing tables
 */

import { query } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';

interface TableHealth {
  name: string;
  exists: boolean;
  count: number | null;
  latest_updated_at: string | null;
}

interface ConfigHealth {
  ok: boolean;
  timestamp: string;
  tables: TableHealth[];
  missing_tables: string[];
  summary: {
    total_tables: number;
    existing_tables: number;
    total_rows: number;
  };
  seed_data: {
    verticals: string[];
    sub_verticals: string[];
    personas: string[];
  } | null;
}

const REQUIRED_TABLES = [
  'os_verticals',
  'os_sub_verticals',
  'os_personas',
  'os_persona_policies',
  'os_workspace_bindings',
  'os_controlplane_audit',
];

/**
 * GET /api/superadmin/controlplane/config-health
 */
export async function GET() {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const health: ConfigHealth = {
    ok: true,
    timestamp: new Date().toISOString(),
    tables: [],
    missing_tables: [],
    summary: {
      total_tables: REQUIRED_TABLES.length,
      existing_tables: 0,
      total_rows: 0,
    },
    seed_data: null,
  };

  try {
    // Check each required table
    for (const tableName of REQUIRED_TABLES) {
      const tableHealth: TableHealth = {
        name: tableName,
        exists: false,
        count: null,
        latest_updated_at: null,
      };

      // Check if table exists
      const existsResult = await query<{ exists: boolean }>(
        `SELECT to_regclass('public.${tableName}') IS NOT NULL AS exists`
      );

      if (existsResult[0]?.exists) {
        tableHealth.exists = true;
        health.summary.existing_tables++;

        // Get row count
        const countResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        tableHealth.count = parseInt(countResult[0]?.count || '0', 10);
        health.summary.total_rows += tableHealth.count;

        // Get latest updated_at (only for tables with updated_at column)
        if (tableName !== 'os_controlplane_audit') {
          try {
            const updatedResult = await query<{ latest: string }>(
              `SELECT MAX(updated_at) as latest FROM ${tableName}`
            );
            tableHealth.latest_updated_at = updatedResult[0]?.latest || null;
          } catch {
            // Table might not have updated_at column
          }
        } else {
          // For audit table, use created_at
          const createdResult = await query<{ latest: string }>(
            `SELECT MAX(created_at) as latest FROM ${tableName}`
          );
          tableHealth.latest_updated_at = createdResult[0]?.latest || null;
        }
      } else {
        health.missing_tables.push(tableName);
        health.ok = false;
      }

      health.tables.push(tableHealth);
    }

    // If all tables exist, get seed data summary
    if (health.ok) {
      const verticalsResult = await query<{ key: string }>(
        'SELECT key FROM os_verticals ORDER BY created_at'
      );
      const subVerticalsResult = await query<{ key: string }>(
        'SELECT key FROM os_sub_verticals ORDER BY created_at'
      );
      const personasResult = await query<{ key: string }>(
        'SELECT key FROM os_personas ORDER BY created_at'
      );

      health.seed_data = {
        verticals: verticalsResult.map(v => v.key),
        sub_verticals: subVerticalsResult.map(sv => sv.key),
        personas: personasResult.map(p => p.key),
      };
    }

    return Response.json({
      success: true,
      data: health,
    });

  } catch (error) {
    console.error('[Config-Health] Error:', error);
    return Response.json({
      success: false,
      error: 'server_error',
      message: 'Failed to check config health',
    }, { status: 500 });
  }
}
