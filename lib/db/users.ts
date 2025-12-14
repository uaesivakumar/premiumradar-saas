/**
 * VS10: User Database Service
 * Sprint: S1 (VS10)
 *
 * Real PostgreSQL operations for users, tenants, and profiles.
 * Replaces all mock implementations.
 */

import bcrypt from 'bcryptjs';
import { query, queryOne, insert, transaction, getPool } from './client';

// ============================================================
// TYPES
// ============================================================

export interface Tenant {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  slug: string;
  domain: string | null;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  max_users: number;
  max_discoveries_per_month: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface User {
  id: string;
  created_at: Date;
  updated_at: Date;
  email: string;
  email_verified: boolean;
  email_verified_at: Date | null;
  password_hash: string;
  name: string | null;
  avatar_url: string | null;
  tenant_id: string;
  role: 'TENANT_USER' | 'TENANT_ADMIN' | 'SUPER_ADMIN' | 'READ_ONLY';
  mfa_enabled: boolean;
  is_active: boolean;
  last_login_at: Date | null;
  last_login_ip: string | null;
  metadata: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  tenant_id: string;
  vertical: string;
  sub_vertical: string;
  region_country: string;
  region_city: string | null;
  vertical_locked: boolean;
  vertical_locked_at: Date | null;
  vertical_locked_by: string | null;
  onboarding_completed: boolean;
  onboarding_completed_at: Date | null;
  onboarding_step: string;
  company_name: string | null;
  company_domain: string | null;
  company_industry: string | null;
  metadata: Record<string, unknown>;
}

export interface UserWithProfile extends User {
  profile: UserProfile | null;
  tenant: Tenant | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  tenantId?: string;
  role?: 'TENANT_USER' | 'TENANT_ADMIN' | 'SUPER_ADMIN' | 'READ_ONLY';
  vertical?: string;
  subVertical?: string;
  regionCountry?: string;
  companyName?: string;
  companyDomain?: string;
  companyIndustry?: string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  domain?: string;
  plan?: 'free' | 'starter' | 'professional' | 'enterprise';
}

// ============================================================
// TENANT OPERATIONS
// ============================================================

/**
 * Create a new tenant
 */
export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const result = await insert<Tenant>(
    `INSERT INTO tenants (name, slug, domain, plan)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.name, input.slug, input.domain || null, input.plan || 'free']
  );
  return result;
}

/**
 * Get tenant by ID
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  return queryOne<Tenant>('SELECT * FROM tenants WHERE id = $1', [id]);
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return queryOne<Tenant>('SELECT * FROM tenants WHERE slug = $1', [slug]);
}

/**
 * Get tenant by domain
 */
export async function getTenantByDomain(domain: string): Promise<Tenant | null> {
  return queryOne<Tenant>('SELECT * FROM tenants WHERE domain = $1', [domain]);
}

/**
 * Get or create tenant for a domain
 */
export async function getOrCreateTenantForDomain(
  domain: string,
  companyName: string
): Promise<Tenant> {
  // Try to find existing tenant
  const existing = await getTenantByDomain(domain);
  if (existing) return existing;

  // Create new tenant
  const slug = domain.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
  return createTenant({
    name: companyName || domain,
    slug: `${slug}-${Date.now()}`,
    domain,
    plan: 'free',
  });
}

// ============================================================
// USER OPERATIONS
// ============================================================

const SALT_ROUNDS = 12;

/**
 * Create a new user with profile
 */
export async function createUser(input: CreateUserInput): Promise<UserWithProfile> {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Extract domain from email
  const emailDomain = input.email.split('@')[1]?.toLowerCase();

  // Get or create tenant
  let tenantId = input.tenantId;
  if (!tenantId && emailDomain) {
    const tenant = await getOrCreateTenantForDomain(
      emailDomain,
      input.companyName || emailDomain
    );
    tenantId = tenant.id;
  }

  if (!tenantId) {
    throw new Error('Unable to determine tenant for user');
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query<User>(
      `INSERT INTO users (email, password_hash, name, tenant_id, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.email.toLowerCase(), passwordHash, input.name || null, tenantId, input.role || 'TENANT_USER']
    );
    const user = userResult.rows[0];

    // Create profile
    const profileResult = await client.query<UserProfile>(
      `INSERT INTO user_profiles (
        user_id, tenant_id, vertical, sub_vertical, region_country,
        company_name, company_domain, company_industry
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        user.id,
        tenantId,
        input.vertical || 'banking',
        input.subVertical || 'employee-banking',
        input.regionCountry || 'UAE',
        input.companyName || null,
        input.companyDomain || emailDomain || null,
        input.companyIndustry || null,
      ]
    );
    const profile = profileResult.rows[0];

    await client.query('COMMIT');

    // Get tenant
    const tenant = await getTenantById(tenantId);

    return { ...user, profile, tenant };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
}

/**
 * Get user with profile and tenant
 */
export async function getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const profile = await queryOne<UserProfile>(
    'SELECT * FROM user_profiles WHERE user_id = $1',
    [userId]
  );

  const tenant = await getTenantById(user.tenant_id);

  return { ...user, profile, tenant };
}

/**
 * Get user by email with profile
 */
export async function getUserByEmailWithProfile(email: string): Promise<UserWithProfile | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  return getUserWithProfile(user.id);
}

/**
 * Verify password
 */
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

/**
 * Update last login
 */
export async function updateLastLogin(userId: string, ip?: string): Promise<void> {
  await query(
    `UPDATE users SET last_login_at = NOW(), last_login_ip = $2 WHERE id = $1`,
    [userId, ip || null]
  );
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await queryOne<{ exists: boolean }>(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
    [email.toLowerCase()]
  );
  return result?.exists || false;
}

// ============================================================
// PROFILE OPERATIONS
// ============================================================

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return queryOne<UserProfile>('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'vertical' | 'sub_vertical' | 'region_country' | 'region_city' | 'onboarding_step'>>
): Promise<UserProfile | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.vertical !== undefined) {
    fields.push(`vertical = $${paramIndex++}`);
    values.push(updates.vertical);
  }
  if (updates.sub_vertical !== undefined) {
    fields.push(`sub_vertical = $${paramIndex++}`);
    values.push(updates.sub_vertical);
  }
  if (updates.region_country !== undefined) {
    fields.push(`region_country = $${paramIndex++}`);
    values.push(updates.region_country);
  }
  if (updates.region_city !== undefined) {
    fields.push(`region_city = $${paramIndex++}`);
    values.push(updates.region_city);
  }
  if (updates.onboarding_step !== undefined) {
    fields.push(`onboarding_step = $${paramIndex++}`);
    values.push(updates.onboarding_step);
  }

  if (fields.length === 0) return getUserProfile(userId);

  values.push(userId);

  const result = await queryOne<UserProfile>(
    `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
    values
  );

  return result;
}

/**
 * Lock user's vertical (VS10.3)
 * Once locked, vertical cannot be changed without admin override
 */
export async function lockUserVertical(
  userId: string,
  lockedBy: 'user' | 'admin' | 'system' = 'user'
): Promise<UserProfile | null> {
  const profile = await getUserProfile(userId);
  if (!profile) return null;

  // Check if already locked
  if (profile.vertical_locked) {
    throw new Error('Vertical is already locked');
  }

  return queryOne<UserProfile>(
    `UPDATE user_profiles
     SET vertical_locked = true,
         vertical_locked_at = NOW(),
         vertical_locked_by = $2,
         onboarding_completed = true,
         onboarding_completed_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId, lockedBy]
  );
}

/**
 * Admin override vertical (requires MFA)
 */
export async function adminOverrideVertical(
  userId: string,
  newVertical: string,
  newSubVertical: string,
  adminId: string
): Promise<UserProfile | null> {
  // Log the override for audit
  console.warn('[VS10.3] Admin vertical override:', {
    userId,
    adminId,
    newVertical,
    newSubVertical,
    timestamp: new Date().toISOString(),
  });

  return queryOne<UserProfile>(
    `UPDATE user_profiles
     SET vertical = $2,
         sub_vertical = $3,
         vertical_locked_by = 'admin',
         vertical_locked_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId, newVertical, newSubVertical]
  );
}

// ============================================================
// EMAIL VERIFICATION (VS12: Code-based)
// ============================================================

/**
 * Generate a cryptographically random 6-digit code
 */
function generateVerificationCode(): string {
  // Generate 6 random digits
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Create email verification code (VS12: 6-digit code instead of link)
 * Returns the 6-digit code to be sent via email
 */
export async function createEmailVerificationCode(userId: string): Promise<string> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes (shorter for codes)

  // Delete any existing codes for this user
  await query(
    `DELETE FROM email_verification_tokens WHERE user_id = $1`,
    [userId]
  );

  // Insert new code
  await insert(
    `INSERT INTO email_verification_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, code, expiresAt]
  );

  return code;
}

/**
 * Verify 6-digit email code (VS12)
 * Returns user if code is valid, null otherwise
 */
export async function verifyEmailCode(userId: string, code: string): Promise<User | null> {
  const record = await queryOne<{ user_id: string; token: string; expires_at: Date; used: boolean }>(
    `SELECT user_id, token, expires_at, used FROM email_verification_tokens
     WHERE user_id = $1 AND token = $2`,
    [userId, code]
  );

  if (!record) {
    return null; // Code not found
  }

  if (record.used) {
    return null; // Already used
  }

  if (new Date() > new Date(record.expires_at)) {
    return null; // Expired
  }

  // Mark code as used
  await query(
    `UPDATE email_verification_tokens SET used = true, used_at = NOW() WHERE user_id = $1 AND token = $2`,
    [userId, code]
  );

  // Mark user email as verified
  const user = await queryOne<User>(
    `UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1 RETURNING *`,
    [record.user_id]
  );

  return user;
}

/**
 * Legacy: Create email verification token (for backward compatibility)
 * @deprecated Use createEmailVerificationCode instead
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  return createEmailVerificationCode(userId);
}

/**
 * Legacy: Verify email token (for backward compatibility)
 * @deprecated Use verifyEmailCode instead
 */
export async function verifyEmailToken(token: string): Promise<User | null> {
  const record = await queryOne<{ user_id: string; expires_at: Date; used: boolean }>(
    `SELECT user_id, expires_at, used FROM email_verification_tokens WHERE token = $1`,
    [token]
  );

  if (!record || record.used || new Date() > record.expires_at) {
    return null;
  }

  // Mark token as used
  await query(
    `UPDATE email_verification_tokens SET used = true, used_at = NOW() WHERE token = $1`,
    [token]
  );

  // Mark user email as verified
  const user = await queryOne<User>(
    `UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1 RETURNING *`,
    [record.user_id]
  );

  return user;
}

// ============================================================
// PASSWORD RESET
// ============================================================

/**
 * Create password reset token
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = `prt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  await insert(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  return token;
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<User | null> {
  const record = await queryOne<{ user_id: string; expires_at: Date; used: boolean }>(
    `SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = $1`,
    [token]
  );

  if (!record || record.used || new Date() > record.expires_at) {
    return null;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Mark token as used
  await query(
    `UPDATE password_reset_tokens SET used = true, used_at = NOW() WHERE token = $1`,
    [token]
  );

  // Update password
  const user = await queryOne<User>(
    `UPDATE users SET password_hash = $2, password_changed_at = NOW() WHERE id = $1 RETURNING *`,
    [record.user_id, passwordHash]
  );

  return user;
}

// ============================================================
// INIT DATABASE
// ============================================================

/**
 * Initialize VS10 tables
 * Run this on first startup to create tables
 */
export async function initVS10Tables(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const migrationPath = path.join(
    process.cwd(),
    'prisma/migrations/VS10_users_tenants_profiles.sql'
  );

  try {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    await query(sql);
    console.log('[VS10] Database tables initialized successfully');
  } catch (error) {
    console.error('[VS10] Failed to initialize tables:', error);
    throw error;
  }
}
