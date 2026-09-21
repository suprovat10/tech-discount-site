import { AdItem, AdPlacementId } from '@/types/ad';

export const ADS_UPDATED_EVENT = 'techpricedrop_ads_updated';

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
 * Fetch all ads from the API
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADS_UPDATED_EVENT));
  }
}
