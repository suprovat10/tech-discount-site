'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/data/blogs';
import { getBlogById, getBlogs } from '@/lib/blogStore';
import { UnifiedProduct } from '@/types/product';
import { BrandItem } from '@/data/brands';
import { DealCard } from '@/components/deals/DealCard';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Tag,
  ChevronRight,
  FileText,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdSlot } from '@/components/ads/AdSlot';
import { optimizeCloudinaryUrl } from '@/lib/imageOptimization';

interface BlogDetailClientProps {
  slug: string;
  initialPost?: BlogPost | null;
  initialRelatedPosts: BlogPost[];
  featuredProducts?: UnifiedProduct[];
  brands?: BrandItem[];
  siteUrl: string;
  brand: string;
  logoUrl: string;
}

export function BlogDetailClient({
  slug,
  initialPost,
  initialRelatedPosts,
  featuredProducts = [],
  brands = [],
  siteUrl,
  brand,
  logoUrl,
}: BlogDetailClientProps) {
  const [post, setPost] = useState<BlogPost | null>(initialPost || null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>(initialRelatedPosts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialPost) {
      setPost(initialPost);
    }

    const loadFromStore = () => {
      const found = getBlogById(slug);
      if (found) {
        setPost(found);
      } else if (!initialPost) {
        fetch(`/api/blogs?slug=${encodeURIComponent(slug)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setPost(data.data);
            }
          })
          .catch(() => {});
      }
      const all = getBlogs();
      const currentSlug = found?.slug || initialPost?.slug || slug;
      const currentCat = (found?.category || initialPost?.category || '').trim().toLowerCase();

      const sameCat = currentCat
        ? all.filter((p) => p.slug !== currentSlug && (p.category || '').trim().toLowerCase() === currentCat)
        : [];
      const other = all.filter(
        (p) => p.slug !== currentSlug && (p.category || '').trim().toLowerCase() !== currentCat
      );
      const related = [...sameCat, ...other].slice(0, 4);
      if (related.length > 0) {
        setRelatedPosts(related);
      }
    };

    loadFromStore();

    window.addEventListener('smarttech_blogs_updated', loadFromStore);
    window.addEventListener('storage', loadFromStore);
    return () => {
      window.removeEventListener('smarttech_blogs_updated', loadFromStore);
      window.removeEventListener('storage', loadFromStore);
    };
  }, [slug, initialPost]);

  // If article not found in server or client storage
  if (!post) {
    if (!mounted) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-xs font-bold text-muted-foreground">
            Loading article...
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-[800px] mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-muted border border-border mx-auto flex items-center justify-center text-muted-foreground">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">Article Not Found</h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            The article you requested could not be located. It may have been renamed or moved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/blog">
            <Button className="font-bold text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tech Guides & Blog</span>
            </Button>
          </Link>
          <Link href="/" prefetch={true}>
            <Button variant="outline" className="font-bold text-xs">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Schema.org Article Structured Data
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: (() => {
      try {
        const d = new Date(post.date);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      } catch {
        return new Date().toISOString();
      }
    })(),
    dateModified: (() => {
      try {
        const d = new Date(post.updatedAt || post.date);
        return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
      } catch {
        return new Date().toISOString();
      }
    })(),
    image: post.imageUrl || `${siteUrl}/og-image.png`,
    author: {
      '@type': 'Organization',
      name: brand,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: brand,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl.startsWith('http') ? logoUrl : `${siteUrl}${logoUrl}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${post.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${siteUrl}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Schema.org Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {/* Schema.org Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="flex items-center gap-2 text-xs text-muted-foreground font-medium overflow-x-auto whitespace-nowrap scrollbar-none [&::-webkit-scrollbar]:hidden py-1 pb-2 border-b border-border/60"
      >
        <Link href="/" prefetch={true} className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
        <Link href="/blog" className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
          Blog
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
        <span className="text-foreground truncate shrink-0 whitespace-nowrap max-w-[200px] sm:max-w-md">
          {post.title}
        </span>
      </nav>

      {/* Two-Column Layout: Left Column (Article) + Right Sidebar (Featured Products & Brands) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
        {/* Left Column: Article Content */}
        <article className="lg:col-span-8 space-y-6">
          {/* Header Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                {post.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                {post.date}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  {post.readTime || '4 min read'}
                </span>
              </div>

              <Link href="/blog" className="text-blue-600 hover:underline flex items-center gap-1 text-xs font-semibold">
                <ArrowLeft className="w-3 h-3" />
                <span>All Articles</span>
              </Link>
            </div>
          </div>

          {/* Featured Cover Image */}
          {post.imageUrl && (
            <div className="relative w-full border border-border overflow-hidden bg-muted">
              <img
                src={optimizeCloudinaryUrl(post.imageUrl, 1200)}
                alt={post.imageAlt || post.title}
                className="w-full max-h-[520px] object-cover"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = '/logo.png';
                }}
              />
            </div>
          )}

          {/* Article Body */}
          <div
            className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-foreground space-y-4 pt-2 prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600 prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-6 border-t border-border flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-2">
                <Tag className="w-3.5 h-3.5" /> Tags:
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-muted border border-border text-xs font-semibold text-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Ad Placement: Above Related Articles Banner */}
          <AdSlot placement="blog_detail_above_related" />

          {/* Related Articles (4 items in 2 columns) */}
          {relatedPosts.length > 0 && (
            <div className="pt-8 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground">Related Articles</h3>
                <Link href="/blog" className="text-xs font-bold text-blue-600 hover:underline">
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedPosts.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    href={`/blog/${r.slug}`}
                    className="p-3.5 border border-border bg-card hover:border-blue-600 transition-colors flex gap-3.5 items-center group"
                  >
                    <div className="relative w-24 h-20 overflow-hidden shrink-0 bg-muted border border-border">
                      {r.imageUrl ? (
                        <img
                          src={optimizeCloudinaryUrl(r.imageUrl, 300)}
                          alt={r.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = '/logo.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">
                        {r.category}
                      </span>
                      <h4 className="font-bold text-xs text-foreground line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                        {r.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground mt-1 block">{r.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Right Sidebar: Featured Products & Brands */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Ad Placement: Right Sidebar Top Square Ad */}
          <AdSlot placement="blog_detail_sidebar_top" />

          {/* 1. Featured Deals (1 column, 4 products) */}
          {featuredProducts && featuredProducts.length > 0 && (
            <div className="border border-border/80 bg-card p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Featured Deals
                </h3>
                <Link
                  href="/products"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {featuredProducts.slice(0, 4).map((product) => (
                  <DealCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Ad Placement: Right Sidebar Above Popular Brands Square Ad */}
          <AdSlot placement="blog_detail_sidebar_above_brands" />

          {/* 2. Popular Brands (3 columns) */}
          {brands && brands.length > 0 && (
            <div className="border border-border/80 bg-card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Popular Brands
                </h3>
                <Link
                  href="/retailers"
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  All →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {brands.slice(0, 9).map((b) => (
                  <Link
                    key={b.id}
                    href={`/brand/${b.slug}`}
                    className="p-2 border border-border/60 bg-background hover:border-blue-600 hover:bg-muted/40 transition-all flex flex-col items-center justify-center text-center group"
                    title={b.name}
                  >
                    <div className="w-7 h-7 relative flex items-center justify-center mb-1">
                      <img
                        src={optimizeCloudinaryUrl(b.logoUrl, 100)}
                        alt={b.name}
                        loading="lazy"
                        decoding="async"
                        className="max-w-full max-h-full object-contain filter dark:invert group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-foreground truncate w-full group-hover:text-blue-600">
                      {b.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
