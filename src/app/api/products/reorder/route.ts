import { NextResponse } from 'next/server';
import { getDatabaseProducts, saveReorderedProductsCatalog } from '@/lib/catalogDb';
import { purgeAllCaches } from '@/lib/cachePurge';
import { isRequestAdminAuthenticated } from '@/lib/auth';
import { CatalogItem } from '@/data/catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  if (!isRequestAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const productIds: string[] = body.productIds || [];
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, error: 'productIds array is required' }, { status: 400 });
    }

    const current = await getDatabaseProducts(true);
    const map = new Map(current.map((p) => [p.id, p]));
    const reordered: CatalogItem[] = [];

    for (const id of productIds) {
      const item = map.get(id);
      if (item) {
        reordered.push(item);
        map.delete(id);
      }
    }
    for (const item of map.values()) {
      reordered.push(item);
    }

    await saveReorderedProductsCatalog(reordered);
    purgeAllCaches();

    return NextResponse.json({ success: true, count: reordered.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to reorder products' }, { status: 500 });
  }
}
