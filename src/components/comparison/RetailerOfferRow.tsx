import React from 'react';
import { ProductOffer } from '@/types/product';
import { formatCurrency, formatPercentage, getRetailerBrandColor, getRetailerDisplayName } from '@/lib/utils';
import { ExternalLink, CheckCircle, XCircle, Sparkles, Truck, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';

interface RetailerOfferRowProps {
  offer: ProductOffer;
  isLowestPrice: boolean;
}

export function RetailerOfferRow({ offer, isLowestPrice }: RetailerOfferRowProps) {
  const brandColors = getRetailerBrandColor(offer.retailer);

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
        isLowestPrice
          ? 'bg-emerald-500/5 border-emerald-500/40 shadow-sm'
          : 'bg-card border-border hover:border-border/80'
      }`}
    >
      {/* Left: Retailer Logo / Identity & Stock */}
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl border font-bold text-xs shrink-0 ${brandColors.border} ${brandColors.bg}`}
        >
          <span className="font-extrabold tracking-tight">
            {offer.retailerName || getRetailerDisplayName(offer.retailer)}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">
              {offer.retailerName || getRetailerDisplayName(offer.retailer)}
            </span>
            {isLowestPrice && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                Best Price
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              {offer.isInStock ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    {offer.availabilityStatus}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 font-medium">Out of stock</span>
                </>
              )}
            </span>

            {offer.shippingInfo && (
              <span className="flex items-center gap-1 text-muted-foreground hidden md:flex">
                <Truck className="w-3.5 h-3.5" />
                <span>{offer.shippingInfo}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Price & Shop CTA */}
      <div className="flex items-center justify-between sm:justify-end gap-5">
        <div className="text-left sm:text-right">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {formatCurrency(offer.price)}
            </span>
            {offer.regularPrice && offer.regularPrice > offer.price && (
              <span className="text-xs font-medium text-muted-foreground line-through">
                {formatCurrency(offer.regularPrice)}
              </span>
            )}
          </div>

          {offer.savingsPercentage && offer.savingsPercentage > 0 && (
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Save {formatPercentage(offer.savingsPercentage)}
            </span>
          )}
        </div>

        <a
          href={offer.internalGoUrl}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="shrink-0"
        >
          <Button
            size="default"
            disabled={!offer.isInStock}
            className={`font-semibold text-xs flex items-center gap-1.5 min-w-[130px] justify-center ${
              isLowestPrice
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <span>Shop at {offer.retailerName || getRetailerDisplayName(offer.retailer)}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
    </div>
  );
}
