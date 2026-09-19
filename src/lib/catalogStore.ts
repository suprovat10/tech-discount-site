import { PRODUCTS_CATALOG, CatalogItem } from '@/data/catalog';

export type { CatalogItem };

const STORAGE_KEY = 'smarttech_products_catalog';

/**
 * Get all catalog products from localStorage if available, otherwise from PRODUCTS_CATALOG
 */
export function getCatalogProducts(): CatalogItem[] {
  if (typeof window === 'undefined') {
    return PRODUCTS_CATALOG;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading catalog from localStorage:', e);
  }
  return PRODUCTS_CATALOG;
}

/**
 * Fetch latest active catalog from server/Supabase
 */
export async function fetchCatalogFromServer(): Promise<CatalogItem[]> {
  try {
    const res = await fetch('/api/products?format=catalog');
    if (res.ok) {
      const data = await res.json();
      if (data.catalog && Array.isArray(data.catalog)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.catalog));
        }
        return data.catalog;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch catalog from server:', e);
  }
  return getCatalogProducts();
}

/**
 * Reset localStorage catalog back to full default PRODUCTS_CATALOG
 */
export function resetCatalogToDefault(): CatalogItem[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTS_CATALOG));
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
  const products = getCatalogProducts();
  const index = products.findIndex((p) => p.id === product.id || p.slug === product.slug);
  if (index >= 0) {
    products.splice(index, 1);
    products.unshift(product);
  } else {
    products.unshift(product);
  }
  saveCatalogProducts(products);
  syncToServerUpsert(product);
}

/**
 * Delete product by id or slug
 */
export function deleteCatalogProduct(id: string): void {
  const products = getCatalogProducts();
  const filtered = products.filter((p) => p.id !== id && p.slug !== id);
  saveCatalogProducts(filtered);
  syncToServerDelete(id);
}

/**
 * Clear all sample catalog products permanently
 */
export async function clearAllCatalogProducts(): Promise<void> {
  saveCatalogProducts([]);
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/products?clearAll=true', { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to clear catalog on server:', e);
    }
  }
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

