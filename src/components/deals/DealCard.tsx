'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UnifiedProduct } from '@/types/product';
import { formatCurrency } from '@/lib/utils';
import { WatchlistButton } from '../watchlist/WatchlistButton';
import { Star, ArrowRight } from 'lucide-react';

interface DealCardProps {
  product: UnifiedProduct;
}

export function DealCard({ product }: DealCardProps) {
  const rating = product.rating || 4.8;
  const regularPrice = product.regularPrice;
  const lowestPrice = product.lowestPrice;
  const hasDiscount = regularPrice && regularPrice > lowestPrice;
  const savingsAmount = hasDiscount && regularPrice ? regularPrice - lowestPrice : 0;
  const discountPercent =
    product.maxSavingsPercentage && product.maxSavingsPercentage > 0
      ? Math.round(product.maxSavingsPercentage)
      : hasDiscount && regularPrice
      ? Math.round(((regularPrice - lowestPrice) / regularPrice) * 100)
      : 0;

  const ALLOWED_BADGES = ['Best Seller', 'Editors Choice', 'Hot Deal'];
  const hasValidBadge = product.badge && ALLOWED_BADGES.includes(product.badge);

  const productUrl = `/product/${product.slug}`;

  return (
    <div className="group relative flex flex-col justify-between border border-border/80 bg-card p-2.5 sm:p-4 transition-all duration-200 hover:border-foreground/40 hover:shadow-md cursor-pointer">
      {/* 1. Primary Full-Card Stretched Link: 1 single click navigates anywhere on the card */}
      <Link
        href={productUrl}
        className="absolute inset-0 z-0"
        aria-label={`View ${product.title}`}
        prefetch={true}
      />

      {/* Product Image: Strictly 5:4 Aspect Ratio, Edge-to-Edge */}
      <div className="relative mb-2 sm:mb-3 block aspect-[5/4] w-full overflow-hidden bg-muted/20 pointer-events-none">
        <Image
          src={product.imageUrl}
          alt={product.imageAlt || product.title}
          fill
          className="object-cover transition-transform duration-300 md:group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          unoptimized
        />

        {/* Discount Badge over Image */}
        {discountPercent > 0 && (
          <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 px-1.5 sm:px-2 py-0.5 bg-emerald-600 text-white font-bold text-[9px] sm:text-[10px] tracking-wider uppercase shadow-sm">
            -{discountPercent}% OFF
          </span>
        )}

        {/* Custom Badge over Image */}
        {hasValidBadge && (
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 px-1.5 sm:px-2 py-0.5 bg-amber-500 text-white font-bold text-[9px] sm:text-[10px] tracking-wider uppercase shadow-sm">
            {product.badge}
          </span>
        )}
      </div>

      {/* Rating on Left & Brand on Right, followed by Title */}
      <div className="space-y-1 sm:space-y-1.5 flex-1 pointer-events-none">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold gap-1">
          <div className="flex items-center gap-1 text-muted-foreground shrink-0">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-foreground font-bold">{rating}</span>
            <span className="text-muted-foreground/80 hidden xs:inline sm:inline">({product.ratingCount || 120})</span>
          </div>
          {/* Brand Link: elevated above stretched link with relative z-10 and pointer-events-auto */}
          <Link
            href={`/brand/${(product.brand || 'tech').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            className="uppercase tracking-wider text-[9px] sm:text-[10px] font-black text-muted-foreground hover:text-blue-600 transition-colors truncate max-w-[65px] sm:max-w-none text-right relative z-10 pointer-events-auto"
            title={`View all ${product.brand} deals`}
          >
            {product.brand}
          </Link>
        </div>

        <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug min-h-[32px] sm:min-h-[40px]">
          {product.title}
        </h3>
      </div>

      {/* Pricing Display: Lowest Price & Discounted/Regular Price */}
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/60 space-y-1.5 sm:space-y-2 pointer-events-none">
        <div className="space-y-0.5">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">Lowest:</span>
            <span className="text-base sm:text-lg font-black text-foreground shrink-0">
              {formatCurrency(lowestPrice)}
            </span>
          </div>

          {hasDiscount && (
            <div className="flex items-baseline justify-between text-[10px] sm:text-xs gap-1">
              <span className="text-[9px] sm:text-[11px] text-muted-foreground truncate">Reg:</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-muted-foreground line-through font-semibold text-[10px] sm:text-xs">
                  {formatCurrency(regularPrice)}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  (-{formatCurrency(savingsAmount)})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Row: Check Price Button + Watchlist Heart */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
          <div className="flex-1 min-w-0 inline-flex items-center justify-center text-[11px] sm:text-xs font-bold h-8 sm:h-9 px-1.5 sm:px-3 border border-border bg-background group-hover:bg-foreground group-hover:text-background transition-colors gap-1.5 text-foreground rounded-none">
            <span>Check Price</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          </div>
          {/* Watchlist Button: elevated above stretched link with relative z-10 and pointer-events-auto */}
          <div className="relative z-10 pointer-events-auto">
            <WatchlistButton product={product} className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
        </div>
      </div>
    </div>
  );
}

