'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag,
  Copy,
  Check,
  ExternalLink,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  Store,
  Info,
} from 'lucide-react';
import { CouponItem, DEFAULT_COUPONS } from '@/data/coupons';
import { getCoupons, saveCoupons, fetchAndSyncCouponsFromServer, COUPONS_UPDATED_EVENT } from '@/lib/couponStore';
import { Button } from '@/components/ui/button';
import { AdSlot } from '@/components/ads/AdSlot';

interface CouponsClientProps {
  initialCoupons?: CouponItem[];
}

export function CouponsClient({ initialCoupons }: CouponsClientProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons || DEFAULT_COUPONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Sync with client-side coupon store and server
  useEffect(() => {
    if (initialCoupons && Array.isArray(initialCoupons)) {
      setCoupons(initialCoupons);
      saveCoupons(initialCoupons);
    } else {
      setCoupons(getCoupons());
    }

    fetchAndSyncCouponsFromServer().then((fresh) => {
      if (fresh) setCoupons(fresh);
    });

    const loadData = () => {
      setCoupons(getCoupons());
    };

    window.addEventListener(COUPONS_UPDATED_EVENT, loadData);
    return () => window.removeEventListener(COUPONS_UPDATED_EVENT, loadData);
  }, [initialCoupons]);


  // Extract unique stores and categories
  const allStores = useMemo(() => {
    const set = new Set<string>();
    coupons.forEach((c) => {
      if (c.store) set.add(c.store);
    });
    return ['All', ...Array.from(set)];
  }, [coupons]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    coupons.forEach((c) => {
      if (c.category && c.category !== 'All') set.add(c.category);
    });
    return ['All', ...Array.from(set)];
  }, [coupons]);

  // Filtering
  const filteredCoupons = useMemo(() => {
    return coupons.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCode = item.code ? item.code.toLowerCase().includes(q) : false;
        const matchStore = item.store.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCode && !matchStore) return false;
      }
      // Store filter
      if (selectedStore !== 'All') {
        if (item.store.toLowerCase() !== selectedStore.toLowerCase()) return false;
      }
      // Category filter
      if (selectedCategory !== 'All') {
        if (item.category && item.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }
      return true;
    });
  }, [coupons, searchQuery, selectedStore, selectedCategory]);

  const handleCopyCode = (id: string, code: string, affiliateUrl: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 3000);

    // Also open retailer site in new tab if affiliateUrl exists
    if (affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer,nofollow,sponsored');
    }
  };

  const handleCopyLink = (id: string, url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2500);
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
        <span className="text-foreground font-semibold shrink-0 whitespace-nowrap">Verified Tech Coupons & Promos</span>
      </nav>

      {/* Ad Placement: Below Breadcrumbs Banner */}
      <AdSlot placement="coupons_below_breadcrumb" />

      {/* Hero Banner (Sharp 0px Theme) */}
      <div className="border border-border/80 bg-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Verified Discounts</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              Tech Coupons, Promo Codes & Deals
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Find tested and working discount codes across Amazon, Best Buy, Walmart, Target, Apple, and leading brands. Copy promo codes with one click and apply them directly at checkout!
            </p>
          </div>

          {/* Quick Counter Box */}
          <div className="border border-border p-4 bg-muted/20 flex md:flex-col items-center justify-around md:justify-center gap-4 shrink-0 min-w-[200px] text-center">
            <div>
              <div className="text-3xl font-black text-blue-600">{coupons.length}</div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Codes & Deals
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% Tested Today</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by store name, promo code, or keyword..."
              className="w-full h-10 pl-9 pr-4 text-xs font-medium border border-border bg-background focus:border-blue-600 focus:outline-none"
            />
          </div>

          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold h-10 shrink-0"
            >
              Clear Search
            </Button>
          )}
        </div>
      </div>

      {/* Store Filter Pills */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter by Store:</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Showing <strong className="text-foreground">{filteredCoupons.length}</strong> available coupons
          </span>
        </div>

        <div
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none [&::-webkit-scrollbar]:hidden py-0.5"
        >
          {allStores.map((store) => {
            const isSelected = selectedStore === store;
            return (
              <button
                key={store}
                onClick={() => setSelectedStore(store)}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider border transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {store === 'All' ? 'All Stores' : store}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coupon Cards Grid */}
      {filteredCoupons.length === 0 ? (
        <div className="p-12 border border-border/80 bg-card text-center space-y-3">
          <div className="w-12 h-12 bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-foreground">No matching coupons found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query or selecting &quot;All Stores&quot; to see all active discount codes.
          </p>
          <Button
            onClick={() => {
              setSearchQuery('');
              setSelectedStore('All');
              setSelectedCategory('All');
            }}
            variant="outline"
            size="sm"
            className="text-xs font-bold"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCoupons.map((coupon) => {
            const isCodeCopied = copiedCodeId === coupon.id;
            const isLinkCopied = copiedLinkId === coupon.id;

            return (
              <div
                key={coupon.id}
                className="border border-border/80 bg-card p-5 flex flex-col justify-between gap-4 transition-all hover:border-blue-600/50 hover:shadow-xs group"
              >
                {/* Header: Store Badge & Discount Highlight */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-[11px] uppercase tracking-wider">
                      {coupon.store}
                    </span>

                    <div className="flex items-center gap-2">
                      {coupon.isVerified && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 border border-emerald-600/20">
                          <Check className="w-3 h-3" />
                          <span>Verified</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 text-[11px] font-black uppercase">
                        {coupon.discountValue}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-foreground group-hover:text-blue-600 transition-colors leading-snug">
                      {coupon.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {coupon.description}
                    </p>
                  </div>
                </div>

                {/* Terms / Expiry */}
                {(coupon.expiresAt || coupon.terms) && (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    {coupon.expiresAt ? (
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Expires: {coupon.expiresAt}</span>
                      </span>
                    ) : (
                      <span className="italic">Limited time deal</span>
                    )}

                    {coupon.terms && (
                      <span className="truncate max-w-[200px]" title={coupon.terms}>
                        {coupon.terms}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions: Copy Code & Copy Link & Apply Deal */}
                <div className="pt-3 border-t border-border/80 flex flex-wrap items-center justify-between gap-2">
                  {/* Promo Code Box with 1-click Copy */}
                  {coupon.code ? (
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.id, coupon.code!, coupon.affiliateUrl)}
                      className={`flex items-center gap-2 px-3 py-1.5 border border-dashed font-mono font-bold text-xs transition-all ${
                        isCodeCopied
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-muted/40 hover:bg-muted border-blue-600/60 text-blue-600 dark:text-blue-400'
                      }`}
                      title="Click to copy promo code and open retailer website"
                    >
                      <span className="tracking-wider">{coupon.code}</span>
                      {isCodeCopied ? (
                        <span className="flex items-center gap-1 font-sans text-[11px]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-sans text-[11px] text-muted-foreground group-hover:text-foreground">
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-muted-foreground italic flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>Direct Deal (No code needed)</span>
                    </span>
                  )}

                  {/* Right side: Copy Link and Apply Deal buttons */}
                  <div className="flex items-center gap-2">
                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(coupon.id, coupon.affiliateUrl)}
                      className={`p-2 border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isLinkCopied
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-600'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      title="Copy coupon direct link to clipboard"
                    >
                      {isLinkCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-600">Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* Open Store / Apply Deal Button */}
                    <a
                      href={coupon.affiliateUrl}
                      target="_blank"
                      rel="nofollow sponsored noopener"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 inline-flex items-center gap-1.5 transition-colors cursor-pointer rounded-none"
                    >
                      <span>Apply Deal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
