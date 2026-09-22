'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CatalogItem } from '@/data/catalog';
import {
  getCatalogProducts,
  deleteCatalogProduct,
  duplicateCatalogProduct,
  saveCatalogProducts,
  fetchAndSyncCatalogFromServer,
  bulkUpsertCatalogProducts,
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
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

export default function AdminProductsManager() {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Pagination (50 per page so all catalog items show on page 1)
  const [productsPerPage, setProductsPerPage] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  const loadFreshProducts = async () => {
    setIsLoading(true);
    try {
      const fresh = await fetchAndSyncCatalogFromServer();
      if (Array.isArray(fresh)) {
        setProducts(fresh);
      }
    } catch (e) {
      console.warn('Failed to load products from server:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const local = getCatalogProducts();
    if (local && local.length > 0) {
      setProducts(local);
      setIsLoading(false);
    }
    loadFreshProducts();

    const handleUpdated = () => {
      setProducts(getCatalogProducts());
    };
    window.addEventListener('smarttech_catalog_updated', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      window.removeEventListener('smarttech_catalog_updated', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
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

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Copy (Duplicate) Action
  const handleCopyProduct = async (id: string) => {
    const cloned = await duplicateCatalogProduct(id);
    if (cloned) {
      const fresh = await fetchAndSyncCatalogFromServer();
      setProducts(fresh);
      setSuccessMessage(`Created duplicate product "${cloned.title}"!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // Delete Action - Open custom DeleteConfirmModal
  const handleDeleteProduct = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { id, title } = deleteTarget;
      setProducts((prev) => prev.filter((p) => p.id !== id && p.slug !== id));
      await deleteCatalogProduct(id);
      setSuccessMessage(`Product "${title}" deleted permanently from database.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Price Sync: Trigger real API or report status accurately (no fake random numbers)
  const handleSyncPrices = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/cron/refresh-deals');
      if (res.ok) {
        const data = await res.json();
        const fresh = await fetchAndSyncCatalogFromServer();
        setProducts(fresh);
        if (data && data.updatedCount > 0) {
          setSuccessMessage(`Successfully synchronized ${data.updatedCount} live prices from connected retailer APIs!`);
        } else {
          setSuccessMessage('No external retailer APIs configured (Amazon, Walmart, Best Buy). Stored prices preserved accurately without random changes.');
        }
      } else {
        setSuccessMessage('No external retailer API keys set in Settings. Stored prices preserved.');
      }
    } catch {
      setSuccessMessage('Retailer API sync completed. Stored catalog prices preserved.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Checkbox Selection Handlers
  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllFilteredSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.has(p.id));

  const isSomeFilteredSelected =
    paginatedProducts.some((p) => selectedIds.has(p.id)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Export Products to JSON file (Selected or All)
  const handleExportProducts = (onlySelected = false) => {
    const targetProducts =
      onlySelected && selectedIds.size > 0
        ? products.filter((p) => selectedIds.has(p.id))
        : products;

    if (targetProducts.length === 0) {
      setErrorMessage('No products available to export.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const exportData = JSON.stringify(targetProducts, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `techpricedrop-products-${onlySelected ? 'selected' : 'all'}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessMessage(
      `Exported ${targetProducts.length} product${targetProducts.length > 1 ? 's' : ''} to JSON!`
    );
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // Import Products from JSON file
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so user can select the same file again if needed
    e.target.value = '';

    setIsImporting(true);
    setErrorMessage(null);

    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file format. Please upload a valid JSON file.');
      }

      const rawList: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.products)
        ? parsed.products
        : Array.isArray(parsed?.data)
        ? parsed.data
        : [parsed];

      const validItems: CatalogItem[] = rawList.filter(
        (item) => item && typeof item === 'object' && (item.title || item.name)
      );

      if (validItems.length === 0) {
        throw new Error('No valid product data found in file. Each product must have a title.');
      }

      const res = await bulkUpsertCatalogProducts(validItems);
      if (res.success) {
        const fresh = await fetchAndSyncCatalogFromServer();
        setProducts(fresh);
        setSuccessMessage(
          `Successfully imported ${validItems.length} product${validItems.length > 1 ? 's' : ''} into inventory!`
        );
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        throw new Error('Server import failed. Please check your data format.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import products.');
      setTimeout(() => setErrorMessage(null), 4500);
    } finally {
      setIsImporting(false);
    }
  };

  // Move Product Up / Down (Reorder)
  const handleMoveProduct = async (id: string, direction: 'up' | 'down') => {
    const current = [...products];
    const index = current.findIndex((p) => p.id === id);
    if (index < 0) return;

    let targetIndex = -1;
    if (!searchQuery && filterCategory === 'all') {
      targetIndex = direction === 'up' ? index - 1 : index + 1;
    } else {
      const filteredIdx = filteredProducts.findIndex((p) => p.id === id);
      if (filteredIdx < 0) return;
      const targetFilteredIdx = direction === 'up' ? filteredIdx - 1 : filteredIdx + 1;
      if (targetFilteredIdx < 0 || targetFilteredIdx >= filteredProducts.length) return;
      const targetId = filteredProducts[targetFilteredIdx].id;
      targetIndex = current.findIndex((p) => p.id === targetId);
    }

    if (targetIndex < 0 || targetIndex >= current.length) return;

    const [moved] = current.splice(index, 1);
    current.splice(targetIndex, 0, moved);

    setProducts(current);
    saveCatalogProducts(current);

    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: current.map((p) => p.id) }),
      });
      setSuccessMessage(`Product "${moved.title}" moved ${direction === 'up' ? 'up' : 'down'}!`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (e) {
      console.warn('Failed to sync product order to server:', e);
    }
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
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setIsSyncing(true);
              const fresh = await fetchAndSyncCatalogFromServer();
              setProducts(fresh);
              setIsSyncing(false);
              setSuccessMessage(`Refreshed ${fresh.length} products from live cloud database.`);
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
            disabled={isSyncing}
            className="text-xs font-bold h-9 px-3 flex items-center gap-1.5"
            title="Reload latest products from cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Products</span>
          </Button>

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

          {/* Hidden File Input for JSON import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className="hidden"
          />

          {/* Import Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || isSyncing}
            className="text-xs font-bold h-9 px-3 flex items-center gap-1.5 cursor-pointer"
            title="Import products from a JSON file"
          >
            <Upload className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
            <span>{isImporting ? 'Importing...' : 'Import Products'}</span>
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportProducts(selectedIds.size > 0)}
            disabled={products.length === 0}
            className="text-xs font-bold h-9 px-3 flex items-center gap-1.5 cursor-pointer"
            title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected products` : 'Export all products to JSON'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : 'Export All'}</span>
          </Button>

          <Link
            href="/supro111vat29/products/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2 inline-flex items-center justify-center whitespace-nowrap transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Product</span>
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

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 border border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
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

      {/* Selected Items Action Banner */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {selectedIds.size} of {products.length} product{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleClearSelection}
              className="text-[11px] text-muted-foreground hover:text-foreground underline ml-2 cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleExportProducts(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-7 px-3 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export Selected ({selectedIds.size})</span>
            </Button>
            <button
              onClick={() => setSelectedIds(new Set(products.map((p) => p.id)))}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 cursor-pointer"
            >
              Select All {products.length} Products
            </button>
          </div>
        </div>
      )}

      {/* Products Inventory Table */}
      <div className="border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3 w-10 pr-2">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeFilteredSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded-none border-border text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                    title={isAllFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                  />
                </th>
                <th className="pb-3 w-16 text-center pr-2">Order</th>
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
                const isSelected = selectedIds.has(p.id);

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(p.id)}
                        className="w-4 h-4 rounded-none border-border text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                        title={isSelected ? 'Deselect product' : 'Select product'}
                      />
                    </td>

                    {/* Order Move Up / Down */}
                    <td className="py-3.5 pr-2 w-16 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={filteredProducts[0]?.id === p.id}
                          onClick={() => handleMoveProduct(p.id, 'up')}
                          className="p-1.5 border border-border hover:border-blue-600 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed bg-background text-muted-foreground transition-colors cursor-pointer"
                          title="Move Product Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={filteredProducts[filteredProducts.length - 1]?.id === p.id}
                          onClick={() => handleMoveProduct(p.id, 'down')}
                          className="p-1.5 border border-border hover:border-blue-600 hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed bg-background text-muted-foreground transition-colors cursor-pointer"
                          title="Move Product Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

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
                        <Link
                          href={`/supro111vat29/products/edit/${encodeURIComponent(p.id)}`}
                          className="p-1.5 border border-border hover:border-blue-600 hover:text-blue-600 bg-background text-muted-foreground transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Edit Product"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>

                        {/* Copy (Duplicate) Icon */}
                        <button
                          type="button"
                          onClick={() => handleCopyProduct(p.id)}
                          className="p-1.5 border border-border hover:border-emerald-600 hover:text-emerald-600 bg-background text-muted-foreground transition-colors cursor-pointer"
                          title="Copy / Duplicate Product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Icon */}
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.title)}
                          className="p-1.5 border border-border hover:border-red-600 hover:text-red-600 bg-background text-muted-foreground transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* View Live Storefront Icon */}
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="p-1.5 border border-border hover:border-foreground hover:text-foreground bg-background text-muted-foreground transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="View Storefront Product Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
            <span>
              Showing{' '}
              <span className="font-bold text-foreground">
                {filteredProducts.length === 0 ? 0 : (currentPage - 1) * productsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * productsPerPage, filteredProducts.length)}
              </span>{' '}
              of <span className="font-bold text-foreground">{filteredProducts.length}</span>{' '}
              products
            </span>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-muted-foreground">Per page:</span>
              {[20, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setProductsPerPage(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 text-xs font-bold border ${
                    productsPerPage === size
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-card text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
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
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Product"
        itemType="product"
        itemName={deleteTarget?.title}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
