'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Heart,
  Sparkles,
  Menu,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useBranding } from '@/hooks/useBranding';
import { optimizeImageUrl } from '@/lib/imageOptimization';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const branding = useBranding();
  const { count: watchlistCount, isLoaded } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync searchQuery with current URL search param (e.g. /products?search=mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('search') || params.get('q');
    setSearchQuery(q || '');
    if (desktopSearchInputRef.current && !q) {
      desktopSearchInputRef.current.value = '';
    }
  }, [pathname]);

  // Listen for instant clear events across the app
  useEffect(() => {
    const handleClearEvent = () => {
      setSearchQuery('');
      if (desktopSearchInputRef.current) {
        desktopSearchInputRef.current.value = '';
      }
    };
    window.addEventListener('tech_clear_search', handleClearEvent);
    return () => window.removeEventListener('tech_clear_search', handleClearEvent);
  }, []);

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileMenuBtnRef.current &&
        !mobileMenuBtnRef.current.contains(target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const displayCount = mounted && isLoaded ? watchlistCount : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (desktopSearchInputRef.current) {
      desktopSearchInputRef.current.value = '';
    }
    window.dispatchEvent(new CustomEvent('tech_clear_search'));
    // Redirect to main product page when clearing search
    router.push('/products');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md transition-all">
      <div className="container max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Brand Logo - suprodesign */}
        <Link
          href="/"
          prefetch={true}
          className="flex items-center gap-2.5 shrink-0 group cursor-pointer"
        >
          <img
            src={optimizeImageUrl(branding.logoUrl, 300) || '/logo.png'}
            alt={branding.brandName || 'suprodesign'}
            width={180}
            height={36}
            className="h-8 sm:h-9 w-auto max-w-[180px] sm:max-w-[210px] object-contain transition-transform group-hover:scale-105 pointer-events-none"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
          />
        </Link>

        {/* Minimal Search Bar (Sharp 0px) */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-md hidden md:flex items-center relative"
        >
          <input
            ref={desktopSearchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tech & compare prices..."
            className="w-full h-9 pl-3.5 pr-16 text-xs font-medium rounded-none bg-muted/40 border border-border focus:bg-background focus:border-blue-600 focus:outline-none transition-all placeholder:text-muted-foreground"
          />

          <div className="absolute right-1 inset-y-1 flex items-center gap-0.5">
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-none transition-colors cursor-pointer"
                title="Clear text"
                aria-label="Clear text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-muted/80 rounded-none transition-colors cursor-pointer"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
          <Link
            href="/"
            prefetch={true}
            className={`hover:text-foreground transition-colors cursor-pointer ${
              pathname === '/' ? 'text-foreground font-bold' : ''
            }`}
          >
            Home
          </Link>
          <Link
            href="/products"
            prefetch={true}
            className={`hover:text-foreground transition-colors cursor-pointer ${
              pathname.startsWith('/products') ? 'text-foreground font-bold' : ''
            }`}
          >
            All Products
          </Link>
          <Link
            href="/coupons"
            prefetch={true}
            className={`hover:text-foreground transition-colors cursor-pointer ${
              pathname.startsWith('/coupons') ? 'text-foreground font-bold' : ''
            }`}
          >
            Coupons
          </Link>
          <Link
            href="/blog"
            prefetch={true}
            className={`hover:text-foreground transition-colors cursor-pointer ${
              pathname.startsWith('/blog') ? 'text-foreground font-bold' : ''
            }`}
          >
            Blog
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/watchlist"
            prefetch={true}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-semibold text-foreground hover:bg-muted/50 hover:text-rose-600 transition-colors rounded-none group cursor-pointer"
            title="View saved items"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                displayCount > 0 ? 'text-rose-600 fill-rose-600' : 'text-muted-foreground'
              }`}
            />
            <span className="hidden sm:inline">Saved</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] h-4 flex items-center justify-center transition-all ${
                displayCount > 0
                  ? 'bg-rose-600 text-white scale-100'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {displayCount}
            </span>
          </Link>

          {/* Mobile menu button */}
          <button
            ref={mobileMenuBtnRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 border border-border text-muted-foreground hover:text-foreground md:hidden rounded-none touch-manipulation cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay (Floats on top, website content underneath does not shift) */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop covering website underneath */}
          <div
            className="fixed inset-0 top-16 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Floating Mobile Menu Panel */}
          <div
            ref={mobileMenuRef}
            className="absolute top-full left-0 right-0 z-50 bg-background border-b border-border shadow-2xl p-4 space-y-4 md:hidden animate-in slide-in-from-top-2 duration-200"
          >
            <form onSubmit={(e) => {
              handleSearch(e);
              setIsMobileMenuOpen(false);
            }} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-9 pl-3 pr-8 text-xs rounded-none border border-border bg-muted/40 focus:bg-background focus:outline-none"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClearSearch();
                      setIsMobileMenuOpen(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer touch-manipulation"
                    title="Clear text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-border font-bold text-xs rounded-none transition-colors cursor-pointer flex items-center justify-center touch-manipulation"
                title="Search"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex flex-col text-xs font-bold divide-y divide-border/40">
              <Link
                href="/"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2.5 hover:text-blue-600 transition-colors cursor-pointer ${
                  pathname === '/' ? 'text-blue-600' : 'text-foreground'
                }`}
              >
                Home
              </Link>
              <Link
                href="/products"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2.5 hover:text-blue-600 transition-colors cursor-pointer ${
                  pathname.startsWith('/products') ? 'text-blue-600' : 'text-foreground'
                }`}
              >
                All Products
              </Link>
              <Link
                href="/coupons"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 text-foreground hover:text-blue-600 transition-colors cursor-pointer"
              >
                Coupons & Deals
              </Link>
              <Link
                href="/blog"
                prefetch={true}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 text-foreground hover:text-blue-600 transition-colors cursor-pointer"
              >
                Blog
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
