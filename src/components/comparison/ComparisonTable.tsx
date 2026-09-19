import React from 'react';
import { UnifiedProduct } from '@/types/product';
import { RetailerOfferRow } from './RetailerOfferRow';
import { LowestPriceBanner } from '../common/LowestPriceBanner';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface ComparisonTableProps {
  product: UnifiedProduct;
}

export function ComparisonTable({ product }: ComparisonTableProps) {
  const lowestOffer = product.offers.find((o) => o.isLowestPrice) || product.offers[0];

  return (
    <div className="space-y-6">
      {/* Lowest Price Banner */}
      {lowestOffer && (
        <LowestPriceBanner
          bestOffer={lowestOffer}
          highestPrice={product.highestPrice}
        />
      )}

      {/* Retailer Comparison List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            All Current Store Offers ({product.offers.length})
          </h3>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin-slow" />
            Live verified pricing
          </span>
        </div>

        <div className="space-y-2.5">
          {product.offers.map((offer) => (
            <RetailerOfferRow
              key={`${offer.retailer}-${offer.retailerItemId}`}
              offer={offer}
              isLowestPrice={offer.isLowestPrice}
            />
          ))}
        </div>
      </div>

      {/* Price Disclaimer */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Prices and availability are updated in real-time through official retailer data feeds. Retailers may change prices or inventory without notice. The price displayed on the retailer's checkout page will apply.
        </p>
      </div>
    </div>
  );
}
