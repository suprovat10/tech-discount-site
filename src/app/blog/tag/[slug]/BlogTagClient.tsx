'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BlogPost, BlogCategory } from '@/data/blogs';
import { getBlogs, getBlogCategories } from '@/lib/blogStore';
import { slugifyTag } from '@/lib/productTagStore';
import {
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Search,
  ChevronRight,
  Tag as TagIcon,
  Filter,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { optimizeImageUrl } from '@/lib/imageOptimization';

interface BlogTagClientProps {
  slug: string;
  tagName: string;
  initialPosts: BlogPost[];
  allCategories: BlogCategory[];
}

export function BlogTagClient({
  slug,
  tagName,
  initialPosts,
  allCategories,
}: BlogTagClientProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>(initialPosts);
  const [categories, setCategories] = useState<BlogCategory[]>(allCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with client-side blog store updates
  useEffect(() => {
    const syncData = () => {
      const all = getBlogs();
      if (all && all.length > 0) {
        const matching = all.filter((p) =>
          p.tags?.some((t) => slugifyTag(t) === slug)
        );
        setBlogs(matching);
      }
      const cats = getBlogCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    };

    window.addEventListener('smarttech_blogs_updated', syncData);
    window.addEventListener('smarttech_blog_categories_updated', syncData);
    window.addEventListener('storage', syncData);
    return () => {
      window.removeEventListener('smarttech_blogs_updated', syncData);
      window.removeEventListener('smarttech_blog_categories_updated', syncData);
      window.removeEventListener('storage', syncData);
    };
  }, [slug]);

  const filteredPosts = useMemo(() => {
    return blogs.filter((post) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        post.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumbs */}
      <nav
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pb-2.5 border-b border-border/60 overflow-x-auto whitespace-nowrap scrollbar-none [&::-webkit-scrollbar]:hidden py-1"
      >
        <Link href="/" prefetch={true} className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <Link href="/blog" prefetch={true} className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
          Blog
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <span className="text-muted-foreground shrink-0">Tags</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <span className="text-foreground font-semibold shrink-0 whitespace-nowrap truncate">#{tagName}</span>
      </nav>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 border border-border/80 bg-card rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <TagIcon className="w-3 h-3" />
              Blog Topic
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {blogs.length} {blogs.length === 1 ? 'article' : 'articles'} found
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-2">
            <span className="text-blue-600">#</span>
            <span>{tagName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            In-depth guides, price comparisons, and buying tips specifically tagged with #{tagName}.
          </p>
        </div>

        {/* Search inside this Tag */}
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in #${tagName}...`}
              className="w-full pl-9 pr-8 py-2 text-xs bg-muted/60 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Filter Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
                selectedCategory === c.name
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              {c.name}
            </button>
          ))}
          {(selectedCategory !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 shrink-0 ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      )}

      {/* Blog Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, idx) => (
            <article
              key={post.id}
              className="bg-card border border-border/70 hover:border-blue-500/50 rounded-xl overflow-hidden flex flex-col transition-all duration-200 group hover:shadow-md"
            >
              {/* Thumbnail */}
              <Link href={`/blog/${post.slug}`} prefetch={true} className="relative aspect-video overflow-hidden bg-muted block">
                {post.imageUrl ? (
                  <img
                    src={optimizeImageUrl(post.imageUrl, 600)}
                    alt={post.title}
                    loading={idx < 2 ? 'eager' : 'lazy'}
                    decoding={idx < 2 ? 'sync' : 'async'}
                    fetchPriority={idx === 0 ? 'high' : undefined}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                    <BookOpen className="w-8 h-8 opacity-40" />
                  </div>
                )}
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-background/90 backdrop-blur-xs text-[11px] font-bold text-foreground rounded border border-border/50">
                  {post.category}
                </span>
              </Link>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="text-base font-bold text-foreground group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
                  <Link href={`/blog/${post.slug}`} prefetch={true}>{post.title}</Link>
                </h2>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4 flex-1">
                  {post.excerpt}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/60">
                    {post.tags.map((t) => {
                      const tSlug = slugifyTag(t);
                      const isCurrent = tSlug === slug;
                      return (
                        <Link
                          key={t}
                          href={`/blog/tag/${tSlug}`}
                          prefetch={true}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            isCurrent
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold'
                              : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          #{t}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-border/80 bg-muted/20 space-y-4 rounded-xl">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Articles Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No articles match your current search or category filter for #{tagName}.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="font-bold text-xs"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
