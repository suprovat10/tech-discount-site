import { CATEGORIES as DEFAULT_CATEGORIES, CategoryDefinition } from '@/data/catalog';
import { getSiteKV } from '@/lib/db/kv';

let cachedCategories: CategoryDefinition[] | null = null;
let cachedCategoriesTime = 0;
const CATEGORIES_CACHE_TTL = 300000; // 5 minutes

export function invalidateCategoryCache(): void {
  cachedCategories = null;
  cachedCategoriesTime = 0;
}

/**
 * Get all categories from MongoDB Atlas (with fallback to DEFAULT_CATEGORIES).
 * Server-side single source of truth for categories.
 */
export async function getDatabaseCategories(forceFresh = false): Promise<CategoryDefinition[]> {
  if (!forceFresh && cachedCategories && Date.now() - cachedCategoriesTime < CATEGORIES_CACHE_TTL) {
    return cachedCategories;
  }

  try {
    const cloud = await getSiteKV<CategoryDefinition[]>('categories_catalog', forceFresh);
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      cachedCategories = cloud;
      cachedCategoriesTime = Date.now();
      return cloud;
    }
  } catch (err) {
    console.warn('Error loading categories from database:', err);
  }
  return [...DEFAULT_CATEGORIES];
}

