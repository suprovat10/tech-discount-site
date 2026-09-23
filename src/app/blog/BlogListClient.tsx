'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlogPost, BlogCategory } from '@/data/blogs';
import { getBlogs, getBlogCategories } from '@/lib/blogStore';
import {
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Search,
  ChevronRight,
  ChevronLeft,
  Filter,
  RotateCcw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { optimizeImageUrl } from '@/lib/imageOptimization';
import {
  doesBlogPostMatchCategory,
  findBlogCategory,
  getBlogCategorySlug,
} from '@/lib/blogStore';

interface BlogListClientProps {
  initialPosts: BlogPost[];
  initialCategories: BlogCategory[];
  initialCategory?: string;
}

export function BlogListClient({
  initialPosts,
  initialCategories,
  initialCategory,
}: BlogListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlCategory = searchParams ? (searchParams.get('category') || searchParams.get('cat') || '') : '';
  const urlPage = searchParams ? parseInt(searchParams.get('page') || '1', 10) : 1;

  const [blogs, setBlogs] = useState<BlogPost[]>(initialPosts);
  const [categories, setCategories] = useState<BlogCategory[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (urlCategory) return urlCategory;
    if (initialCategory && initialCategory !== 'all') {
      return initialCategory;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('smarttech_last_blog_category');
        if (stored) return stored;
      } catch {}
    }
    return 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(urlPage > 0 ? urlPage : 1);
  const POSTS_PER_PAGE = 12;
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Synchronize category & page state whenever Next.js searchParams change (handles Back / Forward browser buttons)
  useEffect(() => {
    if (!searchParams) return;
    const qCat = searchParams.get('category') || searchParams.get('cat');
    if (qCat) {
      setSelectedCategory(qCat);
      try {
        sessionStorage.setItem('smarttech_last_blog_category', qCat);
      } catch {}
    } else {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('smarttech_last_blog_category') : null;
      if (stored && stored !== 'all') {
        setSelectedCategory(stored);
      } else {
        setSelectedCategory('all');
      }
    }

    const p = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(isNaN(p) || p < 1 ? 1 : p);
  }, [searchParams]);

  useEffect(() => {
    const loadData = () => {
      const loadedBlogs = getBlogs();
      const loadedCats = getBlogCategories();
      if (loadedBlogs && loadedBlogs.length > 0) setBlogs(loadedBlogs);
      if (loadedCats && loadedCats.length > 0) setCategories(loadedCats);
    };

    loadData();

    window.addEventListener('smarttech_blogs_updated', loadData);
    window.addEventListener('smarttech_blog_categories_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('smarttech_blogs_updated', loadData);
      window.removeEventListener('smarttech_blog_categories_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen]);

  const handleSelectCategory = (catIdentifier: string) => {
    const isAll = !catIdentifier || catIdentifier === 'all';
    setCurrentPage(1);

    if (isAll) {
      setSelectedCategory('all');
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('smarttech_last_blog_category');
        } catch {}
      }
      router.push('/blog', { scroll: false });
    } else {
      const slug = getBlogCategorySlug(catIdentifier, categories) || catIdentifier;
      setSelectedCategory(slug);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('smarttech_last_blog_category', slug);
        } catch {}
      }
      router.push(`/blog?category=${encodeURIComponent(slug)}`, { scroll: false });
    }

    if (isMobileFilterOpen) {
      setIsMobileFilterOpen(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const cat = selectedCategory !== 'all' ? selectedCategory : '';
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.push(qs ? `/blog?${qs}` : '/blog', { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    handleSelectCategory('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filter posts by category and search
  const filteredPosts = blogs.filter((post) => {
    const matchesCategory = doesBlogPostMatchCategory(post.category, selectedCategory, categories);

    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) + (searchQuery.trim().length > 0 ? 1 : 0);

  // Render filter controls for both desktop sidebar and mobile drawer
  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* 1. Search Articles (Header-style search bar) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground/80">
          Search Articles
        </h3>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative flex items-center w-full"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search topics & guides..."
            className="w-full h-9 pl-3.5 pr-16 text-xs font-medium rounded-none bg-muted/40 border border-border focus:bg-background focus:border-blue-600 focus:outline-none transition-all placeholder:text-muted-foreground"
          />

          <div className="absolute right-1 inset-y-1 flex items-center gap-0.5">
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-none transition-colors cursor-pointer"
                title="Clear text"
                aria-label="Clear text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-muted/80 rounded-none transition-colors cursor-pointer"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 2. Blog Categories Hierarchy (Product Page Style) */}
      <div className="space-y-2.5 pt-4 border-t border-border/60">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground/80">
          Categories
        </h3>

        <div className="space-y-1 text-xs">
          {/* All Articles option */}
          <Link
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              handleSelectCategory('all');
            }}
            className={`w-full text-left py-2 px-2.5 rounded-none flex items-center justify-between transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
            }`}
          >
            <span className="tracking-tight">All Articles</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white/20 dark:bg-black/15 text-white dark:text-slate-900'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {blogs.length}
            </span>
          </Link>

          {/* Dynamic Categories */}
          {categories.map((cat) => {
            const count = blogs.filter((b) =>
              doesBlogPostMatchCategory(b.category, cat.name, categories)
            ).length;
            const isCatSelected =
              selectedCategory !== 'all' && doesBlogPostMatchCategory(cat.name, selectedCategory, categories);
            const catSlug = cat.slug || getBlogCategorySlug(cat.name, categories);

            return (
              <Link
                key={cat.id}
                href={`/blog?category=${encodeURIComponent(catSlug)}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectCategory(catSlug);
                }}
                className={`w-full text-left py-1.5 px-2.5 rounded-none transition-all flex items-center justify-between cursor-pointer ${
                  isCatSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-blue-100/80 dark:border-blue-900/40'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 font-medium'
                }`}
              >
                <span className="truncate pr-1 tracking-tight">{cat.name}</span>
                <span
                  className={`text-[11px] tabular-nums font-semibold shrink-0 ${
                    isCatSelected
                      ? 'text-blue-600/80 dark:text-blue-400/80'
                      : 'text-muted-foreground/70'
                  }`}
                >
                  ({count})
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Blog Page Hero Header */}
      <div className="border-b border-border/60 pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>TechPriceDrop Insights & Buying Guides</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
          Tech Buying Guides, Reviews & Price Trends
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          In-depth price analyses, store comparisons, and buying tips to help you find genuine discounts across Amazon, Walmart, Best Buy, and Target.
        </p>
      </div>

      {/* Mobile Slide-in Filter Drawer Backdrop & Drawer */}
      {isMounted &&
        createPortal(
          <>
            {isMobileFilterOpen && (
              <div
                className="fixed inset-0 bg-black/60 z-[99] lg:hidden backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
                onClick={() => setIsMobileFilterOpen(false)}
              />
            )}

            <div
              className={`fixed top-0 bottom-0 left-0 inset-y-0 z-[100] w-[85%] max-w-[340px] bg-background border-r border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
                isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
              }`}
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                    Filters & Categories
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-none">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    title="Reset all filters"
                    className="p-1.5 border border-border text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1 rounded-none hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="text-[10px]">Reset</span>
                  </button>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1.5 border border-border text-muted-foreground hover:text-foreground rounded-none hover:bg-muted/60 transition-colors cursor-pointer"
                    aria-label="Close filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Filter Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {renderFilterControls()}
              </div>

              {/* Drawer Footer / Show Results Button */}
              <div className="p-3 border-t border-border bg-card/95 backdrop-blur-md shrink-0">
                <Button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-none cursor-pointer"
                >
                  Show {filteredPosts.length} Articles
                </Button>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* Two-Column Layout: Left Sidebar Categories + Right Main Articles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: Categories & Search (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="border border-border/80 bg-card p-4 space-y-6 shadow-sm">
            {renderFilterControls()}
          </div>
        </aside>

        {/* RIGHT MAIN: ARTICLES GRID */}
        <main className="lg:col-span-9 space-y-5">
          {/* Mobile Toolbar: Filter & Category Button */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="w-full h-10 px-3 border border-border bg-card hover:bg-muted/50 text-xs font-bold text-foreground flex items-center justify-between gap-1.5 transition-colors cursor-pointer shadow-xs rounded-none"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Filters & Categories</span>
              </span>
              {activeFiltersCount > 0 ? (
                <span className="w-4 h-4 shrink-0 rounded-full bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
            </button>
          </div>

          {/* Top Bar: Title & Status */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-black text-foreground">
                  {selectedCategory === 'all'
                    ? 'All Articles'
                    : findBlogCategory(selectedCategory, categories)?.name ||
                      selectedCategory
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                </h1>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                    title="Clear search keyword"
                  >
                    <span>&quot;{searchQuery}&quot;</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing {filteredPosts.length === 0 ? 0 : (currentPage - 1) * POSTS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length)} of {filteredPosts.length} published{' '}
                {filteredPosts.length === 1 ? 'article' : 'articles'}
              </p>
            </div>

            {selectedCategory !== 'all' && (
              <button
                onClick={() => handleSelectCategory('all')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                View all categories →
              </button>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border bg-card space-y-3">
              <p className="text-sm font-bold text-foreground">No articles found matching your criteria</p>
              <p className="text-xs text-muted-foreground">
                Try selecting a different category or clearing your search term.
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {paginatedPosts.map((post, idx) => (
                  <article
                    key={post.id}
                    className="relative border border-border bg-card overflow-hidden hover:border-blue-600 transition-colors flex flex-col justify-between group shadow-2xs"
                  >
                    <div>
                      {/* Featured Image - Clickable */}
                      <Link
                        href={`/blog/${post.slug}`}
                        prefetch={true}
                        className="relative block aspect-[16/10] w-full overflow-hidden bg-muted border-b border-border cursor-pointer z-10"
                        title={post.title}
                      >
                        {post.imageUrl ? (
                          <img
                            src={optimizeImageUrl(post.imageUrl, 640)}
                            alt={post.imageAlt || post.title}
                            loading={idx < 2 ? 'eager' : 'lazy'}
                            decoding={idx < 2 ? 'sync' : 'async'}
                            fetchPriority={idx === 0 ? 'high' : undefined}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src = '/logo.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-2 sm:p-4 text-center">
                            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-background/90 border border-border flex items-center justify-center mb-1 sm:mb-2 shadow-xs group-hover:scale-110 transition-transform">
                              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider line-clamp-1">
                              {post.category || 'Tech Guide'}
                            </span>
                          </div>
                        )}
                        {post.category && (
                          <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 px-1.5 sm:px-2.5 py-0.5 bg-blue-600 text-white font-bold text-[9px] sm:text-[10px] uppercase shadow-sm max-w-[85%] truncate z-20">
                            {post.category}
                          </span>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2.5">
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-muted-foreground font-medium flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 shrink-0" />
                            <span className="truncate">{post.date}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500 shrink-0" />
                            <span>{post.readTime}</span>
                          </span>
                        </div>

                        {/* Title - Stretched Link covering the entire card body */}
                        <Link
                          href={`/blog/${post.slug}`}
                          prefetch={true}
                          className="block cursor-pointer after:absolute after:inset-0 after:z-10 focus:outline-none"
                        >
                          <h3 className="text-xs sm:text-sm font-black text-foreground group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h3>
                        </Link>

                        <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Read More button - Clickable */}
                    <div className="p-2.5 sm:p-4 pt-0 border-t border-border/40 mt-2 sm:mt-3 pt-2 sm:pt-3 flex items-center justify-end relative z-20">
                      <Link
                        href={`/blog/${post.slug}`}
                        prefetch={true}
                        className="text-[11px] sm:text-xs font-bold text-blue-600 group-hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read Guide</span>
                        <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination Controls (12 Articles Per Page) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-[30px] border-t border-border/60">
                  <div className="text-xs text-muted-foreground">
                    Showing <span className="font-bold text-foreground">{(currentPage - 1) * POSTS_PER_PAGE + 1}</span> to{' '}
                    <span className="font-bold text-foreground">
                      {Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length)}
                    </span>{' '}
                    of <span className="font-bold text-foreground">{filteredPosts.length}</span> articles
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="h-8 px-2 text-xs font-bold gap-1 cursor-pointer disabled:opacity-50 rounded-none"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Prev</span>
                    </Button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - currentPage) <= 1
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 text-xs font-bold transition-colors cursor-pointer rounded-none ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'border border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (
                        (pageNum === 2 && currentPage > 3) ||
                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        return (
                          <span key={pageNum} className="px-1 text-muted-foreground text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="h-8 px-2 text-xs font-bold gap-1 cursor-pointer disabled:opacity-50 rounded-none"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
