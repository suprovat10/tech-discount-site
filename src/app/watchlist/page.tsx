import React from 'react';
import { Metadata } from 'next';
import { WatchlistGrid } from '@/components/watchlist/WatchlistGrid';

export const metadata: Metadata = {
  title: 'My Saved Watchlist | TechPrice US',
  description: 'View your saved tech price watches across Amazon, Walmart, Best Buy, and Target.',
};

export default function WatchlistPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-10">
      <WatchlistGrid />
    </div>
  );
}
