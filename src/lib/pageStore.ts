import { DEFAULT_PAGES, SitePage } from '@/data/defaultPages';

const PAGES_STORAGE_KEY = 'smarttech_site_pages';
let isInitialPagesFetchTriggered = false;


/**
 * Sync fresh pages from server/database into client localStorage
 */
export async function fetchAndSyncPagesFromServer(): Promise<SitePage[]> {
  if (typeof window === 'undefined') return DEFAULT_PAGES;
  try {
    const res = await fetch('/api/pages', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(json.data));
        window.dispatchEvent(new CustomEvent('smarttech_pages_updated'));
        return json.data;
      }
    }
  } catch (e) {
    console.warn('Could not sync pages from server:', e);
  }
  return getPages();
}

/**
 * Get all site pages from localStorage or fallback to DEFAULT_PAGES.
 * Automatically triggers background server sync on client load so all devices get the latest data.
 */
export function getPages(): SitePage[] {
  if (typeof window === 'undefined') {
    return DEFAULT_PAGES;
  }

  // Trigger background server sync once per page session when browser is idle
  if (!isInitialPagesFetchTriggered) {
    isInitialPagesFetchTriggered = true;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        fetchAndSyncPagesFromServer().catch(() => {});
      }, { timeout: 4000 });
    } else if (typeof window !== 'undefined') {
      setTimeout(() => {
        fetchAndSyncPagesFromServer().catch(() => {});
      }, 2000);
    }
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
 * Save or update a page and sync to server / database
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

    // Sync to server API in background
    fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    }).catch((err) => console.warn('Background page save sync failed:', err));
  } catch (e) {
    console.error('Error saving page:', e);
  }
}

/**
 * Delete a custom (non-system) page and sync to server / database
 */
export function deletePage(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const pages = getPages();
    const updated = pages.filter((p) => p.id !== id || p.isSystem);
    localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('smarttech_pages_updated'));

    // Sync deletion to server API
    fetch(`/api/pages?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Background page delete sync failed:', err));
  } catch (e) {
    console.error('Error deleting page:', e);
  }
}

/**
 * Reset all pages to initial default content and sync to server
 */
export function resetPagesToDefault(): SitePage[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(DEFAULT_PAGES));
      window.dispatchEvent(new CustomEvent('smarttech_pages_updated'));

      fetch('/api/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: DEFAULT_PAGES }),
      }).catch((err) => console.warn('Background page reset sync failed:', err));
    } catch (e) {
      console.error('Error resetting pages:', e);
    }
  }
  return DEFAULT_PAGES;
}
