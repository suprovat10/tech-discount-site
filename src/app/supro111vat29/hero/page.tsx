'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Save,
  CheckCircle2,
  Upload,
  Loader2,
  Image as ImageIcon,
  ArrowRight,
  Flame,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeroSettingsState {
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroImageAlt: string;
  heroImageLink?: string;
  heroImageNewTab?: boolean;
  heroPrimaryBtnText: string;
  heroPrimaryBtnUrl: string;
  heroPrimaryBtnNewTab?: boolean;
  heroPrimaryBtnShowIcon?: boolean;
  heroSecondaryBtnText: string;
  heroSecondaryBtnUrl: string;
  heroSecondaryBtnNewTab?: boolean;
  heroSecondaryBtnShowIcon?: boolean;
  heroBadgeText: string;
}

const DEFAULT_HERO_SETTINGS: HeroSettingsState = {
  heroTitleLine1: 'Compare tech prices.',
  heroTitleLine2: 'Never overpay.',
  heroSubtitle:
    'Instantly compare real-time offers and verified discounts from Amazon, Walmart, Best Buy, and Target before making any purchase.',
  heroImageUrl: '',
  heroImageAlt: 'Hero Banner',
  heroImageLink: '',
  heroImageNewTab: false,
  heroPrimaryBtnText: 'Browse Products',
  heroPrimaryBtnUrl: '/products',
  heroPrimaryBtnNewTab: false,
  heroPrimaryBtnShowIcon: true,
  heroSecondaryBtnText: "Today's Best Deals",
  heroSecondaryBtnUrl: '/products?sort=highest_savings',
  heroSecondaryBtnNewTab: false,
  heroSecondaryBtnShowIcon: true,
  heroBadgeText: '',
};

export default function AdminHeroPage() {
  const [hero, setHero] = useState<HeroSettingsState>(DEFAULT_HERO_SETTINGS);
  const [allSettings, setAllSettings] = useState<any>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load from localStorage first
    try {
      const stored = localStorage.getItem('smarttech_admin_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAllSettings(parsed);
        setHero((prev) => ({
          ...prev,
          heroTitleLine1: parsed.heroTitleLine1 ?? prev.heroTitleLine1,
          heroTitleLine2: parsed.heroTitleLine2 ?? prev.heroTitleLine2,
          heroSubtitle: parsed.heroSubtitle ?? prev.heroSubtitle,
          heroImageUrl: parsed.heroImageUrl ?? prev.heroImageUrl,
          heroImageAlt: parsed.heroImageAlt ?? prev.heroImageAlt,
          heroImageLink: parsed.heroImageLink ?? prev.heroImageLink,
          heroImageNewTab: parsed.heroImageNewTab ?? prev.heroImageNewTab,
          heroPrimaryBtnText: parsed.heroPrimaryBtnText ?? prev.heroPrimaryBtnText,
          heroPrimaryBtnUrl: parsed.heroPrimaryBtnUrl ?? prev.heroPrimaryBtnUrl,
          heroPrimaryBtnNewTab: parsed.heroPrimaryBtnNewTab ?? prev.heroPrimaryBtnNewTab,
          heroPrimaryBtnShowIcon: parsed.heroPrimaryBtnShowIcon ?? prev.heroPrimaryBtnShowIcon,
          heroSecondaryBtnText: parsed.heroSecondaryBtnText ?? prev.heroSecondaryBtnText,
          heroSecondaryBtnUrl: parsed.heroSecondaryBtnUrl ?? prev.heroSecondaryBtnUrl,
          heroSecondaryBtnNewTab: parsed.heroSecondaryBtnNewTab ?? prev.heroSecondaryBtnNewTab,
          heroSecondaryBtnShowIcon: parsed.heroSecondaryBtnShowIcon ?? prev.heroSecondaryBtnShowIcon,
          heroBadgeText: parsed.heroBadgeText ?? prev.heroBadgeText,
        }));
      }
    } catch {
      // ignore
    }

    // Also fetch server settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((serverData) => {
        if (serverData && !serverData.error) {
          setAllSettings(serverData);
          setHero((prev) => ({
            ...prev,
            heroTitleLine1: serverData.heroTitleLine1 ?? prev.heroTitleLine1,
            heroTitleLine2: serverData.heroTitleLine2 ?? prev.heroTitleLine2,
            heroSubtitle: serverData.heroSubtitle ?? prev.heroSubtitle,
            heroImageUrl: serverData.heroImageUrl ?? prev.heroImageUrl,
            heroImageAlt: serverData.heroImageAlt ?? prev.heroImageAlt,
            heroImageLink: serverData.heroImageLink ?? prev.heroImageLink,
            heroImageNewTab: serverData.heroImageNewTab ?? prev.heroImageNewTab,
            heroPrimaryBtnText: serverData.heroPrimaryBtnText ?? prev.heroPrimaryBtnText,
            heroPrimaryBtnUrl: serverData.heroPrimaryBtnUrl ?? prev.heroPrimaryBtnUrl,
            heroPrimaryBtnNewTab: serverData.heroPrimaryBtnNewTab ?? prev.heroPrimaryBtnNewTab,
            heroPrimaryBtnShowIcon: serverData.heroPrimaryBtnShowIcon ?? prev.heroPrimaryBtnShowIcon,
            heroSecondaryBtnText: serverData.heroSecondaryBtnText ?? prev.heroSecondaryBtnText,
            heroSecondaryBtnUrl: serverData.heroSecondaryBtnUrl ?? prev.heroSecondaryBtnUrl,
            heroSecondaryBtnNewTab: serverData.heroSecondaryBtnNewTab ?? prev.heroSecondaryBtnNewTab,
            heroSecondaryBtnShowIcon: serverData.heroSecondaryBtnShowIcon ?? prev.heroSecondaryBtnShowIcon,
            heroBadgeText: serverData.heroBadgeText ?? prev.heroBadgeText,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (field: keyof HeroSettingsState, value: any) => {
    setHero((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    setUploadMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hero');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        handleChange('heroImageUrl', data.url);
        if (!hero.heroImageAlt.trim()) {
          handleChange('heroImageAlt', 'Storefront Featured Hero Banner');
        }
        setUploadMsg('Hero image uploaded & attached successfully!');
        setTimeout(() => setUploadMsg(''), 4000);
      } else {
        throw new Error(data.error || 'Server upload failed');
      }
    } catch (err: any) {
      console.warn('Hero upload fallback to FileReader:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          handleChange('heroImageUrl', e.target.result as string);
          setUploadMsg('Hero image preview attached!');
          setTimeout(() => setUploadMsg(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const merged = {
      ...allSettings,
      ...hero,
    };

    try {
      localStorage.setItem('smarttech_admin_settings', JSON.stringify(merged));
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      }).catch(() => {});

      window.dispatchEvent(new Event('smarttech_branding_updated'));
      window.dispatchEvent(new Event('smarttech_hero_updated'));
    } catch {
      // ignore
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset the hero section to default content?')) {
      setHero(DEFAULT_HERO_SETTINGS);
    }
  };

  return (
    <div className="space-y-8 max-w-[1000px] pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Homepage Hero Section Settings</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Customize the main banner headlines, description, call-to-action buttons, and attach your hero showcase image.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="text-xs font-bold h-9 px-3"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset</span>
          </Button>
          <Button
            type="button"
            onClick={() => handleSave()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Hero section changes successfully saved! The homepage has been updated.</span>
        </div>
      )}

      {/* LIVE PREVIEW CARD */}
      <div className="border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Homepage Hero Preview
          </span>
          <Link
            href="/"
            target="_blank"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>View Live Homepage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Scaled Preview Box */}
        <div className="border border-border/80 bg-background p-6 md:p-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Preview */}
            <div className="md:col-span-7 space-y-3">
              {hero.heroBadgeText && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900">
                  <Sparkles className="w-3 h-3" />
                  <span>{hero.heroBadgeText}</span>
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-[1.1]">
                {hero.heroTitleLine1 || 'Compare tech prices.'} <br />
                <span className="text-muted-foreground font-semibold">
                  {hero.heroTitleLine2 || 'Never overpay.'}
                </span>
              </h2>

              <p className="text-xs text-muted-foreground max-w-md font-medium leading-relaxed">
                {hero.heroSubtitle || 'Instantly compare real-time offers and verified discounts...'}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-[11px] h-8 px-4 flex items-center gap-1.5">
                  <span>{hero.heroPrimaryBtnText || 'Browse Products'}</span>
                  {hero.heroPrimaryBtnShowIcon !== false && <ArrowRight className="w-3 h-3" />}
                  {hero.heroPrimaryBtnNewTab && <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
                </Button>
                <Button size="sm" variant="outline" className="font-bold text-[11px] h-8 px-4 flex items-center gap-1.5">
                  {hero.heroSecondaryBtnShowIcon !== false && (
                    <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  )}
                  <span>{hero.heroSecondaryBtnText || "Today's Best Deals"}</span>
                  {hero.heroSecondaryBtnNewTab && <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />}
                </Button>
              </div>
            </div>

            {/* Right Preview */}
            <div className="md:col-span-5 relative">
              <div className="aspect-[4/3] w-full border border-border/80 bg-muted/20 relative overflow-hidden flex items-center justify-center">
                {hero.heroImageUrl ? (
                  hero.heroImageLink && hero.heroImageLink.trim() ? (
                    <a
                      href={hero.heroImageLink.trim()}
                      target={hero.heroImageNewTab ? '_blank' : undefined}
                      rel={hero.heroImageNewTab ? 'noopener noreferrer' : undefined}
                      className="w-full h-full block cursor-pointer group"
                      title={`Hero Link: ${hero.heroImageLink}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={hero.heroImageUrl}
                        alt={hero.heroImageAlt || 'Hero Showcase'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Clickable Link</span>
                      </span>
                    </a>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={hero.heroImageUrl}
                      alt={hero.heroImageAlt || 'Hero Showcase'}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-muted-foreground/50" />
                    <span className="text-xs font-semibold">No Image Selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: HERO IMAGE ATTACHMENT */}
        <div className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">Hero Showcase Image Attachment</h2>
                <p className="text-[11px] text-muted-foreground">
                  Upload a high-quality product banner or choose a preset (Recommended: 4:3 or 16:9 ratio, minimum 800px width).
                </p>
              </div>
            </div>
            {uploadMsg && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {uploadMsg}
              </span>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png,image/jpeg,image/webp,image/jpg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Reset file input so the same file can be re-uploaded
              e.target.value = '';
              if (file) handleImageUpload(file);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Image Preview Box */}
            <div className="md:col-span-4 aspect-[4/3] w-full border border-border relative overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center group">
              {hero.heroImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hero.heroImageUrl}
                    alt={hero.heroImageAlt || 'Hero Preview'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="text-xs font-bold h-8 px-3 bg-white/90 text-black hover:bg-white"
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleChange('heroImageUrl', '')}
                      className="text-xs font-bold h-8 px-3"
                    >
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center justify-center p-4 text-center text-muted-foreground hover:text-foreground transition-colors w-full h-full"
                >
                  <Upload className="w-8 h-8 mb-2 text-blue-600" />
                  <span className="text-xs font-bold">Attach Hero Image</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Click to upload from device</span>
                </div>
              )}

              {uploadingImage && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs gap-2 font-bold z-10">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading to server...
                </div>
              )}
            </div>

            {/* Upload Controls & URL */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2 shadow-xs"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{hero.heroImageUrl ? 'Upload / Replace Image' : 'Attach Image from Device'}</span>
                </Button>

                {hero.heroImageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleChange('heroImageUrl', '')}
                    className="text-xs text-red-600 hover:text-red-700 h-9 px-3"
                  >
                    Clear Image
                  </Button>
                )}
              </div>

              {/* Image URL Manual Input */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Image URL / File Path:
                </label>
                <Input
                  value={hero.heroImageUrl}
                  onChange={(e) => handleChange('heroImageUrl', e.target.value)}
                  placeholder="https://... or /uploads/..."
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Alt Text */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Image Alt Text (SEO & Accessibility):
                </label>
                <Input
                  value={hero.heroImageAlt}
                  onChange={(e) => handleChange('heroImageAlt', e.target.value)}
                  placeholder="e.g. MacBook Pro and tech accessories showcase"
                  className="h-8 text-xs"
                />
              </div>

              {/* Target Link */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Image Target Link (Optional - Leave empty if non-clickable):
                </label>
                <Input
                  value={hero.heroImageLink || ''}
                  onChange={(e) => handleChange('heroImageLink', e.target.value)}
                  placeholder="e.g. /products or https://... (clickable image link)"
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Open in New Tab */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="heroImageNewTab"
                  checked={hero.heroImageNewTab || false}
                  onChange={(e) => handleChange('heroImageNewTab', e.target.checked)}
                  className="rounded border-border text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="heroImageNewTab" className="text-xs text-foreground font-medium cursor-pointer">
                  Open Image Link in New Tab (<code className="text-[10px] text-muted-foreground font-mono">{'target="_blank"'}</code>)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: HEADLINES & SUBTITLE */}
        <div className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Hero Headlines & Text Content</h2>
              <p className="text-[11px] text-muted-foreground">
                Set the main attention-grabbing headline, supporting punchline, and description text.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Optional Badge */}
            <div>
              <label className="font-bold text-foreground block mb-1">
                Top Badge Tag (Optional)
              </label>
              <Input
                value={hero.heroBadgeText}
                onChange={(e) => handleChange('heroBadgeText', e.target.value)}
                placeholder="e.g. 🔥 REAL-TIME PRICE COMPARISON ENGINE"
                className="h-9 text-xs max-w-md font-semibold"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Leave empty to hide the badge pill.
              </span>
            </div>

            {/* Headline Line 1 & Line 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Headline Line 1 (Primary Dark Text) <span className="text-red-500">*</span>
                </label>
                <Input
                  value={hero.heroTitleLine1}
                  onChange={(e) => handleChange('heroTitleLine1', e.target.value)}
                  placeholder="Compare tech prices."
                  className="h-9 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Headline Line 2 (Muted / Highlight Text)
                </label>
                <Input
                  value={hero.heroTitleLine2}
                  onChange={(e) => handleChange('heroTitleLine2', e.target.value)}
                  placeholder="Never overpay."
                  className="h-9 text-xs font-bold"
                />
              </div>
            </div>

            {/* Subtitle */}
            <div>
              <label className="font-bold text-foreground block mb-1">
                Subtitle / Description Paragraph <span className="text-red-500">*</span>
              </label>
              <textarea
                value={hero.heroSubtitle}
                onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                rows={3}
                placeholder="Instantly compare real-time offers and verified discounts from Amazon, Walmart, Best Buy, and Target before making any purchase."
                className="w-full p-3 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none leading-relaxed"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: CALL TO ACTION BUTTONS */}
        <div className="border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Call To Action (CTA) Buttons</h2>
              <p className="text-[11px] text-muted-foreground">
                Configure the primary and secondary button labels and destination URLs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Primary Button */}
            <div className="p-4 border border-border bg-muted/20 space-y-3">
              <span className="font-bold text-foreground block text-xs uppercase tracking-wider text-blue-600">
                Primary Button (Dark Solid)
              </span>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Button Text:
                </label>
                <Input
                  value={hero.heroPrimaryBtnText}
                  onChange={(e) => handleChange('heroPrimaryBtnText', e.target.value)}
                  placeholder="Browse Products"
                  className="h-8 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Link Target (URL / Path):
                </label>
                <Input
                  value={hero.heroPrimaryBtnUrl}
                  onChange={(e) => handleChange('heroPrimaryBtnUrl', e.target.value)}
                  placeholder="/products"
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Primary Button Options */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(hero.heroPrimaryBtnNewTab)}
                    onChange={(e) => handleChange('heroPrimaryBtnNewTab', e.target.checked)}
                    className="w-4 h-4 rounded-none accent-blue-600 cursor-pointer"
                  />
                  <span>Open link in new tab (target=&quot;_blank&quot;)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={hero.heroPrimaryBtnShowIcon !== false}
                    onChange={(e) => handleChange('heroPrimaryBtnShowIcon', e.target.checked)}
                    className="w-4 h-4 rounded-none accent-blue-600 cursor-pointer"
                  />
                  <span>Show button icon (→ arrow)</span>
                </label>
              </div>
            </div>

            {/* Secondary Button */}
            <div className="p-4 border border-border bg-muted/20 space-y-3">
              <span className="font-bold text-foreground block text-xs uppercase tracking-wider text-amber-600">
                Secondary Button (Outline with Icon)
              </span>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Button Text:
                </label>
                <Input
                  value={hero.heroSecondaryBtnText}
                  onChange={(e) => handleChange('heroSecondaryBtnText', e.target.value)}
                  placeholder="Today's Best Deals"
                  className="h-8 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Link Target (URL / Path):
                </label>
                <Input
                  value={hero.heroSecondaryBtnUrl}
                  onChange={(e) => handleChange('heroSecondaryBtnUrl', e.target.value)}
                  placeholder="/products?sort=highest_savings"
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Secondary Button Options */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(hero.heroSecondaryBtnNewTab)}
                    onChange={(e) => handleChange('heroSecondaryBtnNewTab', e.target.checked)}
                    className="w-4 h-4 rounded-none accent-blue-600 cursor-pointer"
                  />
                  <span>Open link in new tab (target=&quot;_blank&quot;)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={hero.heroSecondaryBtnShowIcon !== false}
                    onChange={(e) => handleChange('heroSecondaryBtnShowIcon', e.target.checked)}
                    className="w-4 h-4 rounded-none accent-blue-600 cursor-pointer"
                  />
                  <span>Show button icon (🔥 fire)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-8 flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Hero Section Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
