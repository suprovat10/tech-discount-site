'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BlogPost } from '@/data/blogs';
import { getBlogById, getBlogs } from '@/lib/blogStore';
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

interface BlogDetailClientProps {
  slug: string;
  initialPost?: BlogPost | null;
  initialRelatedPosts: BlogPost[];
  siteUrl: string;
  brand: string;
  logoUrl: string;
}

export function BlogDetailClient({
  slug,
  initialPost,
  initialRelatedPosts,
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
      const currentSlug = found?.slug || slug;
      const related = all.filter((p) => p.slug !== currentSlug).slice(0, 2);
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
    datePublished: post.date,
    dateModified: post.date,
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
    <article className="max-w-[1000px] mx-auto space-y-6 pb-16">
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

      {/* Featured Cover Image (Sharp 0px, resilient loading) */}
      {post.imageUrl && (
        <div className="relative w-full border border-border overflow-hidden bg-muted">
          <img
            src={post.imageUrl}
            alt={post.imageAlt || post.title}
            className="w-full max-h-[520px] object-cover"
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

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <div className="pt-8 border-t border-border space-y-4">
          <h3 className="text-lg font-black text-foreground">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedPosts.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="p-4 border border-border bg-card hover:border-blue-600 transition-colors flex gap-4 items-center group"
              >
                <div className="relative w-28 h-20 overflow-hidden shrink-0 bg-muted border border-border">
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl}
                      alt={r.title}
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
                <div>
                  <h4 className="font-bold text-xs text-foreground line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {r.title}
                  </h4>
                  <span className="text-[11px] text-muted-foreground mt-1 block">{r.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
