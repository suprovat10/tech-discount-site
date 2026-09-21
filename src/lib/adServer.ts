import { AdItem, AdPlacementId } from '@/types/ad';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const DB_ADS_KEY = 'site_ads';

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

function getInitialAdsFromFile(): AdItem[] {
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'ads.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error reading ads.json:', err);
    }
  }
  return [];
}

/**
 * Get all ads from MongoDB / site_kv with disk fallback
 */
export async function getServerAds(): Promise<AdItem[]> {
  try {
    const cloud = await getSiteKV<AdItem[]>(DB_ADS_KEY);
    if (cloud !== null && Array.isArray(cloud)) {
      return cloud;
    }

    // Seed initial ads to cloud database
    const initialAds = getInitialAdsFromFile();
    if (initialAds.length > 0) {
      await setSiteKV(DB_ADS_KEY, initialAds);
    }
    return initialAds;
  } catch (err) {
    console.warn('Error reading site_ads from database:', err);
    return getInitialAdsFromFile();
  }
}

/**
 * Check whether an ad is currently active (enabled + timer/date check)
 */
export function isAdActive(ad: AdItem): boolean {
  if (!ad || !ad.enabled) return false;

  // If timer is configured, check start and end dates
  const now = Date.now();

  if (ad.startDate) {
    const start = new Date(ad.startDate).getTime();
    if (!isNaN(start) && now < start) {
      return false; // Not started yet
    }
  }

  if (ad.endDate) {
    const end = new Date(ad.endDate).getTime();
    if (!isNaN(end) && now > end) {
      return false; // Expired
    }
  }

  return true;
}

/**
 * Get the active ad for a specific placement slot.
 * Returns null if no active ad exists or if the ad has expired.
 */
export async function getActiveAdForPlacement(placement: AdPlacementId): Promise<AdItem | null> {
  const ads = await getServerAds();
  const placementAds = ads.filter((ad) => ad.placement === placement && isAdActive(ad));
  if (placementAds.length === 0) return null;
  // Return the most recently updated active ad for this placement
  return placementAds[0];
}

/**
 * Save or update an ad item in MongoDB / site_kv
 */
export async function saveServerAd(ad: AdItem): Promise<AdItem[]> {
  const current = await getServerAds();
  const index = current.findIndex((a) => a.id === ad.id);
  const nowIso = new Date().toISOString();

  const prepared: AdItem = {
    ...ad,
    updatedAt: nowIso,
    createdAt: ad.createdAt || nowIso,
  };

  let updated: AdItem[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = prepared;
  } else {
    updated = [prepared, ...current];
  }

  await setSiteKV(DB_ADS_KEY, updated);

  // Sync to local ads.json
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'ads.json');
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
 * Delete an ad by ID
 */
export async function deleteServerAd(id: string): Promise<AdItem[]> {
  const current = await getServerAds();
  const updated = current.filter((a) => a.id !== id);
  await setSiteKV(DB_ADS_KEY, updated);

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'ads.json');
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  }

  return updated;
}

/**
 * Save all ads at once
 */
export async function saveAllServerAds(ads: AdItem[]): Promise<void> {
  await setSiteKV(DB_ADS_KEY, ads);
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'ads.json');
      fs.writeFileSync(filePath, JSON.stringify(ads, null, 2), 'utf-8');
    } catch {}
  }
}
