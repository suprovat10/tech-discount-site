'use client';

import React from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { DealCard } from '../deals/DealCard';
import { Heart, Trash2, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export function WatchlistGrid() {
  const { watchlist, isLoaded, clearWatchlist } = useWatchlist();

  if (!isLoaded) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <div className="h-8 w-8 animate-spin border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
        <p>Loading your saved price watches...</p>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-20 px-4 border border-dashed border-border bg-card/50 max-w-2xl mx-auto space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center bg-rose-50 dark:bg-rose-950/50 text-rose-600">
          <Heart className="h-8 w-8 fill-rose-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Your Favourites List is Empty</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Click the heart icon on any product or deal to save it here and easily monitor price changes across retailers.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-none transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4 mr-2" />
          <span>Explore Tech Deals</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">
            Saved Watchlist ({watchlist.length})
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Locally stored in your browser. No account or personal data required.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearWatchlist}
          className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Clear All Saved
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {watchlist.map((product) => (
          <DealCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
