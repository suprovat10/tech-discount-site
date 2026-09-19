import { NextRequest, NextResponse } from 'next/server';
import { adapterRegistry } from '@/lib/adapters';
import { checkRateLimit } from '@/lib/ratelimit/limiter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateCheck = checkRateLimit(ip, 120, 60);

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment before searching again.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const category = searchParams.get('category')?.trim() || undefined;

  // Live query directly from Supabase database and retailer adapters (never stale cache)
  try {
    const freshProducts = await adapterRegistry.searchAllRetailers({
      query,
      category,
      limit: 100,
    });

    return NextResponse.json(
      {
        success: true,
        source: 'live',
        query,
        count: freshProducts.length,
        data: freshProducts,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Search API exception:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching prices from retailers.' },
      { status: 500 }
    );
  }
}
