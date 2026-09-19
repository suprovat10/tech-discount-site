import { DEFAULT_PAGES, SitePage } from '@/data/defaultPages';

const PAGES_STORAGE_KEY = 'smarttech_site_pages';

/**
 * Get all site pages from localStorage or fallback to DEFAULT_PAGES
 */
export function getPages(): SitePage[] {
  if (typeof window === 'undefined') {
    return DEFAULT_PAGES;
  }
  try {
    const raw = localStorage.getItem(PAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all system default pages are present
        const parsedIds = new Set(parsed.map((p: SitePage) => p.id));
        const missing = DEFAULT_PAGES.filter((p) => !parsedIds.has(p.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading pages from localStorage:', e);
  }
  try {
    localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(DEFAULT_PAGES));
  } catch (e) {
    console.error('Error initializing pages in localStorage:', e);
  }
  return DEFAULT_PAGES;
}

/**
 * Get a single page by its slug (e.g. 'about', 'contact', etc.)
 */
export function getPageBySlug(slug: string): SitePage | undefined {
  const pages = getPages();
  const cleanSlug = slug.toLowerCase().trim().replace(/^\/+|\/+$/g, '');
  return pages.find((p) => p.slug.toLowerCase().trim() === cleanSlug);
}

/**
 * Save or update a page
 */
export function savePage(page: SitePage): void {
  if (typeof window === 'undefined') return;
  try {
    const pages = getPages();
    const index = pages.findIndex((p) => p.id === page.id);
    let updated: SitePage[];
    if (index >= 0) {
      updated = [...pages];
      updated[index] = { ...page, lastUpdated: new Date().toISOString().split('T')[0] };
    } else {
      updated = [...pages, { ...page, lastUpdated: new Date().toISOString().split('T')[0] }];
    }
    localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('smarttech_pages_updated', { detail: page }));
  } catch (e) {
    console.error('Error saving page:', e);
  }
}

/**
 * Delete a custom (non-system) page
 */
export function deletePage(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const pages = getPages();
    const updated = pages.filter((p) => p.id !== id || p.isSystem);
    localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('smarttech_pages_updated'));
  } catch (e) {
    console.error('Error deleting page:', e);
  }
}

/**
 * Reset all pages to initial default content
 */
export function resetPagesToDefault(): SitePage[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(DEFAULT_PAGES));
      window.dispatchEvent(new CustomEvent('smarttech_pages_updated'));
    } catch (e) {
      console.error('Error resetting pages:', e);
    }
  }
  return DEFAULT_PAGES;
}
