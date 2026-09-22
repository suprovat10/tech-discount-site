import { NextResponse } from 'next/server';
import { incrementProductView } from '@/lib/catalogDb';
import { checkRateLimit } from '@/lib/ratelimit/limiter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const body = await request.json();
    const idOrSlug = body.id || body.slug;

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, error: 'Product ID or slug is required' },
        { status: 400 }
      );
    }

    // Prevent spam: Max 10 view increments per minute per IP for the same product
    const rateCheck = checkRateLimit(`view:${ip}:${idOrSlug}`, 10, 60);
    if (!rateCheck.success) {
      return NextResponse.json({ success: true, message: 'View rate limited' });
    }

    const newViews = await incrementProductView(String(idOrSlug));

    return NextResponse.json({
      success: true,
      views: newViews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record view' },
      { status: 500 }
    );
  }
}
