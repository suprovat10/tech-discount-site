'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES, CategoryDefinition, SubcategoryDefinition } from '@/data/catalog';
import { getCategories, getCategorySlug, getSubcategorySlug } from '@/lib/categoryStore';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { optimizeImageUrl } from '@/lib/imageOptimization';

interface SliderItem {
  id: string;
  name: string;
  imageUrl?: string;
  href: string;
  isSub?: boolean;
}

export function TopCategorySlider() {
  const [categories, setCategories] = useState<CategoryDefinition[]>(CATEGORIES);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const loaded = getCategories();
    if (loaded && loaded.length > 0) {
      setCategories(loaded);
    }
    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      })
      .catch(() => {});

    const handleUpdate = () => {
      const fresh = getCategories();
      if (fresh && fresh.length > 0) setCategories(fresh);
    };
    window.addEventListener('smarttech_categories_updated', handleUpdate);
    return () => window.removeEventListener('smarttech_categories_updated', handleUpdate);
  }, []);

  // Build items list: Featured categories + top slider subcategories
  const sliderItems = React.useMemo(() => {
    const items: SliderItem[] = [];
    categories.forEach((cat) => {
      const catSlug = cat.slug || getCategorySlug(categories, cat.name);
      // Include category if enabled (default true)
      if (cat.showInTopSlider !== false) {
        items.push({
          id: `cat-${cat.id}`,
          name: cat.name,
          imageUrl: cat.imageUrl,
          href: `/products/${catSlug}`,
          isSub: false,
        });
      }

      // Include subcategories explicitly toggled for top slider
      cat.subcategories?.forEach((sub) => {
        if (sub.showInTopSlider) {
          const subSlug = sub.slug || getSubcategorySlug(cat, sub.name);
          items.push({
            id: `sub-${sub.id}`,
            name: sub.name,
            imageUrl: sub.imageUrl || cat.imageUrl,
            href: `/products/${catSlug}/${subSlug}`,
            isSub: true,
          });
        }
      });
    });
    return items;
  }, [categories]);

  const checkScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      checkScroll();
    });
    return () => cancelAnimationFrame(id);
  }, [sliderItems]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(() => {
      requestAnimationFrame(checkScroll);
    }, 300);
  };

  if (sliderItems.length === 0) return null;

  return (
    <section className="relative group/slider my-2">
      {/* Scroll Controls (Desktop & Mobile) */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-background/95 hover:bg-background border border-border flex items-center justify-center text-foreground shadow-md transition-opacity cursor-pointer"
          aria-label="Previous categories"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-background/95 hover:bg-background border border-border flex items-center justify-center text-foreground shadow-md transition-opacity cursor-pointer"
          aria-label="Next categories"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Horizontal Slider Track */}
      <div
        ref={sliderRef}
        onScroll={checkScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="flex items-center gap-3.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden scroll-smooth py-2 px-1"
      >
        {sliderItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={true}
            className="group relative flex flex-col items-center justify-between p-3 sm:p-3.5 bg-card hover:bg-muted/30 border border-border/80 hover:border-foreground/30 transition-all rounded-sm shrink-0 w-28 sm:w-32 min-w-[115px] sm:min-w-[130px] min-h-[108px] sm:min-h-[116px] shadow-sm hover:shadow-md cursor-pointer"
            title={item.name}
          >
            {/* Image Container on TOP (Transparent, no background box behind image for transparent PNGs) */}
            <div className="h-12 sm:h-14 w-full flex items-center justify-center bg-transparent">
              {item.imageUrl ? (
                <img
                  src={optimizeImageUrl(item.imageUrl, 160)}
                  alt={item.name}
                  width={60}
                  height={48}
                  className="h-10 sm:h-12 w-auto max-w-[85%] max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-transparent">
                  <Layers className="w-6 h-6 stroke-1" />
                </div>
              )}
            </div>

            {/* Category Name underneath (Full text visible) */}
            <span className="mt-2 text-xs sm:text-[12.5px] font-bold text-foreground group-hover:text-primary transition-colors text-center line-clamp-2 leading-snug w-full px-1 break-words">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
