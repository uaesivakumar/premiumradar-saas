/**
 * Super Admin System Config API
 *
 * CRUD endpoint for system configurations.
 * Protected by Super Admin session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/superadmin/security';
import {
  getAllConfigs,
  getConfigsByCategory,
  setConfig,
  deleteConfig,
  getConfigHistory,
  seedDefaultConfigs,
  type ConfigCategory,
  type ConfigUpdate,
} from '@/lib/admin/system-config';

/**
 * GET /api/superadmin/config
 * Get all configs or filter by category
 */
export async function GET(request: NextRequest) {
  // Extract IP and user agent for session verification
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Verify Super Admin session
  const session = await verifySession(ip, userAgent);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as ConfigCategory | null;
    const history = searchParams.get('history') === 'true';

    // Get change history
    if (history) {
      const limit = parseInt(searchParams.get('limit') || '50');
      const historyData = await getConfigHistory(limit);
      return NextResponse.json({
        success: true,
        data: historyData,
      });
    }

    // Get configs by category or all
    const configs = category
      ? await getConfigsByCategory(category)
      : await getAllConfigs();

    // Group by category for easier UI rendering
    const grouped = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, typeof configs>);

    return NextResponse.json({
      success: true,
      data: {
        configs,
        grouped,
        categories: Object.keys(grouped),
      },
    });
  } catch (error) {
    console.error('[Config API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/config
 * Create or update a config
 */
export async function POST(request: NextRequest) {
  // Extract IP and user agent for session verification
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Verify Super Admin session
  const session = await verifySession(ip, userAgent);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Handle seed request
    if (body.action === 'seed') {
      const seeded = await seedDefaultConfigs();
      return NextResponse.json({
        success: true,
        message: `Seeded ${seeded} default configurations`,
      });
    }

    // Validate required fields
    const { category, key, value, description, valueType, isSecret } = body;

    if (!category || !key || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: category, key, value' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories: ConfigCategory[] = [
      'pricing', 'limits', 'integrations', 'thresholds', 'features', 'llm', 'security', 'general'
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const update: ConfigUpdate = {
      category,
      key,
      value,
      description,
      valueType: valueType || 'string',
      isSecret: isSecret || false,
    };

    const success = await setConfig(update, session.session?.email || 'superadmin');

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Configuration ${category}.${key} saved`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Config API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/config
 * Delete a config
 */
export async function DELETE(request: NextRequest) {
  // Extract IP and user agent for session verification
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Verify Super Admin session
  const session = await verifySession(ip, userAgent);
  if (!session.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as ConfigCategory | null;
    const key = searchParams.get('key');

    if (!category || !key) {
      return NextResponse.json(
        { error: 'Missing required parameters: category, key' },
        { status: 400 }
      );
    }

    const success = await deleteConfig(
      category,
      key,
      session.session?.email || 'superadmin'
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Configuration ${category}.${key} deleted`,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Config API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
}
