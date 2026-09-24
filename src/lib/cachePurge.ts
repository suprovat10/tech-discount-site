import { revalidatePath } from 'next/cache';
import { invalidateSiteKVCache } from './db/kv';
import { invalidateCatalogDbCache } from './catalogDb';
import { invalidateCategoryServerCache } from './categoryServer';
import { invalidateSettingsServerCache } from './settingsServer';
import { invalidatePageServerCache } from './pageServer';
import { invalidatePopupsCache } from './popupServer';

export interface PurgeOptions {
  productSlug?: string;
  blogSlug?: string;
  categorySlug?: string;
  tagSlug?: string;
  pageSlug?: string;
}

/**
 * Purges server-rendered caches in a strictly targeted manner
 * whenever any item is created, updated, or deleted in the admin console.
 * Avoids layout-level invalidations which cause site-wide ISR rewrites.
 */
export function purgeAllCaches(options?: PurgeOptions) {
  try {
    // 0. Invalidate fast in-memory and KV database cache (0 ISR write cost)
    invalidateSiteKVCache();
    invalidateCatalogDbCache();
    invalidateCategoryServerCache();
    invalidateSettingsServerCache();
    invalidatePageServerCache();
    invalidatePopupsCache();

    // 1. If a specific product was updated, only purge that product, catalog, and home
    if (options?.productSlug) {
      revalidatePath(`/product/${options.productSlug}`, 'page');
      revalidatePath('/products', 'page');
      revalidatePath('/', 'page');
      revalidatePath('/sitemap.xml');
      return;
    }

    // 2. If a specific blog post was updated, only purge that blog post, blog listing, and home
    if (options?.blogSlug) {
      revalidatePath(`/blog/${options.blogSlug}`, 'page');
      revalidatePath('/blog', 'page');
      revalidatePath('/', 'page');
      revalidatePath('/sitemap.xml');
      return;
    }

    // 3. If a category was updated, only purge that category and products index
    if (options?.categorySlug) {
      revalidatePath(`/products/${options.categorySlug}`, 'page');
      revalidatePath('/products', 'page');
      revalidatePath('/', 'page');
      return;
    }

    // 4. If a tag was updated, only purge that tag page
    if (options?.tagSlug) {
      revalidatePath(`/tag/${options.tagSlug}`, 'page');
      revalidatePath('/products', 'page');
      return;
    }

    // 5. If a custom CMS page was updated, purge that page
    if (options?.pageSlug) {
      revalidatePath(`/page/${options.pageSlug}`, 'page');
      revalidatePath(`/${options.pageSlug}`, 'page');
      revalidatePath('/sitemap.xml');
      return;
    }

    // 6. Generic or global admin changes (settings, coupons, ads, popups)
    // Only revalidate the affected core pages at 'page' level — NEVER 'layout'
    revalidatePath('/', 'page');
    revalidatePath('/products', 'page');
    revalidatePath('/coupons', 'page');
    revalidatePath('/blog', 'page');
    revalidatePath('/sitemap.xml');
  } catch (err) {
    console.warn('Targeted cache purge error:', err);
  }
}
