/**
 * SaaS Health Check Endpoint
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';

export async function GET() {
  const timestamp = new Date().toISOString();

  // Check SaaS service health
  const saasHealth = {
    status: 'healthy',
    version: '0.1.0',
  };

  // Check OS connectivity
  let osHealth = {
    status: 'unknown',
    reachable: false,
    error: null as string | null,
  };

  try {
    const osResponse = await osClient.health();
    osHealth = {
      status: osResponse.success ? 'healthy' : 'degraded',
      reachable: true,
      error: null,
    };
  } catch (error) {
    osHealth = {
      status: 'unreachable',
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const overallHealthy = saasHealth.status === 'healthy' && osHealth.reachable;

  return NextResponse.json(
    {
      status: overallHealthy ? 'healthy' : 'degraded',
      timestamp,
      services: {
        saas: saasHealth,
        os: osHealth,
      },
    },
    { status: overallHealthy ? 200 : 503 }
  );
}
