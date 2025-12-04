/**
 * API Integrations Management Route
 *
 * CRUD operations for managing API keys (Apollo, SERP, etc.)
 * Used by Super Admin panel - no hardcoded keys.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getIntegrations,
  createIntegration,
  type IntegrationProvider,
  type CreateIntegrationInput,
} from '@/lib/integrations/api-integrations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/integrations
 * List all integrations, optionally filtered by provider
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as IntegrationProvider | null;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const integrations = await getIntegrations({
      provider: provider || undefined,
      activeOnly,
    });

    // Mask API keys in response (show only last 4 chars)
    const masked = integrations.map(integration => ({
      ...integration,
      apiKey: `****${integration.apiKey.slice(-4)}`,
      apiSecret: integration.apiSecret ? `****${integration.apiSecret.slice(-4)}` : null,
    }));

    return NextResponse.json({
      success: true,
      data: masked,
      count: masked.length,
    });
  } catch (error) {
    console.error('[API Integrations] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/integrations
 * Create a new integration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { provider, name, apiKey } = body;
    if (!provider || !name || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: provider, name, apiKey' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders: IntegrationProvider[] = ['apollo', 'serp', 'linkedin', 'crunchbase'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { success: false, error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    const input: CreateIntegrationInput = {
      provider,
      name,
      apiKey,
      description: body.description,
      apiSecret: body.apiSecret,
      baseUrl: body.baseUrl,
      config: body.config,
      tenantId: body.tenantId,
      vertical: body.vertical,
      isDefault: body.isDefault,
    };

    const integration = await createIntegration(input);

    // Mask API key in response
    return NextResponse.json({
      success: true,
      data: {
        ...integration,
        apiKey: `****${integration.apiKey.slice(-4)}`,
        apiSecret: integration.apiSecret ? `****${integration.apiSecret.slice(-4)}` : null,
      },
    });
  } catch (error) {
    console.error('[API Integrations] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
