'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CategoryDefinition, SubcategoryDefinition } from '@/data/catalog';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleFeaturedOnHome,
  toggleTopSlider,
} from '@/lib/categoryStore';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  FolderPlus,
  Tag,
  ChevronRight,
  ExternalLink,
  Star,
  X,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'subcategory';
    id: string;
    catId?: string;
    name: string;
  } | null>(null);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatIsFeatured, setNewCatIsFeatured] = useState(false);
  const [newCatShowSlider, setNewCatShowSlider] = useState(true);

  // New Subcategory Form State
  const [newSubName, setNewSubName] = useState('');
  const [newSubSlug, setNewSubSlug] = useState('');
  const [newSubImage, setNewSubImage] = useState('');
  const [newSubShowSlider, setNewSubShowSlider] = useState(true);

  // Edit Modals
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);
  const [editingSub, setEditingSub] = useState<{ categoryId: string; sub: SubcategoryDefinition } | null>(null);

  const catFileInputRef = useRef<HTMLInputElement>(null);
  const editCatFileInputRef = useRef<HTMLInputElement>(null);
  const subFileInputRef = useRef<HTMLInputElement>(null);
  const editSubFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = getCategories();
    setCategories(loaded);
    if (loaded.length > 0 && !selectedCatId) {
      setSelectedCatId(loaded[0].id);
    }
  }, []);

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const featuredCount = categories.filter((c) => c.isFeaturedOnHome).length;

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'categories');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        callback(data.url);
        return;
      }
    } catch (err) {
      console.warn('Category image upload API failed:', err);
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (typeof uploadEvent.target?.result === 'string') {
        callback(uploadEvent.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCategory: CategoryDefinition = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      slug,
      description: newCatDesc.trim(),
      imageUrl: newCatImage.trim() || undefined,
      isFeaturedOnHome: newCatIsFeatured,
      showInTopSlider: newCatShowSlider,
      subcategories: [],
    };

    const updated = addCategory(newCategory);
    setCategories(updated);
    setSelectedCatId(newCategory.id);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    setNewCatImage('');
    setNewCatIsFeatured(false);
    setNewCatShowSlider(true);
    showNotification(`Category "${newCategory.name}" added successfully!`);
  };

  // Save Category Edit
  const handleSaveCategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const updated = updateCategory(editingCategory);
    setCategories(updated);
    setEditingCategory(null);
    showNotification(`Category "${editingCategory.name}" updated successfully!`);
  };

  // Add Subcategory
  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !activeCategory) return;

    const slug = newSubSlug.trim() || newSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSub: SubcategoryDefinition = {
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      slug,
      imageUrl: newSubImage.trim() || undefined,
      showInTopSlider: newSubShowSlider,
    };

    const updated = addSubcategory(activeCategory.id, newSub);
    setCategories(updated);
    setNewSubName('');
    setNewSubSlug('');
    setNewSubImage('');
    setNewSubShowSlider(true);
    showNotification(`Subcategory "${newSub.name}" added to ${activeCategory.name}!`);
  };

  // Save Subcategory Edit
  const handleSaveSubcategoryEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    const updated = updateSubcategory(editingSub.categoryId, editingSub.sub);
    setCategories(updated);
    setEditingSub(null);
    showNotification(`Subcategory "${editingSub.sub.name}" updated successfully!`);
  };

  // Delete Category - Trigger DeleteConfirmModal
  const handleDeleteCategory = (id: string, name: string) => {
    setDeleteTarget({ type: 'category', id, name });
  };

  // Delete Subcategory - Trigger DeleteConfirmModal
  const handleDeleteSubcategory = (catId: string, subId: string, name: string) => {
    setDeleteTarget({ type: 'subcategory', id: subId, catId, name });
  };

  // Confirm and execute delete from modal
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'category') {
      if (categories.length <= 1) {
        showNotification('You must have at least one category.', true);
        setDeleteTarget(null);
        return;
      }
      const updated = deleteCategory(deleteTarget.id);
      setCategories(updated);
      if (selectedCatId === deleteTarget.id) {
        setSelectedCatId(updated[0]?.id || '');
      }
      showNotification(`Category "${deleteTarget.name}" removed successfully.`);
    } else if (deleteTarget.type === 'subcategory' && deleteTarget.catId) {
      const updated = deleteSubcategory(deleteTarget.catId, deleteTarget.id);
      setCategories(updated);
      showNotification(`Subcategory "${deleteTarget.name}" removed.`);
    }
    setDeleteTarget(null);
  };

  // Toggle Featured On Home
  const handleToggleHome = (catId: string) => {
    const res = toggleFeaturedOnHome(catId);
    if (!res.success) {
      showNotification(res.error || 'Failed to update homepage status', true);
    } else {
      setCategories(res.categories);
      showNotification('Homepage feature status updated!');
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/supro111vat29"
              className="p-2 border border-border bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">Categories & Subcategories</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-600/10 text-blue-600 border border-blue-600/20">
                  {featuredCount}/4 Homepage Featured
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage navigation taxonomy, custom images, descriptions, homepage sections, and top slider items.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/supro111vat29/products">
            <Button variant="outline" className="text-xs font-bold rounded-none h-9">
              Go to Products →
            </Button>
          </Link>
          <Link href="/" target="_blank">
            <Button variant="secondary" className="text-xs font-bold rounded-none h-9 flex items-center gap-1.5">
              <span>View Homepage</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Categories List & Create Form */}
        <div className="md:col-span-5 space-y-6">
          <div className="p-5 border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Categories ({categories.length})</span>
              </h3>
              <span className="text-[11px] text-muted-foreground">Select to manage subcategories</span>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => {
                const isSelected = cat.id === activeCategory?.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`p-3 border cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs'
                        : 'border-border bg-background hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0 mr-2">
                      {cat.imageUrl ? (
                        <div className="relative w-12 h-12 shrink-0 border border-border/70 bg-transparent flex items-center justify-center overflow-hidden">
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 shrink-0 border border-border/70 bg-transparent flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-xs text-foreground truncate">{cat.name}</p>
                          {cat.isFeaturedOnHome && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                              ★ Home
                            </span>
                          )}
                          {cat.showInTopSlider && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/30">
                              Slider
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          slug: /{cat.slug} • {cat.subcategories.length} subs
                        </p>
                        {cat.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 italic mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory({ ...cat });
                        }}
                        className="p-1.5 text-muted-foreground hover:text-blue-600 border border-transparent hover:border-border hover:bg-muted transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id, cat.name);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-rose-600 border border-transparent hover:border-border hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight
                        className={`w-4 h-4 ml-1 ${isSelected ? 'text-blue-600' : 'text-muted-foreground/40'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create New Category Form */}
          <form onSubmit={handleAddCategory} className="p-5 border border-border bg-card space-y-4">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-600" />
              <span>Create New Category</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Category Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Smart Watches & Wearables"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="rounded-none h-9 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Slug (Optional)</label>
                <Input
                  type="text"
                  placeholder="e.g. smart-watches"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="rounded-none h-9 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Category Description Text
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description displayed on homepage showcase section..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full text-xs p-2 border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring rounded-none mt-1"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Category Image (Upload or URL)
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="https://... or upload from PC"
                    value={newCatImage}
                    onChange={(e) => setNewCatImage(e.target.value)}
                    className="rounded-none h-9 text-xs flex-1"
                  />
                  <input
                    type="file"
                    ref={catFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, (dataUrl) => setNewCatImage(dataUrl))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => catFileInputRef.current?.click()}
                    className="rounded-none h-9 text-xs flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </Button>
                </div>
                {newCatImage && (
                  <div className="mt-2 relative w-16 h-16 border border-border bg-muted">
                    <img src={newCatImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewCatImage('')}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-border space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCatIsFeatured}
                    onChange={(e) => setNewCatIsFeatured(e.target.checked)}
                    className="rounded-none"
                  />
                  <span>Feature on Homepage Section</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCatShowSlider}
                    onChange={(e) => setNewCatShowSlider(e.target.checked)}
                    className="rounded-none"
                  />
                  <span>Show in Top Slider</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-none h-9 mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add Category</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Subcategories & Options */}
        <div className="md:col-span-7 space-y-6">
          {activeCategory && (
            <div className="p-6 border border-border bg-card space-y-6">
              {/* Category Quick Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {activeCategory.imageUrl && (
                    <div className="w-14 h-14 border border-border/70 shrink-0 overflow-hidden bg-transparent flex items-center justify-center">
                      <img
                        src={activeCategory.imageUrl}
                        alt={activeCategory.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                      Selected Category
                    </span>
                    <h2 className="text-xl font-black text-foreground">{activeCategory.name}</h2>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                      Slug: /{activeCategory.slug}
                    </p>
                    {activeCategory.description && (
                      <p className="text-xs text-muted-foreground mt-1">{activeCategory.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={activeCategory.isFeaturedOnHome ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleHome(activeCategory.id)}
                    className="text-xs font-bold rounded-none h-8 gap-1.5"
                  >
                    <Star className={`w-3.5 h-3.5 ${activeCategory.isFeaturedOnHome ? 'fill-current' : ''}`} />
                    <span>{activeCategory.isFeaturedOnHome ? 'Homepage Featured' : 'Feature on Home'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCategory({ ...activeCategory })}
                    className="text-xs font-bold rounded-none h-8 gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </Button>
                </div>
              </div>

              {/* Subcategories List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">
                    Subcategories ({activeCategory.subcategories.length})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Customize each subcategory image & slider presence
                  </span>
                </div>

                {activeCategory.subcategories.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-border rounded-none text-xs text-muted-foreground">
                    No subcategories added yet. Use the form below to attach subcategories.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCategory.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 border border-border bg-background flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {sub.imageUrl ? (
                            <div className="w-10 h-10 border border-border/70 shrink-0 overflow-hidden bg-transparent flex items-center justify-center">
                              <img
                                src={sub.imageUrl}
                                alt={sub.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 border border-border/70 shrink-0 bg-transparent flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-xs text-foreground truncate">{sub.name}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">/{sub.slug}</p>
                            {sub.showInTopSlider && (
                              <span className="inline-block mt-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1 py-0.2 border border-blue-200 dark:border-blue-800">
                                In Top Slider
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              setEditingSub({ categoryId: activeCategory.id, sub: { ...sub } })
                            }
                            className="p-1.5 text-muted-foreground hover:text-blue-600 border border-transparent hover:border-border hover:bg-muted transition-colors"
                            title="Edit Subcategory"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(activeCategory.id, sub.id, sub.name)}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 border border-transparent hover:border-border hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Remove Subcategory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Subcategory Form */}
              <form onSubmit={handleAddSubcategory} className="pt-4 border-t border-border space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Add Subcategory to {activeCategory.name}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Subcategory Name *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Wireless Earbuds"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="rounded-none h-9 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Subcategory Slug
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. wireless-earbuds"
                      value={newSubSlug}
                      onChange={(e) => setNewSubSlug(e.target.value)}
                      className="rounded-none h-9 text-xs mt-1"
                    />
                  </div>
                </div>

                {/* Subcategory Image */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                    Subcategory Image (Upload from Computer or URL)
                  </label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="text"
                      placeholder="https://... or upload from PC"
                      value={newSubImage}
                      onChange={(e) => setNewSubImage(e.target.value)}
                      className="rounded-none h-9 text-xs flex-1"
                    />
                    <input
                      type="file"
                      ref={subFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, (dataUrl) => setNewSubImage(dataUrl))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => subFileInputRef.current?.click()}
                      className="rounded-none h-9 text-xs flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </Button>
                  </div>
                  {newSubImage && (
                    <div className="mt-2 relative w-14 h-14 border border-border bg-muted">
                      <img src={newSubImage} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewSubImage('')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSubShowSlider}
                      onChange={(e) => setNewSubShowSlider(e.target.checked)}
                      className="rounded-none"
                    />
                    <span>Show in Homepage Top Slider</span>
                  </label>

                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-none h-9 px-4"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span>Attach Subcategory</span>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Category: {editingCategory.name}</span>
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryEdit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Category Name *</label>
                <Input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="rounded-none h-9 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Slug *</label>
                <Input
                  type="text"
                  required
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="rounded-none h-9 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Category Description Text
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Category overview shown on homepage..."
                  className="w-full text-xs p-2 border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring rounded-none mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Category Image
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="Image URL or upload"
                    value={editingCategory.imageUrl || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, imageUrl: e.target.value })}
                    className="rounded-none h-9 text-xs flex-1"
                  />
                  <input
                    type="file"
                    ref={editCatFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageUpload(e, (dataUrl) =>
                        setEditingCategory({ ...editingCategory, imageUrl: dataUrl })
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editCatFileInputRef.current?.click()}
                    className="rounded-none h-9 text-xs flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </Button>
                </div>
                {editingCategory.imageUrl && (
                  <div className="mt-2 relative w-16 h-16 border border-border/70 bg-transparent flex items-center justify-center">
                    <img
                      src={editingCategory.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, imageUrl: undefined })}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingCategory.isFeaturedOnHome}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, isFeaturedOnHome: e.target.checked })
                    }
                    className="rounded-none"
                  />
                  <span>Feature on Homepage Section</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.showInTopSlider !== false}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, showInTopSlider: e.target.checked })
                    }
                    className="rounded-none"
                  />
                  <span>Show in Homepage Top Slider</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-none text-xs font-bold h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold h-9"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Subcategory: {editingSub.sub.name}</span>
              </h3>
              <button
                onClick={() => setEditingSub(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategoryEdit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Subcategory Name *</label>
                <Input
                  type="text"
                  required
                  value={editingSub.sub.name}
                  onChange={(e) =>
                    setEditingSub({
                      ...editingSub,
                      sub: { ...editingSub.sub, name: e.target.value },
                    })
                  }
                  className="rounded-none h-9 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Slug *</label>
                <Input
                  type="text"
                  required
                  value={editingSub.sub.slug}
                  onChange={(e) =>
                    setEditingSub({
                      ...editingSub,
                      sub: { ...editingSub.sub, slug: e.target.value },
                    })
                  }
                  className="rounded-none h-9 text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Subcategory Image
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="Image URL or upload"
                    value={editingSub.sub.imageUrl || ''}
                    onChange={(e) =>
                      setEditingSub({
                        ...editingSub,
                        sub: { ...editingSub.sub, imageUrl: e.target.value },
                      })
                    }
                    className="rounded-none h-9 text-xs flex-1"
                  />
                  <input
                    type="file"
                    ref={editSubFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageUpload(e, (dataUrl) =>
                        setEditingSub({
                          ...editingSub,
                          sub: { ...editingSub.sub, imageUrl: dataUrl },
                        })
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editSubFileInputRef.current?.click()}
                    className="rounded-none h-9 text-xs flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </Button>
                </div>
                {editingSub.sub.imageUrl && (
                  <div className="mt-2 relative w-14 h-14 border border-border/70 bg-transparent flex items-center justify-center">
                    <img
                      src={editingSub.sub.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSub({
                          ...editingSub,
                          sub: { ...editingSub.sub, imageUrl: undefined },
                        })
                      }
                      className="absolute -top-1 -right-1 bg-rose-600 text-white p-0.5 shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSub.sub.showInTopSlider !== false}
                    onChange={(e) =>
                      setEditingSub({
                        ...editingSub,
                        sub: { ...editingSub.sub, showInTopSlider: e.target.checked },
                      })
                    }
                    className="rounded-none"
                  />
                  <span>Show in Homepage Top Slider</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSub(null)}
                  className="rounded-none text-xs font-bold h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold h-9"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'category' ? 'Delete Category' : 'Delete Subcategory'}
        itemType={deleteTarget?.type === 'category' ? 'category' : 'subcategory'}
        itemName={deleteTarget?.name}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

