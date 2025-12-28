/**
 * S318: Demo Workspace Seeding
 * Part of User & Enterprise Management Program v1.1
 * Phase F - Demo System
 *
 * Seeds demo workspaces with sample data for new demo users.
 */

import { query, queryOne, transaction, getPool } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export interface DemoSeedConfig {
  vertical: string;
  sub_vertical: string;
  region: string;
  sample_companies: number;
  sample_contacts: number;
  sample_discoveries: number;
}

export interface DemoSeedResult {
  success: boolean;
  companies_created: number;
  discoveries_created: number;
  error?: string;
}

// =============================================================================
// SEED DATA TEMPLATES
// =============================================================================

const SAMPLE_COMPANIES = [
  {
    name: 'Acme Technologies LLC',
    domain: 'acmetech.ae',
    industry: 'Technology',
    size: 150,
    location: 'Dubai, UAE',
    signals: ['hiring-expansion', 'headcount-jump'],
  },
  {
    name: 'Gulf Trading International',
    domain: 'gulftrade.ae',
    industry: 'Trading',
    size: 500,
    location: 'Abu Dhabi, UAE',
    signals: ['funding-round', 'market-entry'],
  },
  {
    name: 'Emirates Construction Group',
    domain: 'emiratescons.ae',
    industry: 'Construction',
    size: 1000,
    location: 'Dubai, UAE',
    signals: ['project-award', 'subsidiary-creation'],
  },
  {
    name: 'Falcon Logistics FZCO',
    domain: 'falconlogistics.ae',
    industry: 'Logistics',
    size: 250,
    location: 'Jebel Ali, UAE',
    signals: ['office-opening', 'hiring-expansion'],
  },
  {
    name: 'Desert Healthcare Services',
    domain: 'deserthcs.ae',
    industry: 'Healthcare',
    size: 300,
    location: 'Dubai, UAE',
    signals: ['headcount-jump', 'market-entry'],
  },
];

const SAMPLE_CONTACTS = [
  { title: 'Chief Financial Officer', department: 'Finance' },
  { title: 'Head of HR', department: 'Human Resources' },
  { title: 'Finance Director', department: 'Finance' },
  { title: 'HR Manager', department: 'Human Resources' },
  { title: 'Payroll Manager', department: 'Finance' },
];

// =============================================================================
// WORKSPACE SEEDING (S318)
// =============================================================================

/**
 * Seed a demo workspace with sample data
 */
export async function seedDemoWorkspace(
  enterpriseId: string,
  workspaceId: string,
  config: Partial<DemoSeedConfig> = {}
): Promise<DemoSeedResult> {
  const seedConfig: DemoSeedConfig = {
    vertical: config.vertical || 'banking',
    sub_vertical: config.sub_vertical || 'employee_banking',
    region: config.region || 'UAE',
    sample_companies: config.sample_companies || 5,
    sample_contacts: config.sample_contacts || 3,
    sample_discoveries: config.sample_discoveries || 1,
  };

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let companiesCreated = 0;
    let discoveriesCreated = 0;

    // Get or create sample companies for demo
    const companiesToSeed = SAMPLE_COMPANIES.slice(0, seedConfig.sample_companies);

    for (const company of companiesToSeed) {
      // Check if company already exists (by domain)
      const existingCompany = await client.query(
        `SELECT id FROM demo_sample_companies WHERE domain = $1 AND enterprise_id = $2`,
        [company.domain, enterpriseId]
      );

      let companyId: string;

      if (existingCompany.rows.length === 0) {
        companyId = crypto.randomUUID();

        // Insert sample company
        await client.query(
          `INSERT INTO demo_sample_companies (
            id, enterprise_id, workspace_id, name, domain, industry, size, location, signals, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            companyId,
            enterpriseId,
            workspaceId,
            company.name,
            company.domain,
            company.industry,
            company.size,
            company.location,
            JSON.stringify(company.signals),
          ]
        );
        companiesCreated++;
      } else {
        companyId = existingCompany.rows[0].id;
      }

      // Add sample contacts for this company
      const contactsForCompany = SAMPLE_CONTACTS.slice(0, seedConfig.sample_contacts);
      for (const contact of contactsForCompany) {
        const contactExists = await client.query(
          `SELECT id FROM demo_sample_contacts WHERE company_id = $1 AND title = $2`,
          [companyId, contact.title]
        );

        if (contactExists.rows.length === 0) {
          const contactId = crypto.randomUUID();
          const contactName = generateContactName();
          const contactEmail = `${contactName.toLowerCase().replace(' ', '.')}@${company.domain}`;

          await client.query(
            `INSERT INTO demo_sample_contacts (
              id, company_id, name, title, email, department, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [contactId, companyId, contactName, contact.title, contactEmail, contact.department]
          );
        }
      }
    }

    // Create sample discovery evidence pack
    if (seedConfig.sample_discoveries > 0) {
      const discoveryPayload = {
        query: 'Companies with recent hiring signals in UAE',
        vertical: seedConfig.vertical,
        sub_vertical: seedConfig.sub_vertical,
        region: seedConfig.region,
        is_demo_seed: true,
      };

      const discoveryEvidence = {
        companies_found: companiesToSeed.length,
        signals_detected: companiesToSeed.reduce(
          (acc, c) => acc + c.signals.length,
          0
        ),
        generated_at: new Date().toISOString(),
      };

      await client.query(
        `INSERT INTO evidence_packs (
          id, enterprise_id, workspace_id, pack_type, payload, evidence, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          crypto.randomUUID(),
          enterpriseId,
          workspaceId,
          'DISCOVERY',
          JSON.stringify(discoveryPayload),
          JSON.stringify(discoveryEvidence),
        ]
      );
      discoveriesCreated++;
    }

    await client.query('COMMIT');

    return {
      success: true,
      companies_created: companiesCreated,
      discoveries_created: discoveriesCreated,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Demo Seeder] Error:', error);

    // If tables don't exist, create them and retry
    if (error instanceof Error && error.message.includes('does not exist')) {
      try {
        await createDemoTables();
        return await seedDemoWorkspace(enterpriseId, workspaceId, config);
      } catch (retryError) {
        return {
          success: false,
          companies_created: 0,
          discoveries_created: 0,
          error: 'Failed to create demo tables',
        };
      }
    }

    return {
      success: false,
      companies_created: 0,
      discoveries_created: 0,
      error: error instanceof Error ? error.message : 'Seeding failed',
    };
  } finally {
    client.release();
  }
}

/**
 * Create demo sample tables if they don't exist
 */
async function createDemoTables(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS demo_sample_companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
      workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      domain VARCHAR(255),
      industry VARCHAR(100),
      size INTEGER,
      location VARCHAR(255),
      signals JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS demo_sample_contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES demo_sample_companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      email VARCHAR(255),
      department VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_demo_companies_enterprise ON demo_sample_companies(enterprise_id)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_demo_contacts_company ON demo_sample_contacts(company_id)
  `);
}

/**
 * Clear demo seed data for a workspace
 */
export async function clearDemoSeedData(
  enterpriseId: string,
  workspaceId?: string
): Promise<{ success: boolean; deleted: number }> {
  try {
    let whereClause = 'enterprise_id = $1';
    const params: unknown[] = [enterpriseId];

    if (workspaceId) {
      whereClause += ' AND workspace_id = $2';
      params.push(workspaceId);
    }

    const result = await query(
      `DELETE FROM demo_sample_companies WHERE ${whereClause} RETURNING id`,
      params
    );

    return {
      success: true,
      deleted: result.length,
    };
  } catch (error) {
    console.error('[Demo Seeder] Clear error:', error);
    return { success: false, deleted: 0 };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

const FIRST_NAMES = ['Ahmed', 'Fatima', 'Mohammed', 'Sarah', 'Omar', 'Layla', 'Khalid', 'Nour'];
const LAST_NAMES = ['Al-Maktoum', 'Hassan', 'Ibrahim', 'Khan', 'Ali', 'Rahman', 'Nasser', 'Saleh'];

function generateContactName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

// =============================================================================
// EXPORT
// =============================================================================

export const demoSeeder = {
  seedWorkspace: seedDemoWorkspace,
  clearSeedData: clearDemoSeedData,
};

export default demoSeeder;
