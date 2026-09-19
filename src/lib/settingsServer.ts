import fs from 'fs';
import path from 'path';

import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';
import { getSiteKV } from './db/kv';
export type { SiteSettings };
export { DEFAULT_SITE_SETTINGS };

export function getServerSettings(): SiteSettings {
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

export async function getServerSettingsAsync(): Promise<SiteSettings> {
  try {
    const cloud = await getSiteKV<Partial<SiteSettings>>('settings');
    if (cloud && typeof cloud === 'object' && Object.keys(cloud).length > 0) {
      return { ...DEFAULT_SITE_SETTINGS, ...cloud };
    }
  } catch (e) {
    // fallback
  }
  return getServerSettings();
}
