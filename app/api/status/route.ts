/**
 * Service Status Endpoint
 * S152: Launch Preparation
 *
 * Detailed status check for all service dependencies.
 * Use for dashboard monitoring and debugging.
 *
 * GET /api/status
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  latencyMs?: number;
  message?: string;
}

interface StatusResponse {
  status: 'operational' | 'degraded' | 'outage';
  timestamp: string;
  version: string;
  environment: string;
  services: ServiceStatus[];
  metrics: {
    uptime: number;
    memoryUsage: number;
    heapUsed: number;
  };
}

const startTime = Date.now();

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Simple connectivity check using internal DB client
    await query('SELECT 1');

    return {
      name: 'database',
      status: 'up',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'down',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkOSService(): Promise<ServiceStatus> {
  const osUrl = process.env.OS_SERVICE_URL || process.env.NEXT_PUBLIC_OS_URL;

  if (!osUrl) {
    return {
      name: 'os-service',
      status: 'unknown',
      message: 'OS_SERVICE_URL not configured',
    };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${osUrl}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      name: 'os-service',
      status: response.ok ? 'up' : 'degraded',
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'os-service',
      status: 'down',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkCache(): Promise<ServiceStatus> {
  // For MVP, we're using in-memory cache
  // In production, this would check Redis
  return {
    name: 'cache',
    status: 'up',
    message: 'In-memory cache active',
  };
}

export async function GET() {
  try {
    // Check all services in parallel
    const [database, osService, cache] = await Promise.all([
      checkDatabase(),
      checkOSService(),
      checkCache(),
    ]);

    const services: ServiceStatus[] = [database, osService, cache];

    // Determine overall status
    const hasDown = services.some((s) => s.status === 'down');
    const hasDegraded = services.some((s) => s.status === 'degraded');

    let overallStatus: StatusResponse['status'] = 'operational';
    if (hasDown) {
      overallStatus = 'outage';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }

    // Get memory metrics
    const memoryUsage = process.memoryUsage();

    const status: StatusResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      metrics: {
        uptime: Math.floor((Date.now() - startTime) / 1000),
        memoryUsage: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    };

    // Return appropriate status code
    const httpStatus = overallStatus === 'outage' ? 503 : overallStatus === 'degraded' ? 200 : 200;

    return NextResponse.json(status, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'outage',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
