'use client';

import { useState, useEffect } from 'react';
import { getBrandingConfig, DEFAULT_BRANDING, BrandingConfig, updateFaviconInDocument } from '@/lib/brandingStore';

let settingsPromise: Promise<any> | null = null;
let cachedServerSettings: any = null;

function fetchServerSettingsDeduplicated(): Promise<any> {
  if (cachedServerSettings) return Promise.resolve(cachedServerSettings);
  if (settingsPromise) return settingsPromise;
  settingsPromise = fetch('/api/settings')
    .then((res) => res.json())
    .then((data) => {
      cachedServerSettings = data;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      settingsPromise = null;
    });
  return settingsPromise;
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cfg = getBrandingConfig();
    setBranding(cfg);
    updateFaviconInDocument(cfg.faviconUrl);

    // Sync with server-side saved settings (deduplicated across Header, Footer, and StoreLayoutWrapper)
    fetchServerSettingsDeduplicated().then((serverData) => {
      if (serverData && !serverData.error && Object.keys(serverData).length > 0) {
        const isCustomLogo = cfg.logoUrl && cfg.logoUrl !== '/logo.png' && cfg.logoUrl !== '/logo-techpricedrop.png';
        const isCustomFavicon = cfg.faviconUrl && cfg.faviconUrl !== '/favicon.png' && cfg.faviconUrl !== '/favicon-techpricedrop.png';
        const isCustomBrand = cfg.brandName && cfg.brandName !== 'suprodesign' && cfg.brandName !== 'TechPriceDrop';
        const isCustomTitle = cfg.siteTitle && !cfg.siteTitle.includes('suprodesign') && !cfg.siteTitle.includes('TechPriceDrop');

        const merged: BrandingConfig = {
          logoUrl: isCustomLogo ? cfg.logoUrl : (serverData.logoUrl || cfg.logoUrl || '/logo-techpricedrop.png'),
          faviconUrl: isCustomFavicon ? cfg.faviconUrl : (serverData.faviconUrl || cfg.faviconUrl || '/favicon-techpricedrop.png'),
          brandName: isCustomBrand ? cfg.brandName : (serverData.siteBrandName || cfg.brandName || 'TechPriceDrop'),
          siteTitle: isCustomTitle ? cfg.siteTitle : (serverData.siteTitle || cfg.siteTitle || 'TechPriceDrop - Compare Prices'),
          footerBioText: serverData.footerBioText !== undefined ? serverData.footerBioText : cfg.footerBioText,
          socialFacebook: serverData.socialFacebook !== undefined ? serverData.socialFacebook : cfg.socialFacebook,
          socialInstagram: serverData.socialInstagram !== undefined ? serverData.socialInstagram : cfg.socialInstagram,
          socialYoutube: serverData.socialYoutube !== undefined ? serverData.socialYoutube : cfg.socialYoutube,
          socialTwitter: serverData.socialTwitter !== undefined ? serverData.socialTwitter : cfg.socialTwitter,
        };
        setBranding(merged);
      }
    });

    const handleUpdate = () => {
      cachedServerSettings = null;
      const updated = getBrandingConfig();
      setBranding(updated);
      updateFaviconInDocument(updated.faviconUrl);
    };

    window.addEventListener('smarttech_branding_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('smarttech_branding_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return { ...branding, isLoaded: mounted };
}
