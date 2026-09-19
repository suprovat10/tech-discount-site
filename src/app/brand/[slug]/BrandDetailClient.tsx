'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UnifiedProduct } from '@/types/product';
import { BrandItem, DEFAULT_BRANDS } from '@/data/brands';
import { getBrands, getBrandBySlug } from '@/lib/brandStore';
import { getCatalogProducts } from '@/lib/catalogStore';
import { DealCard } from '@/components/deals/DealCard';
import { ChevronRight, ChevronLeft, ExternalLink, ShieldCheck, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRetailerDisplayName } from '@/lib/utils';

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
  
  // Pagination (20 per page as requested)
  const PRODUCTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setBrand(initialBrand);
    setProducts(initialProducts);
  }, [initialBrand, initialProducts, slug]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const liveBrand = getBrandBySlug(slug) || initialBrand;
        if (liveBrand) {
          setBrand(liveBrand);
          const allCatalog = getCatalogProducts();
          const brandProducts = allCatalog.filter(
            (p) => p.brand && p.brand.toLowerCase().trim() === liveBrand.name.toLowerCase().trim()
          );
          if (brandProducts.length > 0) {
            setProducts(
              brandProducts.map((p) => {
                const inStockPrices = p.offers.filter((o) => o.isInStock && o.price > 0).map((o) => o.price);
                const lowestPrice = inStockPrices.length > 0 ? Math.min(...inStockPrices) : Math.min(...p.offers.map((o) => o.price));
                const regularPrice = Math.max(...p.offers.map((o) => o.regularPrice || o.price));
                const maxSavingsPercentage = regularPrice > lowestPrice ? Math.round(((regularPrice - lowestPrice) / regularPrice) * 100) : 0;
                return {
                  id: p.id,
                  slug: p.slug,
                  title: p.title,
                  brand: p.brand,
                  category: p.category,
                  subcategory: p.subcategory,
                  badge: p.badge,
                  rating: p.rating,
                  ratingCount: p.reviewCount,
                  lowestPrice,
                  highestPrice: Math.max(...p.offers.map((o) => o.price)),
                  regularPrice,
                  maxSavingsPercentage,
                  imageUrl: p.imageUrl,
                  imageAlt: p.title,
                  offers: p.offers.map((o) => ({
                    retailer: o.retailer,
                    retailerName:
                      o.retailerName && o.retailerName.toLowerCase() !== 'custom'
                        ? o.retailerName
                        : getRetailerDisplayName(o.retailer),
                    retailerItemId: o.retailerItemId,
                    productUrl: o.productUrl,
                    directAffiliateUrl: o.productUrl,
                    internalGoUrl: o.productUrl,
                    price: o.price,
                    regularPrice: o.regularPrice,
                    currency: 'USD',
                    isLowestPrice: o.price === lowestPrice,
                    isInStock: o.isInStock,
                    availabilityStatus: o.availabilityStatus,
                    shippingInfo: o.shippingInfo,
                    condition: 'New',
                    lastUpdated: p.updatedAt || new Date().toISOString(),
                  })),
                  specs: p.specs,
                  features: p.features,
                  description: p.description,
                  richDescription: p.richDescription,
                  lastUpdated: p.updatedAt || new Date().toISOString(),
                  updatedAt: p.updatedAt || new Date().toISOString(),
                };
              })
            );
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('smarttech_catalog_updated', handleSync);
    window.addEventListener('smarttech_brands_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('smarttech_catalog_updated', handleSync);
      window.removeEventListener('smarttech_brands_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [slug, initialBrand]);

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

  const brandDisplayName = brand?.name || slug.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="space-y-8 pb-16 max-w-[1200px] mx-auto">
      {/* Breadcrumbs */}
      <nav
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pb-2.5 border-b border-border/60 overflow-x-auto whitespace-nowrap scrollbar-none [&::-webkit-scrollbar]:hidden py-1"
      >
        <Link href="/" className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <Link href="/products" className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
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
                src={brand.logoUrl}
                alt={brandDisplayName}
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
            className="shrink-0"
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold h-9 px-4 flex items-center gap-1.5"
            >
              <span>Visit Official Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
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
              ● Real-time multi-store prices
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

        {paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
              {paginatedProducts.map((product) => (
                <DealCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground font-medium">
                  Showing <span className="font-bold text-foreground">{(currentPage - 1) * PRODUCTS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-bold text-foreground">
                    {Math.min(currentPage * PRODUCTS_PER_PAGE, sortedProducts.length)}
                  </span>{' '}
                  of <span className="font-bold text-foreground">{sortedProducts.length}</span> products
                </p>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 text-xs font-bold transition-colors border cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                          : 'bg-background text-muted-foreground hover:text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
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
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-none transition-colors cursor-pointer"
            >
              Browse All Deals
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
