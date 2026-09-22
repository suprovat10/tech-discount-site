'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '@/types/settings';
import { optimizeImageUrl, getHeroSrcSet, getHeroSizes } from '@/lib/imageOptimization';

interface HeroSectionProps {
  initialSettings?: Partial<SiteSettings>;
}

export function HeroSection({ initialSettings }: HeroSectionProps) {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    ...DEFAULT_SITE_SETTINGS,
    ...initialSettings,
  });

  useEffect(() => {
    // Check localStorage
    try {
      const stored = localStorage.getItem('smarttech_admin_settings');
      if (stored) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {
      // ignore
    }

    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('smarttech_admin_settings');
        if (stored) {
          setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('smarttech_hero_updated', handleUpdate);
    window.addEventListener('smarttech_branding_updated', handleUpdate);
    return () => {
      window.removeEventListener('smarttech_hero_updated', handleUpdate);
      window.removeEventListener('smarttech_branding_updated', handleUpdate);
    };
  }, []);

  const titleLine1 = settings.heroTitleLine1 || 'Compare tech prices.';
  const titleLine2 = settings.heroTitleLine2 || 'Never overpay.';
  const subtitle =
    settings.heroSubtitle ||
    'Instantly compare real-time offers and verified discounts from Amazon, Walmart, Best Buy, and Target before making any purchase.';
  const imageUrl = settings.heroImageUrl || '/hero.webp';
  const imageAlt = settings.heroImageAlt || 'MacBook and Tech Gear';
  const primaryText = settings.heroPrimaryBtnText || 'Browse Products';
  const primaryUrl = (settings.heroPrimaryBtnUrl === '/search' ? '/products' : settings.heroPrimaryBtnUrl) || '/products';
  const secondaryText = settings.heroSecondaryBtnText || "Today's Best Deals";
  const secondaryUrl = (settings.heroSecondaryBtnUrl === '/search?sortBy=highest_savings' || settings.heroSecondaryBtnUrl === '/products?sort=highest_savings' ? '/products?sort=highest-savings' : settings.heroSecondaryBtnUrl) || '/products?sort=highest-savings';
  const badgeText = settings.heroBadgeText;

  return (
    <section className="py-8 md:py-14 border-b border-border/60">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side: Headline, Subtitle, CTA */}
        <div className="md:col-span-7 space-y-5">
          {badgeText && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{badgeText}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
            {titleLine1} <br />
            <span className="text-muted-foreground font-semibold">{titleLine2}</span>
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg font-medium leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={primaryUrl}
              target={settings.heroPrimaryBtnNewTab ? '_blank' : undefined}
              rel={settings.heroPrimaryBtnNewTab ? 'noopener noreferrer' : undefined}
              prefetch={true}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs h-10 px-5 inline-flex items-center gap-2 transition-colors cursor-pointer rounded-none"
            >
              <span>{primaryText}</span>
              {settings.heroPrimaryBtnShowIcon !== false && <ArrowRight className="w-3.5 h-3.5" />}
            </Link>
            <Link
              href={secondaryUrl}
              target={settings.heroSecondaryBtnNewTab ? '_blank' : undefined}
              rel={settings.heroSecondaryBtnNewTab ? 'noopener noreferrer' : undefined}
              prefetch={true}
              className="border border-input bg-background hover:bg-accent hover:text-accent-foreground font-bold text-xs h-10 px-5 inline-flex items-center gap-1.5 transition-colors cursor-pointer rounded-none"
            >
              {settings.heroSecondaryBtnShowIcon !== false && (
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              )}
              <span>{secondaryText}</span>
            </Link>
          </div>
        </div>

        {/* Right Side: Hero Image Showcase */}
        <div className="md:col-span-5 relative">
          <div className="relative aspect-[4/3] w-full border border-border/80 bg-muted/20 p-2 sm:p-4 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimizeImageUrl(imageUrl, 480)}
              srcSet={getHeroSrcSet(imageUrl)}
              sizes={getHeroSizes()}
              alt={imageAlt}
              width={600}
              height={450}
              fetchPriority="high"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/hero.webp';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
