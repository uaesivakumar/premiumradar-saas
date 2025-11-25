import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await osClient.discovery(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/discovery] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Discovery request failed' },
      { status: 500 }
    );
  }
}
