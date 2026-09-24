'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Search,
  BarChart3,
  DollarSign,
  Save,
  CheckCircle2,
  Sparkles,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateFaviconInDocument } from '@/lib/brandingStore';

interface AdminSettings {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogImageUrl: string;
  indexingEnabled: boolean;
  logoUrl: string;
  faviconUrl: string;
  siteBrandName: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  tiktokPixelId: string;
  amazonTag: string;
  walmartPartnerId: string;
  bestBuyAffiliateId: string;
  targetImpactId: string;
  defaultCurrency: string;
  priceCheckIntervalMinutes: number;
  footerBioText: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  socialTwitter: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  googleAdSenseId?: string;
  globalAdHeaderCode?: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  siteTitle: 'TechPriceDrop - Compare Prices across Amazon, Walmart, Best Buy & Target',
  metaDescription: 'Find the lowest prices and best discounts on tech gadgets, laptops, smartphones, and accessories across major US retailers.',
  keywords: 'deals, discounts, price comparison, amazon, walmart, best buy, target, tech gadgets',
  canonicalUrl: 'https://www.techpricedrop.com',
  ogImageUrl: 'https://res.cloudinary.com/koayelts/image/upload/f_auto,q_auto,w_1600,c_limit/v1790111032/techpricedrop/branding/uc66jnomvw4tnewyy2mq.jpg',
  indexingEnabled: true,

  logoUrl: '/logo-techpricedrop.png',
  faviconUrl: '/favicon-techpricedrop.png',
  siteBrandName: 'TechPriceDrop',

  footerBioText: 'TechPriceDrop is a real-time price comparison and deals discovery engine. We scan authorized retailers like Amazon, Walmart, Best Buy, and Target so you never overpay for tech.',
  socialFacebook: 'https://facebook.com',
  socialInstagram: 'https://instagram.com',
  socialYoutube: 'https://youtube.com',
  socialTwitter: 'https://twitter.com',
  googleSiteVerification: '',
  bingSiteVerification: '',
  googleAdSenseId: '',
  globalAdHeaderCode: '',

  googleAnalyticsId: 'G-7LLKVZYHWG',
  googleTagManagerId: '',
  facebookPixelId: '',
  tiktokPixelId: '',

  amazonTag: 'smarttechdeals-20',
  walmartPartnerId: 'WMT-PARTNER-40291',
  bestBuyAffiliateId: 'BBY-CJ-908122',
  targetImpactId: 'TGT-IMPACT-18274',

  defaultCurrency: 'USD ($)',
  priceCheckIntervalMinutes: 60,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [faviconSuccessMsg, setFaviconSuccessMsg] = useState('');
  const [logoSuccessMsg, setLogoSuccessMsg] = useState('');
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [ogImageSuccessMsg, setOgImageSuccessMsg] = useState('');

  const faviconInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('smarttech_admin_settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }

    // Also fetch any server-side saved settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((serverData) => {
        if (serverData && !serverData.error && Object.keys(serverData).length > 0) {
          setSettings((prev) => {
            const updated = { ...prev, ...serverData };
            try {
              localStorage.setItem('smarttech_admin_settings', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (field: keyof AdminSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssetUpload = async (field: 'logoUrl' | 'faviconUrl', file: File) => {
    if (!file) return;
    const isFavicon = field === 'faviconUrl';
    if (isFavicon) setUploadingFavicon(true);
    else setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', isFavicon ? 'favicon' : 'logo');

      const res = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        const newUrl = data.url;
        const updated = { ...settings, [field]: newUrl };
        setSettings(updated);

        localStorage.setItem('smarttech_admin_settings', JSON.stringify(updated));
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {});

        window.dispatchEvent(new Event('smarttech_branding_updated'));
        if (isFavicon) {
          updateFaviconInDocument(newUrl);
          setFaviconSuccessMsg('Favicon uploaded & applied to website!');
          setTimeout(() => setFaviconSuccessMsg(''), 5000);
        } else {
          setLogoSuccessMsg('Logo uploaded & applied to website!');
          setTimeout(() => setLogoSuccessMsg(''), 5000);
        }
      } else {
        throw new Error(data.error || 'Server upload failed');
      }
    } catch (e: any) {
      console.warn('Server upload error, falling back to local data URL:', e);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const updated = { ...settings, [field]: dataUrl };
          setSettings(updated);
          localStorage.setItem('smarttech_admin_settings', JSON.stringify(updated));
          window.dispatchEvent(new Event('smarttech_branding_updated'));
          if (isFavicon) {
            updateFaviconInDocument(dataUrl);
            setFaviconSuccessMsg('Favicon applied to browser tab!');
            setTimeout(() => setFaviconSuccessMsg(''), 5000);
          } else {
            setLogoSuccessMsg('Logo applied to storefront!');
            setTimeout(() => setLogoSuccessMsg(''), 5000);
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      if (isFavicon) setUploadingFavicon(false);
      else setUploadingLogo(false);
    }
  };

  const handleOgImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingOgImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'og');

      const res = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        const newUrl = data.url;
        const updated = { ...settings, ogImageUrl: newUrl };
        setSettings(updated);

        localStorage.setItem('smarttech_admin_settings', JSON.stringify(updated));
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(() => {});

        setOgImageSuccessMsg('OpenGraph (OG) image attached & saved!');
        setTimeout(() => setOgImageSuccessMsg(''), 5000);
      } else {
        throw new Error(data.error || 'Server upload failed');
      }
    } catch (e: any) {
      console.warn('Server upload error, falling back to local data URL:', e);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const updated = { ...settings, ogImageUrl: dataUrl };
          setSettings(updated);
          localStorage.setItem('smarttech_admin_settings', JSON.stringify(updated));
          setOgImageSuccessMsg('OpenGraph image preview attached!');
          setTimeout(() => setOgImageSuccessMsg(''), 5000);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingOgImage(false);
    }
  };

  const handleSaveFaviconOnly = () => {
    try {
      const updated = { ...settings };
      localStorage.setItem('smarttech_admin_settings', JSON.stringify(updated));
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      window.dispatchEvent(new Event('smarttech_branding_updated'));
      updateFaviconInDocument(settings.faviconUrl);
      setFaviconSuccessMsg('Favicon saved & applied to browser tab!');
      setTimeout(() => setFaviconSuccessMsg(''), 4500);
    } catch {
      // ignore
    }
  };

  const handleSaveLogoOnly = () => {
    try {
      const updated = { ...settings };
      localStorage.setItem('smarttech_admin_settings', JSON.stringify(updated));
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      window.dispatchEvent(new Event('smarttech_branding_updated'));
      setLogoSuccessMsg('Logo saved & applied to storefront!');
      setTimeout(() => setLogoSuccessMsg(''), 4500);
    } catch {
      // ignore
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSavedSuccess(false);

    const toSave: AdminSettings = {
      ...settings,
      googleTagManagerId: '',
      tiktokPixelId: '',
      googleSiteVerification: '',
      bingSiteVerification: '',
    };

    try {
      localStorage.setItem('smarttech_admin_settings', JSON.stringify(toSave));

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server error while saving settings.');
      }

      window.dispatchEvent(new Event('smarttech_branding_updated'));
      updateFaviconInDocument(settings.faviconUrl);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4500);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setSaveError(err.message || 'Error saving settings. Please verify database connection.');
      setTimeout(() => setSaveError(''), 7000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1000px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground">SEO, Analytics & Affiliate Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure storefront logo, favicon, site metadata, Google Analytics tracking scripts, and multi-retailer affiliate parameters.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
        </Button>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings successfully saved and persisted to database! Logo, Favicon, tracking codes, and SEO metadata are now active.</span>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="p-4 border border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-xs font-semibold">
          <span className="font-bold">Error:</span>
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 0: SITE BRANDING (LOGO & FAVICON) */}
        <div className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Site Branding & Identity (Logo & Favicon)</h2>
              <p className="text-[11px] text-muted-foreground">Manage your storefront logo, browser tab favicon, and brand display name.</p>
            </div>
          </div>

          <div className="space-y-6 text-xs">
            {/* Brand Display Name */}
            <div>
              <label className="font-bold text-foreground block mb-1">
                Storefront Brand Display Name
              </label>
              <Input
                value={settings.siteBrandName}
                onChange={(e) => handleChange('siteBrandName', e.target.value)}
                placeholder="TechPriceDrop"
                className="h-9 text-xs max-w-md"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                The name displayed in the header, footer, admin panel, and browser titles.
              </span>
            </div>

            {/* Logo Section */}
            <div className="p-4 border border-border bg-muted/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="font-bold text-foreground block">
                    Storefront Main Logo
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Recommended: Transparent PNG (around 500x75px or SVG).
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*,.svg,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload('logoUrl', file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-bold text-[11px] cursor-pointer hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload New Logo'}</span>
                  </button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleChange('logoUrl', '/logo.png');
                      handleSaveLogoOnly();
                    }}
                    className="h-7 px-2.5 text-[11px] font-semibold text-muted-foreground flex items-center gap-1 cursor-pointer"
                    title="Reset to default logo"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Default</span>
                  </Button>
                </div>
              </div>

              {logoSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{logoSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 flex items-center gap-2">
                  <Input
                    value={settings.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    placeholder="/logo.png or https://..."
                    className="h-9 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveLogoOnly}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-3 shrink-0 cursor-pointer"
                    title="Save Logo URL"
                  >
                    Apply & Save
                  </Button>
                </div>
                {/* Logo Live Preview */}
                <div className="p-3 border border-border bg-background flex flex-col items-center justify-center min-h-[60px]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Live Preview
                  </span>
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo preview"
                      className="max-h-8 max-w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/logo.png';
                      }}
                    />
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">No logo set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Favicon Section */}
            <div className="p-4 border border-border bg-muted/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="font-bold text-foreground block">
                    Browser Tab Favicon
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Recommended: Square PNG or ICO (32x32px or 64x64px). Directly updates your browser tab.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/*,.ico,.png,.svg,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload('faviconUrl', file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingFavicon}
                    onClick={() => faviconInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-bold text-[11px] cursor-pointer hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {uploadingFavicon ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingFavicon ? 'Uploading & Applying...' : 'Upload New Favicon'}</span>
                  </button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleChange('faviconUrl', '/favicon.png');
                      handleSaveFaviconOnly();
                    }}
                    className="h-7 px-2.5 text-[11px] font-semibold text-muted-foreground flex items-center gap-1 cursor-pointer"
                    title="Reset to default favicon"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Default</span>
                  </Button>
                </div>
              </div>

              {faviconSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{faviconSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 flex items-center gap-2">
                  <Input
                    value={settings.faviconUrl}
                    onChange={(e) => handleChange('faviconUrl', e.target.value)}
                    placeholder="/favicon.png or https://..."
                    className="h-9 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveFaviconOnly}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-3 shrink-0 cursor-pointer"
                    title="Save Favicon URL and update browser tab"
                  >
                    Apply & Save
                  </Button>
                </div>
                {/* Favicon Live Preview */}
                <div className="p-3 border border-border bg-background flex flex-col items-center justify-center min-h-[60px]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Live Tab Preview
                  </span>
                  <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-muted/40 rounded-none">
                    {settings.faviconUrl ? (
                      <img
                        src={settings.faviconUrl}
                        alt="Favicon preview"
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/favicon.png';
                        }}
                      />
                    ) : (
                      <div className="w-4 h-4 bg-muted" />
                    )}
                    <span className="text-[11px] font-medium text-foreground truncate max-w-[120px]">
                      {settings.siteBrandName || 'TechPriceDrop'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Bio & Tagline */}
            <div className="p-4 border border-border bg-muted/20 space-y-3">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Footer Bio / About Text (Displayed Under Logo)
                </label>
                <textarea
                  value={settings.footerBioText || ''}
                  onChange={(e) => handleChange('footerBioText', e.target.value)}
                  rows={3}
                  placeholder="TechPriceDrop is a real-time price comparison and deals discovery engine..."
                  className="w-full p-2.5 text-xs border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-600 rounded-none"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  This description appears directly underneath your brand logo in the website footer.
                </span>
              </div>
            </div>

            {/* Social Media Channels */}
            <div className="p-4 border border-border bg-muted/20 space-y-4">
              <div>
                <label className="font-bold text-foreground block">
                  Social Media Links (Follow Icons Under Bio)
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Provide links to your social accounts. Icons will appear under the footer bio. Leave blank to hide.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    Facebook Page URL
                  </label>
                  <Input
                    value={settings.socialFacebook || ''}
                    onChange={(e) => handleChange('socialFacebook', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-pink-600 inline-block" />
                    Instagram Profile URL
                  </label>
                  <Input
                    value={settings.socialInstagram || ''}
                    onChange={(e) => handleChange('socialInstagram', e.target.value)}
                    placeholder="https://instagram.com/yourprofile"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                    YouTube Channel URL
                  </label>
                  <Input
                    value={settings.socialYoutube || ''}
                    onChange={(e) => handleChange('socialYoutube', e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white inline-block" />
                    X / Twitter Profile URL
                  </label>
                  <Input
                    value={settings.socialTwitter || ''}
                    onChange={(e) => handleChange('socialTwitter', e.target.value)}
                    placeholder="https://x.com/yourhandle"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: GLOBAL SEO CONFIGURATION */}
        <div className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Search Engine Optimization (SEO)</h2>
              <p className="text-[11px] text-muted-foreground">Default metadata used for search rankings and social share embeds.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">
                Default Meta Title Tag
              </label>
              <Input
                value={settings.siteTitle}
                onChange={(e) => handleChange('siteTitle', e.target.value)}
                placeholder="TechPriceDrop - Compare Prices..."
                className="h-9 text-xs"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Recommended length: 50–60 characters ({settings.siteTitle.length} characters)
              </span>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">
                Meta Description
              </label>
              <textarea
                value={settings.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                rows={3}
                placeholder="Find the lowest prices and best discounts..."
                className="w-full p-2.5 text-xs border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Recommended length: 150–160 characters ({settings.metaDescription.length} characters)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Meta Keywords (Comma separated)
                </label>
                <Input
                  value={settings.keywords}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                  placeholder="deals, discounts, tech..."
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Canonical Base URL
                </label>
                <Input
                  value={settings.canonicalUrl}
                  onChange={(e) => handleChange('canonicalUrl', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* OpenGraph (OG) Image with File Attachment Option */}
            <div className="space-y-3 p-4 border border-border bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Default OpenGraph (OG) Social Share Image
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Attached image is displayed when your website link is shared on Facebook, WhatsApp, Twitter/X, and LinkedIn. (Recommended: 1200 x 630 px)
                  </p>
                </div>
                {ogImageSuccessMsg && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ogImageSuccessMsg}
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={ogImageInputRef}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleOgImageUpload(file);
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
                {/* Image Preview / Attachment Box */}
                <div className="md:col-span-4 aspect-[1.91/1] w-full border border-border relative overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center group">
                  {settings.ogImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.ogImageUrl}
                        alt="Default OG Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => ogImageInputRef.current?.click()}
                          disabled={uploadingOgImage}
                          className="text-[10px] font-bold h-7 px-2 bg-white/90 text-black hover:bg-white"
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleChange('ogImageUrl', '')}
                          className="text-[10px] font-bold h-7 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div
                      onClick={() => ogImageInputRef.current?.click()}
                      className="cursor-pointer flex flex-col items-center justify-center p-3 text-center text-muted-foreground hover:text-foreground transition-colors w-full h-full"
                    >
                      <Upload className="w-6 h-6 mb-1.5 text-blue-600" />
                      <span className="text-xs font-bold">Attach Image</span>
                      <span className="text-[10px] text-muted-foreground">Click to upload from device</span>
                    </div>
                  )}

                  {uploadingOgImage && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs gap-2 font-bold z-10">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Image...
                    </div>
                  )}
                </div>

                {/* Actions & URL Input */}
                <div className="md:col-span-8 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => ogImageInputRef.current?.click()}
                      disabled={uploadingOgImage}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2 shadow-xs"
                    >
                      {uploadingOgImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{settings.ogImageUrl ? 'Upload / Replace OG Image' : 'Attach Image from Device'}</span>
                    </Button>

                    {settings.ogImageUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleChange('ogImageUrl', '')}
                        className="text-xs text-red-600 hover:text-red-700 h-9 px-3"
                      >
                        Clear Image
                      </Button>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Or manually specify / paste Image URL:
                    </label>
                    <Input
                      value={settings.ogImageUrl}
                      onChange={(e) => handleChange('ogImageUrl', e.target.value)}
                      placeholder="https://... or /uploads/..."
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Social Scraper Cache Tip Box */}
              <div className="mt-2 p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <span>Social Media Preview Cache (Facebook, WhatsApp, Twitter)</span>
                  </div>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                    Facebook &amp; WhatsApp cache link preview cards for up to 30 days. When you upload or replace this OG Image, click the debugger button to re-scrape and update preview cards immediately.
                  </p>
                </div>
                <a
                  href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(settings.canonicalUrl || 'https://www.techpricedrop.com')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                >
                  Clear Cache (Facebook Debugger) ↗
                </a>
              </div>
            </div>

            {/* Webmaster Tools Verification */}
            <div className="p-3.5 border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-foreground block">
                  Search Console & Webmaster Verification
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Domain-level verification (DNS TXT record) is active. HTML meta tags are not required.
                </span>
              </div>
              <span className="self-start sm:self-auto px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-xs">
                Domain DNS Active
              </span>
            </div>

            {/* Live Search & Social Snippet Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Google SERP Preview */}
              <div className="p-4 border border-border bg-background space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Google Search Snippet Preview
                </span>
                <div className="space-y-1 font-sans">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {settings.faviconUrl ? (
                        <img src={settings.faviconUrl} alt="Favicon" className="w-3.5 h-3.5 object-contain" />
                      ) : (
                        <span className="text-[8px] font-bold">G</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#202124] dark:text-[#bdc1c6] font-medium leading-none">
                        {settings.siteBrandName || 'TechPriceDrop'}
                      </span>
                      <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] leading-tight">
                        {settings.canonicalUrl || 'https://www.techpricedrop.com'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm text-[#1a0dab] dark:text-[#8ab4f8] font-medium hover:underline cursor-pointer line-clamp-1 leading-tight">
                    {settings.siteTitle || 'TechPriceDrop - Compare Prices & Find Deals'}
                  </h3>
                  <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-relaxed">
                    {settings.metaDescription || 'Real-time price comparison and deals discovery engine...'}
                  </p>
                </div>
              </div>

              {/* Social Share Preview */}
              <div className="p-4 border border-border bg-background space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Social Share Embed Preview (OpenGraph / Twitter)
                </span>
                <div className="border border-border/80 rounded-none overflow-hidden bg-muted/20">
                  <div className="aspect-[1.91/1] w-full bg-muted relative overflow-hidden flex items-center justify-center">
                    {settings.ogImageUrl ? (
                      <img
                        src={settings.ogImageUrl}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/logo-techpricedrop.png';
                        }}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No OG Image Set</span>
                    )}
                  </div>
                  <div className="p-2.5 space-y-0.5">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                      {new URL(settings.canonicalUrl || 'https://www.techpricedrop.com').hostname}
                    </span>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {settings.siteTitle || 'TechPriceDrop - Compare Prices'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {settings.metaDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="indexingToggle"
                checked={settings.indexingEnabled}
                onChange={(e) => handleChange('indexingEnabled', e.target.checked)}
                className="w-4 h-4 border border-input text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="indexingToggle" className="font-bold text-foreground cursor-pointer">
                Allow Search Engines to Index Storefront (robots: index, follow)
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: TRACKING & ANALYTICS */}
        <div className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Analytics & Tracking Pixels</h2>
              <p className="text-[11px] text-muted-foreground">Monitor traffic, click-through rates, and affiliate conversion attribution.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">
                Google Analytics 4 (GA4) Measurement ID
              </label>
              <Input
                value={settings.googleAnalyticsId}
                onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Tracks pageviews, search queries, and outbound store clicks.
              </span>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">
                Facebook Pixel ID
              </label>
              <Input
                value={settings.facebookPixelId}
                onChange={(e) => handleChange('facebookPixelId', e.target.value)}
                placeholder="e.g. 123456789012345"
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Tracks Meta ad conversions and retargeting audiences.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2.5: GOOGLE ADSENSE & GLOBAL AD SCRIPTS */}
        <div className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Google AdSense & Global Ad Scripts</h2>
              <p className="text-[11px] text-muted-foreground">
                Configure your publisher code and header scripts for Google AdSense and ad networks.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-foreground block mb-1">
                Google AdSense Publisher ID
              </label>
              <Input
                value={settings.googleAdSenseId || ''}
                onChange={(e) => handleChange('googleAdSenseId', e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Your Google AdSense Client / Publisher ID. Automatically loads the official Google AdSense script asynchronously across all pages.
              </span>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">
                Global Ad Network Header Code / Custom Script (Optional)
              </label>
              <textarea
                value={settings.globalAdHeaderCode || ''}
                onChange={(e) => handleChange('globalAdHeaderCode', e.target.value)}
                placeholder={`<!-- Any third-party ad network script or verification tags -->\n<script async src="..."></script>`}
                rows={3}
                className="w-full p-2.5 text-xs font-mono border border-border bg-background rounded-none focus:outline-none focus:border-blue-600"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Custom HTML or JavaScript to inject for ad networks (Mediavine, Ezoic, BuySellAds, etc.).
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: AFFILIATE NETWORK STORE TAGS */}
        <div className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Affiliate Partner IDs & Store Tags</h2>
              <p className="text-[11px] text-muted-foreground">Automatically appended to outgoing product referral URLs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-foreground">Amazon Associates Store Tag</label>
                <span className="text-[10px] text-amber-600 font-bold">Amazon US</span>
              </div>
              <Input
                value={settings.amazonTag}
                onChange={(e) => handleChange('amazonTag', e.target.value)}
                placeholder="yourstore-20"
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Appended as &tag=... on all Amazon outbound links.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-foreground">Walmart Impact Partner ID</label>
                <span className="text-[10px] text-blue-600 font-bold">Walmart US</span>
              </div>
              <Input
                value={settings.walmartPartnerId}
                onChange={(e) => handleChange('walmartPartnerId', e.target.value)}
                placeholder="WMT-XXXXX"
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Used in Impact.com affiliate redirect links.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-foreground">Best Buy CJ Affiliate ID</label>
                <span className="text-[10px] text-yellow-600 font-bold">Best Buy US</span>
              </div>
              <Input
                value={settings.bestBuyAffiliateId}
                onChange={(e) => handleChange('bestBuyAffiliateId', e.target.value)}
                placeholder="CJ-XXXXXX"
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Commission Junction tracking parameter.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-foreground">Target Impact Radius ID</label>
                <span className="text-[10px] text-rose-600 font-bold">Target US</span>
              </div>
              <Input
                value={settings.targetImpactId}
                onChange={(e) => handleChange('targetImpactId', e.target.value)}
                placeholder="TGT-XXXXXX"
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Impact Radius referral ID.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: SYSTEM DESIGN & REFRESH SPECS */}
        <div className="border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Storefront Layout & Engine Directives</h2>
              <p className="text-[11px] text-muted-foreground">Global styling and feed configuration defaults.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 border border-border bg-background space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Container Layout</span>
              <p className="font-black text-foreground text-sm">1200px Max-Width</p>
              <p className="text-[10px] text-emerald-600 font-medium">Strictly Enforced across all views</p>
            </div>

            <div className="p-3 border border-border bg-background space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Corner Aesthetics</span>
              <p className="font-black text-foreground text-sm">0px Sharp Corners</p>
              <p className="text-[10px] text-emerald-600 font-medium">Zero Border-Radius Active</p>
            </div>

            <div className="p-3 border border-border bg-background space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase">Product Card Ratio</span>
              <p className="font-black text-foreground text-sm">5:4 Edge-to-Edge</p>
              <p className="text-[10px] text-emerald-600 font-medium">Full-Bleed Cover Fit</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving All Configurations...' : 'Save All Configurations'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
