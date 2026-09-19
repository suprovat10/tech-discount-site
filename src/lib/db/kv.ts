import { getSupabaseAdminClient } from './client';

/**
 * Universal Key-Value / Entity store backed by Supabase
 * Ensures admin data (products, settings, blogs, categories, coupons, brands)
 * survives Git pushes and Vercel rebuilds permanently.
 */

interface CacheEntry {
  value: any;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5 seconds in-memory cache to make page navigation instant

export function invalidateSiteKVCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}

export async function getSiteKV<T>(key: string, forceFresh = false): Promise<T | null> {
  if (!forceFresh) {
    const cached = memoryCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value as T;
    }
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('site_kv')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) return null;
    const val = data.value as T;
    memoryCache.set(key, { value: val, expiry: Date.now() + CACHE_TTL_MS });
    return val;
  } catch (err) {
    console.warn(`[getSiteKV] Error reading key "${key}":`, err);
    return null;
  }
}

export async function setSiteKV<T>(key: string, value: T): Promise<boolean> {
  // Update in-memory cache immediately so this process gets instant read with 0 delay
  memoryCache.set(key, { value, expiry: Date.now() + CACHE_TTL_MS });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('site_kv')
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      console.warn(`[setSiteKV] Failed to upsert key "${key}":`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[setSiteKV] Exception saving key "${key}":`, err);
    return false;
  }
}

