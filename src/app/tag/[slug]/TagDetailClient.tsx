'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { UnifiedProduct } from '@/types/product';
import { ProductTag } from '@/types/tag';
import { getProductTags, slugifyTag } from '@/lib/productTagStore';
import { getCatalogProducts, fetchAndSyncCatalogFromServer } from '@/lib/catalogStore';
import { transformCatalogItemToUnified } from '@/lib/productTransform';
import { DealCard } from '@/components/deals/DealCard';
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Tag as TagIcon,
  Package,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TagDetailClientProps {
  slug: string;
  initialTag?: ProductTag;
  tagName: string;
  initialProducts: UnifiedProduct[];
}

export function TagDetailClient({
  slug,
  initialTag,
  tagName,
  initialProducts,
}: TagDetailClientProps) {
  const [tag, setTag] = useState<ProductTag | undefined>(initialTag);
  const [products, setProducts] = useState<UnifiedProduct[]>(initialProducts);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PRODUCTS_PER_PAGE = 20;

  // Load saved sort preference
  useEffect(() => {
    try {
      const savedSort = localStorage.getItem('smarttech_sort_preference');
      if (savedSort) {
        setSortBy(savedSort);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    try {
      localStorage.setItem('smarttech_sort_preference', newSort);
    } catch {
      // ignore
    }
  };

  const syncTagProducts = async () => {
    try {
      const tags = getProductTags();
      const liveTag = tags.find((t) => t.slug === slug || slugifyTag(t.name) === slug);
      if (liveTag) {
        setTag(liveTag);
      }

      const allCatalog = await fetchAndSyncCatalogFromServer();
      if (Array.isArray(allCatalog)) {
        const matching = allCatalog.filter((p) => {
          if (Array.isArray(p.tags) && p.tags.some((t) => slugifyTag(t) === slug)) {
            return true;
          }
          if (p.brand && slugifyTag(p.brand) === slug) return true;
          if (p.category && slugifyTag(p.category) === slug) return true;
          if (p.subcategory && slugifyTag(p.subcategory) === slug) return true;
          return false;
        });
        if (matching.length > 0) {
          setProducts(matching.map(transformCatalogItemToUnified));
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    syncTagProducts();
    window.addEventListener('smarttech_catalog_updated', syncTagProducts);
    window.addEventListener('smarttech_product_tags_updated', syncTagProducts);
    window.addEventListener('storage', syncTagProducts);
    return () => {
      window.removeEventListener('smarttech_catalog_updated', syncTagProducts);
      window.removeEventListener('smarttech_product_tags_updated', syncTagProducts);
      window.removeEventListener('storage', syncTagProducts);
    };
  }, [slug]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (sortBy === 'latest') {
        const dateA = new Date(a.updatedAt || a.lastUpdated || 0).getTime();
        const dateB = new Date(b.updatedAt || b.lastUpdated || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.id.localeCompare(a.id);
      }
      if (sortBy === 'lowest_price') return a.lowestPrice - b.lowestPrice;
      if (sortBy === 'highest_savings') return (b.maxSavingsPercentage || 0) - (a.maxSavingsPercentage || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'highest_price') return b.lowestPrice - a.lowestPrice;
      return 0;
    });
  }, [products, sortBy]);

  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE) || 1;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const displayName = tag?.name || tagName;

  return (
    <div className="space-y-8 pb-16 max-w-[1200px] mx-auto">
      {/* Breadcrumbs */}
      <nav
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pb-2.5 border-b border-border/60 overflow-x-auto whitespace-nowrap scrollbar-none [&::-webkit-scrollbar]:hidden py-1"
      >
        <Link href="/" prefetch={true} className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <Link href="/products" prefetch={true} className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
          Products
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <span className="text-muted-foreground shrink-0">Tags</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <span className="text-foreground font-semibold shrink-0 whitespace-nowrap truncate">{displayName}</span>
      </nav>

      {/* Tag Profile Banner (Styled like Brand Profile Banner) */}
      <div className="p-6 border border-border/80 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center shrink-0 text-blue-600">
            <TagIcon className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                #{displayName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3 h-3" />
                Product Tag
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {tag?.description ||
                `Browse verified tech price drops, deals, and multi-store comparisons for products tagged #${displayName}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-border/60 sm:pl-6 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-left sm:text-right">
            <div className="text-2xl font-black text-blue-600">{products.length}</div>
            <div className="text-[11px] font-medium text-muted-foreground">Active Deals</div>
          </div>
          <Link
            href="/products"
            prefetch={true}
            className="border border-border bg-background hover:bg-muted text-foreground text-xs font-bold gap-1.5 h-9 px-3 rounded-none inline-flex items-center justify-center transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Deals</span>
          </Link>
        </div>
      </div>

      {/* Sorting & Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Deals matching &quot;{displayName}&quot;
          </h2>
          <p className="text-xs text-muted-foreground">
            Showing {paginatedProducts.length} of {sortedProducts.length} deals
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <label htmlFor="tag-sort-select" className="text-xs font-bold text-muted-foreground">
            Sort by:
          </label>
          <select
            id="tag-sort-select"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-xs font-bold bg-card border border-border px-3 py-1.5 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="latest">Latest Added</option>
            <option value="lowest_price">Lowest Price</option>
            <option value="highest_savings">Biggest Savings ($)</option>
            <option value="rating">Highest Rated</option>
            <option value="highest_price">Highest Price</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {paginatedProducts.map((p) => (
            <DealCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-border/80 bg-muted/20 space-y-4 rounded-xl">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Products Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              There are currently no products tagged with &quot;{displayName}&quot;. Check back soon or explore other deals!
            </p>
          </div>
          <Link
            href="/products"
            prefetch={true}
            className="font-bold text-xs gap-1.5 h-9 px-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 inline-flex items-center justify-center transition-opacity hover:opacity-90 cursor-pointer rounded-none"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Browse All Products</span>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-xs font-bold gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={`text-xs font-bold w-8 h-8 p-0 ${
                  currentPage === page ? 'bg-blue-600 text-white' : ''
                }`}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="text-xs font-bold gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
