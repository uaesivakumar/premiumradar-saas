/**
 * API Integrations Migration Endpoint
 *
 * Creates the api_integrations table if it doesn't exist.
 * POST /api/admin/migrations/api-integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Provider info
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Credentials (encrypted at rest by PostgreSQL)
  api_key TEXT NOT NULL,
  api_secret TEXT,
  base_url VARCHAR(500),
  config JSONB NOT NULL DEFAULT '{}',

  -- Multi-tenancy
  tenant_id UUID,
  vertical VARCHAR(100),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT unique_default_per_provider UNIQUE NULLS NOT DISTINCT (provider, tenant_id, is_default)
    DEFERRABLE INITIALLY DEFERRED
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_api_integrations_tenant ON api_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_active ON api_integrations(is_active);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_api_integrations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS api_integrations_updated_at ON api_integrations;
CREATE TRIGGER api_integrations_updated_at
  BEFORE UPDATE ON api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_api_integrations_timestamp();
`;

export async function POST(request: NextRequest) {
  try {
    // Run migration
    await query(CREATE_TABLE_SQL);

    // Verify table exists
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'api_integrations'
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      success: true,
      message: 'api_integrations table created/verified successfully',
      columns: result.map((r: { column_name: string; data_type: string }) => r.column_name),
    });
  } catch (error) {
    console.error('[Migration] api_integrations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to run the api_integrations migration',
  });
}
