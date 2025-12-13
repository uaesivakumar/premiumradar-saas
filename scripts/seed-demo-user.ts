/**
 * Seed Demo User Script
 * Creates a demo user for testing/demo purposes
 *
 * Run: npx tsx scripts/seed-demo-user.ts
 */

import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

/**
 * Get database pool from environment or Cloud SQL Proxy
 *
 * For local use with Cloud SQL Proxy:
 *   1. Start proxy: cloud-sql-proxy applied-algebra-474804-e6:us-central1:upr-postgres --port=5432
 *   2. Set environment: export DATABASE_URL="postgresql://upr_app:PASSWORD@127.0.0.1:5432/upr_production"
 *   3. Run: npx tsx scripts/seed-demo-user.ts
 */
function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return new Pool({ connectionString: databaseUrl });
}

const DEMO_USER = {
  email: 'demo.eb.user@premiumradar.ai',
  password: 'DemoUser123!',
  name: 'Demo EB User',
  vertical: 'banking',
  subVertical: 'employee-banking',
  regionCountry: 'UAE',
  companyName: 'PremiumRadar Demo',
  companyDomain: 'premiumradar.ai',
};

async function seedDemoUser() {
  const pool = getPool();
  const client = await pool.connect();

  console.log('🌱 Seeding demo user...');
  console.log(`   Email: ${DEMO_USER.email}`);
  console.log(`   Password: ${DEMO_USER.password}`);

  try {
    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [DEMO_USER.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  Demo user already exists. Updating password...');

      const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [passwordHash, DEMO_USER.email.toLowerCase()]
      );

      await client.query('COMMIT');
      console.log('✅ Demo user password updated!');
      return;
    }

    // Get or create tenant
    let tenantId: string;
    const existingTenant = await client.query(
      'SELECT id FROM tenants WHERE domain = $1',
      [DEMO_USER.companyDomain]
    );

    if (existingTenant.rows.length > 0) {
      tenantId = existingTenant.rows[0].id;
      console.log(`   Using existing tenant: ${tenantId}`);
    } else {
      const slug = `premiumradar-demo-${Date.now()}`;
      const newTenant = await client.query(
        `INSERT INTO tenants (name, slug, domain, plan, subscription_status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [DEMO_USER.companyName, slug, DEMO_USER.companyDomain, 'professional', 'active']
      );
      tenantId = newTenant.rows[0].id;
      console.log(`   Created new tenant: ${tenantId}`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, tenant_id, role, email_verified, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [
        DEMO_USER.email.toLowerCase(),
        passwordHash,
        DEMO_USER.name,
        tenantId,
        'TENANT_ADMIN',
        true, // Pre-verified for demo
      ]
    );
    const userId = userResult.rows[0].id;
    console.log(`   Created user: ${userId}`);

    // Create profile
    await client.query(
      `INSERT INTO user_profiles (
        user_id, tenant_id, vertical, sub_vertical, region_country,
        company_name, company_domain, vertical_locked, onboarding_completed, onboarding_completed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        userId,
        tenantId,
        DEMO_USER.vertical,
        DEMO_USER.subVertical,
        DEMO_USER.regionCountry,
        DEMO_USER.companyName,
        DEMO_USER.companyDomain,
        true, // Vertical locked
        true, // Onboarding completed
      ]
    );
    console.log('   Created user profile');

    await client.query('COMMIT');

    console.log('');
    console.log('✅ Demo user created successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log(`   Email:    ${DEMO_USER.email}`);
    console.log(`   Password: ${DEMO_USER.password}`);
    console.log('');
    console.log('🎯 Profile:');
    console.log(`   Vertical:     ${DEMO_USER.vertical}`);
    console.log(`   Sub-Vertical: ${DEMO_USER.subVertical}`);
    console.log(`   Region:       ${DEMO_USER.regionCountry}`);
    console.log('');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed demo user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
seedDemoUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
