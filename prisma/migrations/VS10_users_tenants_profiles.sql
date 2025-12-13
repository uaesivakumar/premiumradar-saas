/**
 * VS10: LIVE SYSTEM WIRING - Users, Tenants, Profiles Tables
 * Sprint: S1 (VS10)
 * Authorization Code: VS10-LIVE-WIRING-20251213
 *
 * Creates the core authentication and user management tables:
 * - tenants: Multi-tenant organizations
 * - users: User accounts with password hashes
 * - profiles: User profiles with vertical lock
 * - sessions: Active session tracking (optional - for session invalidation)
 */

-- ============================================================
-- TENANTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,  -- URL-safe identifier
  domain VARCHAR(255),                  -- Primary email domain (e.g., emiratesnbd.com)

  -- Settings
  plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),

  -- Limits
  max_users INTEGER NOT NULL DEFAULT 3,
  max_discoveries_per_month INTEGER NOT NULL DEFAULT 100,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_domain ON tenants(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE is_active = true;

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Identity
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,

  -- Authentication
  password_hash VARCHAR(255) NOT NULL,
  password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Profile
  name VARCHAR(255),
  avatar_url VARCHAR(500),

  -- Tenant relationship
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Role
  role VARCHAR(50) NOT NULL DEFAULT 'TENANT_USER' CHECK (role IN ('TENANT_USER', 'TENANT_ADMIN', 'SUPER_ADMIN', 'READ_ONLY')),

  -- MFA
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  mfa_secret VARCHAR(255),
  mfa_backup_codes JSONB,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip VARCHAR(45),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_active ON users(is_active, tenant_id) WHERE is_active = true;

-- ============================================================
-- USER PROFILES TABLE (Vertical Lock)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- User relationship
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Vertical Lock (VS10.3)
  vertical VARCHAR(50) NOT NULL,                     -- e.g., 'banking'
  sub_vertical VARCHAR(50) NOT NULL,                 -- e.g., 'employee-banking'
  region_country VARCHAR(50) NOT NULL DEFAULT 'UAE', -- e.g., 'UAE'
  region_city VARCHAR(100),                           -- e.g., 'Dubai'

  -- Lock status
  vertical_locked BOOLEAN NOT NULL DEFAULT false,    -- true after onboarding complete
  vertical_locked_at TIMESTAMP WITH TIME ZONE,
  vertical_locked_by VARCHAR(50),                    -- 'user' | 'admin' | 'system'

  -- Onboarding
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  onboarding_step VARCHAR(50) DEFAULT 'welcome',

  -- Company info (extracted from email domain)
  company_name VARCHAR(255),
  company_domain VARCHAR(255),
  company_industry VARCHAR(100),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_vertical ON user_profiles(vertical, sub_vertical, region_country);

-- ============================================================
-- EMAIL VERIFICATION TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_email_tokens_token ON email_verification_tokens(token) WHERE used = false;
CREATE INDEX idx_email_tokens_user ON email_verification_tokens(user_id);

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_password_tokens_token ON password_reset_tokens(token) WHERE used = false;
CREATE INDEX idx_password_tokens_user ON password_reset_tokens(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Tenants: users can only see their own tenant
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true)::UUID);

-- Users: users can only see users in their tenant
CREATE POLICY user_tenant_isolation ON users
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Profiles: users can only see profiles in their tenant
CREATE POLICY profile_tenant_isolation ON user_profiles
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE tenants IS 'Multi-tenant organizations';
COMMENT ON TABLE users IS 'User accounts with authentication';
COMMENT ON TABLE user_profiles IS 'User profiles with vertical lock for sales context';
COMMENT ON COLUMN user_profiles.vertical_locked IS 'When true, user cannot change their vertical (enforced after onboarding)';
COMMENT ON COLUMN user_profiles.vertical IS 'Primary sales vertical (e.g., banking, insurance)';
COMMENT ON COLUMN user_profiles.sub_vertical IS 'Sub-vertical specialization (e.g., employee-banking, corporate-banking)';

-- ============================================================
-- SEED: Default tenant for development
-- ============================================================

INSERT INTO tenants (id, name, slug, domain, plan, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PremiumRadar Demo',
  'premiumradar-demo',
  'premiumradar.com',
  'enterprise',
  'active'
) ON CONFLICT (slug) DO NOTHING;
