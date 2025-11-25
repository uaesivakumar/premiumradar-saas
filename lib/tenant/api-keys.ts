/**
 * API Key Management
 *
 * Tenant-scoped API key generation and validation.
 */

import { createHash, randomBytes } from 'crypto';
import type { ApiKey, ApiKeyStatus } from '../workspace/types';
import type { Permission } from '../workspace/types';
import { getTenantContext, requireTenantContext } from './tenant-context';

// ============================================================
// API KEY GENERATION
// ============================================================

const API_KEY_PREFIX = 'upr_';
const API_KEY_LENGTH = 32;

/**
 * Generate a new API key
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const randomPart = randomBytes(API_KEY_LENGTH).toString('base64url');
  const key = `${API_KEY_PREFIX}${randomPart}`;
  const prefix = key.substring(0, 12);
  const hash = hashApiKey(key);

  return { key, prefix, hash };
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length >= API_KEY_PREFIX.length + 20;
}

// ============================================================
// API KEY STORE (In-memory for demo)
// ============================================================

const apiKeyStore = new Map<string, ApiKey>();

/**
 * Create a new API key for the current tenant
 */
export function createApiKey(params: {
  name: string;
  permissions: Permission[];
  rateLimit?: number;
  expiresAt?: Date;
}): { apiKey: ApiKey; secretKey: string } {
  const context = requireTenantContext();
  const { key, prefix, hash } = generateApiKey();

  const apiKey: ApiKey = {
    id: `key_${randomBytes(8).toString('hex')}`,
    workspaceId: context.workspaceId,
    name: params.name,
    keyPrefix: prefix,
    keyHash: hash,
    permissions: params.permissions,
    rateLimit: params.rateLimit || 100,
    expiresAt: params.expiresAt,
    createdBy: context.userId,
    createdAt: new Date(),
    status: 'active',
  };

  apiKeyStore.set(hash, apiKey);

  return { apiKey, secretKey: key };
}

/**
 * Validate an API key and return its metadata
 */
export function validateApiKey(key: string): ApiKey | null {
  if (!isValidApiKeyFormat(key)) {
    return null;
  }

  const hash = hashApiKey(key);
  const apiKey = apiKeyStore.get(hash);

  if (!apiKey) {
    return null;
  }

  // Check status
  if (apiKey.status !== 'active') {
    return null;
  }

  // Check expiration
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    apiKey.status = 'expired';
    return null;
  }

  // Update last used
  apiKey.lastUsedAt = new Date();

  return apiKey;
}

/**
 * Revoke an API key
 */
export function revokeApiKey(keyId: string): boolean {
  const context = requireTenantContext();

  for (const [hash, apiKey] of apiKeyStore.entries()) {
    if (apiKey.id === keyId && apiKey.workspaceId === context.workspaceId) {
      apiKey.status = 'revoked';
      return true;
    }
  }

  return false;
}

/**
 * List API keys for current tenant
 */
export function listApiKeys(): ApiKey[] {
  const context = getTenantContext();
  if (!context) return [];

  const keys: ApiKey[] = [];
  for (const apiKey of apiKeyStore.values()) {
    if (apiKey.workspaceId === context.workspaceId) {
      keys.push(apiKey);
    }
  }

  return keys.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get API key by ID (tenant-scoped)
 */
export function getApiKeyById(keyId: string): ApiKey | null {
  const context = getTenantContext();
  if (!context) return null;

  for (const apiKey of apiKeyStore.values()) {
    if (apiKey.id === keyId && apiKey.workspaceId === context.workspaceId) {
      return apiKey;
    }
  }

  return null;
}

/**
 * Check if API key has permission
 */
export function apiKeyHasPermission(apiKey: ApiKey, permission: Permission): boolean {
  return apiKey.permissions.includes(permission);
}

// ============================================================
// API KEY SCOPES
// ============================================================

export const API_KEY_SCOPE_PRESETS: Record<string, { label: string; permissions: Permission[] }> = {
  read_only: {
    label: 'Read Only',
    permissions: [
      'workspace:read',
      'team:read',
      'discovery:read',
      'outreach:read',
      'analytics:read',
    ],
  },
  discovery: {
    label: 'Discovery Access',
    permissions: ['discovery:read', 'discovery:export'],
  },
  analytics: {
    label: 'Analytics Access',
    permissions: ['analytics:read', 'analytics:export'],
  },
  full_access: {
    label: 'Full Access',
    permissions: [
      'workspace:read',
      'team:read',
      'discovery:read',
      'discovery:export',
      'outreach:read',
      'outreach:create',
      'outreach:send',
      'analytics:read',
      'analytics:export',
    ],
  },
};
