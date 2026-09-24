import React from 'react';
import { UnifiedProduct } from '@/types/product';
import { DealCard } from './DealCard';
import { ArrowRight, Flame } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

interface FeaturedDealsGridProps {
  deals: UnifiedProduct[];
  title?: string;
}

export function FeaturedDealsGrid({
  deals,
  title = 'Top Tech Price Drops',
}: FeaturedDealsGridProps) {
  if (!deals || deals.length === 0) return null;

  return (
    <section className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Flame className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {title}
          </h2>
        </div>

        <Link
          href="/products"
          className="border border-border bg-background hover:bg-muted font-bold text-sm rounded-xl px-5 h-11 inline-flex items-center gap-2 transition-colors cursor-pointer text-foreground"
        >
          <span>View All Deals</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {deals.map((product) => (
          <DealCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
