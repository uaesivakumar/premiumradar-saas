/**
 * SaaS Health Check Endpoint
 * S152: Launch Preparation
 *
 * GET /api/health - Simple health check for load balancers and monitoring
 * HEAD /api/health - Lightweight health probe
 */

import { NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';

export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET() {
  const timestamp = new Date().toISOString();

  // Check SaaS service health
  const saasHealth = {
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
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
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        saas: saasHealth,
        os: osHealth,
      },
    },
    {
      status: overallHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

// HEAD request for lightweight health probes (load balancers)
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
