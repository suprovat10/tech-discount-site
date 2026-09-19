'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  ExternalLink,
  Edit,
  RotateCcw,
  Search,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Globe,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPages, resetPagesToDefault, deletePage } from '@/lib/pageStore';
import { SitePage } from '@/data/defaultPages';

export default function AdminPagesListPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'affiliate' | 'company' | 'custom'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadPages = () => {
    setPages(getPages());
  };

  useEffect(() => {
    loadPages();
    window.addEventListener('smarttech_pages_updated', loadPages);
    return () => window.removeEventListener('smarttech_pages_updated', loadPages);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all pages back to their initial default content? Any custom edits on system pages will be restored to default.')) {
      const reset = resetPagesToDefault();
      setPages(reset);
      showToast('All pages have been restored to initial defaults.');
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the custom page "${title}"?`)) {
      deletePage(id);
      loadPages();
      showToast(`Page "${title}" deleted.`);
    }
  };

  // Filtered pages
  const filteredPages = pages.filter((page) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      page.title.toLowerCase().includes(q) ||
      page.slug.toLowerCase().includes(q) ||
      (page.subtitle && page.subtitle.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeTab === 'affiliate') {
      return ['affiliate-disclosure', 'how-it-works', 'price-methodology', 'retailers'].includes(page.slug);
    }
    if (activeTab === 'company') {
      return ['about', 'contact', 'privacy-policy', 'terms', 'cookie-policy'].includes(page.slug);
    }
    if (activeTab === 'custom') {
      return !page.isSystem;
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-[1240px] mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-md shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Globe className="w-3.5 h-3.5" />
            Content & Policy CMS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Site Pages & Legal Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Edit content, FTC disclosures, contact details, and terms. Changes update live across the frontend.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetAll}
            className="text-xs font-bold flex items-center gap-1.5"
            title="Reset all system pages to default text"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </Button>

          <Link href="/supro111vat29/pages/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Page</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Pages ({pages.length})
          </button>
          <button
            onClick={() => setActiveTab('affiliate')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${
              activeTab === 'affiliate'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Affiliate & Transparency (4)
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${
              activeTab === 'company'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Company & Legal (5)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${
              activeTab === 'custom'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Custom Pages ({pages.filter((p) => !p.isSystem).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search pages by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPages.map((page) => (
          <div
            key={page.id}
            className="p-5 rounded-md border border-border bg-card hover:border-foreground/30 transition-all flex flex-col justify-between gap-4 shadow-2xs group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {page.badge || (page.isSystem ? 'System Page' : 'Custom Page')}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  /{page.slug}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-blue-600 transition-colors">
                  {page.title}
                </h3>
                {page.subtitle && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {page.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="text-[10px] text-muted-foreground">
                Updated: {page.lastUpdated || 'Recent'}
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={page.isSystem ? `/${page.slug}` : `/page/${page.slug}`}
                  target="_blank"
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-sm transition-colors"
                  title="View Live Page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                {!page.isSystem && (
                  <button
                    onClick={() => handleDelete(page.id, page.title)}
                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-sm transition-colors"
                    title="Delete Custom Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <Link href={`/supro111vat29/pages/edit/${page.id}`}>
                  <Button size="sm" variant="default" className="h-7 text-xs font-bold px-2.5 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900">
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="p-12 text-center rounded-md border border-dashed border-border text-muted-foreground space-y-3">
          <FileText className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-xs font-bold">No pages found matching your search query.</p>
        </div>
      )}
    </div>
  );
}
