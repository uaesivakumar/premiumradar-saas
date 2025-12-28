/**
 * S291: Enterprise Admin API
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * GET  /api/enterprise - Get current user's enterprise
 * PUT  /api/enterprise - Update enterprise (ENTERPRISE_ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  getEnterpriseById,
  updateEnterprise,
  getEnterpriseStats,
  UpdateEnterpriseInput,
} from '@/lib/db/enterprises';
import { hasRequiredRole } from '@/lib/auth/rbac/types';

// ============================================================
// GET /api/enterprise - Get current user's enterprise
// ============================================================

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const enterpriseId = session.enterpriseId;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 404 }
      );
    }

    const enterprise = await getEnterpriseById(enterpriseId);

    if (!enterprise) {
      return NextResponse.json(
        { success: false, error: 'Enterprise not found' },
        { status: 404 }
      );
    }

    // Get enterprise statistics
    const stats = await getEnterpriseStats(enterpriseId);

    return NextResponse.json({
      success: true,
      data: {
        enterprise: {
          id: enterprise.enterprise_id,
          name: enterprise.name,
          type: enterprise.type,
          region: enterprise.region,
          status: enterprise.status,
          domain: enterprise.domain,
          industry: enterprise.industry,
          plan: enterprise.plan,
          subscription_status: enterprise.subscription_status,
          created_at: enterprise.created_at,
        },
        stats,
        limits: {
          max_users: enterprise.max_users,
          max_workspaces: enterprise.max_workspaces,
          max_discoveries_per_month: enterprise.max_discoveries_per_month,
        },
      },
    });
  } catch (error) {
    console.error('[API] GET /api/enterprise error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get enterprise' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT /api/enterprise - Update enterprise (ENTERPRISE_ADMIN only)
// ============================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has ENTERPRISE_ADMIN or higher role
    const userRole = session.user.role as 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';
    if (!hasRequiredRole(userRole, 'ENTERPRISE_ADMIN') && !hasRequiredRole(userRole, 'TENANT_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'ENTERPRISE_ADMIN role required' },
        { status: 403 }
      );
    }

    const enterpriseId = session.enterpriseId;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'No enterprise associated with user' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate input - only allow certain fields to be updated
    const allowedFields: (keyof UpdateEnterpriseInput)[] = [
      'name',
      'domain',
      'industry',
    ];

    const updates: UpdateEnterpriseInput = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updates as Record<string, unknown>)[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updated = await updateEnterprise(enterpriseId, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Enterprise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enterprise: {
          id: updated.enterprise_id,
          name: updated.name,
          type: updated.type,
          region: updated.region,
          status: updated.status,
          domain: updated.domain,
          industry: updated.industry,
          updated_at: updated.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('[API] PUT /api/enterprise error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update enterprise' },
      { status: 500 }
    );
  }
}
