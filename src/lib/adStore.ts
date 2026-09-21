import { AdItem, AdPlacementId } from '@/types/ad';

export const ADS_UPDATED_EVENT = 'techpricedrop_ads_updated';

let cachedActiveAds: AdItem[] | null = null;
let activeAdsPromise: Promise<AdItem[]> | null = null;
let lastFetchTime = 0;

/**
 * Check whether an ad is currently active (enabled + timer/date check)
 */
export function isAdActiveClient(ad: AdItem): boolean {
  if (!ad || !ad.enabled) return false;

  const now = Date.now();

  if (ad.startDate) {
    const start = new Date(ad.startDate).getTime();
    if (!isNaN(start) && now < start) {
      return false; // Scheduled for future
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
 * Fetch all active ads from API with deduplicated single-flight promise and memory cache.
 * Multiple AdSlots on the same page will share the exact same network request!
 */
export async function getActiveAdsClient(): Promise<AdItem[]> {
  const now = Date.now();
  if (cachedActiveAds && now - lastFetchTime < 30000) {
    return cachedActiveAds;
  }
  if (activeAdsPromise) {
    return activeAdsPromise;
  }

  activeAdsPromise = (async () => {
    try {
      const res = await fetch('/api/ads?activeOnly=true');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          cachedActiveAds = data;
          lastFetchTime = Date.now();
          return data;
        }
      }
      return [];
    } catch (err) {
      console.warn('Error fetching active ads:', err);
      return [];
    } finally {
      activeAdsPromise = null;
    }
  })();

  return activeAdsPromise;
}

/**
 * Get active ad for a specific placement slot from client cache
 */
export async function getActiveAdForPlacementClient(placement: AdPlacementId): Promise<AdItem | null> {
  const ads = await getActiveAdsClient();
  const match = ads.find((a) => a.placement === placement && isAdActiveClient(a));
  return match || null;
}

/**
 * Clear client-side active ads cache
 */
export function clearActiveAdsCache(): void {
  cachedActiveAds = null;
  lastFetchTime = 0;
}

/**
 * Fetch all ads from the API (used in admin dashboard)
 */
export async function fetchAdsFromApi(): Promise<AdItem[]> {
  try {
    const res = await fetch('/api/ads', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Error fetching ads:', err);
    return [];
  }
}

/**
 * Trigger ads updated event to notify client components
 */
export function notifyAdsUpdated(): void {
  clearActiveAdsCache();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADS_UPDATED_EVENT));
  }
}
