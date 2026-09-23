'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  FileText,
  Globe,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatSlugInput } from '@/lib/utils';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { getPages, savePage } from '@/lib/pageStore';
import { DEFAULT_PAGES, SitePage } from '@/data/defaultPages';

export default function AdminPageEditor() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [page, setPage] = useState<SitePage | null>(null);
  const [title, setTitle] = useState('');
  const [badge, setBadge] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');
  const [showInExploreDeals, setShowInExploreDeals] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const pages = getPages();
    const found = pages.find((p) => p.id === id || p.slug === id);
    if (found) {
      setPage(found);
      setTitle(found.title);
      setBadge(found.badge || '');
      setSubtitle(found.subtitle || '');
      setSlug(found.slug);
      setMetaTitle(found.metaTitle || '');
      setMetaDescription(found.metaDescription || '');
      setContent(found.content);
      setShowInExploreDeals(!!found.showInExploreDeals);
    }
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !title.trim()) return;

    setIsSubmitting(true);
    const updated: SitePage = {
      ...page,
      title: title.trim(),
      badge: badge.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      slug: page.isSystem ? page.slug : (slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || page.slug),
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      content,
      showInExploreDeals,
    };

    savePage(updated);
    setIsSubmitting(false);
    showToast('Page updated successfully! Changes are live.');
  };

  const handleResetToDefault = () => {
    if (!page) return;
    const defaultPage = DEFAULT_PAGES.find((p) => p.slug === page.slug || p.id === page.id);
    if (!defaultPage) {
      alert('No default template found for this custom page.');
      return;
    }
    if (confirm(`Reset "${page.title}" back to its initial original default text?`)) {
      setTitle(defaultPage.title);
      setBadge(defaultPage.badge || '');
      setSubtitle(defaultPage.subtitle || '');
      setMetaTitle(defaultPage.metaTitle || '');
      setMetaDescription(defaultPage.metaDescription || '');
      setContent(defaultPage.content);
      showToast('Page fields restored to default.');
    }
  };

  if (!page) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground">
        Loading page editor...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-[1100px] mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-md shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/supro111vat29/pages"
            className="p-2 border border-border hover:bg-muted/40 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Pages"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {page.badge || 'Page Editor'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                /{page.slug}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-1">
              Editing: {page.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {page.isSystem && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetToDefault}
              className="text-xs font-bold flex items-center gap-1.5"
              title="Restore initial default text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </Button>
          )}

          <Link
            href={page.isSystem ? `/${page.slug}` : `/page/${page.slug}`}
            target="_blank"
            className="text-xs font-bold h-9 px-3 border border-border bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 transition-colors rounded-none cursor-pointer"
          >
            <span>View Live</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Button
            type="submit"
            form="page-editor-form"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Page'}</span>
          </Button>
        </div>
      </div>

      <form id="page-editor-form" onSubmit={handleSave} className="space-y-8">
        {/* Basic Metadata */}
        <div className="p-6 border border-border bg-card rounded-md space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
            Page Header & Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Page Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. FTC Affiliate Disclosure"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Badge / Tagline Pill
              </label>
              <Input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. FTC Compliance / Our Mission"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Subtitle / Hero Description
            </label>
            <Input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Brief summary displayed at the top of the page..."
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              URL Slug {page.isSystem && <span className="text-[10px] text-muted-foreground font-normal">(System page URLs cannot be modified)</span>}
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-mono">https://yoursite.com/</span>
              <Input
                type="text"
                value={slug}
                disabled={page.isSystem}
                onChange={(e) => setSlug(formatSlugInput(e.target.value))}
                className="h-9 text-xs font-mono max-w-xs"
              />
            </div>
          </div>
        </div>

        {/* SEO Suite */}
        <div className="p-6 border border-border bg-card rounded-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
              SEO & Social Metadata
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Meta Title</label>
              <Input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Title shown on Google search..."
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Meta Description</label>
              <Input
                type="text"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Description shown on Google search..."
                className="h-9 text-xs"
              />
            </div>

            <div className="pt-2 border-t border-border">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInExploreDeals}
                  onChange={(e) => setShowInExploreDeals(e.target.checked)}
                  className="rounded-none"
                />
                <span>Show in Explore Deals Column (Footer)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Rich Content Editor */}
        <div className="p-6 border border-border bg-card rounded-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground">
                Page Body Content
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Write headings, paragraphs, lists, links, and formatting. You can switch between Visual WYSIWYG and HTML Text mode.
              </p>
            </div>
          </div>

          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your page content here..."
            minHeight="420px"
          />
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href="/supro111vat29/pages"
            className="text-xs font-bold h-9 px-4 border border-border bg-background hover:bg-muted text-foreground inline-flex items-center justify-center transition-colors rounded-none cursor-pointer"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Page Changes'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
