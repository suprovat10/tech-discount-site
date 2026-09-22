import { DEFAULT_BRANDS, BrandItem } from '@/data/brands';
import { getSiteKV } from '@/lib/db/kv';

let cachedBrands: BrandItem[] | null = null;
let lastBrandsFetch = 0;
const BRANDS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateBrandServerCache(): void {
  cachedBrands = null;
  lastBrandsFetch = 0;
}

/**
 * Get all brands from MongoDB Atlas / site_kv (with fallback to DEFAULT_BRANDS).
 * Server-side single source of truth for brands.
 */
export async function getDatabaseBrands(forceFresh = false): Promise<BrandItem[]> {
  if (!forceFresh && cachedBrands && Date.now() - lastBrandsFetch < BRANDS_CACHE_TTL) {
    return cachedBrands;
  }
  try {
    const cloud = await getSiteKV<BrandItem[]>('brands_catalog', forceFresh);
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      cachedBrands = cloud;
      lastBrandsFetch = Date.now();
      return cloud;
    }
  } catch (err) {
    console.warn('Error loading brands from database:', err);
  }
  return [...DEFAULT_BRANDS];
}
