'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { WatchlistToast } from '@/components/watchlist/WatchlistToast';

export function StoreLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/supro111vat29') || pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header />
        <main>{children}</main>
      </div>
      <Footer />
      <WatchlistToast />
    </div>
  );
}

