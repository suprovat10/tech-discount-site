import { CouponItem, DEFAULT_COUPONS } from '@/data/coupons';

const STORAGE_KEY = 'smarttech_coupons_list_v1';
export const COUPONS_UPDATED_EVENT = 'smarttech_coupons_updated';

export function getCoupons(): CouponItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_COUPONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read coupons from localStorage:', e);
  }
  return DEFAULT_COUPONS;
}

export function saveCoupons(coupons: CouponItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    window.dispatchEvent(new Event(COUPONS_UPDATED_EVENT));
  } catch (e) {
    console.error('Failed to save coupons to localStorage:', e);
  }
}

export async function fetchAndSyncCouponsFromServer(): Promise<CouponItem[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/coupons', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      saveCoupons(json.data);
      return json.data;
    }
  } catch (err) {
    console.warn('Failed to fetch coupons from server:', err);
  }
  return null;
}

export function getCouponById(id: string): CouponItem | undefined {
  const coupons = getCoupons();
  return coupons.find((c) => c.id === id);
}

export function upsertCoupon(coupon: CouponItem): void {
  const coupons = getCoupons();
  const index = coupons.findIndex((c) => c.id === coupon.id);
  let updated: CouponItem[];
  if (index >= 0) {
    updated = [...coupons];
    updated[index] = {
      ...updated[index],
      ...coupon,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updated = [
      {
        ...coupon,
        createdAt: coupon.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...coupons,
    ];
  }
  saveCoupons(updated);

  if (typeof window !== 'undefined') {
    fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(coupon),
    }).catch((err) => console.warn('Coupons server upsert error:', err));
  }
}

export function deleteCoupon(id: string): void {
  const coupons = getCoupons();
  const filtered = coupons.filter((c) => c.id !== id);
  saveCoupons(filtered);

  if (typeof window !== 'undefined') {
    fetch(`/api/coupons?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch((err) => console.warn('Coupons server delete error:', err));
  }
}

export function resetCouponsToDefault(): void {
  saveCoupons(DEFAULT_COUPONS);
  if (typeof window !== 'undefined') {
    fetch('/api/coupons', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ coupons: DEFAULT_COUPONS }),
    }).catch((err) => console.warn('Coupons server reset error:', err));
  }
}

