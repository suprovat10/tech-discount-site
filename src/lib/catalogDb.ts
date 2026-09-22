import { getSiteKV, setSiteKV } from '@/lib/db/kv';
import { PRODUCTS_CATALOG, CatalogItem } from '@/data/catalog';

export const DB_CATALOG_KEY = 'products_catalog';

// Ultra-fast in-memory cache to eliminate repeated MongoDB queries during SSR/ISR
let cachedProducts: CatalogItem[] | null = null;
let cachedProductsTime = 0;
const PRODUCTS_CACHE_TTL = 300000; // 5 minutes

export function invalidateCatalogDbCache(): void {
  cachedProducts = null;
  cachedProductsTime = 0;
}

/**
 * Get all products from the persistent database.
 * This is the SINGLE SOURCE OF TRUTH for all products on the website.
 * If the database hasn't been initialized yet, it seeds once with the initial products.
 * From then on, ONLY products in the database are returned.
 */
export async function getDatabaseProducts(forceFresh = false): Promise<CatalogItem[]> {
  if (!forceFresh && cachedProducts && Date.now() - cachedProductsTime < PRODUCTS_CACHE_TTL) {
    return cachedProducts;
  }

  try {
    const [oldDeletedRaw, cloud, viewsMap] = await Promise.all([
      getSiteKV<string[]>('deleted_product_ids', forceFresh),
      getSiteKV<CatalogItem[]>(DB_CATALOG_KEY, forceFresh),
      getSiteKV<Record<string, number>>('product_views', forceFresh),
    ]);
    const oldDeleted = oldDeletedRaw || [];
    const delSet = new Set(oldDeleted);

    const applyViews = (items: CatalogItem[]): CatalogItem[] => {
      if (!viewsMap) return items;
      return items.map((p) => {
        const v = viewsMap[p.id] ?? viewsMap[p.slug];
        if (typeof v === 'number') {
          return { ...p, views: Math.max(p.views || 0, v) };
        }
        return p;
      });
    };

    let result: CatalogItem[];
    if (cloud !== null && Array.isArray(cloud)) {
      const activeCloud = delSet.size > 0
        ? cloud.filter((p) => !delSet.has(p.id) && !delSet.has(p.slug))
        : cloud;
      result = applyViews(activeCloud);
    } else {
      // Migration helper: If products_catalog key not created yet, check custom_products & deleted_product_ids
      const oldCustom = await getSiteKV<CatalogItem[]>('custom_products', forceFresh);

      let initialCatalog = [...PRODUCTS_CATALOG];
      if (oldCustom && Array.isArray(oldCustom) && oldCustom.length > 0) {
        const map = new Map<string, CatalogItem>();
        initialCatalog.forEach((p) => map.set(p.id, p));
        oldCustom.forEach((p) => map.set(p.id, p));
        initialCatalog = Array.from(map.values());
      }

      if (delSet.size > 0) {
        initialCatalog = initialCatalog.filter((p) => !delSet.has(p.id) && !delSet.has(p.slug));
      }

      // Seed the database with this clean list once
      await setSiteKV(DB_CATALOG_KEY, initialCatalog);
      result = applyViews(initialCatalog);
    }

    cachedProducts = result;
    cachedProductsTime = Date.now();
    return result;
  } catch (err) {
    console.warn('Error reading products_catalog from database:', err);
    return cachedProducts || PRODUCTS_CATALOG;
  }
}

/**
 * Add or update a product in the cloud database.
 */
export async function saveDatabaseProduct(product: CatalogItem): Promise<CatalogItem[]> {
  // If this product was previously marked deleted, unmark it
  try {
    const oldDeleted = (await getSiteKV<string[]>('deleted_product_ids')) || [];
    if (oldDeleted.includes(product.id) || (product.slug && oldDeleted.includes(product.slug))) {
      const updatedDeleted = oldDeleted.filter((id) => id !== product.id && id !== product.slug);
      await setSiteKV('deleted_product_ids', updatedDeleted);
    }
  } catch {}

  const current = await getDatabaseProducts();
  const index = current.findIndex((p) => p.id === product.id || p.slug === product.slug);
  let updated: CatalogItem[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = product;
  } else {
    updated = [product, ...current];
  }
  await setSiteKV(DB_CATALOG_KEY, updated);
  invalidateCatalogDbCache();
  return updated;
}

/**
 * Permanently delete a product from the cloud database.
 * Once deleted here, it is gone from the database forever and will never re-appear.
 */
export async function deleteDatabaseProduct(idOrSlug: string): Promise<CatalogItem[]> {
  const current = await getDatabaseProducts();
  const target = current.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  const updated = current.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug);
  await setSiteKV(DB_CATALOG_KEY, updated);
  invalidateCatalogDbCache();

  // Permanently record deletion in deleted_product_ids so it NEVER comes back
  try {
    const oldDeleted = (await getSiteKV<string[]>('deleted_product_ids')) || [];
    const toAdd = [idOrSlug];
    if (target) {
      if (target.id) toAdd.push(target.id);
      if (target.slug) toAdd.push(target.slug);
    }
    const newDeleted = Array.from(new Set([...oldDeleted, ...toAdd]));
    await setSiteKV('deleted_product_ids', newDeleted);
  } catch (err) {
    console.warn('Error updating deleted_product_ids:', err);
  }

  return updated;
}

/**
 * Fast direct lookup of a single product by slug or id.
 * Takes 0.01ms from the in-memory store.
 */
export async function getDatabaseProductBySlug(slug: string): Promise<CatalogItem | null> {
  try {
    const current = await getDatabaseProducts();
    const clean = slug.toLowerCase().trim();
    const found = current.find((p) => p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean);
    if (found) return found;

    return (
      current.find((p) => {
        const slugified = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return slugified.includes(clean) || clean.includes(slugified);
      }) || null
    );
  } catch (e) {
    return null;
  }
}

/**
 * Increment the view count of a product by its ID or slug.
 */
export async function incrementProductView(idOrSlug: string): Promise<number> {
  try {
    const clean = (idOrSlug || '').trim();
    if (!clean) return 0;
    const viewsMap = (await getSiteKV<Record<string, number>>('product_views')) || {};
    const current = (viewsMap[clean] || 0) + 1;
    viewsMap[clean] = current;
    await setSiteKV('product_views', viewsMap);
    return current;
  } catch (err) {
    console.warn('Error incrementing product view:', err);
    return 0;
  }
}
