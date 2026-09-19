import { CouponItem, DEFAULT_COUPONS } from '@/data/coupons';

const STORAGE_KEY = 'smarttech_coupons_list_v1';
export const COUPONS_UPDATED_EVENT = 'smarttech_coupons_updated';

export function getCoupons(): CouponItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_COUPONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read coupons from localStorage:', e);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
  } catch (e) {
    console.error('Failed to initialize coupons in localStorage:', e);
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
}

export function deleteCoupon(id: string): void {
  const coupons = getCoupons();
  const filtered = coupons.filter((c) => c.id !== id);
  saveCoupons(filtered);
}

export function resetCouponsToDefault(): void {
  saveCoupons(DEFAULT_COUPONS);
}
