'use client';

import React from 'react';
import Link from 'next/link';
import { PRODUCTS_CATALOG, CATEGORIES } from '@/data/catalog';
import { BLOG_POSTS, DEFAULT_BLOG_CATEGORIES } from '@/data/blogs';
import {
  Package,
  Layers,
  FileText,
  FolderPlus,
  Award,
  Sliders,
  PlusCircle,
  ExternalLink,
  Store,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-foreground">Admin Console Overview</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              Live Mode
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage multi-retailer affiliate products, price tracking feeds, categories, brand partners, blogs, and SEO/Pixel analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/supro111vat29/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>+ Add New Product</span>
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="text-xs font-bold flex items-center gap-1.5">
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Catalog Items</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{PRODUCTS_CATALOG.length}</p>
          <p className="text-[10px] text-emerald-600 font-semibold">In 4-Store Price Matrix</p>
        </div>

        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Categories</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{CATEGORIES.length}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">
            {CATEGORIES.reduce((acc, c) => acc + c.subcategories.length, 0)} Subcategories Indexed
          </p>
        </div>

        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Brand Partners</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">9 Featured</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Apple, Samsung, Sony...</p>
        </div>

        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Editorial Blogs</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{BLOG_POSTS.length}</p>
          <p className="text-[10px] text-muted-foreground font-semibold">Published Buying Guides</p>
        </div>

        <div className="p-5 border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Tracking & SEO</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">Active</p>
          <p className="text-[10px] text-emerald-600 font-semibold">GA4 + Meta Pixel Connected</p>
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
          href="/supro111vat29/brands"
          className="group p-5 border border-border bg-card hover:border-amber-500 hover:shadow-xs transition-all space-y-2"
        >
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 w-fit">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-foreground group-hover:text-amber-600 transition-colors">
            Brand Partners Manager →
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure featured manufacturers, brand logos, official store websites, and filter catalog items.
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
            Configure Google Analytics 4, Meta Facebook Pixel, TikTok Pixel, affiliate IDs, and meta tags.
          </p>
        </Link>
      </div>
    </div>
  );
}
