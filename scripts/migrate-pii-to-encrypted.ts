/**
 * S368: PII Migration Script
 *
 * Migrates existing plain-text PII to encrypted format.
 * Run this AFTER applying S368_pii_encryption.sql migration.
 *
 * Usage:
 *   npx tsx scripts/migrate-pii-to-encrypted.ts
 *
 * Options:
 *   --dry-run     Preview without making changes
 *   --batch=N     Process N records at a time (default: 100)
 *   --tenant=ID   Process only specific tenant
 */

import { query, queryOne } from '../lib/db/client';
import { piiVault } from '../lib/security/pii-vault';
import { logger } from '../lib/logging/structured-logger';

interface Lead {
  id: string;
  tenant_id: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_name: string | null;
}

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

async function migratePII(options: {
  dryRun: boolean;
  batchSize: number;
  tenantId?: string;
}): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date(),
  };

  console.log('========================================');
  console.log('S368: PII Migration Script');
  console.log('========================================');
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Batch Size: ${options.batchSize}`);
  console.log(`Tenant Filter: ${options.tenantId || 'ALL'}`);
  console.log('');

  // Verify encryption is configured
  const configCheck = await piiVault.verifyConfiguration();
  if (!configCheck.valid) {
    console.error('ERROR: PII Vault not properly configured');
    console.error(configCheck.error);
    process.exit(1);
  }
  console.log('PII Vault configuration verified.');
  console.log('');

  // Count records to migrate
  const tenantFilter = options.tenantId ? 'AND tenant_id = $1' : '';
  const countParams = options.tenantId ? [options.tenantId] : [];

  const countResult = await queryOne<{ count: string }>(`
    SELECT COUNT(*) as count
    FROM leads
    WHERE pii_encrypted = false
      AND (contact_email IS NOT NULL OR contact_phone IS NOT NULL OR contact_name IS NOT NULL)
      ${tenantFilter}
  `, countParams);

  stats.total = parseInt(countResult?.count || '0');
  console.log(`Records to migrate: ${stats.total}`);
  console.log('');

  if (stats.total === 0) {
    console.log('No records to migrate.');
    stats.endTime = new Date();
    return stats;
  }

  // Process in batches
  let offset = 0;
  let batchNum = 0;

  while (offset < stats.total) {
    batchNum++;
    console.log(`Processing batch ${batchNum} (offset: ${offset})...`);

    const leads = await query<Lead>(`
      SELECT id, tenant_id, contact_email, contact_phone, contact_name
      FROM leads
      WHERE pii_encrypted = false
        AND (contact_email IS NOT NULL OR contact_phone IS NOT NULL OR contact_name IS NOT NULL)
        ${tenantFilter}
      ORDER BY created_at ASC
      LIMIT $${countParams.length + 1}
      OFFSET $${countParams.length + 2}
    `, [...countParams, options.batchSize, offset]);

    if (leads.length === 0) {
      break;
    }

    for (const lead of leads) {
      try {
        // Encrypt PII
        const emailEncrypted = lead.contact_email
          ? await piiVault.encrypt(lead.tenant_id, lead.contact_email)
          : null;
        const phoneEncrypted = lead.contact_phone
          ? await piiVault.encrypt(lead.tenant_id, lead.contact_phone)
          : null;
        const nameEncrypted = lead.contact_name
          ? await piiVault.encrypt(lead.tenant_id, lead.contact_name)
          : null;

        // Generate hashes
        const emailHash = lead.contact_email
          ? piiVault.hashEmail(lead.contact_email)
          : null;
        const phoneHash = lead.contact_phone
          ? piiVault.hashPhone(lead.contact_phone)
          : null;
        const nameHash = lead.contact_name
          ? piiVault.hash(lead.contact_name.toLowerCase().trim())
          : null;

        if (!options.dryRun) {
          // Update record
          await query(`
            UPDATE leads
            SET
              contact_email_encrypted = $1,
              contact_email_hash = $2,
              contact_phone_encrypted = $3,
              contact_phone_hash = $4,
              contact_name_encrypted = $5,
              contact_name_hash = $6,
              pii_encrypted = true
            WHERE id = $7
          `, [
            emailEncrypted,
            emailHash,
            phoneEncrypted,
            phoneHash,
            nameEncrypted,
            nameHash,
            lead.id,
          ]);
        }

        stats.migrated++;

        // Log progress every 100 records
        if (stats.migrated % 100 === 0) {
          console.log(`  Migrated: ${stats.migrated} / ${stats.total}`);
        }
      } catch (error) {
        stats.errors++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('PII migration failed for lead', {
          leadId: lead.id,
          tenantId: lead.tenant_id,
          error: errorMessage,
        });
        console.error(`  ERROR: Lead ${lead.id} - ${errorMessage}`);
      }
    }

    offset += options.batchSize;
  }

  stats.endTime = new Date();

  console.log('');
  console.log('========================================');
  console.log('Migration Complete');
  console.log('========================================');
  console.log(`Total Records: ${stats.total}`);
  console.log(`Migrated: ${stats.migrated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Duration: ${(stats.endTime.getTime() - stats.startTime.getTime()) / 1000}s`);
  console.log('');

  if (options.dryRun) {
    console.log('DRY RUN - No changes were made.');
    console.log('Run without --dry-run to apply changes.');
  }

  return stats;
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  batchSize: 100,
  tenantId: undefined as string | undefined,
};

for (const arg of args) {
  if (arg.startsWith('--batch=')) {
    options.batchSize = parseInt(arg.split('=')[1]) || 100;
  }
  if (arg.startsWith('--tenant=')) {
    options.tenantId = arg.split('=')[1];
  }
}

// Run migration
migratePII(options)
  .then((stats) => {
    if (stats.errors > 0) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
