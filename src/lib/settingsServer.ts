import fs from 'fs';
import path from 'path';
import { getSiteKV, getSiteKVSync } from '@/lib/db/kv';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';
export type { SiteSettings };
export { DEFAULT_SITE_SETTINGS };

let cachedSettings: SiteSettings | null = null;
let lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL = 5 * 1000;

export function invalidateSettingsServerCache(): void {
  cachedSettings = null;
  lastSettingsFetch = 0;
}

/**
 * Reads site settings directly from MongoDB Atlas (with local store fallback).
 * Ensures any settings changed from the admin dashboard update across all devices globally.
 */
export async function getServerSettings(forceFresh = false): Promise<SiteSettings> {
  if (!forceFresh && cachedSettings && Date.now() - lastSettingsFetch < SETTINGS_CACHE_TTL) {
    return cachedSettings;
  }
  try {
    const cloud = await getSiteKV<SiteSettings>('settings', forceFresh);
    if (cloud && typeof cloud === 'object' && Object.keys(cloud).length > 0) {
      const merged = { ...DEFAULT_SITE_SETTINGS, ...cloud };
      if (!merged.heroImageUrl || merged.heroImageUrl.includes('v8wowdztetwveiot2ahw') || merged.heroImageUrl.includes('images.unsplash.com/photo-1517336714731-489689fd1ca8')) {
        merged.heroImageUrl = '/hero.webp';
      }
      if (!merged.ogImageUrl || merged.ogImageUrl.includes('photo-1519389950473-47ba0277781c')) {
        merged.ogImageUrl = DEFAULT_SITE_SETTINGS.ogImageUrl;
      }
      cachedSettings = merged;
      lastSettingsFetch = Date.now();
      return merged;
    }
  } catch (err) {
    console.warn('Error reading settings from MongoDB:', err);
  }
  const syncSettings = getServerSettingsSync();
  if (!syncSettings.heroImageUrl || syncSettings.heroImageUrl.includes('v8wowdztetwveiot2ahw') || syncSettings.heroImageUrl.includes('images.unsplash.com/photo-1517336714731-489689fd1ca8')) {
    syncSettings.heroImageUrl = '/hero.webp';
  }
  if (!syncSettings.ogImageUrl || syncSettings.ogImageUrl.includes('photo-1519389950473-47ba0277781c')) {
    syncSettings.ogImageUrl = DEFAULT_SITE_SETTINGS.ogImageUrl;
  }
  cachedSettings = syncSettings;
  lastSettingsFetch = Date.now();
  return syncSettings;
}

/**
 * Synchronous fallback reading from memory cache or disk.
 */
export function getServerSettingsSync(): SiteSettings {
  try {
    const fromKv = getSiteKVSync<SiteSettings>('settings');
    if (fromKv && typeof fromKv === 'object' && Object.keys(fromKv).length > 0) {
      return { ...DEFAULT_SITE_SETTINGS, ...fromKv };
    }
  } catch {}

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SITE_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Error reading server settings:', err);
  }
  return DEFAULT_SITE_SETTINGS;
}
