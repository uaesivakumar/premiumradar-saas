/**
 * Beta Access Control - US SaaS Edition
 * Simple email allowlist gating (NO CRUD UI)
 *
 * Configuration: Set BETA_ALLOWLIST env var with comma-separated emails
 * Example: BETA_ALLOWLIST=founder@startup.com,cfo@saas.co
 */

// Default allowlist - founders who requested early access
// In production, use BETA_ALLOWLIST env var
const DEFAULT_ALLOWLIST = [
  // Add beta users here during development
  'demo.saas.user@premiumradar.ai',
  'sivakumarc.india@gmail.com',
];

/**
 * Get the beta email allowlist
 */
function getBetaAllowlist(): string[] {
  const envAllowlist = process.env.BETA_ALLOWLIST;
  if (envAllowlist) {
    return envAllowlist.split(',').map((email) => email.trim().toLowerCase());
  }
  return DEFAULT_ALLOWLIST.map((email) => email.toLowerCase());
}

/**
 * Check if an email has beta access
 */
export function hasBetaAccess(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowlist = getBetaAllowlist();
  return allowlist.includes(email.toLowerCase());
}

/**
 * Check if beta access is enabled at all
 * Returns false if beta gating is disabled (all users allowed)
 */
export function isBetaGatingEnabled(): boolean {
  // Set BETA_GATING_ENABLED=false to disable beta gating entirely
  return process.env.BETA_GATING_ENABLED !== 'false';
}

/**
 * Check if user can access SaaS Sales features
 * Combines beta check with feature flag
 */
export function canAccessSaasSales(email: string | null | undefined): boolean {
  // If beta gating is disabled, allow everyone
  if (!isBetaGatingEnabled()) {
    return true;
  }

  // Check beta allowlist
  return hasBetaAccess(email);
}

/**
 * Get beta access status for display
 */
export function getBetaAccessStatus(email: string | null | undefined): {
  hasBetaAccess: boolean;
  gatingEnabled: boolean;
  message: string;
} {
  const gatingEnabled = isBetaGatingEnabled();
  const hasAccess = hasBetaAccess(email);

  if (!gatingEnabled) {
    return {
      hasBetaAccess: true,
      gatingEnabled: false,
      message: 'Beta access is open to all users',
    };
  }

  if (hasAccess) {
    return {
      hasBetaAccess: true,
      gatingEnabled: true,
      message: 'You have early beta access',
    };
  }

  return {
    hasBetaAccess: false,
    gatingEnabled: true,
    message: 'Request access to join the beta program',
  };
}
