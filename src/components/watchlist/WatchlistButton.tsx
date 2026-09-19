'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { UnifiedProduct } from '@/types/product';
import { Button } from '../ui/button';

interface WatchlistButtonProps {
  product: UnifiedProduct;
  variant?: 'icon' | 'full';
  className?: string;
}

export function WatchlistButton({ product, variant = 'icon', className = '' }: WatchlistButtonProps) {
  const { isSaved, toggleWatchlist } = useWatchlist();
  if (!product) return null;

  const saved = isSaved(product.id) || isSaved(product.slug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(product);
  };

  if (variant === 'full') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className={`flex items-center gap-2 border-border text-xs font-bold h-9 px-4 transition-all active:scale-95 ${
          saved
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 shadow-xs'
            : 'hover:bg-muted text-muted-foreground hover:text-rose-600 hover:border-rose-300'
        } ${className}`}
      >
        <Heart className={`w-4 h-4 transition-transform duration-200 ${saved ? 'fill-rose-600 text-rose-600 scale-110' : ''}`} />
        <span>{saved ? 'Saved in Watchlist' : 'Save to Watchlist'}</span>
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from Saved' : 'Save to Watchlist'}
      title={saved ? 'Remove from Saved' : 'Save to Watchlist'}
      className={`w-9 h-9 border flex items-center justify-center transition-all active:scale-90 shrink-0 ${
        saved
          ? 'bg-rose-50 border-rose-400 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800 shadow-xs'
          : 'bg-background hover:bg-muted/60 border-border text-muted-foreground hover:text-rose-600 hover:border-rose-300'
      } ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-transform duration-200 ${
          saved ? 'fill-rose-600 text-rose-600 scale-110' : ''
        }`}
      />
    </button>
  );
}

