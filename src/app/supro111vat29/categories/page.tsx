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
  moveCategory,
  moveSubcategory,
  toggleFeaturedOnHome,
  toggleTopSlider,
} from '@/lib/categoryStore';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
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
  Search,
  Hash,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { ProductTag } from '@/types/tag';
import {
  getProductTags,
  fetchAndSyncProductTagsFromServer,
  saveProductTag,
  deleteProductTag,
  slugifyTag,
  PRODUCT_TAGS_UPDATED_EVENT,
} from '@/lib/productTagStore';
import { getCatalogProducts } from '@/lib/catalogStore';
import { CatalogItem } from '@/data/catalog';

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
  const [newCatRichDesc, setNewCatRichDesc] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatIsFeatured, setNewCatIsFeatured] = useState(false);
  const [newCatShowSlider, setNewCatShowSlider] = useState(true);
  const [newCatShowExploreDeals, setNewCatShowExploreDeals] = useState(true);

  // New Category SEO State
  const [newCatMetaTitle, setNewCatMetaTitle] = useState('');
  const [newCatMetaDesc, setNewCatMetaDesc] = useState('');
  const [newCatKeywords, setNewCatKeywords] = useState('');
  const [newCatCanonicalUrl, setNewCatCanonicalUrl] = useState('');
  const [newCatOgImage, setNewCatOgImage] = useState('');
  const [newCatNoIndex, setNewCatNoIndex] = useState(false);
  const [showNewCatSeo, setShowNewCatSeo] = useState(false);
  const newCatOgFileInputRef = React.useRef<HTMLInputElement>(null);

  // New Subcategory Form State
  const [newSubName, setNewSubName] = useState('');
  const [newSubSlug, setNewSubSlug] = useState('');
  const [newSubRichDesc, setNewSubRichDesc] = useState('');
  const [newSubImage, setNewSubImage] = useState('');
  const [newSubShowSlider, setNewSubShowSlider] = useState(true);
  const [newSubShowExploreDeals, setNewSubShowExploreDeals] = useState(false);

  // New Subcategory SEO State
  const [newSubMetaTitle, setNewSubMetaTitle] = useState('');
  const [newSubMetaDesc, setNewSubMetaDesc] = useState('');
  const [newSubKeywords, setNewSubKeywords] = useState('');
  const [newSubCanonicalUrl, setNewSubCanonicalUrl] = useState('');
  const [newSubOgImage, setNewSubOgImage] = useState('');
  const [newSubNoIndex, setNewSubNoIndex] = useState(false);
  const [showNewSubSeo, setShowNewSubSeo] = useState(false);
  const newSubOgFileInputRef = React.useRef<HTMLInputElement>(null);

  // Edit Modals
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);
  const [editingSub, setEditingSub] = useState<{ categoryId: string; sub: SubcategoryDefinition } | null>(null);
  const [showEditCatSeo, setShowEditCatSeo] = useState(false);
  const [showEditSubSeo, setShowEditSubSeo] = useState(false);
  const editCatOgFileInputRef = React.useRef<HTMLInputElement>(null);
  const editSubOgFileInputRef = React.useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [productTags, setProductTags] = useState<ProductTag[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogItem[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Product Tag Form State
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [newTagRichDesc, setNewTagRichDesc] = useState('');
  const [newTagMetaTitle, setNewTagMetaTitle] = useState('');
  const [newTagMetaDesc, setNewTagMetaDesc] = useState('');
  const [newTagKeywords, setNewTagKeywords] = useState('');
  const [newTagCanonicalUrl, setNewTagCanonicalUrl] = useState('');
  const [newTagOgImage, setNewTagOgImage] = useState('');
  const [newTagNoIndex, setNewTagNoIndex] = useState(false);
  const [showNewTagSeo, setShowNewTagSeo] = useState(false);

  // Edit Product Tag State
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagSlug, setEditTagSlug] = useState('');
  const [editTagDesc, setEditTagDesc] = useState('');
  const [editTagRichDesc, setEditTagRichDesc] = useState('');
  const [editTagMetaTitle, setEditTagMetaTitle] = useState('');
  const [editTagMetaDesc, setEditTagMetaDesc] = useState('');
  const [editTagKeywords, setEditTagKeywords] = useState('');
  const [editTagCanonicalUrl, setEditTagCanonicalUrl] = useState('');
  const [editTagOgImage, setEditTagOgImage] = useState('');
  const [editTagNoIndex, setEditTagNoIndex] = useState(false);
  const [showEditTagSeo, setShowEditTagSeo] = useState(false);

  // Delete Product Tag State
  const [deleteTargetTag, setDeleteTargetTag] = useState<ProductTag | null>(null);

  const catFileInputRef = useRef<HTMLInputElement>(null);
  const editCatFileInputRef = useRef<HTMLInputElement>(null);
  const subFileInputRef = useRef<HTMLInputElement>(null);
  const editSubFileInputRef = useRef<HTMLInputElement>(null);
  const newTagOgFileInputRef = useRef<HTMLInputElement>(null);
  const editTagOgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = getCategories();
    setCategories(loaded);
    if (loaded.length > 0) {
      setSelectedCatId((prev) => prev || loaded[0].id);
    }

    const loadTags = () => {
      setProductTags(getProductTags());
      setCatalogProducts(getCatalogProducts());
    };
    loadTags();
    fetchAndSyncProductTagsFromServer().then((fresh) => {
      if (fresh && Array.isArray(fresh)) setProductTags(fresh);
    });

    window.addEventListener(PRODUCT_TAGS_UPDATED_EVENT, loadTags);
    window.addEventListener('smarttech_catalog_updated', loadTags);
    window.addEventListener('storage', loadTags);
    return () => {
      window.removeEventListener(PRODUCT_TAGS_UPDATED_EVENT, loadTags);
      window.removeEventListener('smarttech_catalog_updated', loadTags);
      window.removeEventListener('storage', loadTags);
    };
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
    callback: (dataUrl: string) => void,
    folder: string = 'categories'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        callback(data.url);
        return;
      }
    } catch (err) {
      console.warn('Image upload API failed:', err);
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
      description: newCatDesc.trim() || (newCatRichDesc.trim() ? newCatRichDesc.replace(/<[^>]*>/g, '').slice(0, 160) : undefined),
      richDescription: newCatRichDesc.trim() || undefined,
      imageUrl: newCatImage.trim() || undefined,
      isFeaturedOnHome: newCatIsFeatured,
      showInTopSlider: newCatShowSlider,
      showInExploreDeals: newCatShowExploreDeals,
      seo: {
        metaTitle: newCatMetaTitle.trim() || undefined,
        metaDescription: newCatMetaDesc.trim() || undefined,
        keywords: newCatKeywords.trim() || undefined,
        canonicalUrl: newCatCanonicalUrl.trim() || undefined,
        ogImageUrl: newCatOgImage.trim() || undefined,
        noIndex: newCatNoIndex,
      },
      subcategories: [],
    };

    const updated = addCategory(newCategory);
    setCategories(updated);
    setSelectedCatId(newCategory.id);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    setNewCatRichDesc('');
    setNewCatImage('');
    setNewCatIsFeatured(false);
    setNewCatShowSlider(true);
    setNewCatShowExploreDeals(true);
    setNewCatMetaTitle('');
    setNewCatMetaDesc('');
    setNewCatKeywords('');
    setNewCatCanonicalUrl('');
    setNewCatOgImage('');
    setNewCatNoIndex(false);
    setShowNewCatSeo(false);
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
      showInExploreDeals: newSubShowExploreDeals,
      richDescription: newSubRichDesc.trim() || undefined,
      description: newSubRichDesc.trim() ? newSubRichDesc.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
      seo: {
        metaTitle: newSubMetaTitle.trim() || undefined,
        metaDescription: newSubMetaDesc.trim() || undefined,
        keywords: newSubKeywords.trim() || undefined,
        canonicalUrl: newSubCanonicalUrl.trim() || undefined,
        ogImageUrl: newSubOgImage.trim() || undefined,
        noIndex: newSubNoIndex,
      },
    };

    const updated = addSubcategory(activeCategory.id, newSub);
    setCategories(updated);
    setNewSubName('');
    setNewSubSlug('');
    setNewSubRichDesc('');
    setNewSubImage('');
    setNewSubShowSlider(true);
    setNewSubShowExploreDeals(false);
    setNewSubMetaTitle('');
    setNewSubMetaDesc('');
    setNewSubKeywords('');
    setNewSubCanonicalUrl('');
    setNewSubOgImage('');
    setNewSubNoIndex(false);
    setShowNewSubSeo(false);
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

  // Reorder Categories
  const handleMoveCategory = (id: string, direction: 'up' | 'down') => {
    const updated = moveCategory(id, direction);
    setCategories(updated);
    showNotification('Category reordered successfully!');
  };

  // Reorder Subcategories
  const handleMoveSubcategory = (catId: string, subId: string, direction: 'up' | 'down') => {
    const updated = moveSubcategory(catId, subId, direction);
    setCategories(updated);
    showNotification('Subcategory reordered successfully!');
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

  // Product Tag handlers
  const handleCreateProductTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const finalSlug = newTagSlug.trim() ? slugifyTag(newTagSlug) : slugifyTag(newTagName);
    const newTag: Partial<ProductTag> = {
      name: newTagName.trim(),
      slug: finalSlug,
      description: newTagDesc.trim() || (newTagRichDesc.trim() ? newTagRichDesc.replace(/<[^>]*>/g, '').slice(0, 160) : undefined),
      richDescription: newTagRichDesc.trim() || undefined,
      seo: {
        metaTitle: newTagMetaTitle.trim() || undefined,
        metaDescription: newTagMetaDesc.trim() || undefined,
        keywords: newTagKeywords.trim() || undefined,
        canonicalUrl: newTagCanonicalUrl.trim() || undefined,
        ogImageUrl: newTagOgImage.trim() || undefined,
        noIndex: Boolean(newTagNoIndex),
      },
    };

    const updated = await saveProductTag(newTag);
    setProductTags(updated);
    setNewTagName('');
    setNewTagSlug('');
    setNewTagDesc('');
    setNewTagRichDesc('');
    setNewTagMetaTitle('');
    setNewTagMetaDesc('');
    setNewTagKeywords('');
    setNewTagCanonicalUrl('');
    setNewTagOgImage('');
    setNewTagNoIndex(false);
    setShowNewTagSeo(false);
    showNotification(`Product tag "${newTagName.trim()}" added successfully!`);
  };

  const openEditTagModal = (item: ProductTag) => {
    setEditingTag(item);
    setEditTagName(item.name);
    setEditTagSlug(item.slug);
    setEditTagDesc(item.description || '');
    setEditTagRichDesc(item.richDescription || item.description || '');
    setEditTagMetaTitle(item.seo?.metaTitle || '');
    setEditTagMetaDesc(item.seo?.metaDescription || '');
    setEditTagKeywords(item.seo?.keywords || '');
    setEditTagCanonicalUrl(item.seo?.canonicalUrl || '');
    setEditTagOgImage(item.seo?.ogImageUrl || '');
    setEditTagNoIndex(Boolean(item.seo?.noIndex));
    setShowEditTagSeo(Boolean(item.seo && Object.keys(item.seo).length > 0));
  };

  const handleSaveEditProductTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editTagName.trim()) return;

    const finalSlug = editTagSlug.trim() ? slugifyTag(editTagSlug) : slugifyTag(editTagName);
    const updatedTag: ProductTag = {
      ...editingTag,
      name: editTagName.trim(),
      slug: finalSlug,
      description: editTagDesc.trim() || (editTagRichDesc.trim() ? editTagRichDesc.replace(/<[^>]*>/g, '').slice(0, 160) : undefined),
      richDescription: editTagRichDesc.trim() || undefined,
      seo: {
        metaTitle: editTagMetaTitle.trim() || undefined,
        metaDescription: editTagMetaDesc.trim() || undefined,
        keywords: editTagKeywords.trim() || undefined,
        canonicalUrl: editTagCanonicalUrl.trim() || undefined,
        ogImageUrl: editTagOgImage.trim() || undefined,
        noIndex: Boolean(editTagNoIndex),
      },
    };

    const updated = await saveProductTag(updatedTag);
    setProductTags(updated);
    setEditingTag(null);
    setEditTagRichDesc('');
    showNotification(`Product tag "${updatedTag.name}" updated successfully!`);
  };

  const handleConfirmDeleteProductTag = async () => {
    if (!deleteTargetTag) return;
    const updated = await deleteProductTag(deleteTargetTag.id);
    setProductTags(updated);
    showNotification(`Product tag "${deleteTargetTag.name}" removed successfully.`);
    setDeleteTargetTag(null);
  };

  const filteredProductTags = productTags.filter((t) =>
    t.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

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
          <Link
            href="/supro111vat29/products"
            className="text-xs font-bold rounded-none h-9 px-3 border border-border bg-background hover:bg-muted text-foreground transition-colors inline-flex items-center justify-center whitespace-nowrap"
          >
            Go to Products →
          </Link>
          <Link
            href="/"
            target="_blank"
            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded-none text-xs font-bold h-9 px-3 flex items-center gap-1.5 inline-flex items-center justify-center whitespace-nowrap transition-colors"
          >
            <span>View Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
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

      {/* Tab Switcher */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories & Subcategories ({categories.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tags')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'tags'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Product Tags ({productTags.length})</span>
        </button>
      </div>

      {activeTab === 'categories' ? (
      /* Two-Column Layout */
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
              {categories.map((cat, idx) => {
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
                          {cat.showInExploreDeals !== false && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                              Deals
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

                    <div className="flex items-center gap-0.5 shrink-0 pt-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCategory(cat.id, 'up');
                        }}
                        title="Move Up"
                        className="p-1 text-muted-foreground hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === categories.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCategory(cat.id, 'down');
                        }}
                        title="Move Down"
                        className="p-1 text-muted-foreground hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
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
                  Category Short Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description displayed on homepage showcase section..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full text-xs p-2 border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring rounded-none mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Category Page Bottom Rich Content (WYSIWYG)
                </label>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Displays formatted text, headings, links, or guides below pagination on this category page.
                </p>
                <RichTextEditor
                  value={newCatRichDesc}
                  onChange={setNewCatRichDesc}
                  placeholder="Write formatted content, buying guides, FAQ, or SEO text for this category..."
                  minHeight="160px"
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
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCatShowExploreDeals}
                    onChange={(e) => setNewCatShowExploreDeals(e.target.checked)}
                    className="rounded-none"
                  />
                  <span>Show in Explore Deals Column (Footer)</span>
                </label>
              </div>

              {/* SEO Collapsible Section */}
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewCatSeo(!showNewCatSeo)}
                  className="w-full flex items-center justify-between text-xs font-bold text-foreground py-1"
                >
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <Globe className="w-3.5 h-3.5" />
                    SEO Settings (Search Engine Optimization)
                    {(newCatMetaTitle || newCatMetaDesc || newCatKeywords) && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5">
                        Configured
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {showNewCatSeo ? '▲ Hide' : '▼ Expand'}
                  </span>
                </button>

                {showNewCatSeo && (
                  <div className="space-y-3 pt-2 mt-1 border-t border-border/60 animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Title</label>
                        <span className="text-[10px] text-muted-foreground">{newCatMetaTitle.length}/60</span>
                      </div>
                      <Input
                        type="text"
                        placeholder={`${newCatName || 'Category'} Deals, Coupons & Discounts`}
                        value={newCatMetaTitle}
                        onChange={(e) => setNewCatMetaTitle(e.target.value)}
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Description</label>
                        <span className="text-[10px] text-muted-foreground">{newCatMetaDesc.length}/160</span>
                      </div>
                      <textarea
                        placeholder="Search engine summary snippet for this category..."
                        value={newCatMetaDesc}
                        onChange={(e) => setNewCatMetaDesc(e.target.value)}
                        className="w-full text-xs bg-muted/40 border border-border p-2 rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        SEO Keywords (Comma separated)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. tech deals, gadgets, discounts, coupon code"
                        value={newCatKeywords}
                        onChange={(e) => setNewCatKeywords(e.target.value)}
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Canonical URL (Override)
                      </label>
                      <Input
                        type="text"
                        placeholder="https://suprodesign.com/products/slug"
                        value={newCatCanonicalUrl}
                        onChange={(e) => setNewCatCanonicalUrl(e.target.value)}
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
                          value={newCatOgImage}
                          onChange={(e) => setNewCatOgImage(e.target.value)}
                          className="text-xs rounded-none h-8 flex-1"
                        />
                        <input
                          type="file"
                          ref={newCatOgFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, (url) => setNewCatOgImage(url), 'categories')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => newCatOgFileInputRef.current?.click()}
                          className="rounded-none h-8 text-xs flex items-center gap-1 shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </Button>
                      </div>
                      {newCatOgImage && (
                        <div className="mt-2 relative w-20 h-14 border border-border bg-muted overflow-hidden">
                          <img src={newCatOgImage} alt="OG Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewCatOgImage('')}
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
                          checked={newCatNoIndex}
                          onChange={(e) => setNewCatNoIndex(e.target.checked)}
                          className="rounded-none"
                        />
                        <span className="text-rose-600 dark:text-rose-400">Noindex (Hide from search engines)</span>
                      </label>
                    </div>
                  </div>
                )}
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
                    {activeCategory.subcategories.map((sub, subIdx) => (
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
                            {sub.showInExploreDeals && (
                              <span className="inline-block mt-0.5 ml-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 border border-emerald-200 dark:border-emerald-800">
                                In Explore Deals
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={subIdx === 0}
                            onClick={() =>
                              handleMoveSubcategory(activeCategory.id, sub.id, 'up')
                            }
                            title="Move Up"
                            className="p-1 text-muted-foreground hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={subIdx === activeCategory.subcategories.length - 1}
                            onClick={() =>
                              handleMoveSubcategory(activeCategory.id, sub.id, 'down')
                            }
                            title="Move Down"
                            className="p-1 text-muted-foreground hover:text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
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

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                    Subcategory Page Bottom Rich Content (WYSIWYG)
                  </label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Displays formatted text, headings, links, or guides below pagination on this subcategory page.
                  </p>
                  <RichTextEditor
                    value={newSubRichDesc}
                    onChange={setNewSubRichDesc}
                    placeholder="Write formatted content, buying guides, FAQ, or SEO text for this subcategory..."
                    minHeight="160px"
                  />
                </div>

                {/* SEO Collapsible Section */}
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewSubSeo(!showNewSubSeo)}
                    className="w-full flex items-center justify-between text-xs font-bold text-foreground py-1"
                  >
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Globe className="w-3.5 h-3.5" />
                      SEO Settings (Search Engine Optimization)
                      {(newSubMetaTitle || newSubMetaDesc || newSubKeywords) && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5">
                          Configured
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {showNewSubSeo ? '▲ Hide' : '▼ Expand'}
                    </span>
                  </button>

                  {showNewSubSeo && (
                    <div className="space-y-3 pt-2 mt-1 border-t border-border/60 animate-in fade-in duration-150">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-foreground">Meta Title</label>
                          <span className="text-[10px] text-muted-foreground">{newSubMetaTitle.length}/60</span>
                        </div>
                        <Input
                          type="text"
                          placeholder={`${newSubName || 'Subcategory'} Deals, Offers & Best Prices`}
                          value={newSubMetaTitle}
                          onChange={(e) => setNewSubMetaTitle(e.target.value)}
                          className="text-xs rounded-none h-8"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-foreground">Meta Description</label>
                          <span className="text-[10px] text-muted-foreground">{newSubMetaDesc.length}/160</span>
                        </div>
                        <textarea
                          placeholder="Search engine summary snippet for this subcategory..."
                          value={newSubMetaDesc}
                          onChange={(e) => setNewSubMetaDesc(e.target.value)}
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
                          value={newSubKeywords}
                          onChange={(e) => setNewSubKeywords(e.target.value)}
                          className="text-xs rounded-none h-8"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-foreground block mb-1">
                          Canonical URL (Override)
                        </label>
                        <Input
                          type="text"
                          placeholder="https://suprodesign.com/products/category/slug"
                          value={newSubCanonicalUrl}
                          onChange={(e) => setNewSubCanonicalUrl(e.target.value)}
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
                            value={newSubOgImage}
                            onChange={(e) => setNewSubOgImage(e.target.value)}
                            className="text-xs rounded-none h-8 flex-1"
                          />
                          <input
                            type="file"
                            ref={newSubOgFileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, (url) => setNewSubOgImage(url), 'categories')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => newSubOgFileInputRef.current?.click()}
                            className="rounded-none h-8 text-xs flex items-center gap-1 shrink-0"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </Button>
                        </div>
                        {newSubOgImage && (
                          <div className="mt-2 relative w-20 h-14 border border-border bg-muted overflow-hidden">
                            <img src={newSubOgImage} alt="OG Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewSubOgImage('')}
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
                            checked={newSubNoIndex}
                            onChange={(e) => setNewSubNoIndex(e.target.checked)}
                            className="rounded-none"
                          />
                          <span className="text-rose-600 dark:text-rose-400">Noindex (Hide from search engines)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSubShowSlider}
                        onChange={(e) => setNewSubShowSlider(e.target.checked)}
                        className="rounded-none"
                      />
                      <span>Show in Homepage Top Slider</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSubShowExploreDeals}
                        onChange={(e) => setNewSubShowExploreDeals(e.target.checked)}
                        className="rounded-none"
                      />
                      <span>Show in Explore Deals Column (Footer)</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-none h-9 px-4 shrink-0"
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
      ) : (
        /* Product Tags Management Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Create New Product Tag */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border p-5 space-y-5 sticky top-20">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Tag className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-foreground">Add New Product Tag</h2>
              </div>

              <form onSubmit={handleCreateProductTag} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Tag Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Wireless, Gaming, OLED, Fast Charging"
                    value={newTagName}
                    onChange={(e) => {
                      setNewTagName(e.target.value);
                      setNewTagSlug(slugifyTag(e.target.value));
                    }}
                    className="text-xs rounded-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    URL Slug
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. wireless"
                    value={newTagSlug}
                    onChange={(e) => setNewTagSlug(slugifyTag(e.target.value))}
                    className="text-xs font-mono rounded-none"
                  />
                  {newTagSlug && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Page URL: <code className="text-blue-600 font-mono">/tag/{newTagSlug}</code>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Description (for SEO & Banner)
                  </label>
                  <textarea
                    placeholder="Brief description for SEO and tag landing page banner..."
                    value={newTagDesc}
                    onChange={(e) => setNewTagDesc(e.target.value)}
                    className="w-full text-xs bg-muted/40 border border-border p-2.5 rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Tag Page Bottom Rich Content (WYSIWYG)
                  </label>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Displays formatted text, shopping tips, or SEO guides below pagination on this tag page.
                  </p>
                  <RichTextEditor
                    value={newTagRichDesc}
                    onChange={setNewTagRichDesc}
                    placeholder="Write formatted content, shopping tips, or SEO text for this tag..."
                    minHeight="160px"
                  />
                </div>

                {/* SEO & Meta Data Section */}
                <div className="border border-border/80 bg-muted/20 p-3 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowNewTagSeo(!showNewTagSeo)}
                    className="w-full flex items-center justify-between text-xs font-bold text-foreground"
                  >
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Globe className="w-3.5 h-3.5" />
                      SEO & Meta Data (Optional)
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {showNewTagSeo ? '▲ Hide' : '▼ Expand'}
                    </span>
                  </button>

                  {showNewTagSeo && (
                    <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-150">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-foreground">Meta Title</label>
                          <span className="text-[10px] text-muted-foreground">{newTagMetaTitle.length}/60</span>
                        </div>
                        <Input
                          type="text"
                          placeholder={`${newTagName || 'Tag'} Deals, Discounts & Price Drops`}
                          value={newTagMetaTitle}
                          onChange={(e) => setNewTagMetaTitle(e.target.value)}
                          className="text-xs rounded-none h-8"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-foreground">Meta Description</label>
                          <span className="text-[10px] text-muted-foreground">{newTagMetaDesc.length}/160</span>
                        </div>
                        <textarea
                          placeholder="Search engine snippet summary..."
                          value={newTagMetaDesc}
                          onChange={(e) => setNewTagMetaDesc(e.target.value)}
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
                          value={newTagKeywords}
                          onChange={(e) => setNewTagKeywords(e.target.value)}
                          className="text-xs rounded-none h-8"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-foreground block mb-1">
                          Canonical URL (Override)
                        </label>
                        <Input
                          type="text"
                          placeholder="https://suprodesign.com/tag/slug"
                          value={newTagCanonicalUrl}
                          onChange={(e) => setNewTagCanonicalUrl(e.target.value)}
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
                            value={newTagOgImage}
                            onChange={(e) => setNewTagOgImage(e.target.value)}
                            className="text-xs rounded-none h-8 flex-1"
                          />
                          <input
                            type="file"
                            ref={newTagOgFileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, (url) => setNewTagOgImage(url), 'tags')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => newTagOgFileInputRef.current?.click()}
                            className="rounded-none h-8 text-xs flex items-center gap-1 shrink-0"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload</span>
                          </Button>
                        </div>
                        {newTagOgImage && (
                          <div className="mt-2 relative w-20 h-14 border border-border bg-muted overflow-hidden">
                            <img src={newTagOgImage} alt="OG Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewTagOgImage('')}
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
                            checked={newTagNoIndex}
                            onChange={(e) => setNewTagNoIndex(e.target.checked)}
                            className="rounded-none"
                          />
                          <span className="text-rose-600 dark:text-rose-400">Noindex (Hide from search engines)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-none"
                >
                  <Plus className="w-4 h-4" />
                  Add Product Tag
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Existing Product Tags Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search product tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-card border border-border rounded-none text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="text-xs font-semibold text-muted-foreground">
                {filteredProductTags.length} {filteredProductTags.length === 1 ? 'tag' : 'tags'}
              </div>
            </div>

            <div className="border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold">
                  <tr>
                    <th className="py-3 px-4">Tag Name</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Products</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredProductTags.length > 0 ? (
                    filteredProductTags.map((t) => {
                      const count = catalogProducts.filter((p) => {
                        if (Array.isArray(p.tags) && p.tags.some((pt) => slugifyTag(pt) === t.slug)) return true;
                        if (p.brand && slugifyTag(p.brand) === t.slug) return true;
                        if (p.category && slugifyTag(p.category) === t.slug) return true;
                        if (p.subcategory && slugifyTag(p.subcategory) === t.slug) return true;
                        return false;
                      }).length;

                      return (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-500 font-bold">#</span>
                              <span className="font-bold text-foreground">{t.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                            {t.slug}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
                            {t.description || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted border border-border">
                              {count}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/tag/${t.slug}`}
                                target="_blank"
                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                                title="View tag page on site"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEditTagModal(t)}
                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 rounded transition-colors"
                                title="Edit Tag"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetTag(t)}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 rounded transition-colors"
                                title="Delete Tag"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No product tags found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingCategory(null);
          }}
        >
          <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
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

            <form onSubmit={handleSaveCategoryEdit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Category Name *
                </label>
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
                  Category Short Summary
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
                  Category Page Bottom Rich Content (WYSIWYG)
                </label>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Displays formatted text, headings, links, or guides below pagination on this category page.
                </p>
                <RichTextEditor
                  value={editingCategory.richDescription || ''}
                  onChange={(val) => setEditingCategory({ ...editingCategory, richDescription: val })}
                  placeholder="Write formatted content, buying guides, FAQ, or SEO text for this category..."
                  minHeight="180px"
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
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.showInExploreDeals !== false}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, showInExploreDeals: e.target.checked })
                    }
                    className="rounded-none"
                  />
                  <span>Show in Explore Deals Column (Footer)</span>
                </label>
              </div>

              {/* SEO Collapsible Section */}
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditCatSeo(!showEditCatSeo)}
                  className="w-full flex items-center justify-between text-xs font-bold text-foreground py-1"
                >
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <Globe className="w-3.5 h-3.5" />
                    SEO Settings (Search Engine Optimization)
                    {(editingCategory.seo?.metaTitle || editingCategory.seo?.metaDescription || editingCategory.seo?.keywords) && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5">
                        Configured
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {showEditCatSeo ? '▲ Hide' : '▼ Expand'}
                  </span>
                </button>

                {showEditCatSeo && (
                  <div className="space-y-3 pt-2 mt-1 border-t border-border/60 animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Title</label>
                        <span className="text-[10px] text-muted-foreground">
                          {(editingCategory.seo?.metaTitle || '').length}/60
                        </span>
                      </div>
                      <Input
                        type="text"
                        placeholder={`${editingCategory.name || 'Category'} Deals, Coupons & Discounts`}
                        value={editingCategory.seo?.metaTitle || ''}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            seo: { ...editingCategory.seo, metaTitle: e.target.value },
                          })
                        }
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Description</label>
                        <span className="text-[10px] text-muted-foreground">
                          {(editingCategory.seo?.metaDescription || '').length}/160
                        </span>
                      </div>
                      <textarea
                        placeholder="Search engine summary snippet for this category..."
                        value={editingCategory.seo?.metaDescription || ''}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            seo: { ...editingCategory.seo, metaDescription: e.target.value },
                          })
                        }
                        className="w-full text-xs bg-muted/40 border border-border p-2 rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        SEO Keywords (Comma separated)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. tech deals, gadgets, discounts, coupon code"
                        value={editingCategory.seo?.keywords || ''}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            seo: { ...editingCategory.seo, keywords: e.target.value },
                          })
                        }
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Canonical URL (Override)
                      </label>
                      <Input
                        type="text"
                        placeholder="https://suprodesign.com/products/slug"
                        value={editingCategory.seo?.canonicalUrl || ''}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            seo: { ...editingCategory.seo, canonicalUrl: e.target.value },
                          })
                        }
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
                          value={editingCategory.seo?.ogImageUrl || ''}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              seo: { ...editingCategory.seo, ogImageUrl: e.target.value },
                            })
                          }
                          className="text-xs rounded-none h-8 flex-1"
                        />
                        <input
                          type="file"
                          ref={editCatOgFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageUpload(
                              e,
                              (url) =>
                                setEditingCategory({
                                  ...editingCategory,
                                  seo: { ...editingCategory.seo, ogImageUrl: url },
                                }),
                              'categories'
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => editCatOgFileInputRef.current?.click()}
                          className="rounded-none h-8 text-xs flex items-center gap-1 shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </Button>
                      </div>
                      {editingCategory.seo?.ogImageUrl && (
                        <div className="mt-2 relative w-20 h-14 border border-border bg-muted overflow-hidden">
                          <img
                            src={editingCategory.seo.ogImageUrl}
                            alt="OG Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditingCategory({
                                ...editingCategory,
                                seo: { ...editingCategory.seo, ogImageUrl: undefined },
                              })
                            }
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
                          checked={editingCategory.seo?.noIndex === true}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              seo: { ...editingCategory.seo, noIndex: e.target.checked },
                            })
                          }
                          className="rounded-none"
                        />
                        <span className="text-rose-600 dark:text-rose-400">Noindex (Hide from search engines)</span>
                      </label>
                    </div>
                  </div>
                )}
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
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingSub(null);
          }}
        >
          <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
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
                  Subcategory Page Bottom Rich Content (WYSIWYG)
                </label>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Displays formatted text, headings, links, or guides below pagination on this subcategory page.
                </p>
                <RichTextEditor
                  value={editingSub.sub.richDescription || ''}
                  onChange={(val) =>
                    setEditingSub({
                      ...editingSub,
                      sub: {
                        ...editingSub.sub,
                        richDescription: val,
                        description: val.trim() ? val.replace(/<[^>]*>/g, '').slice(0, 160) : undefined,
                      },
                    })
                  }
                  placeholder="Write formatted content, buying guides, FAQ, or SEO text for this subcategory..."
                  minHeight="160px"
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

              <div className="pt-2 border-t border-border space-y-2">
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
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSub.sub.showInExploreDeals === true}
                    onChange={(e) =>
                      setEditingSub({
                        ...editingSub,
                        sub: { ...editingSub.sub, showInExploreDeals: e.target.checked },
                      })
                    }
                    className="rounded-none"
                  />
                  <span>Show in Explore Deals Column (Footer)</span>
                </label>
              </div>

              {/* SEO Collapsible Section */}
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditSubSeo(!showEditSubSeo)}
                  className="w-full flex items-center justify-between text-xs font-bold text-foreground py-1"
                >
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <Globe className="w-3.5 h-3.5" />
                    SEO Settings (Search Engine Optimization)
                    {(editingSub.sub.seo?.metaTitle || editingSub.sub.seo?.metaDescription || editingSub.sub.seo?.keywords) && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5">
                        Configured
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {showEditSubSeo ? '▲ Hide' : '▼ Expand'}
                  </span>
                </button>

                {showEditSubSeo && (
                  <div className="space-y-3 pt-2 mt-1 border-t border-border/60 animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Title</label>
                        <span className="text-[10px] text-muted-foreground">
                          {(editingSub.sub.seo?.metaTitle || '').length}/60
                        </span>
                      </div>
                      <Input
                        type="text"
                        placeholder={`${editingSub.sub.name || 'Subcategory'} Deals, Offers & Best Prices`}
                        value={editingSub.sub.seo?.metaTitle || ''}
                        onChange={(e) =>
                          setEditingSub({
                            ...editingSub,
                            sub: {
                              ...editingSub.sub,
                              seo: { ...editingSub.sub.seo, metaTitle: e.target.value },
                            },
                          })
                        }
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Description</label>
                        <span className="text-[10px] text-muted-foreground">
                          {(editingSub.sub.seo?.metaDescription || '').length}/160
                        </span>
                      </div>
                      <textarea
                        placeholder="Search engine summary snippet for this subcategory..."
                        value={editingSub.sub.seo?.metaDescription || ''}
                        onChange={(e) =>
                          setEditingSub({
                            ...editingSub,
                            sub: {
                              ...editingSub.sub,
                              seo: { ...editingSub.sub.seo, metaDescription: e.target.value },
                            },
                          })
                        }
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
                        value={editingSub.sub.seo?.keywords || ''}
                        onChange={(e) =>
                          setEditingSub({
                            ...editingSub,
                            sub: {
                              ...editingSub.sub,
                              seo: { ...editingSub.sub.seo, keywords: e.target.value },
                            },
                          })
                        }
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Canonical URL (Override)
                      </label>
                      <Input
                        type="text"
                        placeholder="https://suprodesign.com/products/category/slug"
                        value={editingSub.sub.seo?.canonicalUrl || ''}
                        onChange={(e) =>
                          setEditingSub({
                            ...editingSub,
                            sub: {
                              ...editingSub.sub,
                              seo: { ...editingSub.sub.seo, canonicalUrl: e.target.value },
                            },
                          })
                        }
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
                          value={editingSub.sub.seo?.ogImageUrl || ''}
                          onChange={(e) =>
                            setEditingSub({
                              ...editingSub,
                              sub: {
                                ...editingSub.sub,
                                seo: { ...editingSub.sub.seo, ogImageUrl: e.target.value },
                              },
                            })
                          }
                          className="text-xs rounded-none h-8 flex-1"
                        />
                        <input
                          type="file"
                          ref={editSubOgFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageUpload(
                              e,
                              (url) =>
                                setEditingSub({
                                  ...editingSub,
                                  sub: {
                                    ...editingSub.sub,
                                    seo: { ...editingSub.sub.seo, ogImageUrl: url },
                                  },
                                }),
                              'categories'
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => editSubOgFileInputRef.current?.click()}
                          className="rounded-none h-8 text-xs flex items-center gap-1 shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </Button>
                      </div>
                      {editingSub.sub.seo?.ogImageUrl && (
                        <div className="mt-2 relative w-20 h-14 border border-border bg-muted overflow-hidden">
                          <img
                            src={editingSub.sub.seo.ogImageUrl}
                            alt="OG Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditingSub({
                                ...editingSub,
                                sub: {
                                  ...editingSub.sub,
                                  seo: { ...editingSub.sub.seo, ogImageUrl: undefined },
                                },
                              })
                            }
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
                          checked={editingSub.sub.seo?.noIndex === true}
                          onChange={(e) =>
                            setEditingSub({
                              ...editingSub,
                              sub: {
                                ...editingSub.sub,
                                seo: { ...editingSub.sub.seo, noIndex: e.target.checked },
                              },
                            })
                          }
                          className="rounded-none"
                        />
                        <span className="text-rose-600 dark:text-rose-400">Noindex (Hide from search engines)</span>
                      </label>
                    </div>
                  </div>
                )}
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

      {/* Edit Product Tag Modal */}
      {editingTag && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingTag(null);
          }}
        >
          <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Product Tag</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProductTag} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Tag Name *
                </label>
                <Input
                  type="text"
                  required
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  className="rounded-none h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  URL Slug *
                </label>
                <Input
                  type="text"
                  required
                  value={editTagSlug}
                  onChange={(e) => setEditTagSlug(slugifyTag(e.target.value))}
                  className="rounded-none h-9 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Description
                </label>
                <textarea
                  value={editTagDesc}
                  onChange={(e) => setEditTagDesc(e.target.value)}
                  placeholder="Brief description for SEO..."
                  className="w-full text-xs bg-muted/40 border border-border p-2.5 rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
                  Tag Page Bottom Rich Content (WYSIWYG)
                </label>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Displays formatted text, shopping tips, or SEO guides below pagination on this tag page.
                </p>
                <RichTextEditor
                  value={editTagRichDesc}
                  onChange={setEditTagRichDesc}
                  placeholder="Write formatted content, shopping tips, or SEO text for this tag..."
                  minHeight="160px"
                />
              </div>

              {/* SEO & Meta Data Section */}
              <div className="border border-border/80 bg-muted/20 p-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowEditTagSeo(!showEditTagSeo)}
                  className="w-full flex items-center justify-between text-xs font-bold text-foreground"
                >
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <Globe className="w-3.5 h-3.5" />
                    SEO & Meta Data (Optional)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {showEditTagSeo ? '▲ Hide' : '▼ Expand'}
                  </span>
                </button>

                {showEditTagSeo && (
                  <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Title</label>
                        <span className="text-[10px] text-muted-foreground">{editTagMetaTitle.length}/60</span>
                      </div>
                      <Input
                        type="text"
                        placeholder={`${editTagName || 'Tag'} Deals, Discounts & Price Drops`}
                        value={editTagMetaTitle}
                        onChange={(e) => setEditTagMetaTitle(e.target.value)}
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-foreground">Meta Description</label>
                        <span className="text-[10px] text-muted-foreground">{editTagMetaDesc.length}/160</span>
                      </div>
                      <textarea
                        placeholder="Search engine snippet summary..."
                        value={editTagMetaDesc}
                        onChange={(e) => setEditTagMetaDesc(e.target.value)}
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
                        value={editTagKeywords}
                        onChange={(e) => setEditTagKeywords(e.target.value)}
                        className="text-xs rounded-none h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Canonical URL (Override)
                      </label>
                      <Input
                        type="text"
                        placeholder="https://suprodesign.com/tag/slug"
                        value={editTagCanonicalUrl}
                        onChange={(e) => setEditTagCanonicalUrl(e.target.value)}
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
                          value={editTagOgImage}
                          onChange={(e) => setEditTagOgImage(e.target.value)}
                          className="text-xs rounded-none h-8 flex-1"
                        />
                        <input
                          type="file"
                          ref={editTagOgFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, (url) => setEditTagOgImage(url), 'tags')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => editTagOgFileInputRef.current?.click()}
                          className="rounded-none h-8 text-xs flex items-center gap-1 shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </Button>
                      </div>
                      {editTagOgImage && (
                        <div className="mt-2 relative w-20 h-14 border border-border bg-muted overflow-hidden">
                          <img src={editTagOgImage} alt="OG Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditTagOgImage('')}
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
                          checked={editTagNoIndex}
                          onChange={(e) => setEditTagNoIndex(e.target.checked)}
                          className="rounded-none"
                        />
                        <span className="text-rose-600 dark:text-rose-400">Noindex (Hide from search engines)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingTag(null)}
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

      {/* Delete Product Tag Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetTag}
        title="Delete Product Tag"
        itemType="product tag"
        itemName={deleteTargetTag ? `#${deleteTargetTag.name}` : ''}
        onConfirm={handleConfirmDeleteProductTag}
        onClose={() => setDeleteTargetTag(null)}
      />
    </div>
  );
}

