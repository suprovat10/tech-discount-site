import { BrandItem, DEFAULT_BRANDS } from '@/data/brands';
export type { BrandItem } from '@/data/brands';
import { getCatalogProducts } from './catalogStore';

const STORAGE_KEY = 'smarttech_brands_list';

export function getBrands(): BrandItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_BRANDS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    }
  } catch (e) {
    console.error('Failed to read brands from localStorage:', e);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRANDS));
  } catch (e) {
    console.error('Failed to initialize brands in localStorage:', e);
  }
  return DEFAULT_BRANDS;
}

export function saveBrands(brands: BrandItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
    window.dispatchEvent(new Event('smarttech_brands_updated'));
  } catch (e) {
    console.error('Failed to save brands to localStorage:', e);
  }
}

export function getBrandBySlug(slug: string): BrandItem | undefined {
  const brands = getBrands();
  const cleanSlug = slug.toLowerCase().trim();
  return brands.find(
    (b) => b.slug.toLowerCase() === cleanSlug || b.name.toLowerCase() === cleanSlug
  );
}

export function upsertBrand(brand: BrandItem): void {
  const brands = getBrands();
  const index = brands.findIndex((b) => b.id === brand.id || b.slug === brand.slug);
  let updated: BrandItem[];
  if (index >= 0) {
    updated = [...brands];
    updated[index] = { ...updated[index], ...brand };
  } else {
    const nextOrder = brands.length > 0 ? Math.max(...brands.map((b) => b.order || 0)) + 1 : 1;
    updated = [...brands, { ...brand, order: brand.order || nextOrder }];
  }
  saveBrands(updated);
}

export function deleteBrand(id: string): void {
  const brands = getBrands();
  const filtered = brands.filter((b) => b.id !== id);
  saveBrands(filtered);
}

export function moveBrand(id: string, direction: 'up' | 'down'): BrandItem[] {
  const brands = getBrands();
  const index = brands.findIndex((b) => b.id === id);
  if (index < 0) return brands;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= brands.length) return brands;

  const reordered = [...brands];
  const temp = reordered[index];
  reordered[index] = reordered[targetIndex];
  reordered[targetIndex] = temp;

  // reassign sequence orders
  const updated = reordered.map((b, idx) => ({ ...b, order: idx + 1 }));
  saveBrands(updated);
  return updated;
}

export function getBrandProductCount(brandName: string): number {
  try {
    const products = getCatalogProducts();
    const cleanName = brandName.toLowerCase().trim();
    return products.filter((p) => p.brand && p.brand.toLowerCase().trim() === cleanName).length;
  } catch {
    return 0;
  }
}
