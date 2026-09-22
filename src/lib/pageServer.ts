import { DEFAULT_PAGES, SitePage } from '@/data/defaultPages';
import { getSiteKV } from '@/lib/db/kv';

let cachedPages: SitePage[] | null = null;
let lastPagesFetch = 0;
const PAGES_CACHE_TTL = 5 * 60 * 1000;

export function invalidatePageServerCache(): void {
  cachedPages = null;
  lastPagesFetch = 0;
}

/**
 * Get all site pages from MongoDB Atlas (with fallback to DEFAULT_PAGES).
 * Server-side source of truth.
 */
export async function getDatabasePages(forceFresh = false): Promise<SitePage[]> {
  if (!forceFresh && cachedPages && Date.now() - lastPagesFetch < PAGES_CACHE_TTL) {
    return cachedPages;
  }
  try {
    const cloud = await getSiteKV<SitePage[]>('site_pages', forceFresh);
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      cachedPages = cloud;
      lastPagesFetch = Date.now();
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
