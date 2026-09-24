import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { adapterRegistry } from '@/lib/adapters';
import { getDatabaseProducts, invalidateCatalogDbCache } from '@/lib/catalogDb';
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
  const priceChangedProductSlugs: string[] = [];

  // 1. Daily Auto Price Sync across all products in database
  const catalogProducts = await getDatabaseProducts();

  for (const product of catalogProducts) {
    let offersUpdated = 0;
    let productPriceChanged = false;

    if (Array.isArray(product.offers)) {
      for (const offer of product.offers) {
        try {
          const adapter = adapterRegistry.getAdapter(offer.retailer as any);
          if (adapter && adapter.isConfigured() && offer.retailerItemId) {
            const liveDetails = await adapter.getProductDetails({ itemId: offer.retailerItemId });
            if (liveDetails && liveDetails.price > 0) {
              const previousPrice = offer.price;
              if (previousPrice !== liveDetails.price) {
                productPriceChanged = true;
              }
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

    // ONLY products whose prices actually changed should be revalidated
    if (productPriceChanged && product.slug) {
      priceChangedProductSlugs.push(product.slug);
      try {
        revalidatePath(`/product/${product.slug}`, 'page');
      } catch (err) {
        console.warn(`[Price Sync] Error revalidating /product/${product.slug}:`, err);
      }
    }
  }

  if (syncedProducts.length > 0) {
    await setSiteKV('products_catalog', catalogProducts);
    invalidateCatalogDbCache();
  }

  // If any products had actual price changes, revalidate homepage and products catalog so listings reflect new prices
  if (priceChangedProductSlugs.length > 0) {
    try {
      revalidatePath('/', 'page');
      revalidatePath('/products', 'page');
    } catch (err) {
      console.warn('[Price Sync] Error revalidating home/catalog after price changes:', err);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Daily price sync completed successfully',
    timestamp: new Date().toISOString(),
    productsSyncedCount: syncedProducts.length,
    syncedProducts,
  });
}
