import { PRODUCTS_CATALOG, CatalogItem } from '@/data/catalog';

const STORAGE_KEY = 'smarttech_products_catalog';
const DELETED_KEY = 'smarttech_deleted_product_ids';

export function getDeletedProductIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

export function markProductDeleted(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedProductIds();
    set.add(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function unmarkProductDeleted(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedProductIds();
    set.delete(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

/**
 * Get all catalog products from localStorage if available, otherwise from PRODUCTS_CATALOG
 */
export function getCatalogProducts(): CatalogItem[] {
  if (typeof window === 'undefined') {
    return PRODUCTS_CATALOG;
  }
  const deletedSet = getDeletedProductIds();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((p: any) => !deletedSet.has(p.id) && !deletedSet.has(p.slug));
      }
    }
  } catch (e) {
    console.error('Error reading catalog from localStorage:', e);
  }

  const baseline = PRODUCTS_CATALOG.filter((p) => !deletedSet.has(p.id) && !deletedSet.has(p.slug));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(baseline));
  } catch (e) {
    console.error('Error initializing catalog in localStorage:', e);
  }
  return baseline;
}

/**
 * Sync fresh catalog items from server/cloud database into localStorage
 */
export async function fetchAndSyncCatalogFromServer(): Promise<CatalogItem[]> {
  if (typeof window === 'undefined') return PRODUCTS_CATALOG;
  try {
    const res = await fetch('/api/products?rawCatalog=true', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        saveCatalogProducts(json.data);
        return json.data;
      }
    }
  } catch (e) {
    console.warn('Could not sync catalog from server:', e);
  }
  return getCatalogProducts();
}

/**
 * Reset localStorage catalog back to full default PRODUCTS_CATALOG
 */
export function resetCatalogToDefault(): CatalogItem[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(DELETED_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS_CATALOG));
      window.dispatchEvent(new Event('smarttech_catalog_updated'));
    } catch (e) {
      console.error('Error resetting catalog in localStorage:', e);
    }
  }
  return PRODUCTS_CATALOG;
}

/**
 * Save products catalog to localStorage
 */
export function saveCatalogProducts(products: CatalogItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('smarttech_catalog_updated'));
  } catch (e) {
    console.error('Error saving catalog to localStorage:', e);
  }
}

async function syncToServerUpsert(product: CatalogItem) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  } catch (e) {
    console.warn('Server sync skipped/failed:', e);
  }
}

async function syncToServerDelete(id: string) {
  if (typeof window === 'undefined') return;
  try {
    await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Server sync delete failed:', e);
  }
}

/**
 * Get single product by id or slug
 */
export function getCatalogProductByIdOrSlug(idOrSlug: string): CatalogItem | undefined {
  const products = getCatalogProducts();
  return products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

/**
 * Add or update product in catalog
 */
export function upsertCatalogProduct(product: CatalogItem): void {
  unmarkProductDeleted(product.id);
  if (product.slug) unmarkProductDeleted(product.slug);

  const products = getCatalogProducts();
  const index = products.findIndex((p) => p.id === product.id || p.slug === product.slug);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.unshift(product);
  }
  saveCatalogProducts(products);
  syncToServerUpsert(product);
}

/**
 * Delete product by id
 */
export function deleteCatalogProduct(id: string): void {
  markProductDeleted(id);
  const products = getCatalogProducts();
  const filtered = products.filter((p) => p.id !== id && p.slug !== id);
  saveCatalogProducts(filtered);
  syncToServerDelete(id);
}

/**
 * Duplicate (copy) product by id
 */
export function duplicateCatalogProduct(id: string): CatalogItem | null {
  const products = getCatalogProducts();
  const source = products.find((p) => p.id === id);
  if (!source) return null;

  const newId = `prod-${Date.now()}`;
  const newSlug = `${source.slug}-copy-${Math.floor(Math.random() * 1000)}`;
  const cloned: CatalogItem = {
    ...source,
    id: newId,
    slug: newSlug,
    title: `${source.title} (Copy)`,
    badge: 'Duplicate / Draft',
  };

  products.unshift(cloned);
  saveCatalogProducts(products);
  syncToServerUpsert(cloned);
  return cloned;
}

