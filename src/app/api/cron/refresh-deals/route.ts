import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adapterRegistry } from '@/lib/adapters';
import { setCachedSearchResults } from '@/lib/db/queries';

const POPULAR_QUERIES = [
  'airpods pro',
  'macbook air',
  'sony headphones',
  'playstation 5',
  'oled tv',
  'apple watch',
  'ipad pro',
  'nintendo switch',
  'gaming monitor',
];

import { getDatabaseProducts } from '@/lib/catalogDb';
import { getSupabaseAdminClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  // Authorize Vercel Cron or Admin manual trigger
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  const syncedProducts: { id: string; title: string; offersUpdated: number }[] = [];
  const supabase = getSupabaseAdminClient();

  // 1. Daily Auto Price Sync across all products in database
  const catalogProducts = await getDatabaseProducts();
  let totalOffersUpdated = 0;

  for (const product of catalogProducts) {
    let offersUpdated = 0;
    if (Array.isArray(product.offers)) {
      for (const offer of product.offers) {
        try {
          const adapter = adapterRegistry.getAdapter(offer.retailer as any);
          if (adapter && adapter.isConfigured() && offer.retailerItemId) {
            const liveDetails = await adapter.getProductDetails({ itemId: offer.retailerItemId });
            if (liveDetails && liveDetails.price > 0) {
              offer.price = liveDetails.price;
              if (liveDetails.regularPrice) offer.regularPrice = liveDetails.regularPrice;
              offer.isInStock = liveDetails.isInStock;
              offer.lastUpdated = new Date().toISOString();
              offersUpdated++;

              // Sync to Supabase if connected
              if (supabase) {
                await supabase
                  .from('offers')
                  .update({
                    price: liveDetails.price,
                    regular_price: liveDetails.regularPrice,
                    is_in_stock: liveDetails.isInStock,
                    last_checked_at: new Date().toISOString(),
                  })
                  .match({ retailer: offer.retailer, retailer_item_id: offer.retailerItemId });
              }
            }
          }
        } catch (err: any) {
          console.warn(`[Price Sync] Failed to update ${offer.retailer} for ${product.id}:`, err.message);
        }
      }
    }
    if (offersUpdated > 0) {
      syncedProducts.push({ id: product.id, title: product.title, offersUpdated });
    }
  }

  if (syncedProducts.length > 0) {
    const { setSiteKV } = await import('@/lib/db/kv');
    await setSiteKV('products_catalog', catalogProducts);
  }

  // 2. Refresh search cache for popular queries
  const resultsSummary = [];
  for (const query of POPULAR_QUERIES) {
    try {
      const freshProducts = await adapterRegistry.searchAllRetailers({
        query,
        limit: 10,
      });

      const queryHash = crypto
        .createHash('sha256')
        .update(`${query.toLowerCase()}_`)
        .digest('hex');

      await setCachedSearchResults(queryHash, query, freshProducts, 60);
      resultsSummary.push({ query, count: freshProducts.length, status: 'refreshed' });
    } catch (err: any) {
      resultsSummary.push({ query, status: 'error', error: err.message });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Daily price sync and popular deal refresh completed successfully',
    timestamp: new Date().toISOString(),
    productsSyncedCount: syncedProducts.length,
    syncedProducts,
    popularDeals: resultsSummary,
  });
}
