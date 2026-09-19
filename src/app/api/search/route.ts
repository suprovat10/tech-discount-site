import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adapterRegistry } from '@/lib/adapters';
import { getCachedSearchResults, setCachedSearchResults } from '@/lib/db/queries';
import { checkRateLimit } from '@/lib/ratelimit/limiter';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateCheck = checkRateLimit(ip, 60, 60);

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment before searching again.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const category = searchParams.get('category')?.trim() || undefined;

  // Allow empty query to fetch all catalog products

  const queryHash = crypto
    .createHash('sha256')
    .update(`${query.toLowerCase()}_${category || ''}`)
    .digest('hex');

  // Check Supabase / Server Cache
  const cachedResults = await getCachedSearchResults(queryHash);
  if (cachedResults && cachedResults.length > 0) {
    return NextResponse.json({
      success: true,
      source: 'cache',
      query,
      count: cachedResults.length,
      data: cachedResults,
    });
  }

  // Live Aggregation across all 4 retailer adapters
  try {
    const freshProducts = await adapterRegistry.searchAllRetailers({
      query,
      category,
      limit: 100,
    });

    // Save to cache asynchronously
    if (freshProducts.length > 0) {
      setCachedSearchResults(queryHash, query, freshProducts, 30).catch((e) =>
        console.error('Failed to set cache:', e)
      );
    }

    return NextResponse.json({
      success: true,
      source: 'live',
      query,
      count: freshProducts.length,
      data: freshProducts,
    });
  } catch (error: any) {
    console.error('Search API exception:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching prices from retailers.' },
      { status: 500 }
    );
  }
}
