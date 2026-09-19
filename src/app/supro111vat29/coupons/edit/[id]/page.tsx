'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Tag, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CouponItem } from '@/data/coupons';
import { getCouponById, upsertCoupon } from '@/lib/couponStore';

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [store, setStore] = useState('Amazon');
  const [customStore, setCustomStore] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [discountValue, setDiscountValue] = useState('20% OFF');
  const [discountType, setDiscountType] = useState<CouponItem['discountType']>('percentage');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [category, setCategory] = useState('All');
  const [expiresAt, setExpiresAt] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [terms, setTerms] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const existing = getCouponById(id);
    if (!existing) {
      setNotFound(true);
      return;
    }

    const standardStores = ['Amazon', 'Best Buy', 'Walmart', 'Target', 'Apple', 'GoPro', 'Samsung', 'Sony', 'Anker'];
    if (standardStores.includes(existing.store)) {
      setStore(existing.store);
      setCustomStore('');
    } else {
      setStore('Other');
      setCustomStore(existing.store);
    }

    setTitle(existing.title);
    setDescription(existing.description || '');
    setCode(existing.code || '');
    setDiscountValue(existing.discountValue || '20% OFF');
    setDiscountType(existing.discountType || 'percentage');
    setAffiliateUrl(existing.affiliateUrl || '');
    setCategory(existing.category || 'All');
    setExpiresAt(existing.expiresAt || '');
    setIsVerified(existing.isVerified ?? true);
    setIsFeatured(existing.isFeatured ?? false);
    setTerms(existing.terms || '');
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStore = store === 'Other' ? (customStore.trim() || 'Custom Store') : store;
    if (!title.trim() || !affiliateUrl.trim()) return;

    const updatedCoupon: CouponItem = {
      id,
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

    upsertCoupon(updatedCoupon);
    setSavedSuccess(true);
    setTimeout(() => {
      router.push('/supro111vat29/coupons');
    }, 1200);
  };

  if (notFound) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Coupon not found</h2>
        <Link href="/supro111vat29/coupons">
          <Button size="sm" variant="outline">
            Back to Coupons
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {savedSuccess && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Coupon successfully updated! Redirecting to coupon list...</span>
        </div>
      )}

      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/supro111vat29/coupons">
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-black text-foreground">Edit Coupon & Promo</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border border-border bg-card p-6 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <option value="Other">Other (Custom Store)</option>
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

        <div className="space-y-1.5">
          <label className="font-bold text-foreground">Coupon Title *</label>
          <Input
            placeholder="e.g. 20% OFF Anker Fast Chargers"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 text-xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-foreground">Description & Details</label>
          <textarea
            rows={2}
            placeholder="e.g. Use code at checkout for 20% discount."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 text-xs border border-border bg-background text-foreground resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Promo Code (Optional)</label>
            <Input
              placeholder="e.g. SAVE20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-9 text-xs font-mono font-bold"
            />
          </div>

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

        <div className="space-y-1.5">
          <label className="font-bold text-foreground">Target / Affiliate Link *</label>
          <Input
            placeholder="https://..."
            value={affiliateUrl}
            onChange={(e) => setAffiliateUrl(e.target.value)}
            className="h-9 text-xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-foreground">Terms & Restrictions (Optional)</label>
          <Input
            placeholder="e.g. Minimum order $50."
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

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

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <Link href="/supro111vat29/coupons">
            <Button type="button" variant="outline" size="sm" className="text-xs font-bold">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
