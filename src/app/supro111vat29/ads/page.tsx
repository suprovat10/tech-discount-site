'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Code2,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Upload,
  X,
  Power,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AdItem, AdPlacementId, AD_PLACEMENTS, AdPlacementConfig } from '@/types/ad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlacement, setActivePlacement] = useState<AdPlacementConfig | null>(null);
  const [editingAd, setEditingAd] = useState<Partial<AdItem>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load ads from API
  const loadAds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ads', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAds(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  // Compute status for an ad
  const getAdStatus = (ad?: AdItem) => {
    if (!ad) return { label: 'Empty', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' };
    if (!ad.enabled) return { label: 'Disabled', color: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' };

    const now = Date.now();
    if (ad.startDate) {
      const start = new Date(ad.startDate).getTime();
      if (!isNaN(start) && now < start) {
        return { label: 'Scheduled', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800' };
      }
    }

    if (ad.endDate) {
      const end = new Date(ad.endDate).getTime();
      if (!isNaN(end) && now > end) {
        return { label: 'Expired', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800' };
      }
    }

    return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800' };
  };

  // Open modal for a placement
  const handleConfigureSlot = (config: AdPlacementConfig) => {
    setActivePlacement(config);
    const existing = ads.find((a) => a.placement === config.id);

    if (existing) {
      setEditingAd({ ...existing });
    } else {
      setEditingAd({
        id: `ad-${config.id}-${Date.now()}`,
        placement: config.id,
        title: config.name,
        adType: 'image',
        format: config.format,
        imageUrl: '',
        targetUrl: '',
        altText: config.name,
        openInNewTab: true,
        htmlCode: '',
        enabled: true,
        hasTimer: false,
        startDate: '',
        endDate: '',
      });
    }
    setSaveError('');
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  // Upload image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSaveError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'ads');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setEditingAd((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        setSaveError(data.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  // Save ad
  const handleSaveAd = async () => {
    if (!editingAd.placement || !editingAd.title?.trim()) {
      setSaveError('Title and Placement are required');
      return;
    }

    if (editingAd.adType === 'image' && !editingAd.imageUrl?.trim()) {
      setSaveError('Please upload an image or provide an Image URL for image ads');
      return;
    }

    if (editingAd.adType === 'html' && !editingAd.htmlCode?.trim()) {
      setSaveError('Please paste HTML or Google AdSense code');
      return;
    }

    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAd),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSaveSuccess(false);
          loadAds();
        }, 600);
      } else {
        setSaveError(data.error || 'Failed to save ad');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error saving ad');
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (ad: AdItem) => {
    try {
      const updated = { ...ad, enabled: !ad.enabled };
      await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      loadAds();
    } catch (err) {
      console.error('Error toggling ad status:', err);
    }
  };

  // Delete/Clear ad
  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to remove this ad from this placement?')) return;
    try {
      await fetch(`/api/ads?id=${id}`, { method: 'DELETE' });
      loadAds();
    } catch (err) {
      console.error('Error deleting ad:', err);
    }
  };

  // Filtered placements
  const filteredPlacements = useMemo(() => {
    if (selectedCategory === 'All') return AD_PLACEMENTS;
    return AD_PLACEMENTS.filter((p) => p.page === selectedCategory);
  }, [selectedCategory]);

  // Summary counts
  const stats = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let disabled = 0;

    ads.forEach((ad) => {
      const status = getAdStatus(ad);
      if (status.label === 'Active') active++;
      else if (status.label === 'Scheduled') scheduled++;
      else if (status.label === 'Expired') expired++;
      else if (status.label === 'Disabled') disabled++;
    });

    return { total: AD_PLACEMENTS.length, active, scheduled, expired, disabled };
  }, [ads]);

  const categories = ['All', 'Homepage', 'Products', 'Product Detail', 'Coupons', 'Blog', 'Blog Detail'];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-none">
              <Megaphone className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Ads & Banners Management
            </h1>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Configure custom image banners, square sidebar ads, Google AdSense codes, and automatic expiration timers across 10 strategic placements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAds}
            className="text-xs font-bold gap-1.5 rounded-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Link
            href="/supro111vat29/settings"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border rounded-none transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>AdSense Settings</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 border border-border bg-card rounded-none space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Total Slots
          </span>
          <div className="text-2xl font-black text-foreground">{stats.total}</div>
          <span className="text-[10px] text-muted-foreground">Predefined Placements</span>
        </div>

        <div className="p-4 border border-border bg-card rounded-none space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Live Active
          </span>
          <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
          <span className="text-[10px] text-muted-foreground">Currently Displaying</span>
        </div>

        <div className="p-4 border border-border bg-card rounded-none space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Scheduled
          </span>
          <div className="text-2xl font-black text-amber-600">{stats.scheduled}</div>
          <span className="text-[10px] text-muted-foreground">Future Start Date</span>
        </div>

        <div className="p-4 border border-border bg-card rounded-none space-y-1">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Expired
          </span>
          <div className="text-2xl font-black text-rose-600">{stats.expired}</div>
          <span className="text-[10px] text-muted-foreground">Timer Elapsed</span>
        </div>

        <div className="p-4 border border-border bg-card rounded-none space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Disabled / Empty
          </span>
          <div className="text-2xl font-black text-slate-600 dark:text-slate-400">
            {stats.total - stats.active - stats.scheduled}
          </div>
          <span className="text-[10px] text-muted-foreground">Hidden on Frontend</span>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground block">Zero Blank Space Policy:</span>
          <span>
            If an ad slot is empty, disabled, or its expiration timer has passed, the space completely collapses on the frontend. No broken boxes, empty borders, or blank gaps will be shown to your visitors.
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border text-xs scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 font-bold whitespace-nowrap transition-colors rounded-none cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Placements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPlacements.map((placement) => {
          const currentAd = ads.find((a) => a.placement === placement.id);
          const status = getAdStatus(currentAd);

          return (
            <div
              key={placement.id}
              className="border border-border bg-card p-5 space-y-4 shadow-xs hover:border-blue-600/50 transition-colors flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground border border-border">
                        {placement.page}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          placement.format === 'banner'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                        }`}
                      >
                        {placement.format}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{placement.name}</h3>
                  </div>

                  {currentAd && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleActive(currentAd)}
                        title={currentAd.enabled ? 'Deactivate Ad' : 'Activate Ad'}
                        className={`p-1.5 border border-border transition-colors cursor-pointer ${
                          currentAd.enabled
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(currentAd.id)}
                        title="Remove Ad"
                        className="p-1.5 border border-border text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {placement.description}
                </p>
                <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1 font-mono">
                  <span>Size:</span>
                  <span className="font-semibold text-foreground">{placement.recommendedSize}</span>
                </div>
              </div>

              {/* Ad Content Preview Box */}
              <div className="pt-3 border-t border-border/60">
                {currentAd ? (
                  <div className="space-y-2.5">
                    {currentAd.adType === 'image' && currentAd.imageUrl ? (
                      <div className="space-y-2">
                        <div
                          className={`relative overflow-hidden border border-border bg-muted/40 flex items-center justify-center ${
                            placement.format === 'banner' ? 'h-24 w-full' : 'h-36 w-full max-w-[240px] mx-auto'
                          }`}
                        >
                          <img
                            src={currentAd.imageUrl}
                            alt={currentAd.altText || currentAd.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold uppercase tracking-wider">
                            Ad Preview
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[200px] font-medium text-foreground">
                            {currentAd.title}
                          </span>
                          {currentAd.targetUrl && (
                            <a
                              href={currentAd.targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-0.5 shrink-0"
                            >
                              <span>{currentAd.targetUrl}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/50 border border-border text-xs font-mono text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5 text-foreground font-bold">
                          <Code2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Custom HTML / AdSense Script</span>
                        </div>
                        <p className="line-clamp-2 text-[10px] break-all opacity-80">
                          {currentAd.htmlCode}
                        </p>
                      </div>
                    )}

                    {/* Timer / Schedule display */}
                    {(currentAd.startDate || currentAd.endDate) && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 p-2 border border-border/40">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>
                          {currentAd.startDate ? `Starts: ${new Date(currentAd.startDate).toLocaleString()}` : 'Runs immediately'}
                          {currentAd.endDate ? ` • Expires: ${new Date(currentAd.endDate).toLocaleString()}` : ' • No end date'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-border/80 bg-muted/10 text-center space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      No ad configured for this slot
                    </span>
                    <span className="text-[11px] text-muted-foreground/60 block">
                      Slot is collapsed on frontend. Click configure to add an ad.
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <Button
                  onClick={() => handleConfigureSlot(placement)}
                  variant={currentAd ? 'outline' : 'default'}
                  size="sm"
                  className="w-full text-xs font-bold gap-1.5 rounded-none"
                >
                  {currentAd ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{currentAd ? 'Edit & Configure Ad' : 'Add Ad to Slot'}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Ad Modal */}
      {isModalOpen && activePlacement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-card border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl rounded-none animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                    {activePlacement.page}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    ({activePlacement.format.toUpperCase()})
                  </span>
                </div>
                <h2 className="text-lg font-black text-foreground mt-1">
                  Configure Ad: {activePlacement.name}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground border border-border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success alerts */}
            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Ad saved successfully!</span>
              </div>
            )}

            <div className="space-y-5 text-xs">
              {/* Ad Title & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Internal Ad Title / Campaign Name *
                  </label>
                  <Input
                    value={editingAd.title || ''}
                    onChange={(e) => setEditingAd((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Black Friday Flash Banner"
                    className="h-9 text-xs rounded-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">
                    Ad Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAd((prev) => ({ ...prev, adType: 'image' }))}
                      className={`h-9 px-3 font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        editingAd.adType === 'image'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Custom Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingAd((prev) => ({ ...prev, adType: 'html' }))}
                      className={`h-9 px-3 font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        editingAd.adType === 'html'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>HTML / AdSense</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* IMAGE AD FIELDS */}
              {editingAd.adType === 'image' && (
                <div className="p-4 border border-border bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Image Ad Settings</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Recommended: {activePlacement.recommendedSize}
                    </span>
                  </div>

                  {/* Image Upload + URL */}
                  <div className="space-y-2">
                    <label className="font-bold text-foreground block">
                      Ad Banner Image *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={editingAd.imageUrl || ''}
                        onChange={(e) => setEditingAd((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder="https://example.com/banner.png or upload below"
                        className="h-9 text-xs rounded-none flex-1 font-mono"
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-9 px-3 text-xs font-bold gap-1.5 rounded-none shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Target URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-foreground block mb-1">
                        Destination Target Link (Where clicking leads)
                      </label>
                      <Input
                        value={editingAd.targetUrl || ''}
                        onChange={(e) => setEditingAd((prev) => ({ ...prev, targetUrl: e.target.value }))}
                        placeholder="https://amazon.com/dp/... or /products"
                        className="h-9 text-xs rounded-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-foreground block mb-1">
                        Image Alt Text (Accessibility & SEO)
                      </label>
                      <Input
                        value={editingAd.altText || ''}
                        onChange={(e) => setEditingAd((prev) => ({ ...prev, altText: e.target.value }))}
                        placeholder="e.g. Save 30% on Apple MacBook"
                        className="h-9 text-xs rounded-none"
                      />
                    </div>
                  </div>

                  {/* Open in new tab */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="openInNewTab"
                      checked={editingAd.openInNewTab !== false}
                      onChange={(e) => setEditingAd((prev) => ({ ...prev, openInNewTab: e.target.checked }))}
                      className="w-4 h-4 rounded-none accent-blue-600"
                    />
                    <label htmlFor="openInNewTab" className="text-xs text-foreground cursor-pointer font-medium">
                      Open destination link in a new browser tab (target=&quot;_blank&quot;)
                    </label>
                  </div>
                </div>
              )}

              {/* HTML / GOOGLE ADSENSE CODE */}
              {editingAd.adType === 'html' && (
                <div className="p-4 border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Custom HTML / Google AdSense Snippet</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Format: {activePlacement.format.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-foreground block mb-1">
                      Paste Ad Code / Script / &lt;ins&gt; Tag *
                    </label>
                    <textarea
                      value={editingAd.htmlCode || ''}
                      onChange={(e) => setEditingAd((prev) => ({ ...prev, htmlCode: e.target.value }))}
                      placeholder={`<!-- Google AdSense Example -->\n<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="ca-pub-XXXXXXXXXX"\n     data-ad-slot="1234567890"\n     data-ad-format="auto"></ins>`}
                      rows={5}
                      className="w-full p-2.5 text-xs font-mono border border-border bg-background rounded-none focus:outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Note: You can paste responsive Google AdSense code, affiliate banners, or custom HTML/CSS embeds.
                    </span>
                  </div>
                </div>
              )}

              {/* TIMER & SCHEDULING */}
              <div className="p-4 border border-border bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Timer & Expiration Scheduling</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasTimer"
                      checked={Boolean(editingAd.hasTimer)}
                      onChange={(e) => setEditingAd((prev) => ({ ...prev, hasTimer: e.target.checked }))}
                      className="w-4 h-4 rounded-none accent-blue-600 cursor-pointer"
                    />
                    <label htmlFor="hasTimer" className="text-xs font-bold text-foreground cursor-pointer">
                      Enable Auto-Timer
                    </label>
                  </div>
                </div>

                {editingAd.hasTimer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="font-bold text-foreground block mb-1">
                        Start Date & Time (Optional)
                      </label>
                      <Input
                        type="datetime-local"
                        value={editingAd.startDate || ''}
                        onChange={(e) => setEditingAd((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="h-9 text-xs rounded-none font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Leave blank to show immediately.
                      </span>
                    </div>

                    <div>
                      <label className="font-bold text-foreground block mb-1">
                        Expiry Date & Time (Auto-Remove) *
                      </label>
                      <Input
                        type="datetime-local"
                        value={editingAd.endDate || ''}
                        onChange={(e) => setEditingAd((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="h-9 text-xs rounded-none font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        The ad will automatically disappear once this time arrives.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 border border-border bg-card">
                <div>
                  <span className="font-bold text-foreground block">
                    Ad Status (Active / Inactive)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Instantly turn this ad on or off without deleting the configuration.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAd((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                    editingAd.enabled
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {editingAd.enabled ? 'Enabled (Live)' : 'Disabled (Hidden)'}
                </button>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-1.5 pt-2">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Preview</span>
                </span>
                <div className="p-4 border border-border bg-muted/30 flex items-center justify-center min-h-[100px]">
                  {editingAd.adType === 'image' && editingAd.imageUrl ? (
                    <div
                      className={`relative overflow-hidden border border-border bg-card ${
                        activePlacement.format === 'banner'
                          ? 'w-full max-w-[728px] h-24'
                          : 'w-64 h-64'
                      }`}
                    >
                      <img
                        src={editingAd.imageUrl}
                        alt={editingAd.altText || 'Preview'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : editingAd.adType === 'html' && editingAd.htmlCode ? (
                    <div className="w-full text-center text-xs font-mono text-muted-foreground p-3 border border-border bg-card">
                      [HTML / AdSense Code Ready]
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No image or HTML provided yet
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold rounded-none"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAd}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-none px-6"
              >
                Save Ad Configuration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
