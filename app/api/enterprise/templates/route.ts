/**
 * S297: Template APIs
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * GET  /api/enterprise/templates - List templates
 * POST /api/enterprise/templates - Create template (ENTERPRISE_ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  listEnterpriseTemplates,
  createTemplate,
  getTemplateStats,
  TemplateType,
  extractVariables,
} from '@/lib/db/templates';
import { hasRequiredRole } from '@/lib/auth/rbac/types';

// ============================================================
// GET /api/enterprise/templates - List templates
// ============================================================

export async function GET(request: NextRequest) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TemplateType | null;
    const activeOnly = searchParams.get('active_only') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const includeStats = searchParams.get('include_stats') === 'true';

    const { templates, total } = await listEnterpriseTemplates(enterpriseId, {
      type: type || undefined,
      activeOnly,
      limit,
      offset,
    });

    // Optionally include stats
    let stats = null;
    if (includeStats) {
      stats = await getTemplateStats(enterpriseId);
    }

    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          type: t.type,
          variables: t.variables,
          version: t.version,
          is_active: t.is_active,
          created_at: t.created_at,
          updated_at: t.updated_at,
        })),
        total,
        limit,
        offset,
        ...(stats ? { stats } : {}),
      },
    });
  } catch (error) {
    console.error('[API] GET /api/enterprise/templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/enterprise/templates - Create template
// ============================================================

export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (!body.body) {
      return NextResponse.json(
        { success: false, error: 'Template body is required' },
        { status: 400 }
      );
    }

    // Validate type if provided
    if (body.type) {
      const validTypes: TemplateType[] = ['email', 'sms', 'linkedin', 'whatsapp', 'custom'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid template type' },
          { status: 400 }
        );
      }
    }

    // Auto-extract variables if not provided
    let variables = body.variables;
    if (!variables || variables.length === 0) {
      const extractedVars = extractVariables(body.body, body.subject);
      variables = extractedVars.map((name) => ({
        name,
        type: 'string',
        required: false,
      }));
    }

    const template = await createTemplate({
      enterprise_id: enterpriseId,
      name: body.name,
      subject: body.subject,
      body: body.body,
      type: body.type || 'email',
      variables,
      created_by: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        template: {
          id: template.id,
          name: template.name,
          subject: template.subject,
          body: template.body,
          type: template.type,
          variables: template.variables,
          version: template.version,
          is_active: template.is_active,
          created_at: template.created_at,
        },
      },
    });
  } catch (error) {
    console.error('[API] POST /api/enterprise/templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
