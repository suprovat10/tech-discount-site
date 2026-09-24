'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, BlogCategory } from '@/data/blogs';
import {
  getBlogs,
  deleteBlog,
  duplicateBlog,
  getBlogCategories,
} from '@/lib/blogStore';
import {
  FileText,
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
  Tag,
  Filter,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    setBlogs(getBlogs());
    setCategories(getBlogCategories());

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

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // Delete from server FIRST, then update localStorage
      await fetch(`/api/blogs?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const updated = deleteBlog(deleteTarget.id);
      setBlogs(updated);
      showSuccess(`Article "${deleteTarget.title}" removed successfully.`);
    } catch {
      showSuccess(`Article "${deleteTarget.title}" removed.`);
      const updated = deleteBlog(deleteTarget.id);
      setBlogs(updated);
    } finally {
      setDeleteTarget(null);
      setIsDeleting(false);
    }
  };

  const handleCopy = (id: string, title: string) => {
    const updated = duplicateBlog(id);
    setBlogs(updated);
    showSuccess(`Article "${title}" duplicated successfully!`);
  };

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

        <div className="flex items-center gap-2.5">
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

      {/* Articles Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Article</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4">Read Time</th>
                <th className="py-3 px-4 text-right">Actions (Edit, Copy, Delete, View)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedBlogs.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
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

                  {/* Product-like Actions: Edit, Copy, Delete, View */}
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
              ))}

              {filteredBlogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground text-xs">
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

      {/* Centered Confirmation Modal (Replaces browser confirm dialog) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-black text-base text-foreground">Confirm Article Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete the blog article <span className="font-bold text-foreground">&ldquo;{deleteTarget.title}&rdquo;</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete Article'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
