'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CatalogItem } from '@/data/catalog';
import { CategoryDefinition } from '@/data/catalog';
import { BlogPost } from '@/data/blogs';
import { getCatalogProducts, fetchAndSyncCatalogFromServer } from '@/lib/catalogStore';
import { getCategories } from '@/lib/categoryStore';
import { getPages } from '@/lib/pageStore';
import {
  Package,
  Layers,
  FolderTree,
  FileText,
  FolderPlus,
  Globe,
  Sliders,
  PlusCircle,
  ExternalLink,
  Store,
  CheckCircle2,
  RefreshCw,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [pagesCount, setPagesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadAllData = async () => {
    try {
      // 1. Load products from local & server
      const localProducts = getCatalogProducts();
      setProducts((prev) => (prev.length === 0 ? localProducts : prev));

      const freshProducts = await fetchAndSyncCatalogFromServer();
      if (Array.isArray(freshProducts)) {
        setProducts(freshProducts);
      }

      // 2. Load categories
      try {
        const catRes = await fetch('/api/categories', { cache: 'no-store' });
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.data && Array.isArray(catData.data)) {
            setCategories(catData.data);
          } else {
            setCategories(getCategories());
          }
        } else {
          setCategories(getCategories());
        }
      } catch {
        setCategories(getCategories());
      }

      // 3. Load blogs
      try {
        const blogRes = await fetch('/api/blogs', { cache: 'no-store' });
        if (blogRes.ok) {
          const blogData = await blogRes.json();
          if (blogData.data && Array.isArray(blogData.data)) {
            setBlogs(blogData.data);
          }
        }
      } catch {}

      // 4. Load pages count
      try {
        const pages = getPages();
        setPagesCount(pages.length);
      } catch {}
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const handleCatalogUpdate = () => {
      setProducts(getCatalogProducts());
    };
    window.addEventListener('smarttech_catalog_updated', handleCatalogUpdate);
    window.addEventListener('storage', handleCatalogUpdate);
    return () => {
      window.removeEventListener('smarttech_catalog_updated', handleCatalogUpdate);
      window.removeEventListener('storage', handleCatalogUpdate);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
  };

  // Real dynamic calculations
  const totalProducts = products.length;
  const totalOffers = products.reduce((acc, p) => acc + (p.offers?.length || 0), 0);
  const totalCategories = categories.length;
  const totalSubcategories = categories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0);
  const totalBlogs = blogs.length;
  // Core routes (5) + Categories + Subcategories + Products + Blogs + Site Pages
  const totalSitemapPages = 5 + totalCategories + totalSubcategories + totalProducts + totalBlogs + (pagesCount || 10);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-foreground">Admin Console Overview</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Live Database Engine</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time multi-retailer inventory, database statistics, price comparisons, and site administration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-bold h-9 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Stats'}</span>
          </Button>
          <Link
            href="/supro111vat29/products/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2 inline-flex items-center justify-center whitespace-nowrap transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add New Product</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="border border-border bg-background hover:bg-muted text-foreground text-xs font-bold h-9 px-3 flex items-center gap-1.5 inline-flex items-center justify-center whitespace-nowrap transition-colors"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metric Cards - Real Dynamic Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Products */}
        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Catalog Items</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {isLoading ? '...' : totalProducts}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{totalOffers} Live Store Offers</span>
          </p>
        </div>

        {/* Metric 2: Categories */}
        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Categories</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {isLoading ? '...' : totalCategories}
          </p>
          <p className="text-[10px] text-muted-foreground font-semibold">
            Parent Category Groups
          </p>
        </div>

        {/* Metric 3: Subcategories */}
        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Subcategories</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {isLoading ? '...' : totalSubcategories}
          </p>
          <p className="text-[10px] text-muted-foreground font-semibold">Across {totalCategories} Categories</p>
        </div>

        {/* Metric 4: Blogs */}
        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Editorial Blogs</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {isLoading ? '...' : totalBlogs}
          </p>
          <p className="text-[10px] text-muted-foreground font-semibold">Published Buying Guides</p>
        </div>

        {/* Metric 5: Sitemap Pages */}
        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Sitemap Pages</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">
            {isLoading ? '...' : totalSitemapPages}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Indexed in sitemap.xml</span>
          </p>
        </div>
      </div>

      {/* Quick Management Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/supro111vat29/products"
          className="group p-5 border border-border bg-card hover:border-blue-500 hover:shadow-xs transition-all space-y-2"
        >
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 w-fit">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-foreground group-hover:text-blue-600 transition-colors">
            Product Inventory & Prices →
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manage multi-retailer live prices, real store links, per-product SEO, and specifications.
          </p>
        </Link>

        <Link
          href="/supro111vat29/categories"
          className="group p-5 border border-border bg-card hover:border-purple-500 hover:shadow-xs transition-all space-y-2"
        >
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 w-fit">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-foreground group-hover:text-purple-600 transition-colors">
            Categories & Subcategories →
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Organize catalog taxonomy, custom category images, homepage featured showcases, and top slider.
          </p>
        </Link>

        <Link
          href="/supro111vat29/pages"
          className="group p-5 border border-border bg-card hover:border-amber-500 hover:shadow-xs transition-all space-y-2"
        >
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 w-fit">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-foreground group-hover:text-amber-600 transition-colors">
            Custom Pages & Legal →
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create, edit, and publish static pages like About Us, Privacy Policy, Terms, and custom landing pages.
          </p>
        </Link>

        <Link
          href="/supro111vat29/blogs"
          className="group p-5 border border-border bg-card hover:border-rose-500 hover:shadow-xs transition-all space-y-2"
        >
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 w-fit">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-foreground group-hover:text-rose-600 transition-colors">
            Blog Articles Manager →
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Write tech comparison articles and buying guides with Divi-style rich text editor and action controls.
          </p>
        </Link>

        <Link
          href="/supro111vat29/blogs/categories"
          className="group p-5 border border-border bg-card hover:border-indigo-500 hover:shadow-xs transition-all space-y-2"
        >
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 w-fit">
            <FolderPlus className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-foreground group-hover:text-indigo-600 transition-colors">
            Blog Categories & Topics →
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create, edit, and organize editorial topics, slugs, descriptions, and sidebar category filters.
          </p>
        </Link>

        <Link
          href="/supro111vat29/settings"
          className="group p-5 border border-border bg-card hover:border-emerald-500 hover:shadow-xs transition-all space-y-2"
        >
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 w-fit">
            <Sliders className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-foreground group-hover:text-emerald-600 transition-colors">
            SEO, Analytics & Tracking →
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure Google Analytics 4, Meta Facebook Pixel, affiliate IDs, and SEO settings.
          </p>
        </Link>
      </div>

      {/* Live Inventory Preview Table */}
      <div className="p-6 border border-border bg-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Recent Inventory Activity ({products.length} Products in Database)</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Direct access to recent products saved in your cloud database.
            </p>
          </div>
          <Link
            href="/supro111vat29/products"
            className="text-xs font-bold h-8 px-3 border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 transition-colors rounded-none cursor-pointer"
          >
            <span>Manage All Products</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-3 py-2.5">Product</th>
                <th className="px-3 py-2.5">Brand</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Offers</th>
                <th className="px-3 py-2.5 text-right">Lowest Price</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.slice(0, 8).map((p) => {
                const prices = (p.offers || []).map((o) => o.price).filter((pr) => pr > 0);
                const lowest = prices.length > 0 ? Math.min(...prices) : 0;
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-foreground max-w-[280px] truncate">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-8 h-8 object-contain bg-muted/20 border border-border/60 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="truncate">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-muted-foreground uppercase text-[11px]">
                      {p.brand}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.category}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold text-[10px]">
                        {p.offers?.length || 0} Stores
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-black text-foreground">
                      ${lowest.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/supro111vat29/products/edit/${encodeURIComponent(p.id)}`}
                          className="h-7 px-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 inline-flex items-center justify-center transition-colors rounded-none cursor-pointer"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center justify-center transition-colors rounded-none cursor-pointer"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
