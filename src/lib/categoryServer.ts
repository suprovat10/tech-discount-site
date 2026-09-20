import { CATEGORIES as DEFAULT_CATEGORIES, CategoryDefinition } from '@/data/catalog';
import { getSiteKV } from '@/lib/db/kv';

/**
 * Get all categories from MongoDB Atlas (with fallback to DEFAULT_CATEGORIES).
 * Server-side single source of truth for categories.
 */
export async function getDatabaseCategories(): Promise<CategoryDefinition[]> {
  try {
    const cloud = await getSiteKV<CategoryDefinition[]>('categories_catalog');
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      return cloud;
    }
  } catch (err) {
    console.warn('Error loading categories from database:', err);
  }
  return [...DEFAULT_CATEGORIES];
}
