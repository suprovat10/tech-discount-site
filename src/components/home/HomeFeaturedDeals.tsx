'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedProduct } from '@/types/product';
import { DealCard } from '@/components/deals/DealCard';
import { getCatalogProducts } from '@/lib/catalogStore';
import { transformCatalogItemToUnified } from '@/lib/adapters';

interface HomeFeaturedDealsProps {
  initialDeals: UnifiedProduct[];
}

export function HomeFeaturedDeals({ initialDeals }: HomeFeaturedDealsProps) {
  const [deals, setDeals] = useState<UnifiedProduct[]>(initialDeals);

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const local = getCatalogProducts();
        if (Array.isArray(local) && local.length > 0) {
          const unified = local.map(transformCatalogItemToUnified);
          setDeals(unified.slice(0, 8));
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('smarttech_catalog_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('smarttech_catalog_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
      {deals.map((product) => (
        <DealCard key={product.id} product={product} />
      ))}
    </div>
  );
}
