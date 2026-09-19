import { NextRequest, NextResponse } from 'next/server';
import { adapterRegistry } from '@/lib/adapters';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '8', 10);

  try {
    const products = await adapterRegistry.searchAllRetailers({
      query: category || '',
      category,
      limit: 15,
    });

    // Filter products that have active savings and in-stock items
    const deals = products
      .filter((p) => (p.maxSavingsPercentage && p.maxSavingsPercentage > 0) || (p.regularPrice && p.regularPrice > p.lowestPrice))
      .sort((a, b) => (b.maxSavingsPercentage || 0) - (a.maxSavingsPercentage || 0))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (error) {
    console.error('Deals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured deals' },
      { status: 500 }
    );
  }
}
