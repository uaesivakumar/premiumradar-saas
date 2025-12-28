/**
 * S298: User Profile API
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * GET   /api/me - Get current user's profile
 * PATCH /api/me - Update current user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import {
  getFullUserProfile,
  updateUserProfile,
  validateProfileUpdate,
} from '@/lib/db/user-profiles';

// ============================================================
// GET /api/me - Get current user's profile
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

    const profile = await getFullUserProfile(session.user.id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          avatar_url: profile.avatar_url,
          phone: profile.phone,

          enterprise: profile.enterprise_id ? {
            id: profile.enterprise_id,
            name: profile.enterprise_name,
            type: profile.enterprise_type,
            plan: profile.enterprise_plan,
          } : null,

          workspace: profile.workspace_id ? {
            id: profile.workspace_id,
            name: profile.workspace_name,
            sub_vertical_id: profile.sub_vertical_id,
          } : null,

          demo: {
            is_demo: profile.is_demo,
            demo_type: profile.demo_type,
            expires_at: profile.demo_expires_at,
            days_remaining: profile.demo_days_remaining,
          },

          preferences: profile.preferences,

          last_login_at: profile.last_login_at,
          created_at: profile.created_at,
        },
      },
    });
  } catch (error) {
    console.error('[API] GET /api/me error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH /api/me - Update current user's profile
// ============================================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Only allow certain fields to be updated
    const allowedFields = ['name', 'phone', 'avatar_url', 'preferences'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateProfileUpdate(updates);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const profile = await updateUserProfile(session.user.id, updates);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          avatar_url: profile.avatar_url,
          phone: profile.phone,
          preferences: profile.preferences,
          updated_at: profile.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('[API] PATCH /api/me error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
