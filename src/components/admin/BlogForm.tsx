'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, BlogCategory } from '@/data/blogs';
import { getBlogCategories } from '@/lib/blogStore';
import RichTextEditor from '@/components/admin/RichTextEditor';
import {
  FileText,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Clock,
  Tag,
  Folder,
  Layers,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Eye,
  Upload,
  Loader2,
  CheckCircle2,
  X,
  Search,
  Globe,
  Share2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatSlugInput } from '@/lib/utils';

interface BlogFormProps {
  initialData?: Partial<BlogPost>;
  isEdit?: boolean;
  onSubmit: (data: BlogPost) => void;
  onCancel: () => void;
}

export default function BlogForm({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
}: BlogFormProps) {
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  // Form Fields - clean, blank start for new blogs
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [readTime, setReadTime] = useState(initialData?.readTime || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [imageAlt, setImageAlt] = useState(initialData?.imageAlt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [tagsInput, setTagsInput] = useState((initialData?.tags || []).join(', '));
  const [date, setDate] = useState(
    initialData?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  );

  // SEO State (Requirement 1 & 2)
  const [metaTitle, setMetaTitle] = useState(initialData?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialData?.seo?.metaDescription || '');
  const [keywords, setKeywords] = useState(initialData?.seo?.keywords || '');
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.seo?.canonicalUrl || '');
  const [ogImageUrl, setOgImageUrl] = useState(
    initialData?.seo?.ogImageUrl || initialData?.imageUrl || ''
  );
  const [ogImageAlt, setOgImageAlt] = useState(
    initialData?.seo?.ogImageAlt || initialData?.imageAlt || ''
  );
  const [isOgImageCustomized, setIsOgImageCustomized] = useState(
    Boolean(initialData?.seo?.ogImageUrl && initialData?.seo?.ogImageUrl !== initialData?.imageUrl)
  );
  const [uploadingSocialImg, setUploadingSocialImg] = useState(false);
  const socialFileInputRef = React.useRef<HTMLInputElement>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // Sync Featured Cover with Social Image by default (Requirement 2)
  const syncCoverToSocial = (newUrl: string) => {
    setImageUrl(newUrl);
    if (!isOgImageCustomized || !ogImageUrl) {
      setOgImageUrl(newUrl);
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    setUploadingCover(true);
    setUploadSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'blog');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        syncCoverToSocial(data.url);
        if (!imageAlt.trim()) {
          const autoAlt = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .trim();
          setImageAlt(autoAlt || title || 'Blog cover');
          if (!ogImageAlt.trim()) {
            setOgImageAlt(autoAlt || title || 'Blog cover');
          }
        }
        setUploadSuccessMsg('Featured cover image attached!');
        setTimeout(() => setUploadSuccessMsg(''), 4000);
      } else {
        throw new Error(data.error || 'Server upload failed');
      }
    } catch (err: any) {
      console.warn('Cover upload failed, falling back to local FileReader:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const resUrl = e.target.result as string;
          syncCoverToSocial(resUrl);
          if (!imageAlt.trim()) {
            setImageAlt(title || 'Blog cover');
            if (!ogImageAlt.trim()) {
              setOgImageAlt(title || 'Blog cover');
            }
          }
          setUploadSuccessMsg('Cover image preview attached!');
          setTimeout(() => setUploadSuccessMsg(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSocialImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingSocialImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'blog-social');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setOgImageUrl(data.url);
        setIsOgImageCustomized(true);
        if (!ogImageAlt.trim()) {
          setOgImageAlt(imageAlt || title || 'Social share preview');
        }
      } else {
        throw new Error(data.error || 'Server upload failed');
      }
    } catch (err: any) {
      console.warn('Social image upload failed, falling back to local FileReader:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setOgImageUrl(e.target.result as string);
          setIsOgImageCustomized(true);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingSocialImg(false);
    }
  };

  const handleResetToCover = () => {
    setOgImageUrl(imageUrl);
    setOgImageAlt(imageAlt || title);
    setIsOgImageCustomized(false);
  };

  useEffect(() => {
    const cats = getBlogCategories();
    setCategories(cats);
    if (!category && cats.length > 0) {
      setCategory(cats[0].name);
    }

    const handleCatsUpdate = () => {
      const updated = getBlogCategories();
      setCategories(updated);
      if (!category && updated.length > 0) {
        setCategory(updated[0].name);
      }
    };
    window.addEventListener('smarttech_blog_categories_updated', handleCatsUpdate);
    return () => window.removeEventListener('smarttech_blog_categories_updated', handleCatsUpdate);
  }, [category]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    const finalSlug =
      slug.trim() ||
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const postData: BlogPost = {
      id: initialData?.id || `post-${Date.now()}`,
      slug: finalSlug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      category: category || (categories[0]?.name ?? 'Tech Guides'),
      readTime: readTime.trim() || '3 min read',
      date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      imageUrl: imageUrl.trim(),
      imageAlt: imageAlt.trim() || undefined,
      content: content.trim() || `<p>${excerpt.trim()}</p>`,
      tags: parsedTags.length > 0 ? parsedTags : [category || 'Tech Deals'],
      seo: {
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        keywords: keywords.trim() || (parsedTags.length > 0 ? parsedTags.join(', ') : undefined),
        canonicalUrl: canonicalUrl.trim() || undefined,
        ogImageUrl: (ogImageUrl.trim() || imageUrl.trim()).trim() || undefined,
        ogImageAlt: (ogImageAlt.trim() || imageAlt.trim() || title.trim()).trim() || undefined,
      },
    };

    onSubmit(postData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="p-1 border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Blog Articles"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-black text-foreground">
              {isEdit ? 'Edit Blog Article' : 'Write New Blog Article'}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEdit
              ? 'Update article content, layout, styling, and metadata.'
              : 'Compose a rich tech buying guide, comparison, or price trend article.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs font-bold h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!title.trim() || !excerpt.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 flex items-center gap-2 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEdit ? 'Save Changes' : 'Publish Article'}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Content Editor on Left, Meta & Settings on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols): Title, Excerpt, Divi Rich WYSIWYG Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Box */}
          <div className="bg-card border border-border p-5 space-y-3">
            <label className="block text-xs font-bold text-foreground">
              Article Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Apple M3 MacBook Air vs M2: Is It Worth The Upgrade in 2026?"
              className="h-10 text-sm font-bold"
              required
            />

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Permalink / Slug:
              </label>
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-slate-50 dark:bg-slate-900 border border-border px-3 py-1.5">
                <span>/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(formatSlugInput(e.target.value))}
                  placeholder="article-slug"
                  className="bg-transparent text-foreground font-mono focus:outline-none flex-1"
                />
              </div>
            </div>
          </div>

          {/* Short Excerpt */}
          <div className="bg-card border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-foreground">
                Short Excerpt / Summary <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground">Used for preview cards & SEO snippet</span>
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Write a compelling 1-2 sentence overview of the article..."
              className="w-full p-3 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none leading-relaxed"
              required
            />
          </div>

          {/* Divi / WordPress Style WYSIWYG Editor */}
          <div className="bg-card border border-border p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Full Article Body (Divi / WordPress Style Editor)
                </h2>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Visual mode with font styling, lists, headings & media insertion
              </span>
            </div>

            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start drafting your article... Use the top formatting bar to style headings, lists, quotes, colors, and media."
              minHeight="420px"
            />
          </div>

          {/* Search Engine Optimization (SEO) & Social Sharing (Requirement 1 & 2) */}
          <div className="bg-card border border-border p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Search Engine Optimization (SEO) & Social Sharing
                </h2>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Google SERP preview, social share cards, canonical URL & meta tags
              </span>
            </div>

            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-foreground">
                  SEO Meta Title
                </label>
                <span className={`text-[10px] font-mono ${(metaTitle || title).length > 60 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {(metaTitle || (title ? `${title} | TechPriceDrop Blog` : '')).length} / 60 chars (Recommended: 50-60)
                </span>
              </div>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title ? `${title} | TechPriceDrop Blog` : 'Optimized title for search engines...'}
                className="h-9 text-xs"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Leave empty to automatically use the article title + site branding.
              </span>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-foreground">
                  SEO Meta Description
                </label>
                <span className={`text-[10px] font-mono ${(metaDescription || excerpt).length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {(metaDescription || excerpt).length} / 160 chars (Recommended: 150-160)
                </span>
              </div>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                placeholder={excerpt || 'Enter a concise, click-worthy summary for search engines...'}
                className="w-full p-2.5 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none leading-relaxed"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Leave empty to automatically use the short summary / excerpt.
              </span>
            </div>

            {/* SEO Keywords */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                SEO Keywords (comma separated)
              </label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={tagsInput || 'apple, macbook air, price comparison, tech deals'}
                className="h-9 text-xs"
              />
            </div>

            {/* Canonical URL Override */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Canonical URL (Override)
              </label>
              <Input
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder={`https://www.techpricedrop.com/blog/${slug || 'article-slug'}`}
                className="h-9 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Default: https://www.techpricedrop.com/blog/{slug || 'article-slug'}
              </span>
            </div>

            {/* Social Media OG Image Section (Requirement 1 & 2) */}
            <div className="p-4 border border-border bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Social Share Image (OpenGraph / Twitter)
                  </span>
                </div>
                {ogImageUrl && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-none border ${
                    !isOgImageCustomized || ogImageUrl === imageUrl
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400'
                  }`}>
                    {!isOgImageCustomized || ogImageUrl === imageUrl
                      ? 'Auto-synced with Cover Photo'
                      : 'Custom Social Image'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Image Preview Box */}
                <div className="sm:col-span-4 aspect-[1.91/1] bg-muted border border-border overflow-hidden flex items-center justify-center relative">
                  {(ogImageUrl || imageUrl) ? (
                    <img
                      src={ogImageUrl || imageUrl}
                      alt={ogImageAlt || imageAlt || title || 'Social Preview'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/logo-techpricedrop.png';
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground text-center p-2">
                      No Social Image Set (Upload or add Featured Cover)
                    </span>
                  )}
                </div>

                {/* Actions & Inputs */}
                <div className="sm:col-span-8 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={socialFileInputRef}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) handleSocialImageUpload(f);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => socialFileInputRef.current?.click()}
                      disabled={uploadingSocialImg}
                      className="h-8 text-xs font-bold gap-1.5"
                    >
                      {uploadingSocialImg ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>Upload Custom Social Image</span>
                        </>
                      )}
                    </Button>

                    {imageUrl && ogImageUrl !== imageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleResetToCover}
                        className="h-8 text-xs font-bold text-blue-600 gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset to Cover Photo</span>
                      </Button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                      Direct Social Image URL:
                    </label>
                    <Input
                      value={ogImageUrl}
                      onChange={(e) => {
                        setOgImageUrl(e.target.value);
                        setIsOgImageCustomized(true);
                      }}
                      placeholder={imageUrl || 'https://res.cloudinary.com/... or /uploads/...'}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                      Social Image Alt Text:
                    </label>
                    <Input
                      value={ogImageAlt}
                      onChange={(e) => setOgImageAlt(e.target.value)}
                      placeholder={imageAlt || title || 'Social share cover image'}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Google Search Live Preview */}
            <div className="p-4 border border-border bg-background space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                Google Search Result Preview
              </span>
              <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-sm font-semibold truncate hover:underline cursor-pointer">
                {metaTitle || (title ? `${title} | TechPriceDrop Blog` : 'Article Title | TechPriceDrop Blog')}
              </div>
              <div className="text-[#006621] dark:text-[#34a853] text-[11px] truncate">
                https://www.techpricedrop.com/blog/{slug || 'article-slug'}
              </div>
              <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-relaxed">
                {metaDescription || excerpt || 'Enter an excerpt or meta description to see how this buying guide appears in Google search engine results.'}
              </p>
            </div>

            {/* Social Media Live Share Preview (Facebook / Twitter / LinkedIn) */}
            <div className="p-4 border border-border bg-background space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Social Share Card Preview (Facebook, Twitter, LinkedIn)
              </span>
              <div className="border border-border/80 overflow-hidden bg-muted/20 max-w-md">
                <div className="aspect-[1.91/1] w-full bg-muted relative overflow-hidden flex items-center justify-center">
                  {(ogImageUrl || imageUrl) ? (
                    <img
                      src={ogImageUrl || imageUrl}
                      alt={ogImageAlt || title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/logo-techpricedrop.png';
                      }}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No Social Image Set</span>
                  )}
                </div>
                <div className="p-3 space-y-1 bg-card">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                    techpricedrop.com
                  </span>
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">
                    {metaTitle || title || 'Article Title'}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {metaDescription || excerpt || 'Article excerpt and summary...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Settings, Category, Cover Image, Meta */}
        <div className="space-y-6">
          {/* Category Card */}
          <div className="bg-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Article Category
                </h3>
              </div>
              <Link
                href="/supro111vat29/blogs/categories"
                target="_blank"
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                + Manage
              </Link>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Select Topic</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-background border border-border focus:border-blue-600 focus:outline-none font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Reading Time</label>
              <Input
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="5 min read"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Publish Date</label>
              <Input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Sep 18, 2026"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Featured Cover Image Card with Attachment */}
          <div className="bg-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Featured Cover Image
                </h3>
              </div>
              {uploadSuccessMsg && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {uploadSuccessMsg}
                </span>
              )}
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/jpg,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                // Reset file input so the same file can be re-uploaded
                e.target.value = '';
                if (file) handleCoverUpload(file);
              }}
            />

            {/* Dropzone & Preview Box */}
            <div className="space-y-3">
              {imageUrl ? (
                <div className="relative aspect-video w-full border border-border overflow-hidden bg-slate-100 dark:bg-slate-900 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={imageAlt || 'Cover Preview'}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover Overlay with Change / Remove */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="text-xs font-bold h-8 px-3 bg-white/90 text-black hover:bg-white"
                    >
                      Change Image
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setImageUrl('')}
                      className="text-xs font-bold h-8 px-3"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-border hover:border-blue-500 rounded p-6 flex flex-col items-center justify-center text-center transition-all bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/20"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Click to Attach Cover Image</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    PNG, JPG, or WebP (Recommended 16:9 ratio, min 800px width)
                  </span>
                </div>
              )}

              {uploadingCover && (
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-bold py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading image to server...</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 flex items-center justify-center gap-2"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{imageUrl ? 'Upload / Replace Image' : 'Attach Cover from Device'}</span>
                </Button>

                {imageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-red-600 hover:text-red-700 h-9 px-3 shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Direct Image URL input */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Image URL / File Path</label>
              <Input
                value={imageUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setImageUrl(val);
                  if (!isOgImageCustomized || !ogImageUrl) {
                    setOgImageUrl(val);
                  }
                }}
                placeholder="https://... or /uploads/..."
                className="h-8 text-xs font-mono"
              />
            </div>

            {/* Image Alt Text */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Image Alt Text (SEO & Google Image Ranking)
              </label>
              <Input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="e.g. Detailed comparison benchmark of tech laptops"
                className="h-8 text-xs"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Helps Google index this image in Google Images search results.
              </span>
            </div>
          </div>

          {/* Tags Card */}
          <div className="bg-card border border-border p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Tag className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Article Tags
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Tags (comma separated)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Apple, MacBook Air, Price Trends, Laptops"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Bottom Action Card */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-border p-5 space-y-3">
            <Button
              type="submit"
              disabled={!title.trim() || !excerpt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 flex items-center justify-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Save Article Changes' : 'Publish Article Now'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full text-xs font-bold h-9"
            >
              Cancel & Return
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
