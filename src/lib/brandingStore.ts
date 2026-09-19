export interface BrandingConfig {
  logoUrl: string;
  faviconUrl: string;
  brandName: string;
  siteTitle: string;
  footerBioText: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  socialTwitter: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.png',
  brandName: 'suprodesign',
  siteTitle: 'suprodesign - Compare Tech Deals & Prices',
  footerBioText: 'suprodesign is a real-time price comparison and deals discovery engine. We scan authorized retailers like Amazon, Walmart, Best Buy, and Target so you never overpay for tech.',
  socialFacebook: 'https://facebook.com',
  socialInstagram: 'https://instagram.com',
  socialYoutube: 'https://youtube.com',
  socialTwitter: 'https://twitter.com',
};

const STORAGE_KEY = 'smarttech_admin_settings';

export function getBrandingConfig(): BrandingConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_BRANDING;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BRANDING;
    const parsed = JSON.parse(raw);
    return {
      logoUrl: parsed.logoUrl || DEFAULT_BRANDING.logoUrl,
      faviconUrl: parsed.faviconUrl || DEFAULT_BRANDING.faviconUrl,
      brandName: parsed.siteBrandName || DEFAULT_BRANDING.brandName,
      siteTitle: parsed.siteTitle || DEFAULT_BRANDING.siteTitle,
      footerBioText: parsed.footerBioText !== undefined ? parsed.footerBioText : DEFAULT_BRANDING.footerBioText,
      socialFacebook: parsed.socialFacebook !== undefined ? parsed.socialFacebook : DEFAULT_BRANDING.socialFacebook,
      socialInstagram: parsed.socialInstagram !== undefined ? parsed.socialInstagram : DEFAULT_BRANDING.socialInstagram,
      socialYoutube: parsed.socialYoutube !== undefined ? parsed.socialYoutube : DEFAULT_BRANDING.socialYoutube,
      socialTwitter: parsed.socialTwitter !== undefined ? parsed.socialTwitter : DEFAULT_BRANDING.socialTwitter,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function updateFaviconInDocument(faviconUrl?: string) {
  if (typeof document === 'undefined') return;
  const rawHref = faviconUrl || DEFAULT_BRANDING.faviconUrl;
  const href = rawHref.startsWith('data:')
    ? rawHref
    : `${rawHref}${rawHref.includes('?') ? '&' : '?'}v=${Date.now()}`;

  // Remove existing favicon and apple icon links to force browser refresh
  const existingLinks = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
  existingLinks.forEach((el) => el.remove());

  // 1. Primary standard shortcut icon
  const shortcutLink = document.createElement('link');
  shortcutLink.rel = 'shortcut icon';
  shortcutLink.href = href;
  document.head.appendChild(shortcutLink);

  // 2. Modern PNG icon
  const iconLink = document.createElement('link');
  iconLink.rel = 'icon';
  iconLink.type = href.includes('.ico') ? 'image/x-icon' : 'image/png';
  iconLink.href = href;
  document.head.appendChild(iconLink);

  // 3. Apple touch icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = href;
  document.head.appendChild(appleLink);
}
