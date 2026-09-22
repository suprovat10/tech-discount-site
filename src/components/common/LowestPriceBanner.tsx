import React from 'react';
import { ProductOffer } from '@/types/product';
import { formatCurrency, getRetailerBrandColor, getRetailerDisplayName } from '@/lib/utils';
import { Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';

interface LowestPriceBannerProps {
  bestOffer: ProductOffer;
  highestPrice?: number;
}

export function LowestPriceBanner({ bestOffer, highestPrice }: LowestPriceBannerProps) {
  const brandColors = getRetailerBrandColor(bestOffer.retailer);
  const potentialSavings = highestPrice && highestPrice > bestOffer.price ? highestPrice - bestOffer.price : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                Verified Best Deal
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-md ${brandColors.badge}`}>
                {bestOffer.retailerName || getRetailerDisplayName(bestOffer.retailer)}
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {formatCurrency(bestOffer.price)}
              </span>
              {potentialSavings > 0 && (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Save up to {formatCurrency(potentialSavings)} vs other retailers
                </span>
              )}
            </div>

            {bestOffer.shippingInfo && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{bestOffer.shippingInfo}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={bestOffer.internalGoUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="w-full sm:w-auto h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/25 inline-flex items-center justify-center gap-2 text-base transition-colors cursor-pointer"
          >
            <span>Shop at {bestOffer.retailerName || getRetailerDisplayName(bestOffer.retailer)}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
