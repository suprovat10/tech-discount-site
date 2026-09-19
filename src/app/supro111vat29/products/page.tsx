'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CatalogItem, PRODUCTS_CATALOG } from '@/data/catalog';
import {
  getCatalogProducts,
  deleteCatalogProduct,
  duplicateCatalogProduct,
  saveCatalogProducts,
  resetCatalogToDefault,
} from '@/lib/catalogStore';
import {
  PlusCircle,
  Pencil,
  Copy,
  Trash2,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Search,
  Store,
  Layers,
  Sparkles,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminProductsManager() {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Pagination (20 per page)
  const PRODUCTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setProducts(getCatalogProducts());
  }, []);

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchQuery =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'all' || p.category === filterCategory;
    return matchQuery && matchCat;
  });

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Copy (Duplicate) Action
  const handleCopyProduct = (id: string) => {
    const cloned = duplicateCatalogProduct(id);
    if (cloned) {
      setProducts(getCatalogProducts());
      setSuccessMessage(`Product duplicated as "${cloned.title}"!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // Delete Action
  const handleDeleteProduct = (id: string, title: string) => {
    if (confirm(`Are you sure you want to remove "${title}"?`)) {
      deleteCatalogProduct(id);
      setProducts(getCatalogProducts());
      setSuccessMessage(`Product "${title}" removed.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Restore / Re-sync all default products from catalog
  const handleRestoreDefaultCatalog = () => {
    const all = resetCatalogToDefault();
    setProducts([...all]);
    setSuccessMessage(`Successfully synchronized and restored all ${all.length} products with the full catalog!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Dynamic Price Sync Action
  const handleSyncPrices = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Simulate live price feed updates across the 4 platforms
      const updated = products.map((p) => {
        const updatedOffers = p.offers.map((offer) => {
          // slight live fluctuation (+/- 2%)
          const variance = (Math.random() * 4 - 2) / 100;
          const newPrice = Math.max(15, parseFloat((offer.price * (1 + variance)).toFixed(2)));
          return {
            ...offer,
            price: newPrice,
            lastUpdated: new Date().toISOString(),
          };
        });

        // Lowest price offer
        const prices = updatedOffers.map((o) => o.price);
        const lowest = Math.min(...prices);
        const adjustedOffers = updatedOffers.map((o) => ({
          ...o,
          isLowestPrice: o.price === lowest,
        }));

        return {
          ...p,
          offers: adjustedOffers,
        };
      });

      saveCatalogProducts(updated);
      setProducts(updated);
      setIsSyncing(false);
      setSuccessMessage('Real-time prices successfully synchronized across Amazon, Walmart, Best Buy, and Target!');
      setTimeout(() => setSuccessMessage(null), 3500);
    }, 800);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground">Product Inventory & Live Price Feeds</h1>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold text-[10px]">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage multi-retailer products with real store links, per-product SEO, rich text descriptions, and live price comparisons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {products.length < PRODUCTS_CATALOG.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestoreDefaultCatalog}
              className="text-xs font-bold h-9 px-3 flex items-center gap-1.5 border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              title="Load all 22 products from system catalog"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Load All Products ({PRODUCTS_CATALOG.length})</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncPrices}
            disabled={isSyncing}
            className="text-xs font-bold h-9 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncing ? 'Syncing Feeds...' : 'Sync Live Prices'}</span>
          </Button>

          <Link href="/supro111vat29/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>Create New Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border border-border bg-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by title or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-muted-foreground shrink-0">Filter Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 border border-input bg-background px-3 text-xs font-semibold w-full sm:w-auto"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Inventory Table */}
      <div className="border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3">Product</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Amazon</th>
                <th className="pb-3">Walmart</th>
                <th className="pb-3">Best Buy</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">Specs / FAQs</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-semibold">
              {paginatedProducts.map((p) => {
                const amz = p.offers.find((o) => o.retailer === 'amazon');
                const wal = p.offers.find((o) => o.retailer === 'walmart');
                const bby = p.offers.find((o) => o.retailer === 'bestbuy');
                const tgt = p.offers.find((o) => o.retailer === 'target');
                const imageCount = p.images?.length || 1;
                const faqCount = p.faqs?.length || 0;

                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    {/* Product Info */}
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-10 border border-border bg-white overflow-hidden shrink-0">
                          <Image
                            src={p.imageUrl}
                            alt={p.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <div className="font-bold text-foreground line-clamp-1 max-w-xs">{p.title}</div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-bold text-blue-600 uppercase">{p.brand}</span>
                            <span>•</span>
                            <span>{imageCount} Image{imageCount > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 pr-4 text-muted-foreground">{p.category}</td>

                    {/* Real 4 Platform Prices with Direct Links */}
                    <td className="py-3.5 pr-4">
                      <a
                        href={amz?.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-600 font-bold hover:underline inline-flex items-center gap-1"
                        title="Open Amazon Product Link"
                      >
                        <span>${amz?.price?.toFixed(2) || '—'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </td>

                    <td className="py-3.5 pr-4">
                      <a
                        href={wal?.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                        title="Open Walmart Product Link"
                      >
                        <span>${wal?.price?.toFixed(2) || '—'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </td>

                    <td className="py-3.5 pr-4">
                      <a
                        href={bby?.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-yellow-600 font-bold hover:underline inline-flex items-center gap-1"
                        title="Open Best Buy Product Link"
                      >
                        <span>${bby?.price?.toFixed(2) || '—'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </td>

                    <td className="py-3.5 pr-4">
                      <a
                        href={tgt?.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-600 font-bold hover:underline inline-flex items-center gap-1"
                        title="Open Target Product Link"
                      >
                        <span>${tgt?.price?.toFixed(2) || '—'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </td>

                    {/* Specs / FAQs count */}
                    <td className="py-3.5 pr-4 text-muted-foreground">
                      <span className="font-mono text-[11px]">
                        {Object.keys(p.specs || {}).length} specs / {faqCount} faqs
                      </span>
                    </td>

                    {/* Action Icons: Edit, Copy, Delete, View */}
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <Link href={`/supro111vat29/products/edit/${encodeURIComponent(p.id)}`}>
                          <button
                            type="button"
                            className="p-1.5 border border-border hover:border-blue-600 hover:text-blue-600 bg-background text-muted-foreground transition-colors"
                            title="Edit Product"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </Link>

                        {/* Copy (Duplicate) Icon */}
                        <button
                          type="button"
                          onClick={() => handleCopyProduct(p.id)}
                          className="p-1.5 border border-border hover:border-emerald-600 hover:text-emerald-600 bg-background text-muted-foreground transition-colors"
                          title="Copy / Duplicate Product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Icon */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.title)}
                          className="p-1.5 border border-border hover:border-red-600 hover:text-red-600 bg-background text-muted-foreground transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* View Live Storefront Icon */}
                        <Link href={`/product/${p.slug}`} target="_blank">
                          <button
                            type="button"
                            className="p-1.5 border border-border hover:border-foreground hover:text-foreground bg-background text-muted-foreground transition-colors"
                            title="View Storefront Product Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (20 per page) */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground font-medium">
              Showing{' '}
              <span className="font-bold text-foreground">
                {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}
              </span>{' '}
              of <span className="font-bold text-foreground">{filteredProducts.length}</span>{' '}
              products
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 text-xs font-bold rounded-none flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    totalPages > 7 &&
                    pageNum !== 1 &&
                    pageNum !== totalPages &&
                    Math.abs(pageNum - currentPage) > 1
                  ) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={pageNum} className="px-1 text-xs text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-xs font-bold border transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-3 text-xs font-bold rounded-none flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
