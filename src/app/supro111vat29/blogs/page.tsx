'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BlogPost, BlogCategory } from '@/data/blogs';
import {
  getBlogs,
  deleteBlog,
  duplicateBlog,
  getBlogCategories,
  fetchAndSyncBlogsFromServer,
  fetchAndSyncBlogCategoriesFromServer,
  bulkUpsertBlogs,
  bulkDeleteBlogs,
} from '@/lib/blogStore';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Pencil,
  Copy,
  ExternalLink,
  FolderPlus,
  CheckCircle2,
  Calendar,
  Clock,
  Search,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const loadFreshBlogs = async () => {
    setIsSyncing(true);
    try {
      const [freshBlogs, freshCats] = await Promise.all([
        fetchAndSyncBlogsFromServer(),
        fetchAndSyncBlogCategoriesFromServer(),
      ]);
      if (Array.isArray(freshBlogs)) setBlogs(freshBlogs);
      if (Array.isArray(freshCats)) setCategories(freshCats);
    } catch (e) {
      console.warn('Failed to sync blogs from server:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setBlogs(getBlogs());
    setCategories(getBlogCategories());
    loadFreshBlogs();

    const handleBlogsUpdate = () => {
      setBlogs(getBlogs());
    };
    const handleCatsUpdate = () => {
      setCategories(getBlogCategories());
    };

    window.addEventListener('smarttech_blogs_updated', handleBlogsUpdate);
    window.addEventListener('smarttech_blog_categories_updated', handleCatsUpdate);
    window.addEventListener('storage', handleBlogsUpdate);

    return () => {
      window.removeEventListener('smarttech_blogs_updated', handleBlogsUpdate);
      window.removeEventListener('smarttech_blog_categories_updated', handleCatsUpdate);
      window.removeEventListener('storage', handleBlogsUpdate);
    };
  }, []);

  // Checkbox selection handlers
  const toggleSelectBlog = (id: string) => {
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

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Single Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/blogs?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const updated = deleteBlog(deleteTarget.id);
      setBlogs(updated);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      showSuccess(`Article "${deleteTarget.title}" deleted permanently from database.`);
    } catch {
      const updated = deleteBlog(deleteTarget.id);
      setBlogs(updated);
      showSuccess(`Article "${deleteTarget.title}" removed.`);
    } finally {
      setDeleteTarget(null);
      setIsDeleting(false);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      // Optimistically remove from UI
      setBlogs((prev) => prev.filter((b) => !selectedIds.has(b.id)));
      const success = await bulkDeleteBlogs(idsToDelete);
      if (success) {
        setSelectedIds(new Set());
        setIsBulkDeleteOpen(false);
        showSuccess(`Successfully deleted ${idsToDelete.length} article${idsToDelete.length > 1 ? 's' : ''} permanently.`);
      } else {
        showError('Some articles could not be deleted from server. Please refresh and try again.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to bulk delete articles.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Duplicate
  const handleCopy = (id: string, title: string) => {
    const updated = duplicateBlog(id);
    setBlogs(updated);
    showSuccess(`Article "${title}" duplicated successfully!`);
  };

  // Export Blogs to JSON (Selected or All)
  const handleExportBlogs = (onlySelected = false) => {
    const targetBlogs =
      onlySelected && selectedIds.size > 0
        ? blogs.filter((b) => selectedIds.has(b.id))
        : blogs;

    if (targetBlogs.length === 0) {
      showError('No articles available to export.');
      return;
    }

    const exportData = JSON.stringify(targetBlogs, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `techpricedrop-blogs-${onlySelected ? 'selected' : 'all'}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess(
      `Exported ${targetBlogs.length} article${targetBlogs.length > 1 ? 's' : ''} to JSON!`
    );
  };

  // Import Blogs from JSON file
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
        : Array.isArray(parsed?.blogs)
        ? parsed.blogs
        : Array.isArray(parsed?.posts)
        ? parsed.posts
        : Array.isArray(parsed?.articles)
        ? parsed.articles
        : Array.isArray(parsed?.data)
        ? parsed.data
        : [parsed];

      const validItems: BlogPost[] = rawList.filter(
        (item) => item && typeof item === 'object' && (item.title || item.name)
      );

      if (validItems.length === 0) {
        throw new Error('No valid blog data found in file. Each article must have a title.');
      }

      const res = await bulkUpsertBlogs(validItems);
      if (res.success) {
        const fresh = await fetchAndSyncBlogsFromServer();
        setBlogs(fresh);
        showSuccess(
          `Successfully imported ${validItems.length} article${validItems.length > 1 ? 's' : ''} into blog archive!`
        );
      } else {
        throw new Error('Server import failed. Please check your data format.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to import articles.');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered list
  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat === 'all' || b.category.toLowerCase() === selectedCat.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // Pagination (20 per page)
  const BLOGS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCat]);

  const totalPages = Math.ceil(filteredBlogs.length / BLOGS_PER_PAGE) || 1;
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * BLOGS_PER_PAGE,
    currentPage * BLOGS_PER_PAGE
  );

  const isAllFilteredSelected =
    paginatedBlogs.length > 0 &&
    paginatedBlogs.every((b) => selectedIds.has(b.id));

  const isSomeFilteredSelected =
    paginatedBlogs.some((b) => selectedIds.has(b.id)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedBlogs.forEach((b) => next.delete(b.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedBlogs.forEach((b) => next.add(b.id));
        return next;
      });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground">Blog & Editorial Management</h1>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold text-[10px]">
              {blogs.length} Articles
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage tech buying guides, product comparisons, and deal insights with full visual Divi-style editing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Blogs Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setIsSyncing(true);
              const fresh = await fetchAndSyncBlogsFromServer();
              if (Array.isArray(fresh)) setBlogs(fresh);
              setIsSyncing(false);
              showSuccess(`Refreshed ${fresh.length} articles from live cloud database.`);
            }}
            disabled={isSyncing}
            className="text-xs font-bold h-9 px-3 flex items-center gap-1.5 cursor-pointer"
            title="Reload latest articles from cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Blogs</span>
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
            title="Import articles from a JSON file"
          >
            <Upload className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
            <span>{isImporting ? 'Importing...' : 'Import Blogs'}</span>
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportBlogs(selectedIds.size > 0)}
            disabled={blogs.length === 0}
            className="text-xs font-bold h-9 px-3 flex items-center gap-1.5 cursor-pointer"
            title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected articles` : 'Export all articles to JSON'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{selectedIds.size > 0 ? `Export Selected (${selectedIds.size})` : 'Export All'}</span>
          </Button>

          <Link
            href="/supro111vat29/blogs/categories"
            className="text-xs font-bold h-9 px-3 flex items-center gap-1.5 border border-border bg-background hover:bg-muted text-foreground transition-colors inline-flex items-center justify-center whitespace-nowrap"
          >
            <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Blog Categories</span>
          </Link>

          <Link
            href="/supro111vat29/blogs/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 flex items-center gap-2 shadow-xs inline-flex items-center justify-center whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Write Article</span>
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

      {/* Error Notification */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-500/30 text-red-700 dark:text-red-300 p-3.5 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title or keyword..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">Category:</span>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="h-9 px-3 text-xs bg-background border border-border focus:outline-none focus:border-blue-600 font-semibold"
          >
            <option value="all">All Categories ({blogs.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Items Action Banner */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {selectedIds.size} of {blogs.length} article{selectedIds.size > 1 ? 's' : ''} selected
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
              onClick={() => handleExportBlogs(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-7 px-3 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export Selected ({selectedIds.size})</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-7 px-3 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Selected ({selectedIds.size})</span>
            </Button>
            <button
              onClick={() => setSelectedIds(new Set(blogs.map((b) => b.id)))}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 cursor-pointer"
            >
              Select All {blogs.length} Articles
            </button>
          </div>
        </div>
      )}

      {/* Articles Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
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
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4">Read Time</th>
                <th className="py-3 px-4 text-right">Actions (Edit, Copy, Delete, View)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedBlogs.map((b) => {
                const isSelected = selectedIds.has(b.id);
                return (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectBlog(b.id)}
                        className="w-4 h-4 rounded-none border-border text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                        title={isSelected ? 'Deselect article' : 'Select article'}
                      />
                    </td>

                    {/* Article Thumbnail + Title + Excerpt */}
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-start gap-3">
                        <div className="relative w-16 h-12 shrink-0 bg-slate-100 dark:bg-slate-800 border border-border overflow-hidden flex items-center justify-center">
                          {b.imageUrl && b.imageUrl.trim() ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={b.imageUrl}
                              alt={b.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400 opacity-60" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Link
                            href={`/supro111vat29/blogs/edit/${encodeURIComponent(b.id)}`}
                            className="font-bold text-foreground hover:text-blue-600 line-clamp-1 transition-colors"
                          >
                            {b.title}
                          </Link>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                            {b.excerpt}
                          </p>
                          <div className="text-[10px] font-mono text-slate-400">
                            /blog/{b.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200 dark:border-blue-900">
                        {b.category}
                      </span>
                    </td>

                    {/* Published Date */}
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{b.date}</span>
                      </div>
                    </td>

                    {/* Reading Time */}
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.readTime}</span>
                      </div>
                    </td>

                    {/* Actions: Edit, Copy, Delete, View */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Edit Action */}
                        <Link
                          href={`/supro111vat29/blogs/edit/${encodeURIComponent(b.id)}`}
                          className="p-1.5 border border-border hover:border-blue-600 hover:text-blue-600 bg-background text-muted-foreground transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Edit Article in Divi Style WYSIWYG Editor"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>

                        {/* 2. Copy (Duplicate) Action */}
                        <button
                          type="button"
                          onClick={() => handleCopy(b.id, b.title)}
                          className="p-1.5 border border-border hover:border-emerald-600 hover:text-emerald-600 bg-background text-muted-foreground transition-colors cursor-pointer"
                          title="Copy / Duplicate Article"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Delete Action */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: b.id, title: b.title })}
                          className="p-1.5 border border-border hover:border-red-600 hover:text-red-600 bg-background text-muted-foreground transition-colors cursor-pointer"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* 4. View Public Live Page Action */}
                        <Link
                          href={`/blog/${b.slug}`}
                          target="_blank"
                          className="p-1.5 border border-border hover:border-foreground hover:text-foreground bg-background text-muted-foreground transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="View Live Article on Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBlogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                    No articles found matching &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (20 per page) */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-card">
            <div className="text-xs text-muted-foreground font-medium">
              Showing{' '}
              <span className="font-bold text-foreground">
                {(currentPage - 1) * BLOGS_PER_PAGE + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * BLOGS_PER_PAGE, filteredBlogs.length)}
              </span>{' '}
              of <span className="font-bold text-foreground">{filteredBlogs.length}</span>{' '}
              articles
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
        )}
      </div>

      {/* Delete Single Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Article"
        itemType="article"
        itemName={deleteTarget?.title}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Bulk Delete Modal */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteOpen}
        title={`Delete ${selectedIds.size} Article${selectedIds.size > 1 ? 's' : ''}`}
        itemType="articles"
        message={`Are you sure you want to permanently delete ${selectedIds.size} selected article${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone and will remove all associated blog posts and contents from the database.`}
        confirmText={`Delete ${selectedIds.size} Article${selectedIds.size > 1 ? 's' : ''}`}
        isDeleting={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onClose={() => !isBulkDeleting && setIsBulkDeleteOpen(false)}
      />
    </div>
  );
}
