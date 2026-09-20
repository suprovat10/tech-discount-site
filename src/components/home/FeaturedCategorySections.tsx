'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryDefinition, CATEGORIES } from '@/data/catalog';
import { UnifiedProduct } from '@/types/product';
import { DealCard } from '@/components/deals/DealCard';
import { getCategories, getCategorySlug } from '@/lib/categoryStore';

interface FeaturedCategorySectionsProps {
  initialCategories?: CategoryDefinition[];
  allProducts: UnifiedProduct[];
}

export function FeaturedCategorySections({
  initialCategories = CATEGORIES,
  allProducts,
}: FeaturedCategorySectionsProps) {
  const [categories, setCategories] = useState<CategoryDefinition[]>(initialCategories);

  useEffect(() => {
    const loaded = getCategories();
    if (loaded && loaded.length > 0) {
      setCategories(loaded);
    }
    const handleUpdate = () => {
      const fresh = getCategories();
      if (fresh && fresh.length > 0) setCategories(fresh);
    };
    window.addEventListener('smarttech_categories_updated', handleUpdate);
    return () => window.removeEventListener('smarttech_categories_updated', handleUpdate);
  }, []);

  // Filter only categories featured on home (limit to max 4)
  const featuredCategories = categories
    .filter((cat) => cat.isFeaturedOnHome)
    .slice(0, 4);

  if (featuredCategories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-12">
      {featuredCategories.map((category) => {
        // Find products matching this category
        const catNameLower = category.name.toLowerCase();
        const catSlugLower = category.slug.toLowerCase();

        let matchedProducts = allProducts.filter((p) => {
          const pCat = (p.category || '').toLowerCase();
          const pSub = (p.subcategory || '').toLowerCase();
          return (
            pCat.includes(catNameLower) ||
            catNameLower.includes(pCat) ||
            pCat.includes(catSlugLower) ||
            category.subcategories?.some(
              (s) => pSub.includes(s.name.toLowerCase()) || pSub.includes(s.slug.toLowerCase())
            )
          );
        });

        // If fewer than 4 matched, pad with fallback products so section looks full
        if (matchedProducts.length < 4) {
          const remaining = allProducts.filter(
            (p) => !matchedProducts.some((mp) => mp.id === p.id)
          );
          matchedProducts = [...matchedProducts, ...remaining].slice(0, 4);
        } else {
          matchedProducts = matchedProducts.slice(0, 4);
        }

        return (
          <CategoryShowcaseBlock
            key={category.id}
            category={category}
            products={matchedProducts}
          />
        );
      })}
    </div>
  );
}

function CategoryShowcaseBlock({
  category,
  products,
}: {
  category: CategoryDefinition;
  products: UnifiedProduct[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [products]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  return (
    <section className="space-y-4">
      {/* Category Header with Title, Description, and View All */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {category.name}
            </h2>
          </div>
          {category.description && (
            <p className="text-xs text-muted-foreground">{category.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Mobile Arrows */}
          <div className="flex sm:hidden items-center gap-1">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous items"
              className="p-1 border border-border bg-background text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Next items"
              className="p-1 border border-border bg-background text-foreground disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href={`/products/${category.slug || getCategorySlug([category], category.name)}`}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Products Grid / Horizontal Scroll on Mobile */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto sm:overflow-x-visible scrollbar-none [&::-webkit-scrollbar]:hidden scroll-smooth snap-x snap-mandatory sm:snap-none pb-2 sm:pb-0"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[260px] shrink-0 snap-start sm:w-auto sm:shrink sm:snap-align-none"
            >
              <DealCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
