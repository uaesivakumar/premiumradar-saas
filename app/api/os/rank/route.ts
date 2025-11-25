import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await osClient.rank(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/rank] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Rank request failed' },
      { status: 500 }
    );
  }
}
