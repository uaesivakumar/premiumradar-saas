import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await osClient.score(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /os/score] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Score request failed' },
      { status: 500 }
    );
  }
}
