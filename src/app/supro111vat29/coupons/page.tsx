'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Pencil,
  X,
  Search,
  Calendar,
  Sparkles,
  Share2,
  RefreshCw,
  SlidersHorizontal,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { CouponItem, DEFAULT_COUPONS } from '@/data/coupons';
import {
  getCoupons,
  saveCoupons,
  upsertCoupon,
  deleteCoupon,
  resetCouponsToDefault,
  COUPONS_UPDATED_EVENT,
} from '@/lib/couponStore';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [store, setStore] = useState('Amazon');
  const [customStore, setCustomStore] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<CouponItem['discountType']>('percentage');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [category, setCategory] = useState('All');
  const [expiresAt, setExpiresAt] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [terms, setTerms] = useState('');

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshCoupons = () => {
    setCoupons(getCoupons());
  };

  useEffect(() => {
    refreshCoupons();
    fetch('/api/coupons', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCoupons(json.data);
          saveCoupons(json.data);
        }
      })
      .catch((err) => console.warn('Coupons fetch error:', err));

    const handleUpdate = () => refreshCoupons();
    window.addEventListener(COUPONS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(COUPONS_UPDATED_EVENT, handleUpdate);
  }, []);


  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const openAddForm = () => {
    setEditingId(null);
    setStore('Amazon');
    setCustomStore('');
    setTitle('');
    setDescription('');
    setCode('');
    setDiscountValue('20% OFF');
    setDiscountType('percentage');
    setAffiliateUrl('https://');
    setCategory('All');
    setExpiresAt('2026-12-31');
    setIsVerified(true);
    setIsFeatured(false);
    setTerms('');
    setIsFormOpen(true);
  };

  const openEditForm = (item: CouponItem) => {
    setEditingId(item.id);
    const standardStores = ['Amazon', 'Best Buy', 'Walmart', 'Target', 'Apple', 'GoPro', 'Samsung', 'Sony', 'Anker'];
    if (standardStores.includes(item.store)) {
      setStore(item.store);
      setCustomStore('');
    } else {
      setStore('Other');
      setCustomStore(item.store);
    }
    setTitle(item.title);
    setDescription(item.description);
    setCode(item.code || '');
    setDiscountValue(item.discountValue);
    setDiscountType(item.discountType);
    setAffiliateUrl(item.affiliateUrl);
    setCategory(item.category || 'All');
    setExpiresAt(item.expiresAt || '');
    setIsVerified(item.isVerified);
    setIsFeatured(item.isFeatured || false);
    setTerms(item.terms || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStore = store === 'Other' ? (customStore.trim() || 'Custom Store') : store;
    if (!title.trim()) {
      alert('Please enter a coupon title');
      return;
    }
    if (!affiliateUrl.trim()) {
      alert('Please enter an affiliate/store URL');
      return;
    }

    const itemData: CouponItem = {
      id: editingId || `cp-dyn-${Date.now()}`,
      store: finalStore,
      storeSlug: finalStore.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: title.trim(),
      description: description.trim(),
      code: code.trim() || undefined,
      discountValue: discountValue.trim() || 'Special Deal',
      discountType,
      affiliateUrl: affiliateUrl.trim(),
      category: category.trim() || 'All',
      expiresAt: expiresAt.trim() || undefined,
      isVerified,
      isFeatured,
      terms: terms.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    upsertCoupon(itemData);
    setIsFormOpen(false);
    showToast(editingId ? 'Coupon successfully updated!' : 'New coupon added successfully!');

    try {
      await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
    } catch (err) {
      console.warn('Coupons server save error:', err);
    }
  };

  const handleDelete = (id: string, itemTitle: string) => {
    setDeleteTarget({ id, title: itemTitle });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { id, title } = deleteTarget;
      deleteCoupon(id);
      showToast(`Coupon "${title}" deleted.`);

      try {
        await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Coupons server delete error:', err);
      }
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset all coupons to default seed coupons?')) {
      resetCouponsToDefault();
      showToast('Reset to defaults');

      try {
        await fetch('/api/coupons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupons: DEFAULT_COUPONS }),
        });
      } catch (err) {
        console.warn('Coupons server reset error:', err);
      }
    }
  };


  const handleCopyCode = (id: string, codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  // Unique stores for filter
  const allStores = useMemo(() => {
    const set = new Set<string>();
    coupons.forEach((c) => {
      if (c.store) set.add(c.store);
    });
    return ['All', ...Array.from(set)];
  }, [coupons]);

  // Filtered coupons
  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = c.title.toLowerCase().includes(q);
        const mStore = c.store.toLowerCase().includes(q);
        const mCode = c.code ? c.code.toLowerCase().includes(q) : false;
        if (!mTitle && !mStore && !mCode) return false;
      }
      if (selectedStoreFilter !== 'All') {
        if (c.store.toLowerCase() !== selectedStoreFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [coupons, searchQuery, selectedStoreFilter]);

  const verifiedCount = coupons.filter((c) => c.isVerified).length;
  const codesCount = coupons.filter((c) => !!c.code).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 p-3.5 bg-emerald-600 text-white font-bold text-xs shadow-lg border border-emerald-500 animate-in fade-in slide-in-from-top-3 duration-150 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Coupons & Promo Codes</h1>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold">
              {coupons.length} Total
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage active store discount codes, affiliate promotional deals, and copyable vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/coupons"
            target="_blank"
            className="px-3 py-2 border border-border text-xs font-bold hover:bg-muted text-foreground flex items-center gap-1.5 transition-colors"
          >
            <span>View Frontend Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Button
            onClick={openAddForm}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 px-4 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Coupon</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 border border-border bg-card">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Coupons
          </div>
          <div className="text-2xl font-black text-foreground mt-1">{coupons.length}</div>
        </div>
        <div className="p-4 border border-border bg-card">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Verified Active
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{verifiedCount}</div>
        </div>
        <div className="p-4 border border-border bg-card">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Promo Codes
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">{codesCount}</div>
        </div>
        <div className="p-4 border border-border bg-card">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Direct Deals
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{coupons.length - codesCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by title, promo code, or store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Store filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-semibold shrink-0">Store:</span>
          <select
            value={selectedStoreFilter}
            onChange={(e) => setSelectedStoreFilter(e.target.value)}
            className="h-9 px-3 text-xs font-semibold border border-border bg-background text-foreground"
          >
            {allStores.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Stores' : s}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            title="Reset to default seed coupons"
            className="text-xs font-bold h-9 ml-auto sm:ml-0"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset Defaults
          </Button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Store</th>
              <th className="py-3 px-4">Coupon Title & Deal</th>
              <th className="py-3 px-4">Promo Code</th>
              <th className="py-3 px-4">Discount</th>
              <th className="py-3 px-4">Expiry</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No coupons found matching your search.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isCodeCopied = copiedCodeId === item.id;
                const isLinkCopied = copiedLinkId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground shrink-0">
                      <span className="px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-extrabold uppercase">
                        {item.store}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                      <div className="font-bold text-foreground truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {item.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      {item.code ? (
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.id, item.code!)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted border border-dashed border-blue-600/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                          title="Click to copy code"
                        >
                          <span>{item.code}</span>
                          {isCodeCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Instant Deal</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black uppercase">
                        {item.discountValue}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-muted-foreground">
                      {item.expiresAt || 'Ongoing'}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-600/20 text-[10px] font-bold">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-bold">
                          Unverified
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Copy Deal Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(item.id, item.affiliateUrl)}
                          className="p-1.5 text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors"
                          title="Copy affiliate deal URL"
                        >
                          {isLinkCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Open Link */}
                        <a
                          href={item.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors"
                          title="Open Store Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          className="p-1.5 text-muted-foreground hover:text-blue-600 border border-border hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Edit Coupon"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 border border-border hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-black text-foreground">
                  {editingId ? 'Edit Coupon & Promo' : 'Add New Coupon & Promo Code'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Store / Retailer *</label>
                  <select
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="w-full h-9 px-3 border border-border bg-background text-foreground text-xs"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Best Buy">Best Buy</option>
                    <option value="Walmart">Walmart</option>
                    <option value="Target">Target</option>
                    <option value="Apple">Apple</option>
                    <option value="GoPro">GoPro</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Sony">Sony</option>
                    <option value="Anker">Anker</option>
                    <option value="Other">Other (Custom Brand)</option>
                  </select>
                </div>

                {store === 'Other' ? (
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Custom Store Name *</label>
                    <Input
                      placeholder="e.g. Dell, Lenovo, Bose"
                      value={customStore}
                      onChange={(e) => setCustomStore(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-9 px-3 border border-border bg-background text-foreground text-xs"
                    >
                      <option value="All">All Categories</option>
                      <option value="Laptops">Laptops & Computers</option>
                      <option value="Audio">Audio & Headphones</option>
                      <option value="Cameras">Cameras & Photography</option>
                      <option value="Mobile & Wearables">Mobile & Wearables</option>
                      <option value="Accessories">Accessories & Gear</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Coupon Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Coupon Title *</label>
                <Input
                  placeholder="e.g. $50 OFF MacBook Air M3 & Apple Laptops"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Description & Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Use this promo code at checkout to receive 20% off all eligible accessories."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 text-xs border border-border bg-background text-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Promo Code */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Promo Code <span className="text-muted-foreground font-normal">(Leave blank if instant deal)</span>
                  </label>
                  <Input
                    placeholder="e.g. SAVE20, TECH50"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="h-9 text-xs font-mono font-bold tracking-wider"
                  />
                </div>

                {/* Discount Value */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Discount Value *</label>
                  <Input
                    placeholder="e.g. 20% OFF, $50 OFF"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Expiry Date</label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Affiliate URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Store / Affiliate Target URL *</label>
                <Input
                  placeholder="https://amazon.com/dp/... or https://bestbuy.com/..."
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {/* Terms */}
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Terms & Restrictions (Optional)</label>
                <Input
                  placeholder="e.g. Valid on purchases over $100. Limit 1 per customer."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-none cursor-pointer"
                  />
                  <span className="font-semibold text-foreground">Verified Active Deal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-none cursor-pointer"
                  />
                  <span className="font-semibold text-foreground">Featured Highlight</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5"
                >
                  {editingId ? 'Save Changes' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Coupon"
        itemType="coupon"
        itemName={deleteTarget?.title}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
