import { PopupItem } from '@/types/popup';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const DB_POPUPS_KEY = 'site_popups';

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

function getInitialPopupsFromFile(): PopupItem[] {
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'popups.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error reading popups.json:', err);
    }
  }
  return [];
}

let memoryPopupsCache: { data: PopupItem[]; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Invalidate server-side popups memory cache
 */
export function invalidatePopupsCache(): void {
  memoryPopupsCache = null;
}

/**
 * Get all popups from MongoDB Atlas / site_kv with disk fallback and in-memory cache
 */
export async function getServerPopups(): Promise<PopupItem[]> {
  const now = Date.now();
  if (memoryPopupsCache && now - memoryPopupsCache.timestamp < CACHE_TTL) {
    return memoryPopupsCache.data;
  }

  try {
    const cloud = await getSiteKV<PopupItem[]>(DB_POPUPS_KEY);
    if (cloud !== null && Array.isArray(cloud)) {
      memoryPopupsCache = { data: cloud, timestamp: now };
      return cloud;
    }

    // Seed initial popups to cloud database
    const initial = getInitialPopupsFromFile();
    if (initial.length > 0) {
      await setSiteKV(DB_POPUPS_KEY, initial);
    }
    memoryPopupsCache = { data: initial, timestamp: now };
    return initial;
  } catch (err) {
    console.warn('Error reading site_popups from database:', err);
    return memoryPopupsCache ? memoryPopupsCache.data : getInitialPopupsFromFile();
  }
}

/**
 * Save or update a popup item in MongoDB Atlas / site_kv and disk
 */
export async function saveServerPopup(popup: PopupItem): Promise<PopupItem[]> {
  const current = await getServerPopups();
  const index = current.findIndex((p) => p.id === popup.id);
  const nowIso = new Date().toISOString();

  const prepared: PopupItem = {
    ...popup,
    updatedAt: nowIso,
    createdAt: popup.createdAt || nowIso,
  };

  let updated: PopupItem[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = prepared;
  } else {
    updated = [prepared, ...current];
  }

  await setSiteKV(DB_POPUPS_KEY, updated);
  memoryPopupsCache = { data: updated, timestamp: Date.now() };

  // Sync to local popups.json
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'popups.json');
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
 * Delete a popup by ID
 */
export async function deleteServerPopup(id: string): Promise<PopupItem[]> {
  const current = await getServerPopups();
  const updated = current.filter((p) => p.id !== id);
  await setSiteKV(DB_POPUPS_KEY, updated);
  memoryPopupsCache = { data: updated, timestamp: Date.now() };

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'popups.json');
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  }

  return updated;
}

/**
 * Check if a popup matches the requested browser path
 */
export function isPopupMatchingPath(popup: PopupItem, pathname: string): boolean {
  if (!popup.enabled) return false;

  const cleanPath = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';

  switch (popup.targetPage) {
    case 'all':
      return true;
    case 'home':
      return cleanPath === '/' || cleanPath === '';
    case 'products':
      return cleanPath.startsWith('/products') || cleanPath.startsWith('/product');
    case 'coupons':
      return cleanPath.startsWith('/coupons');
    case 'custom':
      if (!popup.customPagePath) return false;
      const targetClean = popup.customPagePath.split('?')[0].replace(/\/+$/, '') || '/';
      return cleanPath === targetClean;
    default:
      return false;
  }
}
