import fs from 'fs';
import path from 'path';
import { getSiteKV, getSiteKVSync } from '@/lib/db/kv';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';
export type { SiteSettings };
export { DEFAULT_SITE_SETTINGS };

/**
 * Reads site settings directly from MongoDB Atlas (with local store fallback).
 * Ensures any settings changed from the admin dashboard update across all devices globally.
 */
export async function getServerSettings(): Promise<SiteSettings> {
  try {
    const cloud = await getSiteKV<SiteSettings>('settings');
    if (cloud && typeof cloud === 'object' && Object.keys(cloud).length > 0) {
      return { ...DEFAULT_SITE_SETTINGS, ...cloud };
    }
  } catch (err) {
    console.warn('Error reading settings from MongoDB:', err);
  }
  return getServerSettingsSync();
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
