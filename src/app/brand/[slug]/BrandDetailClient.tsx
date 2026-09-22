'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UnifiedProduct } from '@/types/product';
import { BrandItem, DEFAULT_BRANDS } from '@/data/brands';
import { getBrands, getBrandBySlug } from '@/lib/brandStore';
import { getCatalogProducts, fetchAndSyncCatalogFromServer } from '@/lib/catalogStore';
import { transformCatalogItemToUnified } from '@/lib/productTransform';
import { DealCard } from '@/components/deals/DealCard';
import { ChevronRight, ChevronLeft, ExternalLink, ShieldCheck, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRetailerDisplayName } from '@/lib/utils';
import { optimizeCloudinaryUrl } from '@/lib/imageOptimization';

interface BrandDetailClientProps {
  slug: string;
  initialBrand?: BrandItem;
  initialProducts: UnifiedProduct[];
}

export function BrandDetailClient({
  slug,
  initialBrand,
  initialProducts,
}: BrandDetailClientProps) {
  const [brand, setBrand] = useState<BrandItem | undefined>(initialBrand);
  const [products, setProducts] = useState<UnifiedProduct[]>(initialProducts);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PRODUCTS_PER_PAGE = 20;

  // Load and remember user sort preference across browser visits
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

  const syncBrandProducts = async (forceRemote = false) => {
    try {
      const liveBrand = getBrandBySlug(slug);
      if (liveBrand) {
        setBrand(liveBrand);
      }
      const localCatalog = getCatalogProducts();
      if (Array.isArray(localCatalog) && localCatalog.length > 0 && liveBrand) {
        const brandProducts = localCatalog.filter(
          (p) => p.brand && p.brand.toLowerCase().trim() === liveBrand.name.toLowerCase().trim()
        );
        if (brandProducts.length > 0) {
          setProducts(brandProducts.map(transformCatalogItemToUnified));
        }
      }

      if (forceRemote || (initialProducts.length === 0 && (!localCatalog || localCatalog.length === 0))) {
        const allCatalog = await fetchAndSyncCatalogFromServer();
        if (liveBrand && Array.isArray(allCatalog)) {
          const brandProducts = allCatalog.filter(
            (p) => p.brand && p.brand.toLowerCase().trim() === liveBrand.name.toLowerCase().trim()
          );
          if (brandProducts.length > 0) {
            setProducts(brandProducts.map(transformCatalogItemToUnified));
          }
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    syncBrandProducts(false);
    const onUpdate = () => syncBrandProducts(true);
    window.addEventListener('smarttech_catalog_updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('smarttech_catalog_updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [slug]);

  const sortedProducts = React.useMemo(() => {
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

  const brandDisplayName = brand?.name || slug.replace(/-/g, ' ').toUpperCase();

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
          Brands
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <span className="text-foreground font-semibold shrink-0 whitespace-nowrap truncate">{brandDisplayName}</span>
      </nav>

      {/* Brand Profile Banner */}
      <div className="p-6 border border-border/80 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Transparent Logo Box */}
          <div className="h-16 w-24 sm:h-20 sm:w-28 p-2 bg-muted/20 border border-border/70 flex items-center justify-center shrink-0">
            {brand?.logoUrl ? (
              <img
                src={optimizeCloudinaryUrl(brand.logoUrl, 300)}
                alt={brandDisplayName}
                loading="lazy"
                decoding="async"
                className="h-10 sm:h-12 w-auto max-w-[90%] object-contain dark:invert"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-xl font-black text-foreground">
                {brandDisplayName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {brandDisplayName}
              </h1>
              <span className="px-2 py-0.5 bg-blue-600/10 text-blue-600 border border-blue-600/20 font-bold text-[10px] uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Partner</span>
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {products.length} live verified deals and lowest 4-store comparison prices
            </p>
          </div>
        </div>

        {/* External Website Button */}
        {brand?.website && (
          <a
            href={brand.website}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold h-9 px-4 border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer rounded-none"
          >
            <span>Visit Official Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Products Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
              {brandDisplayName} Products ({sortedProducts.length})
            </h2>
            <span className="text-xs text-muted-foreground font-semibold">
              ● Showing 20 items per page • Real-time multi-store prices
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-8 px-2.5 border border-border bg-background text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="latest">Latest Products</option>
              <option value="lowest_price">Lowest Price</option>
              <option value="highest_savings">Highest Savings</option>
              <option value="rating">Top Rated</option>
              <option value="highest_price">Highest Price</option>
            </select>
          </div>
        </div>

        {sortedProducts.length > 0 ? (
          <>
            {/* Mobile 2 Columns & Desktop 3-4 Columns */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
              {paginatedProducts.map((product, idx) => (
                <DealCard key={product.id} product={product} priority={idx < 4} />
              ))}
            </div>

            {/* Pagination Controls (20 Products Per Page) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 mt-[30px] border-t border-border/60">
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-bold text-foreground">{(currentPage - 1) * PRODUCTS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-bold text-foreground">
                    {Math.min(currentPage * PRODUCTS_PER_PAGE, sortedProducts.length)}
                  </span>{' '}
                  of <span className="font-bold text-foreground">{sortedProducts.length}</span> deals
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="h-8 px-2 text-xs font-bold gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </Button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 text-xs font-bold transition-colors cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'border border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={pageNum} className="px-1 text-muted-foreground text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="h-8 px-2 text-xs font-bold gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 border border-border/80 bg-card text-center space-y-4">
            <div className="w-12 h-12 bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">No Products Found for {brandDisplayName}</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                We couldn&apos;t find any active deals under this brand. Check back soon or explore our featured deals!
              </p>
            </div>
            <Link
              href="/products"
              prefetch={true}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 inline-flex items-center justify-center transition-colors cursor-pointer rounded-none"
            >
              Browse All Deals
            </Link>
          </div>
        )}
      </section>

      {/* Brand Rich Description Section below products / pagination */}
      {(brand?.richDescription || brand?.description) && (
        <div
          style={{ marginTop: '70px' }}
          className="!mt-[70px] sm:!mt-[80px] p-6 sm:p-8 bg-card border border-border/80 shadow-2xs"
        >
          <div
            className="text-xs sm:text-sm text-foreground/90 font-normal leading-relaxed prose dark:prose-invert max-w-none [&_h1]:text-xl [&_h1]:font-black [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_img]:rounded-md [&_img]:max-w-full [&_img]:my-3"
            dangerouslySetInnerHTML={{ __html: brand.richDescription || brand.description || '' }}
          />
        </div>
      )}
    </div>
  );
}
