'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Sliders,
  Plus,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { savePage } from '@/lib/pageStore';
import { SitePage } from '@/data/defaultPages';

export default function AdminNewPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [badge, setBadge] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Page title is required.');
      return;
    }

    const cleanSlug = (slug.trim() || title.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setIsSubmitting(true);
    const newPage: SitePage = {
      id: `page-custom-${Date.now()}`,
      slug: cleanSlug,
      title: title.trim(),
      badge: badge.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      content,
      lastUpdated: new Date().toISOString().split('T')[0],
      isSystem: false,
    };

    savePage(newPage);
    setIsSubmitting(false);
    router.push('/supro111vat29/pages');
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-[1100px] mx-auto">
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Plus className="w-3.5 h-3.5" />
              New Page
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-1">
              Create New Custom Page
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/supro111vat29/pages">
            <Button variant="outline" className="text-xs font-bold">
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            form="new-page-form"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Page'}</span>
          </Button>
        </div>
      </div>

      <form id="new-page-form" onSubmit={handleSave} className="space-y-8">
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
                placeholder="e.g. Warranty & Returns Policy"
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
                placeholder="e.g. Guarantee / Customer Care"
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
            <label className="text-xs font-bold text-foreground">URL Slug</label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-mono">https://yoursite.com/</span>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="warranty-returns"
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
                Write headings, paragraphs, lists, links, and formatting with the rich visual editor.
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

        {/* Publish Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link href="/supro111vat29/pages">
            <Button type="button" variant="outline" className="text-xs font-bold">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Page'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
