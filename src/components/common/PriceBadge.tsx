import React from 'react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { Sparkles, TrendingDown } from 'lucide-react';

interface PriceBadgeProps {
  price: number;
  regularPrice?: number;
  isLowest?: boolean;
  savingsPercentage?: number;
}

export function PriceBadge({
  price,
  regularPrice,
  isLowest = false,
  savingsPercentage,
}: PriceBadgeProps) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-foreground">
          {formatCurrency(price)}
        </span>
        {regularPrice && regularPrice > price && (
          <span className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/60">
            {formatCurrency(regularPrice)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-1">
        {isLowest && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Lowest Price
          </span>
        )}

        {savingsPercentage && savingsPercentage > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            <TrendingDown className="w-3 h-3" />
            Save {formatPercentage(savingsPercentage)}
          </span>
        )}
      </div>
    </div>
  );
}
