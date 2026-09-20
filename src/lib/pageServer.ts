import { DEFAULT_PAGES, SitePage } from '@/data/defaultPages';
import { getSiteKV } from '@/lib/db/kv';

/**
 * Get all site pages from MongoDB Atlas (with fallback to DEFAULT_PAGES).
 * Server-side source of truth.
 */
export async function getDatabasePages(): Promise<SitePage[]> {
  try {
    const cloud = await getSiteKV<SitePage[]>('site_pages');
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      return cloud;
    }
  } catch (err) {
    console.warn('Error loading pages from database:', err);
  }
  return [...DEFAULT_PAGES];
}

/**
 * Get a single page by slug directly from MongoDB Atlas.
 */
export async function getDatabasePageBySlug(slug: string): Promise<SitePage | null> {
  const pages = await getDatabasePages();
  const cleanSlug = slug.toLowerCase().trim().replace(/^\/+|\/+$/g, '');
  return pages.find((p) => p.slug.toLowerCase().trim() === cleanSlug) || null;
}
