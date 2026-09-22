import { ProductTag } from '@/types/tag';

export const PRODUCT_TAGS_UPDATED_EVENT = 'smarttech_product_tags_updated';
const PRODUCT_TAGS_STORAGE_KEY = 'smarttech_product_tags';

export function slugifyTag(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fetch and sync product tags from server / API into client localStorage
 */
export async function fetchAndSyncProductTagsFromServer(): Promise<ProductTag[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/tags', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem(PRODUCT_TAGS_STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent(PRODUCT_TAGS_UPDATED_EVENT));
        return data;
      }
    }
  } catch (err) {
    console.warn('Could not sync product tags from server:', err);
  }
  return getProductTags();
}

/**
 * Get product tags from localStorage with fallback
 */
export function getProductTags(): ProductTag[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRODUCT_TAGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading product tags from localStorage:', e);
  }
  return [];
}

/**
 * Save product tag to API and localStorage
 */
export async function saveProductTag(tag: Partial<ProductTag>): Promise<ProductTag[]> {
  const prepared: ProductTag = {
    id: tag.id || `tag-${Date.now()}`,
    name: tag.name || '',
    slug: tag.slug ? slugifyTag(tag.slug) : slugifyTag(tag.name || ''),
    description: tag.description || '',
    richDescription: tag.richDescription || tag.description || '',
    featured: Boolean(tag.featured),
    seo: tag.seo || undefined,
  };

  try {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prepared),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.allTags && Array.isArray(data.allTags)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(PRODUCT_TAGS_STORAGE_KEY, JSON.stringify(data.allTags));
          window.dispatchEvent(new CustomEvent(PRODUCT_TAGS_UPDATED_EVENT));
        }
        return data.allTags;
      }
    }
  } catch (err) {
    console.error('Error saving product tag:', err);
  }

  // Fallback local update
  const current = getProductTags();
  const idx = current.findIndex((t) => t.id === prepared.id || t.slug === prepared.slug);
  const updated = idx >= 0 ? [...current] : [prepared, ...current];
  if (idx >= 0) updated[idx] = prepared;
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRODUCT_TAGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(PRODUCT_TAGS_UPDATED_EVENT));
  }
  return updated;
}

/**
 * Delete product tag by ID or slug
 */
export async function deleteProductTag(idOrSlug: string): Promise<ProductTag[]> {
  try {
    const res = await fetch(`/api/tags?id=${encodeURIComponent(idOrSlug)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.allTags && Array.isArray(data.allTags)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(PRODUCT_TAGS_STORAGE_KEY, JSON.stringify(data.allTags));
          window.dispatchEvent(new CustomEvent(PRODUCT_TAGS_UPDATED_EVENT));
        }
        return data.allTags;
      }
    }
  } catch (err) {
    console.error('Error deleting product tag:', err);
  }

  const current = getProductTags();
  const updated = current.filter((t) => t.id !== idOrSlug && t.slug !== idOrSlug);
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRODUCT_TAGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(PRODUCT_TAGS_UPDATED_EVENT));
  }
  return updated;
}
