'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost, BlogCategory } from '@/data/blogs';
import { getBlogs, getBlogCategories } from '@/lib/blogStore';
import { Calendar, Clock, ArrowRight, BookOpen, Layers, Search, ChevronRight } from 'lucide-react';

interface BlogListClientProps {
  initialPosts: BlogPost[];
  initialCategories: BlogCategory[];
}

export function BlogListClient({
  initialPosts,
  initialCategories,
}: BlogListClientProps) {
  const [blogs, setBlogs] = useState<BlogPost[]>(initialPosts);
  const [categories, setCategories] = useState<BlogCategory[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = () => {
      const loadedBlogs = getBlogs();
      const loadedCats = getBlogCategories();
      if (loadedBlogs && loadedBlogs.length > 0) setBlogs(loadedBlogs);
      if (loadedCats && loadedCats.length > 0) setCategories(loadedCats);
    };

    loadData();

    window.addEventListener('smarttech_blogs_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('smarttech_blogs_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  // Filter posts by category and search
  const filteredPosts = blogs.filter((post) => {
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

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Blog Page Hero Header */}
      <div className="border-b border-border/60 pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>SmartTech Insights & Buying Guides</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
          Tech Buying Guides, Reviews & Price Trends
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          In-depth price analyses, store comparisons, and buying tips to help you find genuine discounts across Amazon, Walmart, Best Buy, and Target.
        </p>
      </div>

      {/* Two-Column Layout: Left Sidebar Categories + Right Main Articles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: BLOG CATEGORIES */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="p-4 border border-border bg-card space-y-3">
            <h3 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Blog Categories</span>
            </h3>

            <div className="space-y-1">
              {/* All Articles option */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span>All Articles</span>
                <span className="text-[10px] opacity-75 font-semibold">({blogs.length})</span>
              </button>

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const count = blogs.filter(
                  (b) => b.category.toLowerCase() === cat.name.toLowerCase()
                ).length;
                const isSelected =
                  selectedCategory.toLowerCase() === cat.name.toLowerCase();

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className="text-[10px] opacity-75 font-semibold shrink-0">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search inside blog */}
          <div className="p-4 border border-border bg-card space-y-2">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase">Search Articles</h4>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-border bg-background focus:outline-none focus:border-blue-600"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[10px] font-semibold text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        </aside>

        {/* RIGHT MAIN: ARTICLES GRID (NO Author shown) */}
        <main className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h2 className="text-lg font-black text-foreground">
                {selectedCategory === 'all' ? 'All Articles' : selectedCategory}
              </h2>
              <p className="text-xs text-muted-foreground">
                Showing {filteredPosts.length} published {filteredPosts.length === 1 ? 'article' : 'articles'}
              </p>
            </div>

            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View all categories →
              </button>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border bg-card space-y-3">
              <p className="text-sm font-bold text-foreground">No articles found in this category</p>
              <p className="text-xs text-muted-foreground">
                Try selecting a different category or clearing your search term.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="border border-border bg-card overflow-hidden hover:border-blue-600 transition-colors flex flex-col justify-between group"
                >
                  <div>
                    {/* Featured Image - Clickable */}
                    <Link
                      href={`/blog/${post.slug}`}
                      prefetch={true}
                      className="relative block aspect-[16/10] w-full overflow-hidden bg-muted border-b border-border cursor-pointer"
                      title={post.title}
                    >
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={post.imageAlt || post.title}
                          loading="eager"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = '/logo.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                          <BookOpen className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-blue-600 text-white font-bold text-[10px] uppercase shadow-sm">
                        {post.category}
                      </span>
                    </Link>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          {post.readTime}
                        </span>
                      </div>

                      {/* Title - Clickable */}
                      <Link href={`/blog/${post.slug}`} prefetch={true} className="block cursor-pointer">
                        <h3 className="text-sm font-black text-foreground hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Read More button - Clickable */}
                  <div className="p-4 pt-0 border-t border-border/40 mt-3 pt-3 flex items-center justify-end">
                    <Link
                      href={`/blog/${post.slug}`}
                      prefetch={true}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
