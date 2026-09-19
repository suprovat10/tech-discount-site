'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Layers,
  FileText,
  FolderPlus,
  Award,
  Sliders,
  PlusCircle,
  ExternalLink,
  Tag,
  FileCode2,
  ArrowRight,
  Edit,
  Eye,
} from 'lucide-react';
import { getCatalogProducts, fetchCatalogFromServer } from '@/lib/catalogStore';
import { getCategories } from '@/lib/categoryStore';
import { getBrands } from '@/lib/brandStore';
import { getBlogs } from '@/lib/blogStore';
import { getCoupons } from '@/lib/couponStore';
import { getPages } from '@/lib/pageStore';
import type { CatalogItem, CategoryDefinition } from '@/data/catalog';
import type { BrandItem } from '@/data/brands';
import type { BlogPost } from '@/data/blogs';
import type { CouponItem } from '@/data/coupons';
import type { SitePage } from '@/data/defaultPages';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Initial load from local store
      const localProducts = getCatalogProducts();
      setProducts(localProducts);
      setCategories(getCategories());
      setBrands(getBrands());
      setBlogs(getBlogs());
      setCoupons(getCoupons());
      setPages(getPages());

      // 2. Refresh products from server (Supabase)
      try {
        const serverProducts = await fetchCatalogFromServer();
        if (serverProducts && serverProducts.length >= 0) {
          setProducts(serverProducts);
        }
      } catch (err) {
        console.warn('Could not refresh catalog from server on overview load:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Listen for storage / catalog update events
    const handleUpdate = () => {
      setProducts(getCatalogProducts());
      setCategories(getCategories());
      setBrands(getBrands());
      setBlogs(getBlogs());
      setCoupons(getCoupons());
      setPages(getPages());
    };

    window.addEventListener('smarttech_catalog_updated', handleUpdate);
    window.addEventListener('smarttech_categories_updated', handleUpdate);
    window.addEventListener('smarttech_brands_updated', handleUpdate);
    window.addEventListener('smarttech_blogs_updated', handleUpdate);
    window.addEventListener('smarttech_coupons_updated', handleUpdate);
    window.addEventListener('smarttech_pages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('smarttech_catalog_updated', handleUpdate);
      window.removeEventListener('smarttech_categories_updated', handleUpdate);
      window.removeEventListener('smarttech_brands_updated', handleUpdate);
      window.removeEventListener('smarttech_blogs_updated', handleUpdate);
      window.removeEventListener('smarttech_coupons_updated', handleUpdate);
      window.removeEventListener('smarttech_pages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute live aggregates
  const totalProducts = products.length;
  const totalOffers = products.reduce((acc, p) => acc + (p.offers?.length || 0), 0);
  const totalCategories = categories.length;
  const totalSubcategories = categories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0);
  const totalBrands = brands.length;
  const activeBrands = brands.filter((b) => b.isActive !== false).length;
  const totalBlogs = blogs.length;
  const totalCoupons = coupons.length;
  const verifiedCoupons = coupons.filter((c) => c.isVerified).length;
  const totalPages = pages.length;

  const recentProducts = [...products]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 6);

  return (
    <div className="space-y-8 max-w-[1240px]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Admin Console Overview
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              Live Mode
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time control center for products, multi-store price feeds, taxonomy, coupons, and affiliate monetization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/supro111vat29/products/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-none transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add New Product</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-muted text-foreground font-bold text-xs h-9 px-3.5 rounded-none transition-colors cursor-pointer"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Products */}
        <div className="p-4 border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Products
            </span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{totalProducts}</p>
          <p className="text-[10px] text-emerald-600 font-semibold truncate">
            {totalOffers} Live Store Offers
          </p>
        </div>

        {/* Categories */}
        <div className="p-4 border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Categories
            </span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{totalCategories}</p>
          <p className="text-[10px] text-muted-foreground font-semibold truncate">
            {totalSubcategories} Subcategories
          </p>
        </div>

        {/* Brands */}
        <div className="p-4 border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Brands
            </span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{totalBrands}</p>
          <p className="text-[10px] text-emerald-600 font-semibold truncate">
            {activeBrands} Active Partners
          </p>
        </div>

        {/* Coupons */}
        <div className="p-4 border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Coupons
            </span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{totalCoupons}</p>
          <p className="text-[10px] text-emerald-600 font-semibold truncate">
            {verifiedCoupons} Verified Working
          </p>
        </div>

        {/* Blogs */}
        <div className="p-4 border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Blog Guides
            </span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{totalBlogs}</p>
          <p className="text-[10px] text-muted-foreground font-semibold truncate">
            Published Articles
          </p>
        </div>

        {/* Pages */}
        <div className="p-4 border border-border bg-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Custom Pages
            </span>
            <div className="p-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600">
              <FileCode2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{totalPages}</p>
          <p className="text-[10px] text-muted-foreground font-semibold truncate">
            Legal & Policy Pages
          </p>
        </div>
      </div>

      {/* Quick Navigation Hub Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-black text-foreground uppercase tracking-wider text-xs">
          Management Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/supro111vat29/products"
            className="p-4 border border-border bg-card hover:border-blue-500 hover:shadow-xs transition-all space-y-1.5 block cursor-pointer group"
          >
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 w-fit">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-foreground group-hover:text-blue-600 transition-colors">
              Product Catalog ({totalProducts}) →
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Add, edit, bulk-delete products, and configure Amazon/Walmart affiliate links.
            </p>
          </Link>

          <Link
            href="/supro111vat29/categories"
            className="p-4 border border-border bg-card hover:border-purple-500 hover:shadow-xs transition-all space-y-1.5 block cursor-pointer group"
          >
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 w-fit">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-foreground group-hover:text-purple-600 transition-colors">
              Categories & Slider ({totalCategories}) →
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Manage category taxonomy, subcategories, top image slider, and homepage sections.
            </p>
          </Link>

          <Link
            href="/supro111vat29/brands"
            className="p-4 border border-border bg-card hover:border-amber-500 hover:shadow-xs transition-all space-y-1.5 block cursor-pointer group"
          >
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 w-fit">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-foreground group-hover:text-amber-600 transition-colors">
              Brand Partners ({totalBrands}) →
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Configure brand logos, slugs, 2-column brand pages, and homepage showcase.
            </p>
          </Link>

          <Link
            href="/supro111vat29/coupons"
            className="p-4 border border-border bg-card hover:border-indigo-500 hover:shadow-xs transition-all space-y-1.5 block cursor-pointer group"
          >
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 w-fit">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-foreground group-hover:text-indigo-600 transition-colors">
              Verified Coupons ({totalCoupons}) →
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Create promo codes, store discounts, expiry dates, and affiliate links.
            </p>
          </Link>

          <Link
            href="/supro111vat29/blogs"
            className="p-4 border border-border bg-card hover:border-rose-500 hover:shadow-xs transition-all space-y-1.5 block cursor-pointer group"
          >
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 w-fit">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-foreground group-hover:text-rose-600 transition-colors">
              Blog Articles ({totalBlogs}) →
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Write rich buying guides with comparison tables, product embeds, and SEO meta tags.
            </p>
          </Link>

          <Link
            href="/supro111vat29/blogs/categories"
            className="p-4 border border-border bg-card hover:border-pink-500 hover:shadow-xs transition-all space-y-1.5 block cursor-pointer group"
          >
            <div className="p-2 bg-pink-50 dark:bg-pink-950/60 text-pink-600 w-fit">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-foreground group-hover:text-pink-600 transition-colors">
              Blog Topics & Filters →
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Organize editorial categories, topics, and guide classification.
            </p>
          </Link>

          <Link
            href="/supro111vat29/pages"
            className="p-4 border border-border bg-card hover:border-teal-500 hover:shadow-xs transition-all space-y-1.5 block cursor-pointer group"
          >
            <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 w-fit">
              <FileCode2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-foreground group-hover:text-teal-600 transition-colors">
              Custom & Legal Pages ({totalPages}) →
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Edit Privacy Policy, Terms of Service, FTC Disclosure, and custom policy pages.
            </p>
          </Link>

          <Link
            href="/supro111vat29/settings"
            className="p-4 border border-border bg-card hover:border-emerald-500 hover:shadow-xs transition-all space-y-1.5 block cursor-pointer group"
          >
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 w-fit">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-foreground group-hover:text-emerald-600 transition-colors">
              SEO, Pixels & Affiliates →
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Configure Amazon Associate Tag, GA4, Meta Facebook Pixel, TikTok Pixel, and branding.
            </p>
          </Link>
        </div>
      </div>

      {/* Recent Catalog Items Table */}
      <div className="p-5 border border-border bg-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              Catalog Items Live Preview
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {recentProducts.length} of {totalProducts} active products in the database
            </p>
          </div>
          <Link
            href="/supro111vat29/products"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Manage All Products</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Brand & Category</th>
                  <th className="py-2.5 px-3">Lowest Price</th>
                  <th className="py-2.5 px-3">Store Offers</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentProducts.map((p) => {
                  const offerPrices = (p.offers || [])
                    .map((o) => o.price)
                    .filter((pr) => pr > 0);
                  const minPrice = offerPrices.length > 0 ? Math.min(...offerPrices) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 bg-muted/40 border border-border shrink-0 overflow-hidden">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <p className="font-bold text-foreground truncate">{p.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">
                              ID: {p.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-foreground">{p.brand || 'Generic'}</span>
                        <span className="text-muted-foreground block text-[11px]">{p.category}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-black text-foreground">
                          {minPrice > 0 ? formatCurrency(minPrice) : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold text-[10px]">
                          {p.offers?.length || 0} Stores
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/supro111vat29/products/edit/${p.id}`}
                            className="p-1.5 border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="p-1.5 border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                            title="View on Storefront"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-xs">
            {loading ? 'Loading catalog statistics...' : 'No products found in catalog.'}
          </div>
        )}
      </div>
    </div>
  );
}
