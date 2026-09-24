'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CategoryDefinition } from '@/data/catalog';
import { getCategorySlug, getSubcategorySlug, doesProductMatchCategory, doesProductMatchSubcategory } from '@/lib/categoryStore';
import { Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { AdSlot } from '@/components/ads/AdSlot';
import { AdItem } from '@/types/ad';

export interface StorePlatformItem {
  id: string;
  name: string;
  color: string;
}

interface ProductCategorySidebarProps {
  categories: CategoryDefinition[];
  catCounts: Record<string, number>;
  subCounts: Record<string, number>;
  storeCounts: Record<string, number>;
  stores: StorePlatformItem[];
  totalCount: number;
  activeCategory?: string;
  activeSubcategory?: string;
  initialSidebarAd?: AdItem | null;
}

export function ProductCategorySidebar({
  categories,
  catCounts,
  subCounts,
  storeCounts,
  stores,
  totalCount,
  activeCategory = '',
  activeSubcategory = '',
  initialSidebarAd,
}: ProductCategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [activeCategory]: true,
  });

  return (
    <aside className="lg:col-span-3 space-y-6 hidden lg:block">
      <div className="border border-border/80 bg-card p-4 space-y-6 shadow-sm">
        {/* Sidebar Header & Reset */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Filters & Categories
          </span>
          <Link
            href="/products"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
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
              className="w-full text-left py-2 px-2.5 rounded-lg flex items-center justify-between transition-all text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
            >
              <span className="tracking-tight">All Categories</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums bg-muted text-muted-foreground">
                {totalCount}
              </span>
            </Link>

            {/* Dynamic Category tree with subcategories */}
            {categories.map((cat) => {
              const isCatSelected = doesProductMatchCategory(activeCategory, cat.name, categories);
              const isExpanded = expandedCategories[cat.name] ?? isCatSelected;
              const catCount = catCounts[cat.name] || 0;
              const catSlug = (cat.slug || getCategorySlug(categories, cat.name)).toLowerCase();

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
                      href={`/products/${catSlug}`}
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
                          doesProductMatchSubcategory(activeSubcategory, sub.name, cat.name, categories);
                        const subCount = subCounts[`${cat.name}::${sub.name}`] || 0;
                        const subSlug = (sub.slug || getSubcategorySlug(cat, sub.name)).toLowerCase();

                        return (
                          <Link
                            key={sub.id}
                            href={`/products/${catSlug}/${subSlug}`}
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
            {stores.map((store) => {
              const storeCount = storeCounts[store.id] || 0;
              return (
                <Link
                  key={store.id}
                  href={`/products?platform=${encodeURIComponent(store.id)}`}
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

      {/* Ad Placement: Left Sidebar Bottom Square Ad */}
      <AdSlot placement="product_detail_sidebar_bottom" initialAd={initialSidebarAd} />
    </aside>
  );
}
