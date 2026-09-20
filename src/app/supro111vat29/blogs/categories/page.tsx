'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogCategory, BlogPost } from '@/data/blogs';
import {
  getBlogCategories,
  addBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogs,
} from '@/lib/blogStore';
import {
  FolderPlus,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Tag,
  ExternalLink,
  X,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminBlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Category State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  // Edit Category State
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteTargetCat, setDeleteTargetCat] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setCategories(getBlogCategories());
    setBlogs(getBlogs());

    const handleCatsUpdate = () => {
      setCategories(getBlogCategories());
    };
    const handleBlogsUpdate = () => {
      setBlogs(getBlogs());
    };

    window.addEventListener('smarttech_blog_categories_updated', handleCatsUpdate);
    window.addEventListener('smarttech_blogs_updated', handleBlogsUpdate);
    window.addEventListener('storage', handleCatsUpdate);

    return () => {
      window.removeEventListener('smarttech_blog_categories_updated', handleCatsUpdate);
      window.removeEventListener('smarttech_blogs_updated', handleBlogsUpdate);
      window.removeEventListener('storage', handleCatsUpdate);
    };
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat: BlogCategory = {
      id: finalSlug,
      name: name.trim(),
      slug: finalSlug,
      description: description.trim() || undefined,
    };

    const updated = addBlogCategory(newCat);
    setCategories(updated);
    setName('');
    setSlug('');
    setDescription('');
    setSuccessMessage(`Category "${newCat.name}" added successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const openEditModal = (cat: BlogCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;

    const updatedCat: BlogCategory = {
      ...editingCategory,
      name: editName.trim(),
      slug: editSlug.trim() || editingCategory.slug,
      description: editDescription.trim() || undefined,
    };

    const updated = updateBlogCategory(updatedCat);
    setCategories(updated);
    setEditingCategory(null);
    setSuccessMessage(`Category "${updatedCat.name}" updated successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetCat) {
      const updated = deleteBlogCategory(deleteTargetCat.id);
      setCategories(updated);
      setSuccessMessage(`Category "${deleteTargetCat.name}" removed.`);
      setDeleteTargetCat(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Helper to count articles per category
  const getArticleCount = (catName: string) => {
    return blogs.filter((b) => b.category.toLowerCase() === catName.toLowerCase()).length;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/supro111vat29/blogs"
              className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Blog Articles"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-black text-foreground">Blog Categories Management</h1>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold text-[10px]">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create, edit, and organize article topics and sidebar tags across the Blog platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/supro111vat29/blogs">
            <Button variant="outline" size="sm" className="text-xs font-bold h-9 px-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>All Articles</span>
            </Button>
          </Link>
          <Link href="/supro111vat29/blogs/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>+ Write Article</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-3.5 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Create on Left, Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Create Category */}
        <div className="bg-card border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <FolderPlus className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-foreground">Add New Blog Category</h2>
          </div>

          <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Smart Home & IoT"
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="smart-home-iot"
                className="h-9 text-xs font-mono"
                required
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Public URL: /blog?category={slug || 'slug'}
              </span>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of articles in this topic..."
                rows={3}
                className="w-full p-2.5 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Category
            </Button>
          </form>
        </div>

        {/* Right Column: Existing Categories List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">Existing Blog Categories</h2>
              </div>
              <span className="text-xs text-muted-foreground">{categories.length} total topics</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Articles</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((cat) => {
                    const articleCount = getArticleCount(cat.name);
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                            <span>{cat.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                          {cat.slug}
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                          {cat.description || <span className="italic text-slate-400">None</span>}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-foreground font-bold text-[11px]">
                            {articleCount}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 border border-border hover:border-blue-600 hover:text-blue-600 bg-background text-muted-foreground transition-colors"
                              title="Edit Category Name & Description"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteTargetCat({ id: cat.id, name: cat.name })}
                              className="p-1.5 border border-border hover:border-red-600 hover:text-red-600 bg-background text-muted-foreground transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* View in Public Blog */}
                            <Link href={`/blog?category=${encodeURIComponent(cat.name)}`} target="_blank">
                              <button
                                type="button"
                                className="p-1.5 border border-border hover:border-foreground hover:text-foreground bg-background text-muted-foreground transition-colors"
                                title="View in Public Blog"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                        No categories found. Create one using the form on the left.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-base text-foreground">Edit Blog Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Centered Confirmation Modal for Delete Category */}
      {deleteTargetCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-black text-base text-foreground">Confirm Category Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetCat(null)}
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete the blog category <span className="font-bold text-foreground">&ldquo;{deleteTargetCat.name}&rdquo;</span>? Articles assigned to this topic will remain in the catalog.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTargetCat(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Delete Category
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

