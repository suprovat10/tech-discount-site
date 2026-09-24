import { CatalogItem } from '@/data/catalog';

const STORAGE_KEY = 'smarttech_products_catalog';
const DELETED_KEY = 'smarttech_deleted_product_ids';

let isInitialCatalogFetchTriggered = false;

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
 * Get all catalog products from localStorage if available, otherwise empty array and trigger server sync
 */
export function getCatalogProducts(): CatalogItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  // Trigger background server sync after page is idle — avoids TBT spike during load
  if (!isInitialCatalogFetchTriggered) {
    isInitialCatalogFetchTriggered = true;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
        () => fetchAndSyncCatalogFromServer().catch(() => {}),
        { timeout: 3000 }
      );
    } else {
      setTimeout(() => fetchAndSyncCatalogFromServer().catch(() => {}), 2000);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const deleted = getDeletedProductIds();
        if (deleted.size > 0) {
          return parsed.filter((p) => !deleted.has(p.id) && !deleted.has(p.slug));
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading catalog from localStorage:', e);
  }

  return [];
}

/**
 * Sync fresh catalog items from server/cloud database into localStorage
 */
export async function fetchAndSyncCatalogFromServer(): Promise<CatalogItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/products?rawCatalog=true', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const deleted = getDeletedProductIds();

        // If the browser has deleted IDs that still exist in the server database,
        // automatically sync the deletion to the server so MongoDB deletes them too!
        if (deleted.size > 0) {
          const toDeleteOnServer = json.data.filter(
            (p: CatalogItem) => deleted.has(p.id) || (p.slug && deleted.has(p.slug))
          );
          if (toDeleteOnServer.length > 0) {
            for (const item of toDeleteOnServer) {
              fetch(`/api/products?id=${encodeURIComponent(item.id)}`, { method: 'DELETE', credentials: 'include' }).catch(() => {});
            }
          }
        }

        const filtered = deleted.size > 0
          ? json.data.filter((p: CatalogItem) => !deleted.has(p.id) && !deleted.has(p.slug))
          : json.data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new Event('smarttech_catalog_updated'));
        return filtered;
      }
    }
  } catch (e) {
    console.warn('Could not sync catalog from server:', e);
  }
  return getCatalogProducts();
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

/**
 * Get single product by id or slug from local memory
 */
export function getCatalogProductByIdOrSlug(idOrSlug: string): CatalogItem | undefined {
  const products = getCatalogProducts();
  return products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

/**
 * Fetch product by id or slug from database if not found in local memory
 */
export async function fetchProductByIdOrSlug(idOrSlug: string): Promise<CatalogItem | undefined> {
  const local = getCatalogProductByIdOrSlug(idOrSlug);
  if (local) return local;

  const fresh = await fetchAndSyncCatalogFromServer();
  return fresh.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

/**
 * Add or update product in catalog and persist immediately to database
 */
export async function upsertCatalogProduct(product: CatalogItem): Promise<boolean> {
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

  if (typeof window === 'undefined') return true;

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(product),
    });
    return res.ok;
  } catch (e) {
    console.warn('Server sync failed:', e);
    return false;
  }
}

/**
 * Bulk import/upsert multiple products in catalog and persist to cloud database
 */
export async function bulkUpsertCatalogProducts(incoming: CatalogItem[]): Promise<{ success: boolean; count: number }> {
  if (!incoming || incoming.length === 0) {
    return { success: true, count: 0 };
  }

  incoming.forEach((p) => {
    unmarkProductDeleted(p.id);
    if (p.slug) unmarkProductDeleted(p.slug);
  });

  const current = getCatalogProducts();
  const productList = [...current];

  incoming.forEach((newProd) => {
    const index = productList.findIndex((p) => p.id === newProd.id || p.slug === newProd.slug);
    if (index >= 0) {
      productList[index] = newProd;
    } else {
      productList.unshift(newProd);
    }
  });

  saveCatalogProducts(productList);

  if (typeof window === 'undefined') {
    return { success: true, count: incoming.length };
  }

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(incoming),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, count: data.count || incoming.length };
    }
    return { success: false, count: 0 };
  } catch (e) {
    console.warn('Server bulk import failed:', e);
    return { success: false, count: 0 };
  }
}

/**
 * Delete product by id and remove immediately from database
 */
export async function deleteCatalogProduct(id: string): Promise<boolean> {
  markProductDeleted(id);
  const products = getCatalogProducts();
  const target = products.find((p) => p.id === id || p.slug === id);
  if (target) {
    if (target.id) markProductDeleted(target.id);
    if (target.slug) markProductDeleted(target.slug);
  }
  const filtered = products.filter((p) => p.id !== id && p.slug !== id);
  saveCatalogProducts(filtered);

  if (typeof window === 'undefined') return true;

  try {
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  } catch (e) {
    console.warn('Server sync delete failed:', e);
    return false;
  }
}

/**
 * Duplicate (copy) product by id
 */
export async function duplicateCatalogProduct(id: string): Promise<CatalogItem | null> {
  let products = getCatalogProducts();
  let source = products.find((p) => p.id === id);
  if (!source) {
    const fresh = await fetchAndSyncCatalogFromServer();
    source = fresh.find((p) => p.id === id);
    products = fresh;
  }
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

  await upsertCatalogProduct(cloned);
  return cloned;
}

/**
 * Reorder products catalog in localStorage and sync with server
 */
export async function saveReorderedCatalogProducts(products: CatalogItem[]): Promise<boolean> {
  saveCatalogProducts(products);
  if (typeof window === 'undefined') return true;
  try {
    const res = await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productIds: products.map((p) => p.id) }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Background products reorder server sync failed:', err);
    return false;
  }
}

/**
 * Move product up or down in catalog
 */
export async function moveCatalogProduct(id: string, direction: 'up' | 'down'): Promise<CatalogItem[]> {
  const current = getCatalogProducts();
  const index = current.findIndex((p) => p.id === id);
  if (index < 0) return current;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= current.length) return current;

  const reordered = [...current];
  const temp = reordered[index];
  reordered[index] = reordered[targetIndex];
  reordered[targetIndex] = temp;

  saveCatalogProducts(reordered);
  await saveReorderedCatalogProducts(reordered);
  return reordered;
}
