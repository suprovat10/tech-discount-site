'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BrandItem, DEFAULT_BRANDS } from '@/data/brands';
import { getBrands, fetchAndSyncBrandsFromServer } from '@/lib/brandStore';
import { optimizeCloudinaryUrl } from '@/lib/imageOptimization';

export function BrandShowcaseSection() {
  const [brands, setBrands] = useState<BrandItem[]>(DEFAULT_BRANDS);

  useEffect(() => {
    setBrands(getBrands());
    fetchAndSyncBrandsFromServer().then((fresh) => {
      if (fresh) setBrands(fresh);
    });
    const handleUpdate = () => setBrands(getBrands());
    window.addEventListener('smarttech_brands_updated', handleUpdate);
    return () => window.removeEventListener('smarttech_brands_updated', handleUpdate);
  }, []);

  // Filter only active brands that have the homepage tick option enabled
  const visibleBrands = brands.filter((b) => b.showOnHomepage && b.isActive);

  if (visibleBrands.length === 0) return null;

  return (
    <section className="my-6 border border-border/80 bg-card p-4 sm:p-5 shadow-2xs">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
            Shop by Brand
          </h2>
        </div>
        <Link
          href="/retailers"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>View all brands</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Brand Logos Grid: Same Height, Auto Width, Transparent Logos */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
        {visibleBrands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brand/${brand.slug}`}
            className="group relative flex flex-col items-center justify-center p-3 sm:p-4 bg-card hover:bg-muted/30 border border-border/80 hover:border-blue-600 transition-all duration-200"
            title={`View all deals from ${brand.name}`}
          >
            {/* Logo Container with fixed height and auto width */}
            <div className="h-9 sm:h-10 w-full flex items-center justify-center">
              {brand.logoUrl ? (
                <img
                  src={optimizeCloudinaryUrl(brand.logoUrl, 160)}
                  alt={brand.name}
                  width={100}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  className="h-7 sm:h-8 w-auto max-w-[85%] object-contain dark:invert transition-transform duration-200 group-hover:scale-110"
                  onError={(e) => {
                    // fallback to text if logo image fails
                    const el = e.target as HTMLElement;
                    el.style.display = 'none';
                    if (el.nextElementSibling) {
                      (el.nextElementSibling as HTMLElement).style.display = 'block';
                    }
                  }}
                />
              ) : null}
              <span
                className={`font-black text-xs sm:text-sm text-foreground tracking-tight ${
                  brand.logoUrl ? 'hidden' : 'block'
                }`}
              >
                {brand.name}
              </span>
            </div>

            {/* Brand Name Text underneath */}
            <span className="mt-2 text-[11px] font-bold text-muted-foreground group-hover:text-blue-600 transition-colors truncate max-w-full text-center">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
