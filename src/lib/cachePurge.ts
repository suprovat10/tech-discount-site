import { revalidatePath } from 'next/cache';
import { invalidateSiteKVCache } from './db/kv';
import { invalidateCatalogDbCache } from './catalogDb';
import { invalidateCategoryCache } from './categoryServer';
import { invalidateSettingsCache } from './settingsServer';
import { invalidatePageCache } from './pageServer';

export interface PurgeOptions {
  productSlug?: string;
  blogSlug?: string;
  categorySlug?: string;
  tagSlug?: string;
  pageSlug?: string;
}

/**
 * Centrally purges all server-rendered and ISR caches across the site
 * whenever any item is created, updated, or deleted in the admin console.
 */
export function purgeAllCaches(options?: PurgeOptions) {
  try {
    // 0. Invalidate in-memory and KV database cache
    invalidateSiteKVCache();
    invalidateCatalogDbCache();
    invalidateCategoryCache();
    invalidateSettingsCache();
    invalidatePageCache();

    // 1. Root and Layout caches
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');

    // 2. Catalog and Products
    revalidatePath('/products', 'layout');
    revalidatePath('/products', 'page');
    revalidatePath('/products/[[...slug]]', 'layout');
    revalidatePath('/products/[[...slug]]', 'page');
    revalidatePath('/search', 'page');
    revalidatePath('/brand/[slug]', 'page');

    // 3. Product Tags
    revalidatePath('/tag/[slug]', 'page');

    // 4. Coupons
    revalidatePath('/coupons', 'layout');
    revalidatePath('/coupons', 'page');

    // 5. Blog & Blog Tags
    revalidatePath('/blog', 'layout');
    revalidatePath('/blog', 'page');
    revalidatePath('/blog/[slug]', 'page');
    revalidatePath('/blog/tag/[slug]', 'page');

    // 6. Custom Pages
    revalidatePath('/page/[slug]', 'page');

    // 7. Dynamic Sitemap
    revalidatePath('/sitemap.xml');

    // Specific slug purges
    if (options?.productSlug) {
      revalidatePath(`/product/${options.productSlug}`, 'page');
    }
    if (options?.blogSlug) {
      revalidatePath(`/blog/${options.blogSlug}`, 'page');
    }
    if (options?.tagSlug) {
      revalidatePath(`/tag/${options.tagSlug}`, 'page');
    }
    if (options?.pageSlug) {
      revalidatePath(`/page/${options.pageSlug}`, 'page');
      revalidatePath(`/${options.pageSlug}`, 'page');
    }
    if (options?.categorySlug) {
      revalidatePath(`/products/${options.categorySlug}`, 'page');
    }
  } catch (err) {
    console.warn('Auto cache purge error:', err);
  }
}
