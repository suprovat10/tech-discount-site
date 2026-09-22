import { ProductTag } from '@/types/tag';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const DB_PRODUCT_TAGS_KEY = 'site_product_tags';

function getFs(): any {
  if (typeof window === 'undefined') {
    try {
      return eval('require')('fs');
    } catch {
      return null;
    }
  }
  return null;
}

function getPath(): any {
  if (typeof window === 'undefined') {
    try {
      return eval('require')('path');
    } catch {
      return null;
    }
  }
  return null;
}

function getInitialTagsFromFile(): ProductTag[] {
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'tags.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error reading tags.json:', err);
    }
  }
  return [];
}

let memoryProductTagsCache: { data: ProductTag[]; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

export function invalidateProductTagsCache(): void {
  memoryProductTagsCache = null;
}

/**
 * Get all product tags from MongoDB / site_kv with disk fallback and in-memory cache
 */
export async function getServerProductTags(): Promise<ProductTag[]> {
  const now = Date.now();
  if (memoryProductTagsCache && now - memoryProductTagsCache.timestamp < CACHE_TTL) {
    return memoryProductTagsCache.data;
  }

  try {
    const cloud = await getSiteKV<ProductTag[]>(DB_PRODUCT_TAGS_KEY);
    if (cloud !== null && Array.isArray(cloud)) {
      memoryProductTagsCache = { data: cloud, timestamp: now };
      return cloud;
    }

    // Seed initial tags to cloud database
    const initialTags = getInitialTagsFromFile();
    if (initialTags.length > 0) {
      await setSiteKV(DB_PRODUCT_TAGS_KEY, initialTags);
    }
    memoryProductTagsCache = { data: initialTags, timestamp: now };
    return initialTags;
  } catch (err) {
    console.warn('Error reading site_product_tags from database:', err);
    return memoryProductTagsCache ? memoryProductTagsCache.data : getInitialTagsFromFile();
  }
}

export const getProductTagsServer = getServerProductTags;

/**
 * Save or update a product tag item in MongoDB / site_kv
 */
export async function saveServerProductTag(tag: ProductTag): Promise<ProductTag[]> {
  const current = await getServerProductTags();
  const index = current.findIndex((t) => t.id === tag.id || t.slug === tag.slug);
  const nowIso = new Date().toISOString();

  const prepared: ProductTag = {
    ...tag,
    updatedAt: nowIso,
    createdAt: tag.createdAt || nowIso,
  };

  let updated: ProductTag[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = prepared;
  } else {
    updated = [prepared, ...current];
  }

  await setSiteKV(DB_PRODUCT_TAGS_KEY, updated);
  memoryProductTagsCache = { data: updated, timestamp: Date.now() };

  // Sync to local tags.json
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'tags.json');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  }

  return updated;
}

/**
 * Delete a product tag by ID or slug
 */
export async function deleteServerProductTag(idOrSlug: string): Promise<ProductTag[]> {
  const current = await getServerProductTags();
  const updated = current.filter((t) => t.id !== idOrSlug && t.slug !== idOrSlug);
  await setSiteKV(DB_PRODUCT_TAGS_KEY, updated);
  memoryProductTagsCache = { data: updated, timestamp: Date.now() };

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'tags.json');
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  }

  return updated;
}
