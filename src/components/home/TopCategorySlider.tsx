'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryDefinition } from '@/data/catalog';
import { CATEGORIES } from '@/data/catalog';
import { getCategories, getCategorySlug, getSubcategorySlug } from '@/lib/categoryStore';
import { ChevronLeft, ChevronRight, Layers, Laptop, Headphones, Smartphone, Gamepad2, Tv, Camera, Watch, Speaker } from 'lucide-react';
import { optimizeImageUrl } from '@/lib/imageOptimization';
import { SiteSettings } from '@/types/settings';

interface SliderItem {
  id: string;
  name: string;
  imageUrl?: string;
  href: string;
  isSub?: boolean;
}

interface TopCategorySliderProps {
  initialSettings?: SiteSettings;
  initialCategories?: CategoryDefinition[];
}

function renderCategoryFallbackIcon(name: string) {
  const n = name.toLowerCase();
  let IconComponent = Layers;
  let colorClass = 'text-slate-600 dark:text-slate-400';

  if (n.includes('laptop') || n.includes('macbook') || n.includes('computer')) {
    IconComponent = Laptop;
    colorClass = 'text-blue-600 dark:text-blue-400';
  } else if (n.includes('audio') || n.includes('headphone') || n.includes('earbud') || n.includes('sound')) {
    IconComponent = Headphones;
    colorClass = 'text-indigo-600 dark:text-indigo-400';
  } else if (n.includes('speaker')) {
    IconComponent = Speaker;
    colorClass = 'text-sky-600 dark:text-sky-400';
  } else if (n.includes('phone') || n.includes('mobile')) {
    IconComponent = Smartphone;
    colorClass = 'text-emerald-600 dark:text-emerald-400';
  } else if (n.includes('watch') || n.includes('fitness')) {
    IconComponent = Watch;
    colorClass = 'text-amber-600 dark:text-amber-400';
  } else if (n.includes('gaming') || n.includes('playstation') || n.includes('xbox') || n.includes('console')) {
    IconComponent = Gamepad2;
    colorClass = 'text-purple-600 dark:text-purple-400';
  } else if (n.includes('tv') || n.includes('theater')) {
    IconComponent = Tv;
    colorClass = 'text-rose-600 dark:text-rose-400';
  } else if (n.includes('camera') || n.includes('smart home')) {
    IconComponent = Camera;
    colorClass = 'text-cyan-600 dark:text-cyan-400';
  }

  return (
    <div className="w-12 h-12 rounded-full bg-muted/60 dark:bg-muted/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
      <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 stroke-[1.6] ${colorClass}`} />
    </div>
  );
}

export function TopCategorySlider({ initialSettings, initialCategories }: TopCategorySliderProps) {
  // Initialize with client-side localStorage if available, or server initialCategories, preventing flash of old/default data
  const [categories, setCategories] = useState<CategoryDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('smarttech_categories_catalog');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    if (initialCategories && initialCategories.length > 0) {
      return initialCategories;
    }
    return CATEGORIES;
  });

  // Initialize with client-side localStorage settings if available, or server initialSettings, preventing jump from left to middle
  const [settings, setSettings] = useState<SiteSettings | undefined>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('smarttech_admin_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return { ...initialSettings, ...parsed };
          }
        }
      } catch {}
    }
    return initialSettings;
  });

  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Sync if server props update
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories((prev) => {
        // Keep local if user made newer edits on this browser
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('smarttech_categories_catalog');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch {}
          }
        }
        return initialCategories;
      });
    }
  }, [initialCategories]);

  useEffect(() => {
    if (initialSettings) {
      setSettings((prev) => {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('smarttech_admin_settings');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') {
                return { ...initialSettings, ...parsed };
              }
            } catch {}
          }
        }
        return initialSettings;
      });
    }
  }, [initialSettings]);

  useEffect(() => {
    // 1. Sync from localStorage immediately on mount
    try {
      const storedCategories = localStorage.getItem('smarttech_categories_catalog');
      if (storedCategories) {
        const parsed = JSON.parse(storedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
        }
      }
    } catch {}

    try {
      const storedSettings = localStorage.getItem('smarttech_admin_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed && typeof parsed === 'object') {
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}

    // 2. Background verification sync with API
    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      })
      .catch(() => {});

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});

    const handleCategoryUpdate = () => {
      const fresh = getCategories();
      if (fresh && fresh.length > 0) setCategories(fresh);
    };

    const handleSettingsUpdate = () => {
      try {
        const stored = localStorage.getItem('smarttech_admin_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            setSettings((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {}
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data === 'object') {
            setSettings((prev) => ({ ...prev, ...data }));
          }
        })
        .catch(() => {});
    };

    window.addEventListener('smarttech_categories_updated', handleCategoryUpdate);
    window.addEventListener('smarttech_settings_updated', handleSettingsUpdate);
    window.addEventListener('smarttech_branding_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('smarttech_categories_updated', handleCategoryUpdate);
      window.removeEventListener('smarttech_settings_updated', handleSettingsUpdate);
      window.removeEventListener('smarttech_branding_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
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
  }, [sliderItems, settings]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(() => {
      requestAnimationFrame(checkScroll);
    }, 300);
  };

  // Setting 1: If category slider is hidden, don't render anything
  if (settings?.categorySliderHidden === true) {
    return null;
  }

  if (sliderItems.length === 0) return null;

  const layout = settings?.categorySliderLayout || 'slider'; // 'slider' | 'wrap'
  const alignment = settings?.categorySliderAlignment || 'left'; // 'left' | 'center' | 'right'

  const alignmentClass =
    alignment === 'center'
      ? 'justify-center'
      : alignment === 'right'
      ? 'justify-end'
      : 'justify-start';

  // Setting 2 & 3: Multi-line wrap mode
  if (layout === 'wrap') {
    return (
      <section className="relative my-3" aria-label="Product Categories">
        <div className={`flex flex-wrap items-center gap-3 sm:gap-3.5 py-2 px-1 ${alignmentClass}`}>
          {sliderItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className="group relative flex flex-col items-center justify-between p-2.5 sm:p-3 bg-card hover:bg-muted/30 border border-border/80 hover:border-foreground/30 transition-all rounded-sm shrink-0 w-28 sm:w-32 min-w-[115px] sm:min-w-[130px] h-[134px] sm:h-[142px] shadow-sm hover:shadow-md cursor-pointer select-none"
              title={item.name}
            >
              {/* Square Image Container on TOP (1:1 ratio, transparent) */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 aspect-square shrink-0 flex items-center justify-center bg-transparent mt-1">
                {item.imageUrl ? (
                  <img
                    src={optimizeImageUrl(item.imageUrl, 200)}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  renderCategoryFallbackIcon(item.name)
                )}
              </div>

              {/* Category Name underneath (Fixed 2-line height) */}
              <div className="h-9 sm:h-10 w-full flex items-center justify-center px-0.5">
                <span className="text-[11.5px] sm:text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors text-center line-clamp-2 leading-tight break-words">
                  {item.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // Setting 2: Slider / Carousel mode (allow slider)
  return (
    <section className="relative group/slider my-2" aria-label="Category Slider">
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

      {/* Horizontal Slider Track with Instant Alignment without breakpoint delay */}
      <div
        ref={sliderRef}
        onScroll={checkScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className={`flex items-center gap-3.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden scroll-smooth py-2 px-1 ${
          alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'
        }`}
      >
        {sliderItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={true}
            className="group relative flex flex-col items-center justify-between p-2.5 sm:p-3 bg-card hover:bg-muted/30 border border-border/80 hover:border-foreground/30 transition-all rounded-sm shrink-0 w-28 sm:w-32 min-w-[115px] sm:min-w-[130px] h-[134px] sm:h-[142px] shadow-sm hover:shadow-md cursor-pointer select-none"
            title={item.name}
          >
            {/* Square Image Container on TOP (Larger 1:1 ratio, transparent) */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 aspect-square shrink-0 flex items-center justify-center bg-transparent mt-1">
              {item.imageUrl ? (
                <img
                  src={optimizeImageUrl(item.imageUrl, 200)}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                renderCategoryFallbackIcon(item.name)
              )}
            </div>

            {/* Category Name underneath (Fixed 2-line height so all boxes maintain identical height) */}
            <div className="h-9 sm:h-10 w-full flex items-center justify-center px-0.5">
              <span className="text-[11.5px] sm:text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors text-center line-clamp-2 leading-tight break-words">
                {item.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
