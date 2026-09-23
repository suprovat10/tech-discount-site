import React from 'react';
import Link from 'next/link';
import { Search, Home, ShoppingBag, BookOpen, ArrowRight, Flame } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The deal or page you are looking for does not exist or has been moved.',
};

export default function NotFound() {
  const quickCategories = [
    { name: 'Laptops & Computers', href: '/products/laptops' },
    { name: 'Audio & Headphones', href: '/products/audio' },
    { name: 'Mobile & Wearables', href: '/products/mobile' },
    { name: 'Gaming & Consoles', href: '/products/gaming' },
    { name: 'TV & Home Theater', href: '/products/tv' },
    { name: 'Cameras & Smart Home', href: '/products/cameras' },
  ];

  return (
    <div className="container max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Status Code Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
          <span>Error 404</span>
          <span>•</span>
          <span>Page Not Found</span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight">
            Looking for a Deal?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The page or deal you are looking for has expired, moved, or doesn&apos;t exist. 
            Use our search below or explore today&apos;s verified lowest prices.
          </p>
        </div>

        {/* Search Bar Form */}
        <form
          action="/products"
          method="GET"
          className="flex items-center border border-border bg-background shadow-xs max-w-lg mx-auto"
        >
          <div className="pl-3.5 pr-2 text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            name="search"
            placeholder="Search laptops, headphones, deals..."
            className="w-full h-11 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            className="h-11 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs shrink-0 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs inline-flex items-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/products?sort=highest-savings"
            className="h-10 px-5 border border-border bg-background hover:bg-accent font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Today&apos;s Best Deals</span>
          </Link>
          <Link
            href="/blog"
            className="h-10 px-5 border border-border bg-background hover:bg-accent font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Buying Guides</span>
          </Link>
        </div>

        {/* Category Discovery Grid */}
        <div className="pt-8 border-t border-border/60 text-left space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
            Popular Categories to Explore
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {quickCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="p-3 border border-border/80 bg-card hover:bg-accent/60 transition-colors flex items-center justify-between text-xs font-bold text-foreground group"
              >
                <span>{cat.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
