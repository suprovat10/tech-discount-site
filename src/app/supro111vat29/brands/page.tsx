'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Globe,
  Upload,
  ArrowUp,
  ArrowDown,
  Pencil,
  X,
  Check,
  Eye,
  ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { BrandItem } from '@/data/brands';
import {
  getBrands,
  saveBrands,
  upsertBrand,
  deleteBrand,
  moveBrand,
  getBrandProductCount,
  fetchAndSyncBrandsFromServer,
} from '@/lib/brandStore';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [richDescription, setRichDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);
  const [showOnHomepage, setShowOnHomepage] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // SEO states
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [noIndex, setNoIndex] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const ogFileInputRef = React.useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const refreshBrands = () => {
    setBrands(getBrands());
  };

  useEffect(() => {
    refreshBrands();
    fetchAndSyncBrandsFromServer().then((fresh) => {
      if (fresh) setBrands(fresh);
    });
    const handleUpdate = () => refreshBrands();
    window.addEventListener('smarttech_brands_updated', handleUpdate);
    return () => window.removeEventListener('smarttech_brands_updated', handleUpdate);
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setWebsite('');
    setLogoUrl('');
    setRichDescription('');
    setIsFeatured(true);
    setShowOnHomepage(true);
    setIsActive(true);
    setMetaTitle('');
    setMetaDescription('');
    setKeywords('');
    setCanonicalUrl('');
    setOgImageUrl('');
    setNoIndex(false);
    setShowSeo(false);
    setIsFormOpen(true);
  };

  const openEditForm = (brand: BrandItem) => {
    setEditingId(brand.id);
    setName(brand.name);
    setSlug(brand.slug);
    setWebsite(brand.website);
    setLogoUrl(brand.logoUrl || '');
    setRichDescription(brand.richDescription || brand.description || '');
    setIsFeatured(brand.isFeatured);
    setShowOnHomepage(brand.showOnHomepage ?? true);
    setIsActive(brand.isActive);
    setMetaTitle(brand.seo?.metaTitle || '');
    setMetaDescription(brand.seo?.metaDescription || '');
    setKeywords(brand.seo?.keywords || '');
    setCanonicalUrl(brand.seo?.canonicalUrl || '');
    setOgImageUrl(brand.seo?.ogImageUrl || '');
    setNoIndex(Boolean(brand.seo?.noIndex));
    setShowSeo(Boolean(brand.seo?.metaTitle || brand.seo?.metaDescription || brand.seo?.keywords));
    setIsFormOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'brands');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url) {
          setLogoUrl(data.url);
          return;
        }
      } catch (err) {
        console.warn('Brand logo upload API failed:', err);
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const brandPayload: BrandItem = {
      id: editingId || `b-${Date.now()}`,
      name: name.trim(),
      slug: generatedSlug,
      logoUrl: logoUrl.trim(),
      website: website.trim() || `https://${generatedSlug}.com`,
      isFeatured,
      showOnHomepage,
      isActive,
      order: editingId ? brands.find((b) => b.id === editingId)?.order || 1 : brands.length + 1,
      richDescription: richDescription.trim() || undefined,
      description: richDescription.trim() ? richDescription.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
      seo: {
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        keywords: keywords.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        ogImageUrl: ogImageUrl.trim() || undefined,
        noIndex,
      },
    };

    upsertBrand(brandPayload);
    setIsFormOpen(false);
    setNotification(editingId ? `Brand "${brandPayload.name}" updated successfully!` : `Brand "${brandPayload.name}" created!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleHomepage = (brand: BrandItem) => {
    const updated = { ...brand, showOnHomepage: !brand.showOnHomepage };
    upsertBrand(updated);
    setNotification(`Homepage visibility updated for "${brand.name}".`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleToggleActive = (brand: BrandItem) => {
    const updated = { ...brand, isActive: !brand.isActive };
    upsertBrand(updated);
    setNotification(`Status updated for "${brand.name}".`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleMove = (id: string, dir: 'up' | 'down') => {
    moveBrand(id, dir);
  };

  const handleDelete = (id: string, brandName: string) => {
    setDeleteTarget({ id, name: brandName });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteBrand(deleteTarget.id);
    setNotification(`Brand "${deleteTarget.name}" removed.`);
    setTimeout(() => setNotification(null), 3000);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground">Brand Partners Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure transparent logos, homepage showcase, reorder brands, and dedicated brand store pages.
          </p>
        </div>

        <Button
          onClick={openAddForm}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand</span>
        </Button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border-2 border-blue-600 w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>{editingId ? 'Edit Brand Partner' : 'Add New Brand Partner'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                    Brand Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Apple, Samsung, Sony"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                    Slug (URL Key) *
                  </label>
                  <Input
                    required
                    placeholder="e.g. apple"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground block mb-1">
                  Official Website
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Brand Logo Upload & URL */}
              <div className="space-y-2 p-3.5 border border-border bg-muted/20">
                <label className="text-[11px] font-black uppercase text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Brand Logo (Transparent PNG / SVG Recommended)</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                      Upload from Computer
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                      Or Paste Image / SVG URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://...logo.svg"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Logo Live Preview */}
                {logoUrl && (
                  <div className="pt-2 flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Preview:</span>
                    <div className="flex items-center gap-3">
                      {/* Light background preview */}
                      <div className="h-10 px-3 bg-white border border-border flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt="Preview"
                          className="h-7 max-w-[100px] w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      {/* Dark background preview */}
                      <div className="h-10 px-3 bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt="Preview Dark"
                          className="h-7 max-w-[100px] w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* Brand Page Bottom Rich Content */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                    Brand Page Bottom Rich Content (WYSIWYG)
                  </label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Displays formatted text, brand history, warranty info, or guides below pagination on this brand page.
                  </p>
                  <RichTextEditor
                    value={richDescription}
                    onChange={setRichDescription}
                    placeholder="Write formatted content, brand overview, warranty details, or SEO text for this brand..."
                    minHeight="160px"
                  />
                </div>

              {/* Brand SEO Settings Collapsible Section */}
              <div className="p-3.5 border border-border bg-card space-y-3">
                <button
                  type="button"
                  onClick={() => setShowSeo(!showSeo)}
                  className="w-full flex items-center justify-between text-xs font-bold text-foreground cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>SEO Settings (Search Engine Optimization)</span>
                    {(metaTitle || metaDescription || keywords) && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-bold">
                        Configured
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {showSeo ? '▲ Hide' : '▼ Expand'}
                  </span>
                </button>

                {showSeo && (
                  <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Title</label>
                        <span className="text-[10px] text-muted-foreground">{metaTitle.length}/60</span>
                      </div>
                      <Input
                        type="text"
                        placeholder={`${name || 'Brand'} Deals, Discounts & Price Drops`}
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Description</label>
                        <span className="text-[10px] text-muted-foreground">{metaDescription.length}/160</span>
                      </div>
                      <textarea
                        placeholder="Search engine snippet summary..."
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        className="w-full text-xs bg-muted/40 border border-border p-2 rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        SEO Keywords (Comma separated)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. deals, discounts, price drop, best price"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Canonical URL (Override)
                      </label>
                      <Input
                        type="text"
                        placeholder="https://suprodesign.com/brand/slug"
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        className="text-xs font-mono rounded-none h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        OG Image URL (Social Share)
                      </label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="text"
                          placeholder="https://... or upload image"
                          value={ogImageUrl}
                          onChange={(e) => setOgImageUrl(e.target.value)}
                          className="text-xs rounded-none h-8 flex-1"
                        />
                        <input
                          type="file"
                          ref={ogFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('folder', 'brands');
                                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                const data = await res.json();
                                if (data.success && data.url) {
                                  setOgImageUrl(data.url);
                                  return;
                                }
                              } catch (err) {
                                console.warn('OG image upload failed:', err);
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setOgImageUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => ogFileInputRef.current?.click()}
                          className="rounded-none h-8 text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </Button>
                      </div>
                      {ogImageUrl && (
                        <div className="mt-2 relative w-20 h-14 border border-border bg-muted overflow-hidden">
                          <img src={ogImageUrl} alt="OG Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setOgImageUrl('')}
                            className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 shadow-sm"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={noIndex}
                          onChange={(e) => setNoIndex(e.target.checked)}
                          className="rounded-none"
                        />
                        <span className="text-rose-600 dark:text-rose-400">Noindex (Hide from search engines)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkboxes: Show on Homepage & Featured */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showOnHomepage}
                    onChange={(e) => setShowOnHomepage(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>Show on Homepage (Brand Showcase Section)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Mark as Featured Brand</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span>Active in Storefront Filter and Brand Pages</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-bold h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5"
                >
                  {editingId ? 'Save Changes' : 'Create Brand'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brands Table */}
      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
              Configured Brands ({brands.length})
            </h3>
            <span className="text-[11px] text-muted-foreground">
              • Use (↑ / ↓) to reorder the brand display sequence
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-600">
            {brands.filter((b) => b.showOnHomepage && b.isActive).length} on Homepage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3 w-16 text-center">Order</th>
                <th className="p-3">Brand Logo & Name</th>
                <th className="p-3">Slug (Dedicated Page)</th>
                <th className="p-3">Website</th>
                <th className="p-3">Products</th>
                <th className="p-3">Homepage</th>
                <th className="p-3">Featured</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {brands.map((b, idx) => {
                const count = getBrandProductCount(b.name);
                return (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    {/* Move Up / Down */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMove(b.id, 'up')}
                          title="Move Up"
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === brands.length - 1}
                          onClick={() => handleMove(b.id, 'down')}
                          title="Move Down"
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Logo & Name */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-9 p-1 bg-muted/40 border border-border flex items-center justify-center shrink-0">
                          {b.logoUrl ? (
                            <img
                              src={b.logoUrl}
                              alt={b.name}
                              className="h-6 w-auto max-w-[36px] object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="font-black text-xs text-muted-foreground">
                              {b.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-black text-foreground block">{b.name}</span>
                          <span className="text-[10px] text-muted-foreground">Position #{idx + 1}</span>
                        </div>
                      </div>
                    </td>

                    {/* Slug / Brand Page Link */}
                    <td className="p-3">
                      <Link
                        href={`/brand/${b.slug}`}
                        target="_blank"
                        className="text-blue-600 hover:underline font-mono text-[11px] flex items-center gap-1"
                        title="View brand storefront page"
                      >
                        <span>/{b.slug}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </Link>
                    </td>

                    {/* Website */}
                    <td className="p-3">
                      {b.website ? (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Visit Site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Product count */}
                    <td className="p-3 font-semibold text-foreground">
                      <Link
                        href={`/brand/${b.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {count} item{count === 1 ? '' : 's'}
                      </Link>
                    </td>

                    {/* Homepage Tick Option */}
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleHomepage(b)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                          b.showOnHomepage
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/70'
                        }`}
                        title="Click to toggle show on homepage"
                      >
                        {b.showOnHomepage ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>On Home</span>
                          </>
                        ) : (
                          <span>Hidden</span>
                        )}
                      </button>
                    </td>

                    {/* Featured */}
                    <td className="p-3">
                      {b.isFeatured ? (
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase">
                          Featured
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">Standard</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(b)}
                        className={`px-2 py-0.5 font-bold text-[10px] uppercase ${
                          b.isActive
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {b.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(b)}
                          className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                          title="Edit Brand"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id, b.name)}
                          className="p-1 text-muted-foreground hover:text-rose-600 transition-colors"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Brand Partner"
        itemType="brand"
        itemName={deleteTarget?.name}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
