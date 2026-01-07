/**
 * Auth Enforcement Tests
 *
 * S350: Security Hole Remediation & Auth Enforcement
 * Behavior Contract B001: All API endpoints require authentication
 *
 * These tests verify that:
 * 1. Unauthenticated requests return 401
 * 2. No data is exposed without authentication
 * 3. tenant_id is always injected from session, never from client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the auth module
vi.mock('@/lib/auth/session', () => ({
  getServerSession: vi.fn(),
}));

// Mock the OS client
vi.mock('@/lib/os-client', () => ({
  osClient: {
    pipeline: vi.fn(),
    discovery: vi.fn(),
    score: vi.fn(),
    rank: vi.fn(),
    outreach: vi.fn(),
  },
}));

import { getServerSession } from '@/lib/auth/session';
import { osClient } from '@/lib/os-client';

// Import the route handlers
import { POST as pipelineHandler } from '@/app/api/os/pipeline/route';

describe('B001: All API endpoints require authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/os/pipeline', () => {
    it('returns 401 when unauthenticated', async () => {
      // Arrange: No session
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/os/pipeline', {
        method: 'POST',
        body: JSON.stringify({ action: 'test' }),
      });

      // Act
      const response = await pipelineHandler(request);

      // Assert
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Authentication required');
    });

    it('does not expose data when unauthenticated', async () => {
      // Arrange: No session
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/os/pipeline', {
        method: 'POST',
        body: JSON.stringify({ action: 'test' }),
      });

      // Act
      const response = await pipelineHandler(request);

      // Assert: OS client should never be called
      expect(osClient.pipeline).not.toHaveBeenCalled();
    });

    it('allows authenticated requests', async () => {
      // Arrange: Valid session
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        enterpriseId: 'enterprise-1',
        tenantId: 'enterprise-1',
        expiresAt: new Date(Date.now() + 3600000),
      } as any);

      vi.mocked(osClient.pipeline).mockResolvedValue({ success: true, timestamp: new Date().toISOString() } as any);

      const request = new NextRequest('http://localhost/api/os/pipeline', {
        method: 'POST',
        body: JSON.stringify({ action: 'test' }),
      });

      // Act
      const response = await pipelineHandler(request);

      // Assert
      expect(response.status).toBe(200);
      expect(osClient.pipeline).toHaveBeenCalled();
    });

    it('injects tenant_id from session, not client', async () => {
      // Arrange: Valid session with specific tenant
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        enterpriseId: 'real-enterprise',
        tenantId: 'real-enterprise',
        expiresAt: new Date(Date.now() + 3600000),
      } as any);

      vi.mocked(osClient.pipeline).mockResolvedValue({ success: true, timestamp: new Date().toISOString() } as any);

      // Client tries to send a FAKE tenant_id
      const request = new NextRequest('http://localhost/api/os/pipeline', {
        method: 'POST',
        body: JSON.stringify({
          action: 'test',
          tenant_id: 'FAKE-TENANT-ID', // Attacker trying to spoof
        }),
      });

      // Act
      await pipelineHandler(request);

      // Assert: OS client received the REAL tenant_id from session
      expect(osClient.pipeline).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'real-enterprise', // From session, NOT from client
          enterprise_id: 'real-enterprise',
        })
      );
    });
  });
});

describe('Auth Gate Middleware', () => {
  it('requireAuth returns 401 response when no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const { requireAuth } = await import('@/lib/middleware/auth-gate');
    const result = await requireAuth();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(401);
    }
  });

  it('requireAuth returns session when authenticated', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' },
      enterpriseId: 'enterprise-1',
      tenantId: 'enterprise-1',
      expiresAt: new Date(Date.now() + 3600000),
    };

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

    const { requireAuth } = await import('@/lib/middleware/auth-gate');
    const result = await requireAuth();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.tenantId).toBe('enterprise-1');
    }
  });

  it('injectSecureTenantContext overrides client tenant_id', async () => {
    const { injectSecureTenantContext } = await import('@/lib/middleware/auth-gate');

    const clientBody = {
      action: 'test',
      tenant_id: 'FAKE-TENANT', // Client-sent (should be overridden)
    };

    const session = {
      tenantId: 'real-tenant',
      enterpriseId: 'real-enterprise',
    } as any;

    const result = injectSecureTenantContext(clientBody, session);

    expect(result.tenant_id).toBe('real-tenant');
    expect(result.enterprise_id).toBe('real-enterprise');
  });
});
