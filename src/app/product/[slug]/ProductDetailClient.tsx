'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UnifiedProduct } from '@/types/product';
import { CATEGORIES, CatalogItem } from '@/data/catalog';
import { getCatalogProductByIdOrSlug, getCatalogProducts, fetchAndSyncCatalogFromServer } from '@/lib/catalogStore';
import { getCategories, getCategorySlug, getSubcategorySlug } from '@/lib/categoryStore';
import { DealCard } from '@/components/deals/DealCard';
import { WatchlistButton } from '@/components/watchlist/WatchlistButton';
import { formatCurrency, getRetailerDisplayName, getRetailerHexColor } from '@/lib/utils';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Star,
  ExternalLink,
  ShieldCheck,
  Truck,
  ArrowRight,
  Layers,
  Store,
  CheckCircle2,
  FileText,
  HelpCircle,
  Sparkles,
  Filter,
  RotateCcw,
  Package,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { transformCatalogItemToUnified } from '@/lib/adapters';

interface ProductDetailClientProps {
  product?: UnifiedProduct | null;
  slug?: string;
  relatedProducts: UnifiedProduct[];
}

export function ProductDetailClient({ product, slug = '', relatedProducts }: ProductDetailClientProps) {
  const [activeProduct, setActiveProduct] = useState<UnifiedProduct | null>(product || null);
  const [categories, setCategories] = useState(CATEGORIES);
  const [catalogProducts, setCatalogProducts] = useState<CatalogItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [product?.category || '']: true,
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Sync categories & catalog products from persistent store + client fallback lookup
  useEffect(() => {
    try {
      const allCats = getCategories();
      setCategories(allCats);
      const allProds = getCatalogProducts();
      if (allProds && allProds.length > 0) {
        setCatalogProducts(allProds);
      }
      fetchAndSyncCatalogFromServer().then((fresh) => {
        if (fresh && fresh.length > 0) {
          setCatalogProducts(fresh);
        }
      });

      if (product) {
        setActiveProduct(product);
      } else if (slug) {
        const localItem = getCatalogProductByIdOrSlug(slug);
        if (localItem) {
          const unified = transformCatalogItemToUnified(localItem);
          setActiveProduct(unified);
        }
      }
    } catch {
      // ignore
    }
  }, [product, slug]);

  useEffect(() => {
    if (activeProduct?.category) {
      setExpandedCategories((prev) => ({
        ...prev,
        [activeProduct.category]: true,
      }));
    }
  }, [activeProduct?.category]);

  const matchesCategory = (p: UnifiedProduct | CatalogItem, catName: string) => {
    return (p.category || '').toLowerCase() === catName.toLowerCase();
  };

  const matchesSubcategory = (p: UnifiedProduct | CatalogItem, subName: string) => {
    return (p.subcategory || '').toLowerCase() === subName.toLowerCase();
  };

  // Dynamically discover all platforms/stores present across catalog products and active product
  const availablePlatforms = React.useMemo(() => {
    const storeMap = new Map<string, { id: string; name: string; color: string }>();

    // Standard baseline stores
    const defaultStores = [
      { id: 'amazon', name: 'Amazon', color: '#FF9900' },
      { id: 'walmart', name: 'Walmart', color: '#0071DC' },
      { id: 'bestbuy', name: 'Best Buy', color: '#FFE000' },
      { id: 'target', name: 'Target', color: '#CC0000' },
    ];
    defaultStores.forEach((s) => storeMap.set(s.id.toLowerCase(), s));

    // Discover any custom stores from catalog products
    catalogProducts.forEach((p) => {
      (p.offers || []).forEach((o) => {
        if (o.retailer) {
          const rawId = o.retailer.trim();
          const key = rawId.toLowerCase();
          const rawName = (o.retailerName || '').trim();
          const displayName = (rawName && rawName.toLowerCase() !== 'custom')
            ? rawName
            : getRetailerDisplayName(rawId);

          if (rawId && !storeMap.has(key)) {
            storeMap.set(key, {
              id: rawId,
              name: displayName,
              color: getRetailerHexColor(rawId),
            });
          } else if (rawId && storeMap.has(key)) {
            const existing = storeMap.get(key)!;
            if (displayName && (existing.name.toLowerCase() === 'custom' || existing.name.toLowerCase() === key)) {
              existing.name = displayName;
            }
          }
        }
      });
    });

    // Also include any retailer from activeProduct.offers
    (activeProduct?.offers || []).forEach((o) => {
      if (o.retailer) {
        const rawId = o.retailer.trim();
        const key = rawId.toLowerCase();
        const rawName = (o.retailerName || '').trim();
        const displayName = (rawName && rawName.toLowerCase() !== 'custom')
          ? rawName
          : getRetailerDisplayName(rawId);

        if (rawId && !storeMap.has(key)) {
          storeMap.set(key, {
            id: rawId,
            name: displayName,
            color: getRetailerHexColor(rawId),
          });
        } else if (rawId && storeMap.has(key)) {
          const existing = storeMap.get(key)!;
          if (displayName && (existing.name.toLowerCase() === 'custom' || existing.name.toLowerCase() === key)) {
            existing.name = displayName;
          }
        }
      }
    });

    return Array.from(storeMap.values());
  }, [catalogProducts, activeProduct?.offers]);

  // Sync with client-side stored updates (from admin studio edits or newly created products)
  useEffect(() => {
    try {
      const targetSlug = product?.slug || slug;
      const targetId = product?.id || slug;
      const stored = targetSlug ? (getCatalogProductByIdOrSlug(targetSlug) || getCatalogProductByIdOrSlug(targetId)) : undefined;
      if (stored) {
        const unified = transformCatalogItemToUnified(stored);
        setActiveProduct(unified);
      }
    } catch {
      // ignore
    }
  }, [product?.slug, product?.id, slug]);

  if (!activeProduct) {
    return (
      <div className="max-w-[800px] mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-muted border border-border mx-auto flex items-center justify-center text-muted-foreground">
          <Package className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">Product Not Found</h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            The product you requested could not be located. It may have been updated or moved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/products">
            <Button className="font-bold text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Browse All Deals & Products</span>
            </Button>
          </Link>
          <Link href="/" prefetch={true}>
            <Button variant="outline" className="font-bold text-xs">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter only offers that have an active product URL and valid price
  const validOffers = (activeProduct.offers || []).filter(
    (o) => o.productUrl && o.productUrl.trim() !== '' && o.productUrl !== '#' && o.price > 0
  );
  const lowestOffer =
    validOffers.find((o) => o.isLowestPrice) ||
    validOffers[0] ||
    activeProduct.offers?.[0];
  const rating = activeProduct.rating || 4.8;
  const ratingCount = activeProduct.ratingCount || 150;
  const savings =
    activeProduct.regularPrice && activeProduct.regularPrice > activeProduct.lowestPrice
      ? activeProduct.regularPrice - activeProduct.lowestPrice
      : 0;
  const discountPercent =
    activeProduct.maxSavingsPercentage && activeProduct.maxSavingsPercentage > 0
      ? Math.round(activeProduct.maxSavingsPercentage)
      : activeProduct.regularPrice && activeProduct.regularPrice > activeProduct.lowestPrice
      ? Math.round(((activeProduct.regularPrice - activeProduct.lowestPrice) / activeProduct.regularPrice) * 100)
      : 0;

  const ALLOWED_BADGES = ['Best Seller', 'Editors Choice', 'Hot Deal'];
  const hasValidBadge = Boolean(activeProduct.badge && ALLOWED_BADGES.includes(activeProduct.badge));

  // Multi-image gallery list
  const defaultGallery = [
    activeProduct.imageUrl,
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  ];

  const images: string[] =
    activeProduct.images && activeProduct.images.length > 0 ? activeProduct.images : defaultGallery;

  // FAQ Accordion State (Requirement 3)
  const productFaqs =
    activeProduct.faqs && activeProduct.faqs.length > 0
      ? activeProduct.faqs
      : [
          {
            question: `Is ${activeProduct.title} backed by official manufacturer warranty?`,
            answer: `Yes, every retailer offer listed on SmartTech (Amazon, Walmart, Best Buy, Target) is from authorized US sellers and includes official manufacturer warranty and original retail packaging.`,
          },
          {
            question: 'How frequently are store prices and deals updated?',
            answer: 'Our multi-retailer price engine continuously tracks and verifies pricing across Amazon, Walmart, Best Buy, and Target every 15 minutes, highlighting the lowest available price in real-time.',
          },
          {
            question: 'What are the shipping and return policies for these retailer offers?',
            answer: 'Purchases are fulfilled directly by the chosen retailer. Fast delivery (e.g. Amazon Prime, Walmart+ 2-Day, Best Buy Store Pickup, Target Circle 360) and standard 15-90 day return windows apply.',
          },
        ];

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

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
        <Link
          href={`/products/${getCategorySlug(categories, activeProduct.category)}`}
          prefetch={true}
          className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap"
        >
          {activeProduct.category}
        </Link>
        {activeProduct.subcategory && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <Link
              href={`/products/${getCategorySlug(categories, activeProduct.category)}/${getSubcategorySlug(categories.find((c) => c.name.toLowerCase() === activeProduct.category.toLowerCase()), activeProduct.subcategory)}`}
              prefetch={true}
              className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap"
            >
              {activeProduct.subcategory}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <span
          className="text-foreground font-semibold shrink-0 whitespace-nowrap max-w-[200px] sm:max-w-xs md:max-w-md truncate"
          title={activeProduct.title}
        >
          {activeProduct.title}
        </span>
      </nav>

      {/* Two-Column Layout: Left Category Sidebar + Right Product View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: Identical to Shop Page Categories & Filters */}
        <aside className="lg:col-span-3 space-y-6 hidden lg:block">
          <div className="border border-border/80 bg-card p-4 space-y-6 shadow-sm">
            {/* Sidebar Header & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 whitespace-nowrap">
                <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Filters & Categories
              </span>
              <Link
                href="/products"
                prefetch={true}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                title="Reset / View all products"
                aria-label="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 1. Category & Subcategory Hierarchy */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground/80">
                Categories
              </h3>

              <div className="space-y-1 text-xs">
                {/* All Categories option */}
                <Link
                  href="/products"
                  prefetch={true}
                  className="w-full text-left py-2 px-2.5 rounded-lg flex items-center justify-between transition-all text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
                >
                  <span className="tracking-tight">All Categories</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums bg-muted text-muted-foreground">
                    {catalogProducts.length}
                  </span>
                </Link>

                {/* Dynamic Category tree with subcategories */}
                {categories.map((cat) => {
                  const isCatSelected = activeProduct.category?.toLowerCase() === cat.name.toLowerCase();
                  const isExpanded = expandedCategories[cat.name] ?? isCatSelected;
                  const catCount = catalogProducts.filter((p) => matchesCategory(p, cat.name)).length;

                  return (
                    <div key={cat.id} className="space-y-0.5">
                      <div
                        className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-all ${
                          isCatSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-blue-100/80 dark:border-blue-900/40'
                            : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 font-medium'
                        }`}
                      >
                        <Link
                          href={`/products/${cat.slug || getCategorySlug(categories, cat.name)}`}
                          prefetch={true}
                          className="flex-1 text-left truncate pr-1 tracking-tight"
                        >
                          {cat.name}
                        </Link>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[11px] tabular-nums font-semibold ${
                              isCatSelected
                                ? 'text-blue-600/80 dark:text-blue-400/80'
                                : 'text-muted-foreground/70'
                            }`}
                          >
                            ({catCount})
                          </span>
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCategories((prev) => ({
                                  ...prev,
                                  [cat.name]: !isExpanded,
                                }));
                              }}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                isCatSelected
                                  ? 'text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-900/50'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                              }`}
                              title="Toggle subcategories"
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subcategories nested under category */}
                      {isExpanded && cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="pl-3 py-1 space-y-1 border-l-2 border-blue-500/20 ml-2.5">
                          {cat.subcategories.map((sub) => {
                            const isSubSelected =
                              isCatSelected &&
                              (activeProduct.subcategory || '').toLowerCase() === sub.name.toLowerCase();
                            const subCount = catalogProducts.filter(
                              (p) => matchesCategory(p, cat.name) && matchesSubcategory(p, sub.name)
                            ).length;

                            return (
                              <Link
                                  key={sub.id}
                                  href={`/products/${cat.slug || getCategorySlug(categories, cat.name)}/${sub.slug || getSubcategorySlug(cat, sub.name)}`}
                                  prefetch={true}
                                  className={`w-full text-left py-1 px-2 text-[11px] rounded-md flex items-center justify-between transition-all ${
                                  isSubSelected
                                    ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/40'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-100/70 dark:hover:bg-slate-800/40 font-medium'
                                }`}
                              >
                                <span className="truncate pr-1">{sub.name}</span>
                                <span className="text-[10px] opacity-70 tabular-nums">({subCount})</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Platform / Store Filter */}
            <div className="space-y-2.5 pt-3 border-t border-border/60">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                Platform / Store
              </h3>

              <div className="space-y-1.5 text-xs font-medium">
                {availablePlatforms.map((store) => {
                  const storeCount = catalogProducts.filter((p) =>
                    p.offers.some((o) => {
                      const rId = (o.retailer || '').toLowerCase();
                      const rName = (o.retailerName || '').trim().toLowerCase();
                      const sId = store.id.toLowerCase();
                      const sName = store.name.trim().toLowerCase();
                      return rId === sId || (rName && rName === sName);
                    })
                  ).length;

                  // Only show stores that have offers, or are the default top 4 stores
                  if (
                    storeCount === 0 &&
                    !['amazon', 'walmart', 'bestbuy', 'target'].includes(store.id.toLowerCase())
                  ) {
                    return null;
                  }

                  return (
                    <Link
                      key={store.id}
                      href={`/products?platform=${encodeURIComponent(store.id)}`}
                      prefetch={true}
                      className="flex items-center justify-between py-1 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors rounded-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: store.color }}
                        />
                        <span>{store.name}</span>
                      </div>
                      <span className="text-[10px] opacity-70 tabular-nums">({storeCount})</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <div className="lg:col-span-9 space-y-10">
          {/* Product Overview Box: Image Slider on Left, Info/Price on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border border-border/80 bg-card p-6">
            {/* Product Image Slider: 5:4 Main Slide + Thumbnail Gallery Underneath */}
            <div className="md:col-span-6 space-y-3">
              <div className="relative aspect-[5/4] w-full overflow-hidden bg-muted/20 border border-border/50 group">
                <Image
                  src={images[activeImageIndex] || activeProduct.imageUrl}
                  alt={
                    (activeImageIndex === 0
                      ? activeProduct.imageAlt
                      : activeProduct.imageAlts?.[activeImageIndex]) ||
                    `${activeProduct.title} - Slide ${activeImageIndex + 1}`
                  }
                  fill
                  priority
                  className="object-cover transition-all duration-300"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  unoptimized
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous Image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next Image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Counter Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold">
                  {activeImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails Underneath */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-14 shrink-0 overflow-hidden border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-blue-600 ring-1 ring-blue-600 opacity-100'
                          : 'border-border opacity-70 hover:opacity-100 hover:border-muted-foreground'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={
                          (idx === 0 ? activeProduct.imageAlt : activeProduct.imageAlts?.[idx]) ||
                          `${activeProduct.title} thumbnail ${idx + 1}`
                        }
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info & Price */}
            <div className="md:col-span-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/brand/${(activeProduct.brand || 'tech').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      prefetch={true}
                      className="uppercase tracking-wider font-bold text-blue-600 hover:underline"
                      title={`View all products by ${activeProduct.brand}`}
                    >
                      {activeProduct.brand}
                    </Link>
                    {hasValidBadge && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider">
                        {activeProduct.badge}
                      </span>
                    )}
                  </div>
                  <WatchlistButton product={activeProduct} variant="full" />
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                  {activeProduct.title}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <span className="font-bold text-foreground">{rating}</span>
                  <span>({ratingCount} verified reviews)</span>
                </div>
              </div>

              {/* Lowest Price Banner */}
              <div className="p-4 bg-muted/40 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    Lowest Current Price
                  </span>
                  {discountPercent > 0 && (
                    <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-xs tracking-wider uppercase">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {formatCurrency(activeProduct.lowestPrice)}
                  </span>
                  {activeProduct.regularPrice && activeProduct.regularPrice > activeProduct.lowestPrice && (
                    <span className="text-xs font-semibold text-muted-foreground line-through">
                      {formatCurrency(activeProduct.regularPrice)}
                    </span>
                  )}
                  {savings > 0 && (
                    <span className="text-xs font-bold text-emerald-600">
                      Save {formatCurrency(savings)}
                    </span>
                  )}
                </div>
              </div>

              {/* Key Specs Preview (shows dedicated keySpecs if provided, otherwise falls back to first 4 of specs) */}
              {((activeProduct.keySpecs && Object.keys(activeProduct.keySpecs).length > 0) ||
                (activeProduct.specs && Object.keys(activeProduct.specs).length > 0)) && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Key Specifications
                  </h3>
                  <div className="divide-y divide-border/60 text-xs">
                    {Object.entries(
                      (activeProduct.keySpecs && Object.keys(activeProduct.keySpecs).length > 0
                        ? activeProduct.keySpecs
                        : activeProduct.specs) || {}
                    ).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="py-1.5 flex justify-between">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fast Delivery / Safe Check */}
              <div className="flex items-center gap-4 pt-1 text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" /> Fast Delivery Eligible
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authorized Retailers
                </span>
              </div>
            </div>
          </div>

          {/* Price Comparison Matrix (Only shows retailers with valid links) */}
          {validOffers.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                  <span>Check Product Prices Across Stores</span>
                  <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                    ({validOffers.length} {validOffers.length === 1 ? 'Store' : 'Stores'})
                  </span>
                </h2>
                <span className="text-xs font-bold text-emerald-600">
                  ● Lowest price highlighted
                </span>
              </div>

              <div className="overflow-x-auto sm:overflow-x-visible border border-border/80 bg-card">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 sm:px-4">Store</th>
                      <th className="py-3 px-4 hidden md:table-cell">Availability</th>
                      <th className="py-3 px-4 hidden md:table-cell">Shipping</th>
                      <th className="py-3 px-3 sm:px-4">Current Price</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {validOffers.map((offer) => (
                      <tr
                        key={offer.retailerItemId || `${offer.retailer}-${offer.price}`}
                        className={offer.isLowestPrice ? 'bg-emerald-500/5 font-semibold' : ''}
                      >
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-foreground">
                              {offer.retailerName || getRetailerDisplayName(offer.retailer)}
                            </span>
                            {offer.isLowestPrice && (
                              <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase shrink-0">
                                Lowest
                              </span>
                            )}
                          </div>
                          {/* Mobile-only: Availability & Shipping values directly under Store name */}
                          <div className="flex md:hidden items-center gap-1.5 text-[11px] mt-1 text-muted-foreground flex-wrap">
                            <span className={`font-semibold shrink-0 ${offer.isInStock ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {offer.isInStock ? 'In Stock' : 'Limited'}
                            </span>
                            <span className="text-muted-foreground/40 shrink-0">•</span>
                            <span className="text-muted-foreground truncate max-w-[150px] xs:max-w-[200px]">
                              {offer.shippingInfo || 'Free Standard Delivery'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 font-medium hidden md:table-cell">
                          {offer.isInStock ? 'In Stock' : 'Limited'}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground hidden md:table-cell">
                          {offer.shippingInfo || 'Free Standard Delivery'}
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                          <span className="text-sm sm:text-base font-black text-foreground">
                            {formatCurrency(offer.price)}
                          </span>
                        </td>
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                          <a
                            href={offer.productUrl || offer.internalGoUrl}
                            target="_blank"
                            rel="nofollow sponsored noopener"
                          >
                            <Button
                              size="sm"
                              className={`text-xs font-bold h-8 px-3 sm:px-4 ${
                                offer.isLowestPrice
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white'
                              }`}
                            >
                              <span>Buy Now</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Related Products
                </h2>
                <Link
                  href={`/products/${getCategorySlug(categories, activeProduct.category)}`}
                  prefetch={true}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {relatedProducts.slice(0, 3).map((p) => (
                  <DealCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* PRODUCT DESCRIPTION & RICH SPECIFICATIONS (Requirement 1 & 2: Under Related Products) */}
          <section className="space-y-6 pt-6 border-t border-border/80">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Product Overview & Full Description</span>
              </h2>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {activeProduct.brand} Official Information
              </span>
            </div>

            <div className="border border-border/80 bg-card p-6 space-y-6">
              {/* Rich Text / Formatted Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Overview & Engineering Details
                </h3>
                {activeProduct.richDescription ? (
                  <div
                    className="text-sm sm:text-base text-foreground font-medium leading-relaxed prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: activeProduct.richDescription }}
                  />
                ) : (
                  <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                    {activeProduct.description}
                  </p>
                )}
              </div>

              {/* Key Features & Benefits List (1 Column Layout) */}
              {activeProduct.features && activeProduct.features.length > 0 && (
                <div className="space-y-3 pt-5 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Key Features & Highlights
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-600">
                      {activeProduct.features.length} Highlights
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activeProduct.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 border border-border/60 bg-muted/15 hover:bg-muted/30 transition-colors"
                      >
                        <div className="p-1 bg-emerald-500/10 text-emerald-600 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Specifications (1 Column Layout) */}
              {activeProduct.specs && Object.keys(activeProduct.specs).length > 0 && (
                <div className="space-y-3 pt-5 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Full Technical Specifications
                    </h3>
                    <span className="text-[11px] font-semibold text-blue-600">
                      {Object.keys(activeProduct.specs).length} Hardware Specs
                    </span>
                  </div>
                  <div className="border border-border/80 bg-background divide-y divide-border/60 text-xs sm:text-sm">
                    {Object.entries(activeProduct.specs).map(([key, val], idx) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between p-3.5 transition-colors ${
                          idx % 2 === 0 ? 'bg-muted/25' : 'bg-background'
                        } hover:bg-muted/40`}
                      >
                        <span className="font-semibold text-muted-foreground w-2/5 sm:w-1/3 shrink-0">
                          {key}
                        </span>
                        <span className="font-bold text-foreground text-right flex-1 pl-4">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Retailer Quality Assurance */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs">
                <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Authorized Retailer Network:</strong> Real-time price tracking across Amazon, Walmart, Best Buy, and Target with full manufacturer warranty.
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 font-semibold">
                  Continuous price checks
                </span>
              </div>
            </div>
          </section>

          {/* FREQUENTLY ASKED QUESTIONS (FAQ Section - Requirement 3) */}
          <section className="space-y-4 pt-6 border-t border-border/80">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Frequently Asked Questions (FAQ)</span>
              </h2>
              <span className="text-xs font-bold text-blue-600">
                {productFaqs.length} Answers Available
              </span>
            </div>

            <div className="border border-border/80 bg-card divide-y divide-border/60">
              {productFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="transition-colors">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <span className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2.5">
                        <span className="text-blue-600 font-black">Q{idx + 1}.</span>
                        <span>{faq.question}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed pl-9 sm:pl-10">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
