'use client';

import { useState, useEffect } from 'react';
import { getBrandingConfig, DEFAULT_BRANDING, BrandingConfig, updateFaviconInDocument } from '@/lib/brandingStore';

export function useBranding() {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cfg = getBrandingConfig();
    setBranding(cfg);
    updateFaviconInDocument(cfg.faviconUrl);

    // Sync with server-side saved settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((serverData) => {
        if (serverData && !serverData.error && Object.keys(serverData).length > 0) {
          const merged: BrandingConfig = {
            logoUrl: serverData.logoUrl || cfg.logoUrl,
            faviconUrl: serverData.faviconUrl || cfg.faviconUrl,
            brandName: serverData.siteBrandName || cfg.brandName,
            siteTitle: serverData.siteTitle || cfg.siteTitle,
            footerBioText: serverData.footerBioText !== undefined ? serverData.footerBioText : cfg.footerBioText,
            socialFacebook: serverData.socialFacebook !== undefined ? serverData.socialFacebook : cfg.socialFacebook,
            socialInstagram: serverData.socialInstagram !== undefined ? serverData.socialInstagram : cfg.socialInstagram,
            socialYoutube: serverData.socialYoutube !== undefined ? serverData.socialYoutube : cfg.socialYoutube,
            socialTwitter: serverData.socialTwitter !== undefined ? serverData.socialTwitter : cfg.socialTwitter,
          };
          setBranding(merged);
        }
      })
      .catch(() => {});

    const handleUpdate = () => {
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
