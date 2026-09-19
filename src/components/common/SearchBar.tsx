'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  size?: 'default' | 'large';
  className?: string;
}

const QUICK_SUGGESTIONS = [
  'AirPods Pro',
  'MacBook Air M3',
  'Sony WH-1000XM5',
  'PlayStation 5',
  'Samsung OLED TV',
  'Apple Watch',
];

export function SearchBar({
  initialQuery = '',
  placeholder = 'Search gadgets, laptops, TVs, headphones...',
  size = 'default',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleQuickClick = (item: string) => {
    setQuery(item);
    setIsLoading(true);
    router.push(`/products?search=${encodeURIComponent(item)}`);
  };

  const isLarge = size === 'large';

  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      <form onSubmit={handleSearch} className="relative flex items-center">
        <div className="relative w-full">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            ) : (
              <Search className={`w-6 h-6 ${isLarge ? 'text-indigo-600' : 'text-muted-foreground'}`} />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={`w-full bg-card border-2 border-border/90 rounded-2xl pl-14 pr-32 text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/15 transition-all shadow-xl shadow-black/5 ${
              isLarge ? 'h-16 sm:h-18 text-lg sm:text-xl' : 'h-12 text-base'
            }`}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-28 top-1/2 -translate-y-1/2 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <Button
            type="submit"
            disabled={!query.trim()}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all ${
              isLarge ? 'h-11 sm:h-13 px-6 text-base' : 'h-9 px-4 text-sm'
            }`}
          >
            Search
          </Button>
        </div>
      </form>

      {isLarge && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 font-bold text-foreground">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Trending:
          </span>
          {QUICK_SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleQuickClick(item)}
              className="px-3 py-1.5 rounded-full bg-card hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-border text-foreground font-semibold text-xs sm:text-sm transition-all hover:border-indigo-400 shadow-sm"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
