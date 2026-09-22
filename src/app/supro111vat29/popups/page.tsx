'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AppWindow,
  Plus,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Upload,
  Loader2,
  Sparkles,
  Ticket,
  MousePointerClick,
  Layers,
  Repeat,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PopupItem, PopupTargetPage, PopupFrequency, PopupActionType } from '@/types/popup';

const DEFAULT_POPUP: PopupItem = {
  id: '',
  name: 'New Promotion Popup',
  enabled: true,
  targetPage: 'all',
  customPagePath: '',
  delaySeconds: 3,
  frequency: 'once_per_session',
  maxViews: 2,
  hideDays: 7,
  imageUrl: '',
  imageAlt: 'Special Offer',
  badgeText: 'LIMITED TIME SPECIAL OFFER',
  title: 'NEW SEASON SALE!',
  description: 'Save 10% on all qualifying orders across top retailers.',
  actionType: 'coupon',
  couponCode: 'NEWSEASON10',
  couponBtnText: 'COPY CODE',
  buttonText: 'Explore Deals',
  buttonUrl: '/products',
  openInNewTab: false,
  createdAt: '',
  updatedAt: '',
};

export default function AdminPopupsPage() {
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PopupItem>(DEFAULT_POPUP);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewPopup, setPreviewPopup] = useState<PopupItem | null>(null);
  const [copiedPreviewCode, setCopiedPreviewCode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/popups');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPopups(data);
      }
    } catch (err) {
      console.error('Failed to fetch popups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPopup({
      ...DEFAULT_POPUP,
      id: `popup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (popup: PopupItem) => {
    setEditingPopup({ ...popup });
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (popup: PopupItem) => {
    const duplicated: PopupItem = {
      ...popup,
      id: `popup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: `${popup.name} (Copy)`,
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated),
      });
      const data = await res.json();
      if (data.success && data.allPopups) {
        setPopups(data.allPopups);
        setSaveMessage({ type: 'success', text: 'Popup duplicated successfully!' });
        setTimeout(() => setSaveMessage(null), 3500);
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to duplicate popup.' });
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleToggleStatus = async (popup: PopupItem) => {
    const updated = { ...popup, enabled: !popup.enabled };
    try {
      const res = await fetch('/api/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success && data.allPopups) {
        setPopups(data.allPopups);
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this modal popup?')) return;

    try {
      const res = await fetch(`/api/popups?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && data.allPopups) {
        setPopups(data.allPopups);
        setSaveMessage({ type: 'success', text: 'Popup deleted successfully.' });
        setTimeout(() => setSaveMessage(null), 3500);
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to delete popup.' });
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'popup');

      const res = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setEditingPopup((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Image upload error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSavePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPopup.title.trim()) {
      setSaveMessage({ type: 'error', text: 'Popup title is required.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/popups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPopup),
      });
      const data = await res.json();
      if (data.success && data.allPopups) {
        setPopups(data.allPopups);
        setIsEditorOpen(false);
        setSaveMessage({ type: 'success', text: 'Popup configuration saved and live!' });
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        throw new Error(data.error || 'Failed to save popup');
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Error saving popup.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <AppWindow className="w-6 h-6 text-blue-600" />
            Modal Popups &amp; Promo Banners
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create high-converting popups with coupon copy, discount buttons, custom delays, and visitor frequency capping.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Popup</span>
        </Button>
      </div>

      {/* Save Message Notification */}
      {saveMessage && (
        <div
          className={`p-4 border flex items-center gap-3 text-xs font-semibold ${
            saveMessage.type === 'success'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
              : 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Popups List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs">Loading popups...</span>
        </div>
      ) : popups.length === 0 ? (
        <div className="p-12 border border-dashed border-border bg-card text-center space-y-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-none flex items-center justify-center mx-auto">
            <AppWindow className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">No Modal Popups Configured</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Create your first promotional popup dialog to showcase discounts, seasonal sales, or coupon codes.
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create First Popup
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {popups.map((popup) => (
            <div
              key={popup.id}
              className={`border bg-card p-5 transition-all ${
                popup.enabled ? 'border-border' : 'border-border/60 opacity-75 bg-muted/20'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-muted shrink-0 border border-border overflow-hidden relative">
                    {popup.imageUrl ? (
                      <img
                        src={popup.imageUrl}
                        alt={popup.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <AppWindow className="w-6 h-6" />
                      </div>
                    )}
                    <div
                      className={`absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        popup.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white'
                      }`}
                    >
                      {popup.enabled ? 'Active' : 'Disabled'}
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div>
                      {popup.badgeText && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase block">
                          {popup.badgeText}
                        </span>
                      )}
                      <h3 className="text-base font-black text-foreground truncate">{popup.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {popup.description || 'No description set'}
                      </p>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900">
                        {popup.targetPage === 'all' && 'All Pages'}
                        {popup.targetPage === 'home' && 'Homepage Only'}
                        {popup.targetPage === 'products' && 'Products Pages'}
                        {popup.targetPage === 'coupons' && 'Coupons Page'}
                        {popup.targetPage === 'custom' && `Custom: ${popup.customPagePath || '/'}`}
                      </span>

                      <span className="px-2 py-0.5 bg-muted text-muted-foreground font-semibold flex items-center gap-1 border border-border">
                        <Clock className="w-3 h-3" />
                        Delay: {popup.delaySeconds}s
                      </span>

                      <span className="px-2 py-0.5 bg-muted text-muted-foreground font-semibold flex items-center gap-1 border border-border">
                        <Repeat className="w-3 h-3" />
                        {popup.frequency === 'always' && 'Every Reload'}
                        {popup.frequency === 'once_per_session' && 'Once per Session'}
                        {popup.frequency === 'once_forever' && 'Once Forever'}
                        {popup.frequency === 'max_views' && `Max ${popup.maxViews || 1} Views`}
                        {popup.frequency === 'hide_days' && `Hide ${popup.hideDays || 7} Days`}
                      </span>

                      {popup.actionType === 'coupon' && popup.couponCode && (
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-bold border border-amber-200 dark:border-amber-900 flex items-center gap-1">
                          <Ticket className="w-3 h-3" />
                          Code: {popup.couponCode}
                        </span>
                      )}

                      {popup.actionType === 'button' && (
                        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-900 flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" />
                          {popup.buttonText || 'Button Link'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewPopup(popup);
                      setPreviewModalOpen(true);
                    }}
                    className="h-8 px-2.5 text-xs text-foreground font-bold"
                    title="Live Preview"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(popup)}
                    className={`h-8 px-2.5 text-xs font-bold ${
                      popup.enabled
                        ? 'text-amber-700 hover:text-amber-800 border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'text-emerald-700 hover:text-emerald-800 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                    }`}
                  >
                    {popup.enabled ? 'Pause' : 'Activate'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(popup)}
                    className="h-8 px-2.5 text-xs font-bold text-foreground"
                    title="Duplicate Popup"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(popup)}
                    className="h-8 px-2.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(popup.id)}
                    className="h-8 px-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT POPUP MODAL DRAWER */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-4xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
              <div className="flex items-center gap-2">
                <AppWindow className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-black text-foreground">
                  {editingPopup.id ? 'Edit Modal Popup' : 'Create New Modal Popup'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePopup} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Internal Name & Enabled */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-foreground block mb-1">
                    Internal Popup Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={editingPopup.name}
                    onChange={(e) => setEditingPopup({ ...editingPopup, name: e.target.value })}
                    placeholder="e.g. Black Friday Special 15% Off"
                    className="h-9 text-xs"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Admin reference label to organize your campaigns.
                  </span>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="font-bold text-foreground block mb-2">Publish Status</label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={editingPopup.enabled}
                      onChange={(e) => setEditingPopup({ ...editingPopup, enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span>{editingPopup.enabled ? 'Active (Live)' : 'Paused (Disabled)'}</span>
                  </label>
                </div>
              </div>

              {/* Targeting, Delay & Frequency Rules */}
              <div className="p-4 border border-border bg-muted/20 space-y-4">
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Targeting, Timing &amp; Frequency Rules
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Target Page */}
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Target Page</label>
                    <select
                      value={editingPopup.targetPage}
                      onChange={(e) =>
                        setEditingPopup({ ...editingPopup, targetPage: e.target.value as PopupTargetPage })
                      }
                      className="w-full h-9 px-2 text-xs border border-input bg-background text-foreground"
                    >
                      <option value="all">All Pages (Everywhere)</option>
                      <option value="home">Homepage Only (/)</option>
                      <option value="products">Products &amp; Deals Pages</option>
                      <option value="coupons">Coupons Page (/coupons)</option>
                      <option value="custom">Custom Page URL</option>
                    </select>
                  </div>

                  {/* Delay */}
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Delay Before Showing</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="60"
                        value={editingPopup.delaySeconds}
                        onChange={(e) =>
                          setEditingPopup({ ...editingPopup, delaySeconds: Math.max(0, parseInt(e.target.value) || 0) })
                        }
                        className="h-9 text-xs"
                      />
                      <span className="text-muted-foreground font-bold">seconds</span>
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Display Frequency</label>
                    <select
                      value={editingPopup.frequency}
                      onChange={(e) =>
                        setEditingPopup({ ...editingPopup, frequency: e.target.value as PopupFrequency })
                      }
                      className="w-full h-9 px-2 text-xs border border-input bg-background text-foreground"
                    >
                      <option value="always">Always (Every page reload)</option>
                      <option value="once_per_session">Once per Browser Session</option>
                      <option value="once_forever">Once Forever (Never repeat)</option>
                      <option value="max_views">Max Capped Views (X times)</option>
                      <option value="hide_days">Hide for X days after dismiss</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Settings */}
                {editingPopup.targetPage === 'custom' && (
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Custom Page Path (Relative or URL)
                    </label>
                    <Input
                      value={editingPopup.customPagePath || ''}
                      onChange={(e) => setEditingPopup({ ...editingPopup, customPagePath: e.target.value })}
                      placeholder="/product/apple-macbook-air-13-m3-chip or /brand/apple"
                      className="h-9 text-xs"
                    />
                  </div>
                )}

                {editingPopup.frequency === 'max_views' && (
                  <div className="max-w-xs">
                    <label className="font-semibold text-foreground block mb-1">Maximum Views per Visitor</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={editingPopup.maxViews || 2}
                      onChange={(e) =>
                        setEditingPopup({ ...editingPopup, maxViews: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                )}

                {editingPopup.frequency === 'hide_days' && (
                  <div className="max-w-xs">
                    <label className="font-semibold text-foreground block mb-1">
                      Days to hide after user closes (X)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={editingPopup.hideDays || 7}
                      onChange={(e) =>
                        setEditingPopup({ ...editingPopup, hideDays: Math.max(1, parseInt(e.target.value) || 7) })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Left Column Image */}
              <div className="p-4 border border-border bg-card space-y-3">
                <label className="font-bold text-foreground text-xs uppercase tracking-wider block">
                  Left-Side Image (Full-Height Banner)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <div className="w-full aspect-[4/3] bg-muted border border-border overflow-hidden relative flex items-center justify-center">
                    {editingPopup.imageUrl ? (
                      <img
                        src={editingPopup.imageUrl}
                        alt="Popup preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-[10px]">No image set</span>
                    )}

                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3 flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Device</span>
                      </Button>
                      {editingPopup.imageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPopup({ ...editingPopup, imageUrl: '' })}
                          className="text-xs text-rose-600 h-8 px-2.5"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Or paste Direct Image URL:
                    </label>
                    <Input
                      value={editingPopup.imageUrl}
                      onChange={(e) => setEditingPopup({ ...editingPopup, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Title, Badge & Description */}
              <div className="p-4 border border-border bg-card space-y-4">
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Text Content (Right Column)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Badge / Subtitle (Optional)
                    </label>
                    <Input
                      value={editingPopup.badgeText || ''}
                      onChange={(e) => setEditingPopup({ ...editingPopup, badgeText: e.target.value })}
                      placeholder="LIMITED TIME SPECIAL OFFER"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Main Heading / Title <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={editingPopup.title}
                      onChange={(e) => setEditingPopup({ ...editingPopup, title: e.target.value })}
                      placeholder="NEW SEASON SALE!"
                      className="h-9 text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Description Paragraph</label>
                  <textarea
                    rows={2}
                    value={editingPopup.description}
                    onChange={(e) => setEditingPopup({ ...editingPopup, description: e.target.value })}
                    placeholder="Save 10% on all qualifying orders across top retailers..."
                    className="w-full p-2.5 text-xs border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Action / CTA Options */}
              <div className="p-4 border border-border bg-card space-y-4">
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-blue-600" />
                  Action / Call To Action
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'coupon', label: 'Coupon Code Copy' },
                    { id: 'button', label: 'CTA Button Link' },
                    { id: 'both', label: 'Both Coupon & Button' },
                    { id: 'none', label: 'No Action (Notice Only)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setEditingPopup({ ...editingPopup, actionType: opt.id as PopupActionType })
                      }
                      className={`p-2.5 text-xs font-bold border transition-colors cursor-pointer text-center ${
                        editingPopup.actionType === opt.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Coupon Code fields */}
                {(editingPopup.actionType === 'coupon' || editingPopup.actionType === 'both') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">Coupon Promo Code</label>
                      <Input
                        value={editingPopup.couponCode || ''}
                        onChange={(e) => setEditingPopup({ ...editingPopup, couponCode: e.target.value })}
                        placeholder="NEWSEASON10"
                        className="h-9 text-xs font-mono font-bold uppercase tracking-wider"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-foreground block mb-1">Copy Button Label</label>
                      <Input
                        value={editingPopup.couponBtnText || 'COPY CODE'}
                        onChange={(e) => setEditingPopup({ ...editingPopup, couponBtnText: e.target.value })}
                        placeholder="COPY CODE"
                        className="h-9 text-xs font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* Button Link fields */}
                {(editingPopup.actionType === 'button' || editingPopup.actionType === 'both') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">Button Text</label>
                      <Input
                        value={editingPopup.buttonText || ''}
                        onChange={(e) => setEditingPopup({ ...editingPopup, buttonText: e.target.value })}
                        placeholder="Explore Deals"
                        className="h-9 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-foreground block mb-1">Target Link URL</label>
                      <Input
                        value={editingPopup.buttonUrl || ''}
                        onChange={(e) => setEditingPopup({ ...editingPopup, buttonUrl: e.target.value })}
                        placeholder="/products or https://..."
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground">
                        <input
                          type="checkbox"
                          checked={editingPopup.openInNewTab || false}
                          onChange={(e) =>
                            setEditingPopup({ ...editingPopup, openInNewTab: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 accent-blue-600 cursor-pointer"
                        />
                        <span>Open in New Tab</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE CARD PREVIEW IN EDITOR */}
              <div className="p-4 border border-border bg-slate-900 text-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Live Preview of Popup Modal (Exact Look)
                </span>

                <div
                  className={`bg-white text-slate-900 border border-slate-200 overflow-hidden shadow-xl mx-auto relative ${
                    editingPopup.imageUrl
                      ? 'max-w-xl grid grid-cols-1 sm:grid-cols-12'
                      : 'max-w-md p-6'
                  }`}
                >
                  {/* Close icon dummy */}
                  <div className="absolute top-2 right-2 p-1 text-slate-400">
                    <X className="w-4 h-4" />
                  </div>

                  {/* Left Column (Image) - only if set */}
                  {editingPopup.imageUrl && (
                    <div className="sm:col-span-5 bg-slate-100 min-h-[160px] sm:min-h-full">
                      <img
                        src={editingPopup.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Right Column (Content) */}
                  <div
                    className={
                      editingPopup.imageUrl
                        ? 'sm:col-span-7 p-5 flex flex-col justify-center text-center space-y-3'
                        : 'p-3 flex flex-col justify-center text-center space-y-3'
                    }
                  >
                    {editingPopup.badgeText && (
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-600">
                        {editingPopup.badgeText}
                      </span>
                    )}

                    <h4 className="text-xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                      {editingPopup.title || 'POPUP HEADING'}
                    </h4>

                    {editingPopup.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {editingPopup.description}
                      </p>
                    )}

                    {/* Action */}
                    {(editingPopup.actionType === 'coupon' || editingPopup.actionType === 'both') && (
                      <div className="border border-slate-300 flex items-stretch overflow-hidden text-xs max-w-xs mx-auto w-full">
                        <span className="flex-1 py-2 px-3 font-mono font-bold tracking-wider text-slate-900 bg-slate-50 flex items-center justify-center">
                          {editingPopup.couponCode || 'CODE10'}
                        </span>
                        <span className="px-3 py-2 bg-white text-slate-900 font-extrabold text-[11px] border-l border-slate-300 flex items-center gap-1.5 uppercase shrink-0">
                          <Copy className="w-3.5 h-3.5" />
                          {editingPopup.couponBtnText || 'COPY CODE'}
                        </span>
                      </div>
                    )}

                    {(editingPopup.actionType === 'button' || editingPopup.actionType === 'both') && (
                      <div className="pt-1">
                        <span className="inline-block w-full py-2.5 px-4 bg-slate-900 text-white font-black text-xs uppercase tracking-wider text-center">
                          {editingPopup.buttonText || 'Explore Deals'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={isSaving}
                  className="h-9 px-4 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL LIVE TEST PREVIEW MODAL */}
      {previewModalOpen && previewPopup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`relative bg-white text-slate-900 border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
              previewPopup.imageUrl
                ? 'max-w-2xl w-full grid grid-cols-1 md:grid-cols-12'
                : 'max-w-md w-full p-6 sm:p-8'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setPreviewModalOpen(false);
                setCopiedPreviewCode(false);
              }}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 p-1 z-10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column Image */}
            {previewPopup.imageUrl && (
              <div className="md:col-span-5 bg-slate-100 min-h-[220px] md:min-h-full">
                <img
                  src={previewPopup.imageUrl}
                  alt={previewPopup.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Right Column Content */}
            <div
              className={
                previewPopup.imageUrl
                  ? 'md:col-span-7 p-6 sm:p-8 flex flex-col justify-center text-center space-y-4'
                  : 'flex flex-col justify-center text-center space-y-4'
              }
            >
              {previewPopup.badgeText && (
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-600">
                  {previewPopup.badgeText}
                </span>
              )}

              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                {previewPopup.title}
              </h2>

              {previewPopup.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {previewPopup.description}
                </p>
              )}

              {/* Actions */}
              {(previewPopup.actionType === 'coupon' || previewPopup.actionType === 'both') && (
                <div className="border border-slate-300 flex items-stretch overflow-hidden text-xs max-w-xs mx-auto w-full">
                  <span className="flex-1 py-2.5 px-3 font-mono font-bold tracking-wider text-slate-900 bg-slate-50 flex items-center justify-center">
                    {previewPopup.couponCode || 'PROMO10'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (previewPopup.couponCode) {
                        navigator.clipboard.writeText(previewPopup.couponCode);
                        setCopiedPreviewCode(true);
                        setTimeout(() => setCopiedPreviewCode(false), 3000);
                      }
                    }}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-[11px] border-l border-slate-300 flex items-center gap-1.5 uppercase shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedPreviewCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{previewPopup.couponBtnText || 'COPY CODE'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {(previewPopup.actionType === 'button' || previewPopup.actionType === 'both') && (
                <a
                  href={previewPopup.buttonUrl || '#'}
                  target={previewPopup.openInNewTab ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="inline-block w-full py-3 px-5 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider text-center transition-colors shadow-xs"
                >
                  {previewPopup.buttonText || 'Shop Deals'}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
