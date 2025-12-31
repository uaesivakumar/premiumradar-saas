/**
 * Build Info Endpoint
 * Returns deterministic build metadata for validation
 */

import { NextResponse } from 'next/server';

const BUILD_SHA = process.env.BUILD_SHA || '55be6375a796da0fcb7605f75e96e7cd2691bb23';
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();
const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || 'development';

export async function GET() {
  return NextResponse.json({
    sha: BUILD_SHA,
    time: BUILD_TIME,
    env: APP_ENV,
    admin_plane_version: '1.1',
    narrator_version: 'deterministic-v1.1',
  });
}
