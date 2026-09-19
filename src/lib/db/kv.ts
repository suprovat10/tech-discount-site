import { getSupabaseAdminClient } from './client';

/**
 * Universal Key-Value / Entity store backed by Supabase
 * Ensures admin data (products, settings, blogs, categories) survives Git pushes and Vercel rebuilds permanently.
 */
export async function getSiteKV<T>(key: string): Promise<T | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('site_kv')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) return null;
    return data.value as T;
  } catch (err) {
    console.warn(`[getSiteKV] Error reading key "${key}":`, err);
    return null;
  }
}

export async function setSiteKV<T>(key: string, value: T): Promise<boolean> {
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
