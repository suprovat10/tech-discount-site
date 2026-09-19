import fs from 'fs';
import path from 'path';

import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';
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
