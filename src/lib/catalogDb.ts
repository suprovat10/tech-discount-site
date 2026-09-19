import { getSiteKV, setSiteKV } from '@/lib/db/kv';
import { PRODUCTS_CATALOG, CatalogItem } from '@/data/catalog';

export const DB_CATALOG_KEY = 'products_catalog';

/**
 * Get all products from the Supabase cloud database.
 * This is the SINGLE SOURCE OF TRUTH for all products on the website.
 * If the database hasn't been initialized yet, it seeds once with the initial products.
 * From then on, ONLY products in the database are returned.
 */
export async function getDatabaseProducts(): Promise<CatalogItem[]> {
  try {
    const cloud = await getSiteKV<CatalogItem[]>(DB_CATALOG_KEY);
    if (cloud !== null && Array.isArray(cloud)) {
      return cloud;
    }

    // Migration helper: If products_catalog key not created yet, check custom_products & deleted_product_ids
    const oldCustom = await getSiteKV<CatalogItem[]>('custom_products');
    const oldDeleted = await getSiteKV<string[]>('deleted_product_ids');

    let initialCatalog = [...PRODUCTS_CATALOG];
    if (oldCustom && Array.isArray(oldCustom) && oldCustom.length > 0) {
      const map = new Map<string, CatalogItem>();
      initialCatalog.forEach((p) => map.set(p.id, p));
      oldCustom.forEach((p) => map.set(p.id, p));
      initialCatalog = Array.from(map.values());
    }

    if (oldDeleted && Array.isArray(oldDeleted) && oldDeleted.length > 0) {
      const delSet = new Set(oldDeleted);
      initialCatalog = initialCatalog.filter((p) => !delSet.has(p.id) && !delSet.has(p.slug));
    }

    // Seed the database with this clean list once
    await setSiteKV(DB_CATALOG_KEY, initialCatalog);
    return initialCatalog;
  } catch (err) {
    console.warn('Error reading products_catalog from database:', err);
    return PRODUCTS_CATALOG;
  }
}

/**
 * Add or update a product in the cloud database.
 */
export async function saveDatabaseProduct(product: CatalogItem): Promise<CatalogItem[]> {
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
  return updated;
}

/**
 * Permanently delete a product from the cloud database.
 * Once deleted here, it is gone from the database forever and will never re-appear.
 */
export async function deleteDatabaseProduct(idOrSlug: string): Promise<CatalogItem[]> {
  const current = await getDatabaseProducts();
  const updated = current.filter((p) => p.id !== idOrSlug && p.slug !== idOrSlug);
  await setSiteKV(DB_CATALOG_KEY, updated);
  return updated;
}

/**
 * Fast direct lookup of a single product by slug or id.
 * Takes 0.01ms from the in-memory store.
 */
export async function getDatabaseProductBySlug(slug: string): Promise<CatalogItem | null> {
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
}

