'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogTagItem } from '@/types/tag';
import {
  Tag as TagIcon,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ExternalLink,
  X,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';
import { slugifyTag } from '@/lib/productTagStore';

export default function AdminBlogTagsPage() {
  const [tags, setTags] = useState<BlogTagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Tag Form State
  const [newTagName, setNewTagName] = useState('');

  // Edit Tag State
  const [editingTag, setEditingTag] = useState<BlogTagItem | null>(null);
  const [editTagName, setEditTagName] = useState('');

  // Delete Confirm Modal State
  const [deleteTargetTag, setDeleteTargetTag] = useState<BlogTagItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/blogs/tags', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTags(data);
        }
      }
    } catch (err) {
      console.error('Failed to load blog tags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Add new tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('/api/blogs/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: trimmed }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showNotification(errData.error || 'Failed to create tag', true);
        return;
      }

      setNewTagName('');
      showNotification(`Tag "${trimmed}" added successfully!`);
      await fetchTags();
    } catch (err: any) {
      showNotification(err.message || 'Error creating tag', true);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: BlogTagItem) => {
    setEditingTag(item);
    setEditTagName(item.name);
  };

  // Save Edit (Rename tag across all blog posts)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editTagName.trim()) return;

    try {
      const res = await fetch('/api/blogs/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldTag: editingTag.name,
          newTag: editTagName.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showNotification(errData.error || 'Failed to rename tag', true);
        return;
      }

      const resData = await res.json();
      showNotification(
        `Tag renamed from "${editingTag.name}" to "${editTagName.trim()}" across ${resData.updatedPostsCount || 0} blog posts!`
      );
      setEditingTag(null);
      await fetchTags();
    } catch (err: any) {
      showNotification(err.message || 'Error renaming tag', true);
    }
  };

  // Confirm Delete Tag
  const handleConfirmDelete = async () => {
    if (!deleteTargetTag) return;
    setIsDeleting(true);

    try {
      const res = await fetch(
        `/api/blogs/tags?tag=${encodeURIComponent(deleteTargetTag.name)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showNotification(errData.error || 'Failed to delete tag', true);
        return;
      }

      const resData = await res.json();
      showNotification(
        `Tag "${deleteTargetTag.name}" removed from ${resData.affectedPostsCount || 0} blog posts.`
      );
      setDeleteTargetTag(null);
      await fetchTags();
    } catch (err: any) {
      showNotification(err.message || 'Error deleting tag', true);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/supro111vat29/blogs"
              className="p-2 border border-border bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">Blog Tags</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-600/10 text-blue-600 border border-blue-600/20">
                  {tags.length} Active Tags
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage tags used across your tech articles. Renaming or deleting updates all associated posts automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTags}
            disabled={loading}
            className="text-xs font-bold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/supro111vat29/blogs/categories">
            <Button variant="outline" className="text-xs font-bold rounded-none h-9">
              Blog Categories →
            </Button>
          </Link>
          <Link href="/blog" target="_blank">
            <Button variant="secondary" className="text-xs font-bold rounded-none h-9 flex items-center gap-1.5">
              <span>View Blog</span>
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

      {/* Main Grid: Add Tag Form & Tags Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create New Tag */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border p-5 space-y-5 sticky top-20">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <TagIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-foreground">Add New Blog Tag</h2>
            </div>

            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Tag Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Price Drop, Smartphone, GPU"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="text-xs"
                  required
                />
                {newTagName && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Slug preview: <code className="text-blue-600 font-mono">/blog/tag/{slugifyTag(newTagName)}</code>
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4" />
                Add Blog Tag
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Existing Tags List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              {filteredTags.length} {filteredTags.length === 1 ? 'tag' : 'tags'}
            </div>
          </div>

          {/* Tags Table */}
          <div className="border border-border bg-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold">
                <tr>
                  <th className="py-3 px-4">Tag Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4 text-center">Articles</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTags.length > 0 ? (
                  filteredTags.map((item) => (
                    <tr key={item.slug} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500 font-bold">#</span>
                          <span className="font-bold text-foreground">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                        {item.slug}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted border border-border">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          {item.postCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/blog/tag/${item.slug}`}
                            target="_blank"
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                            title="View tag page on site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 rounded transition-colors"
                            title="Edit / Rename Tag"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetTag(item)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 rounded transition-colors"
                            title="Delete Tag"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      {loading ? 'Loading tags...' : 'No blog tags found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-foreground">Edit / Rename Blog Tag</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTag(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Tag Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  className="text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Renaming this tag will automatically update all {editingTag.postCount} associated blog posts.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTag(null)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save & Update Posts
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (NO native browser confirm!) */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetTag)}
        title="Delete Blog Tag"
        itemName={deleteTargetTag ? `#${deleteTargetTag.name}` : ''}
        itemType={`tag used in ${deleteTargetTag?.postCount || 0} blog posts`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetTag(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
