/**
 * VS10.4: Email Open Tracking Pixel Route
 * Sprint: S1 (VS10)
 *
 * Returns a 1x1 transparent pixel and records the open event.
 * Used for tracking email opens via embedded image.
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordTrackingEvent } from '@/lib/email/send';

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('id');
    const event = searchParams.get('event');
    const recipient = searchParams.get('r');

    if (messageId && event === 'open') {
      recordTrackingEvent({
        type: 'opened',
        messageId,
        recipient: recipient || 'unknown',
        timestamp: new Date(),
        metadata: {
          source: 'tracking_pixel',
          userAgent: request.headers.get('user-agent') || undefined,
        },
      });

      console.log('[Email Track] Open recorded:', { messageId, recipient });
    }

    // Return tracking pixel
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': String(TRACKING_PIXEL.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('[Email Track] Error:', error);
    // Still return pixel to avoid breaking email display
    return new NextResponse(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    });
  }
}
