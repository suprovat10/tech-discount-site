import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adapterRegistry } from '@/lib/adapters';
import { getDatabaseProducts, saveDatabaseProduct } from '@/lib/catalogDb';
import { setSiteKV } from '@/lib/db/kv';

import { isRequestAdminAuthenticated } from '@/lib/auth';

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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
  const isAdmin = isRequestAdminAuthenticated(request);

  if (!isCronAuthorized && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  const syncedProducts: { id: string; title: string; offersUpdated: number }[] = [];

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
    await setSiteKV('products_catalog', catalogProducts);
  }

  return NextResponse.json({
    success: true,
    message: 'Daily price sync completed successfully',
    timestamp: new Date().toISOString(),
    productsSyncedCount: syncedProducts.length,
    syncedProducts,
  });
}
