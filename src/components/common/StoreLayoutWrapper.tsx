'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { WatchlistToast } from '@/components/watchlist/WatchlistToast';
import { useBranding } from '@/hooks/useBranding';

const StorePopupModal = dynamic(
  () => import('@/components/popup/StorePopupModal').then((mod) => mod.StorePopupModal),
  { ssr: false }
);

export function StoreLayoutWrapper({ children }: { children: React.ReactNode }) {
  useBranding();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/supro111vat29') || pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <React.Suspense fallback={<div className="h-16 border-b border-border/60 bg-background" />}>
          <Header />
        </React.Suspense>
        <main>{children}</main>
      </div>
      <Footer />
      <WatchlistToast />
      <StorePopupModal />
    </div>
  );
}

