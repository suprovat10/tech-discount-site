'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { UnifiedProduct, RetailerId } from '@/types/product';
import { CategoryDefinition } from '@/data/catalog';
import {
  getCategories,
  findCategoryBySlugOrName,
  findSubcategoryBySlugOrName,
  getCategorySlug,
  getSubcategorySlug,
  doesProductMatchCategory,
  doesProductMatchSubcategory,
} from '@/lib/categoryStore';
import { getBrands, BrandItem } from '@/lib/brandStore';
import { getCatalogProducts } from '@/lib/catalogStore';
import { transformCatalogItemToUnified } from '@/lib/productTransform';
import { DealCard } from '@/components/deals/DealCard';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  RotateCcw,
  Star,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRetailerDisplayName, getRetailerHexColor } from '@/lib/utils';
import { AdSlot } from '@/components/ads/AdSlot';

interface SearchResultsClientProps {
  initialCategorySlug?: string;
  initialSubcategorySlug?: string;
  initialProducts?: UnifiedProduct[];
  initialCategories?: CategoryDefinition[];
}

// Isolated SearchParams listener inside Suspense — ensures SearchResultsClient is SSR pre-rendered without client bailout
function SearchParamsWatcher({ onChange }: { onChange: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onChange();
  }, [searchParams, onChange]);
  return null;
}

export function SearchResultsClient({
  initialCategorySlug = '',
  initialSubcategorySlug = '',
  initialProducts = [],
  initialCategories,
}: SearchResultsClientProps) {
  const router = useRouter();

  // Dynamic Categories list from categoryStore / MongoDB
  const [categories, setCategories] = useState<CategoryDefinition[]>(initialCategories || []);
  const [adminBrands, setAdminBrands] = useState<BrandItem[]>([]);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [products, setProducts] = useState<UnifiedProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Dynamic maximum price computed from current products and catalog (Highest Sale Price)
  const dynamicMaxPrice = useMemo(() => {
    let highest = 0;

    if (products && products.length > 0) {
      for (const p of products) {
        // Only consider the live selling / sale price, not regular/discount price
        const salePrice = p.lowestPrice || 0;
        if (salePrice > highest) highest = salePrice;
      }
    }

    if (highest <= 0) return 1000;
    // Round up to nearest 10 or 50
    return Math.ceil(highest / 10) * 10;
  }, [products]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(() => dynamicMaxPrice);
  const [hasCustomMaxPrice, setHasCustomMaxPrice] = useState<boolean>(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update maxPrice whenever dynamicMaxPrice is computed, unless user explicitly customized it
  useEffect(() => {
    if (!hasCustomMaxPrice) {
      setMaxPrice(dynamicMaxPrice);
    }
  }, [dynamicMaxPrice, hasCustomMaxPrice]);

  // Pagination State (14 items per page on mobile, 15 on desktop)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const productsPerPage = isMobile ? 14 : 15;
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  // Compute active filters count for badges
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedSubcategory !== 'all') count++;
    count += selectedPlatforms.length;
    count += selectedBrands.length;
    if (minPrice > 0 || (hasCustomMaxPrice && maxPrice < dynamicMaxPrice)) count++;
    if (minRating > 0) count++;
    if (inStockOnly) count++;
    return count;
  }, [
    selectedCategory,
    selectedSubcategory,
    selectedPlatforms,
    selectedBrands,
    minPrice,
    maxPrice,
    hasCustomMaxPrice,
    dynamicMaxPrice,
    minRating,
    inStockOnly,
  ]);

  // Helper to sync all active filters to the browser URL dynamically without full-page reloads
  const syncToUrl = useCallback(
    (overrides?: {
      search?: string;
      category?: string;
      sub?: string;
      stores?: string[];
      brands?: string[];
      minPrice?: number;
      maxPrice?: number;
      rating?: number;
      inStock?: boolean;
      sort?: string;
      page?: number;
    }) => {
      const q = overrides?.search !== undefined ? overrides.search : searchQuery;
      const cat = overrides?.category !== undefined ? overrides.category : selectedCategory;
      const sub = overrides?.sub !== undefined ? overrides.sub : selectedSubcategory;
      const stores = overrides?.stores !== undefined ? overrides.stores : selectedPlatforms;
      const brands = overrides?.brands !== undefined ? overrides.brands : selectedBrands;
      const minP = overrides?.minPrice !== undefined ? overrides.minPrice : minPrice;
      const maxP = overrides?.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
      const rat = overrides?.rating !== undefined ? overrides.rating : minRating;
      const stock = overrides?.inStock !== undefined ? overrides.inStock : inStockOnly;
      const s = overrides?.sort !== undefined ? overrides.sort : sortBy;
      const p = overrides?.page !== undefined ? overrides.page : currentPage;

      // Construct clean, SEO-friendly path: /products/[category-slug]/[subcategory-slug]
      let basePath = '/products';
      if (cat && cat !== 'all') {
        const catSlug = getCategorySlug(categories, cat);
        basePath += `/${catSlug}`;

        if (sub && sub !== 'all') {
          const matchedCat = findCategoryBySlugOrName(categories, cat);
          const subSlug = getSubcategorySlug(matchedCat, sub);
          basePath += `/${subSlug}`;
        }
      }

      const params = new URLSearchParams();

      if (q && q.trim()) {
        params.set('search', q.trim());
      }
      if (stores && stores.length > 0) {
        params.set('stores', stores.map((s) => s.toLowerCase().trim()).join(','));
      }
      if (brands && brands.length > 0) {
        params.set('brands', brands.map((b) => b.toLowerCase().trim()).join(','));
      }
      if (minP > 0) {
        params.set('minPrice', String(minP));
      }
      if (maxP < dynamicMaxPrice) {
        params.set('maxPrice', String(maxP));
      }
      if (rat > 0) {
        params.set('rating', String(rat));
      }
      if (stock) {
        params.set('inStock', 'true');
      }
      if (s && s !== 'latest') {
        params.set('sort', s.replace(/_/g, '-'));
      }
      if (p > 1) {
        params.set('page', String(p));
      }

      const queryString = params.toString().replace(/%2C/gi, ',');
      const nextPath = queryString ? `${basePath}?${queryString}` : basePath;
      window.history.replaceState(window.history.state, '', nextPath);
    },
    [
      searchQuery,
      selectedCategory,
      selectedSubcategory,
      selectedPlatforms,
      selectedBrands,
      minPrice,
      maxPrice,
      dynamicMaxPrice,
      minRating,
      inStockOnly,
      sortBy,
      currentPage,
      categories,
    ]
  );

  // Parse URL query parameters and restore all filters & state
  const parseUrlParams = useCallback(
    (cats: CategoryDefinition[]) => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search') || params.get('q') || '';

      // Determine category and subcategory from path first, then query fallback
      let pathCatSlug = '';
      let pathSubSlug = '';

      const pathname = window.location.pathname;
      const segments = pathname
        .replace(/^\/products\/?/, '')
        .replace(/^\/search\/?/, '')
        .split('/')
        .filter(Boolean);

      if (segments.length > 0) {
        pathCatSlug = segments[0];
        if (segments.length > 1) {
          pathSubSlug = segments[1];
        }
      } else {
        pathCatSlug = '';
        pathSubSlug = '';
      }

      const catParam = pathCatSlug || params.get('category') || '';
      const subParam = pathSubSlug || params.get('sub') || params.get('subcategory') || '';

      const rawStores = params.get('stores') || params.get('store') || params.get('platform') || '';
      const rawBrands = params.get('brands') || params.get('brand') || '';
      const minP = params.get('minPrice');
      const maxP = params.get('maxPrice');
      const rat = params.get('rating') || params.get('minRating');
      const stock = params.get('inStock');
      const s = params.get('sort') || params.get('sortBy');
      const pg = params.get('page');

      setSearchQuery(q);

      if (catParam && catParam !== 'all') {
        const matchCat = findCategoryBySlugOrName(cats, catParam);
        if (matchCat) {
          setSelectedCategory(matchCat.name);
          setExpandedCategories((prev) => ({ ...prev, [matchCat.name]: true }));

          if (subParam && subParam !== 'all') {
            const matchSub = findSubcategoryBySlugOrName(matchCat, subParam);
            setSelectedSubcategory(matchSub ? matchSub.name : 'all');
          } else {
            setSelectedSubcategory('all');
          }
        } else {
          setSelectedCategory('all');
          setSelectedSubcategory('all');
        }
      } else {
        setSelectedCategory('all');
        setSelectedSubcategory('all');
      }

      if (rawStores) {
        const storesList = rawStores
          .split(/[,\+]/)
          .map((st) => decodeURIComponent(st).trim().toLowerCase())
          .filter(Boolean);
        setSelectedPlatforms(storesList);
      } else {
        setSelectedPlatforms([]);
      }

      if (rawBrands) {
        const brandsList = rawBrands
          .split(/[,\+]/)
          .map((b) => decodeURIComponent(b).trim().toLowerCase())
          .filter(Boolean);
        setSelectedBrands(brandsList);
      } else {
        setSelectedBrands([]);
      }

      if (minP !== null && minP !== '') {
        setMinPrice(Number(minP) || 0);
      } else {
        setMinPrice(0);
      }

      if (maxP !== null && maxP !== '') {
        const parsed = Number(maxP);
        if (!isNaN(parsed) && parsed > 0) {
          setMaxPrice(parsed);
          setHasCustomMaxPrice(true);
        } else {
          setHasCustomMaxPrice(false);
        }
      } else {
        setHasCustomMaxPrice(false);
      }

      if (rat !== null && rat !== '') {
        setMinRating(Number(rat) || 0);
      } else {
        setMinRating(0);
      }

      if (stock !== null) {
        setInStockOnly(stock === 'true');
      } else {
        setInStockOnly(false);
      }

      if (s) {
        const norm = s.replace(/_/g, '-');
        if (norm === 'lowest-price') setSortBy('lowest-price');
        else if (norm === 'highest-savings') setSortBy('highest-savings');
        else if (norm === 'top-rated' || norm === 'rating') setSortBy('top-rated');
        else if (norm === 'highest-price') setSortBy('highest-price');
        else setSortBy('latest');
      } else {
        setSortBy('latest');
      }

      if (pg) {
        const pNum = Number(pg);
        if (pNum > 0) setCurrentPage(pNum);
      }
    },
    [initialCategorySlug, initialSubcategorySlug]
  );

  // Initialize and synchronize when searchParams change or on load
  const handleParamsUpdate = useCallback(() => {
    const loadedCats = getCategories();
    setCategories(loadedCats);
    parseUrlParams(loadedCats);
  }, [parseUrlParams]);

  useEffect(() => {
    handleParamsUpdate();
  }, [handleParamsUpdate]);

  // Handle browser Back / Forward history buttons
  useEffect(() => {
    const handlePopState = () => {
      const cats = categories.length > 0 ? categories : getCategories();
      parseUrlParams(cats);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [categories, parseUrlParams]);

  // Synchronize categories, brands, and catalog updates reactively
  useEffect(() => {
    const loadCategories = () => {
      setCategories(getCategories());
    };
    const loadBrands = () => {
      setAdminBrands(getBrands());
    };
    const handleCatalogUpdate = () => {
      setCatalogVersion((v) => v + 1);
    };

    loadBrands();
    const handleClearEvent = () => {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedSubcategory('all');
      setCurrentPage(1);
      if (initialProducts.length > 0 && catalogVersion === 0) {
        setProducts(initialProducts);
      }
    };
    window.addEventListener('smarttech_categories_updated', loadCategories);
    window.addEventListener('smarttech_brands_updated', loadBrands);
    window.addEventListener('smarttech_catalog_updated', handleCatalogUpdate);
    window.addEventListener('tech_clear_search', handleClearEvent);

    return () => {
      window.removeEventListener('smarttech_categories_updated', loadCategories);
      window.removeEventListener('smarttech_brands_updated', loadBrands);
      window.removeEventListener('smarttech_catalog_updated', handleCatalogUpdate);
      window.removeEventListener('tech_clear_search', handleClearEvent);
    };
  }, [initialProducts, catalogVersion]);

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    syncToUrl({ sort: newSort, page: 1 });
  };

  // Dynamically discover all platforms/stores present across all products (standard 4 + any custom added platforms)
  const availablePlatforms = useMemo(() => {
    const storeMap = new Map<string, { id: string; name: string; color: string }>();

    // Standard baseline stores
    const defaultStores = [
      { id: 'amazon', name: 'Amazon', color: '#FF9900' },
      { id: 'walmart', name: 'Walmart', color: '#0071DC' },
      { id: 'bestbuy', name: 'Best Buy', color: '#FFE000' },
      { id: 'target', name: 'Target', color: '#CC0000' },
    ];
    defaultStores.forEach((s) => storeMap.set(s.id.toLowerCase(), s));

    // Dynamically discover any custom stores added across products
    products.forEach((p) => {
      (p.offers || []).forEach((o) => {
        if (o.retailer) {
          const rawId = o.retailer.trim();
          const key = rawId.toLowerCase();
          const rawName = (o.retailerName || '').trim();
          const displayName = (rawName && rawName.toLowerCase() !== 'custom')
            ? rawName
            : getRetailerDisplayName(rawId);

          if (rawId && !storeMap.has(key)) {
            storeMap.set(key, {
              id: rawId,
              name: displayName,
              color: getRetailerHexColor(rawId),
            });
          } else if (rawId && storeMap.has(key)) {
            const existing = storeMap.get(key)!;
            if (displayName && (existing.name.toLowerCase() === 'custom' || existing.name.toLowerCase() === key)) {
              existing.name = displayName;
            }
          }
        }
      });
    });

    return Array.from(storeMap.values());
  }, [products]);

  // Fetch products for active search query and merge with local catalog items
  useEffect(() => {
    let isMounted = true;

    async function fetchResults() {
      if (!searchQuery.trim()) {
        const local = getCatalogProducts();
        if (local && local.length > 0) {
          setProducts(local.map(transformCatalogItemToUnified));
          setIsLoading(false);
          return;
        }
        if (initialProducts.length > 0 && catalogVersion === 0) {
          setProducts(initialProducts);
          setIsLoading(false);
          return;
        }
      }
      setIsLoading(products.length === 0);
      setError(null);

      try {
        const queryUrl = `/api/search?q=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(queryUrl);
        let apiProducts: UnifiedProduct[] = [];

        if (res.ok) {
          const json = await res.json();
          apiProducts = json.data || [];
        }

        let finalProducts = apiProducts;

        // If searchQuery exists, filter local items as well
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          finalProducts = finalProducts.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.brand.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              p.subcategory?.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
          );
        }

        if (isMounted) {
          setProducts(finalProducts);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred while fetching prices.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [searchQuery, catalogVersion]);

  // Helper to check if a product matches a category
  const matchesCategory = useCallback(
    (prod: UnifiedProduct, catName: string) => {
      return doesProductMatchCategory(prod.category, catName, categories);
    },
    [categories]
  );

  // Helper to check if a product matches a subcategory
  const matchesSubcategory = useCallback(
    (prod: UnifiedProduct, subName: string, catName?: string) => {
      return doesProductMatchSubcategory(prod.subcategory, subName, catName || selectedCategory, categories);
    },
    [categories, selectedCategory]
  );

  // Available brands and their dynamic counts (merges admin brands and catalog products)
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, { brand: string; count: number }>();

    // 1. Initialize with active brands configured in Admin Brands
    adminBrands.forEach((b) => {
      if (b.isActive !== false && b.name && b.name.trim()) {
        const key = b.name.trim().toLowerCase();
        brandMap.set(key, { brand: b.name.trim(), count: 0 });
      }
    });

    // 2. Count products for each brand (and dynamically add any product brands not in admin list)
    products.forEach((p) => {
      if (
        p.brand &&
        p.brand.trim() &&
        p.brand.toLowerCase() !== 'no brand' &&
        p.brand.toLowerCase() !== 'none'
      ) {
        const rawBrand = p.brand.trim();
        const key = rawBrand.toLowerCase();
        const existing = brandMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          brandMap.set(key, { brand: rawBrand, count: 1 });
        }
      }
    });

    return Array.from(brandMap.values()).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.brand.localeCompare(b.brand);
    });
  }, [adminBrands, products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        // Category Filter
        if (selectedCategory !== 'all') {
          if (!matchesCategory(prod, selectedCategory)) {
            return false;
          }
        }
        // Subcategory Filter
        if (selectedSubcategory !== 'all') {
          if (!matchesSubcategory(prod, selectedSubcategory, selectedCategory)) {
            return false;
          }
        }
        // Platform / Store Filter (Must have offer from at least one selected platform)
        if (selectedPlatforms.length > 0) {
          const normalizedSelected = selectedPlatforms.map((p) => p.toLowerCase());
          const hasSelectedPlatform = prod.offers.some((o) => {
            const rId = (o.retailer || '').toLowerCase();
            const rName = (o.retailerName || '').trim().toLowerCase();
            return normalizedSelected.includes(rId) || (rName && normalizedSelected.includes(rName));
          });
          if (!hasSelectedPlatform) return false;
        }
        // Price Filter
        if (prod.lowestPrice < minPrice || (hasCustomMaxPrice && prod.lowestPrice > maxPrice)) {
          return false;
        }
        // Brand Filter (case-insensitive)
        if (selectedBrands.length > 0) {
          const normSelected = selectedBrands.map((b) => b.trim().toLowerCase());
          const prodBrand = (prod.brand || '').trim().toLowerCase();
          if (!normSelected.includes(prodBrand)) {
            return false;
          }
        }
        // Rating Filter
        if (minRating > 0 && (prod.rating || 0) < minRating) {
          return false;
        }
        // In Stock Filter
        if (inStockOnly && !prod.offers.some((o) => o.isInStock)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const s = sortBy.replace(/_/g, '-');
        if (s === 'latest') {
          // Preserve exact manual product arrangement from Admin Dashboard
          return 0;
        }
        if (s === 'lowest-price') {
          const priceA = a.lowestPrice > 0 ? a.lowestPrice : Infinity;
          const priceB = b.lowestPrice > 0 ? b.lowestPrice : Infinity;
          if (priceA !== priceB) return priceA - priceB;
          return (b.rating || 0) - (a.rating || 0);
        }
        if (s === 'highest-price') {
          const priceA = a.lowestPrice > 0 ? a.lowestPrice : 0;
          const priceB = b.lowestPrice > 0 ? b.lowestPrice : 0;
          if (priceB !== priceA) return priceB - priceA;
          return (b.rating || 0) - (a.rating || 0);
        }
        if (s === 'highest-savings') {
          const savA = a.maxSavingsPercentage || 0;
          const savB = b.maxSavingsPercentage || 0;
          if (savB !== savA) return savB - savA;
          const diffA = (a.regularPrice || a.lowestPrice) - a.lowestPrice;
          const diffB = (b.regularPrice || b.lowestPrice) - b.lowestPrice;
          if (diffB !== diffA) return diffB - diffA;
          return (b.rating || 0) - (a.rating || 0);
        }
        if (s === 'top-rated' || s === 'rating') {
          const ratA = a.rating || 0;
          const ratB = b.rating || 0;
          if (ratB !== ratA) return ratB - ratA;
          return (b.ratingCount || 0) - (a.ratingCount || 0);
        }
        return 0;
      });
  }, [
    products,
    selectedCategory,
    selectedSubcategory,
    selectedPlatforms,
    minPrice,
    maxPrice,
    hasCustomMaxPrice,
    selectedBrands,
    minRating,
    inStockOnly,
    sortBy,
    matchesCategory,
    matchesSubcategory,
  ]);

  // Paginated product slice
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    syncToUrl({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const togglePlatform = (p: string) => {
    const target = p.toLowerCase().trim();
    let updated: string[];
    if (selectedPlatforms.some((x) => x.toLowerCase().trim() === target)) {
      updated = selectedPlatforms.filter((x) => x.toLowerCase().trim() !== target);
    } else {
      updated = [...selectedPlatforms, target];
    }
    setSelectedPlatforms(updated);
    setCurrentPage(1);
    syncToUrl({ stores: updated, page: 1 });
  };

  const toggleBrand = (b: string) => {
    const target = b.trim().toLowerCase();
    const isAlreadySelected = selectedBrands.some(
      (x) => x.trim().toLowerCase() === target
    );
    let updated: string[];
    if (isAlreadySelected) {
      updated = selectedBrands.filter((x) => x.trim().toLowerCase() !== target);
    } else {
      updated = [...selectedBrands, target];
    }
    setSelectedBrands(updated);
    setCurrentPage(1);
    syncToUrl({ brands: updated, page: 1 });
  };

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const handleSelectAllCategories = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setCurrentPage(1);
    syncToUrl({ category: 'all', sub: 'all', page: 1 });
    if (window.location.pathname !== '/products') {
      window.history.pushState(null, '', '/products');
    }
  };

  const handleSelectCategory = (catName: string) => {
    if (selectedCategory.toLowerCase() === catName.toLowerCase()) {
      handleSelectAllCategories();
    } else {
      setSelectedCategory(catName);
      setSelectedSubcategory('all');
      setExpandedCategories((prev) => ({ ...prev, [catName]: true }));
      setCurrentPage(1);
      syncToUrl({ category: catName, sub: 'all', page: 1 });
      const targetSlug = getCategorySlug(categories, catName);
      if (window.location.pathname !== `/products/${targetSlug}`) {
        window.history.pushState(null, '', `/products/${targetSlug}`);
      }
    }
  };

  const handleSelectSubcategory = (catName: string, subName: string) => {
    setSelectedCategory(catName);
    let nextSub = 'all';
    if (selectedSubcategory.toLowerCase() === subName.toLowerCase()) {
      setSelectedSubcategory('all');
      nextSub = 'all';
    } else {
      setSelectedSubcategory(subName);
      nextSub = subName;
    }
    setCurrentPage(1);
    syncToUrl({ category: catName, sub: nextSub, page: 1 });

    const catSlug = getCategorySlug(categories, catName);
    const matchedCat = findCategoryBySlugOrName(categories, catName);
    const subSlug = nextSub !== 'all' ? getSubcategorySlug(matchedCat, nextSub) : '';
    const targetPath = subSlug ? `/products/${catSlug}/${subSlug}` : `/products/${catSlug}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const handleMinPriceChange = (val: number) => {
    setMinPrice(val);
    setCurrentPage(1);
    syncToUrl({ minPrice: val, page: 1 });
  };

  const handleMaxPriceChange = (val: number) => {
    const clamped = Math.max(0, val);
    setMaxPrice(clamped);
    if (clamped < dynamicMaxPrice) {
      setHasCustomMaxPrice(true);
      setCurrentPage(1);
      syncToUrl({ maxPrice: clamped, page: 1 });
    } else {
      setHasCustomMaxPrice(false);
      setCurrentPage(1);
      syncToUrl({ maxPrice: dynamicMaxPrice, page: 1 });
    }
  };

  const handleRatingChange = (starVal: number) => {
    const nextVal = minRating === starVal ? 0 : starVal;
    setMinRating(nextVal);
    setCurrentPage(1);
    syncToUrl({ rating: nextVal, page: 1 });
  };

  const handleInStockChange = (checked: boolean) => {
    setInStockOnly(checked);
    setCurrentPage(1);
    syncToUrl({ inStock: checked, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setCurrentPage(1);
    if (initialProducts.length > 0 && catalogVersion === 0) {
      setProducts(initialProducts);
    }
    syncToUrl({ search: '', category: 'all', sub: 'all', page: 1 });
    window.dispatchEvent(new CustomEvent('tech_clear_search'));
    if (window.location.pathname !== '/products' || window.location.search) {
      window.history.replaceState(null, '', '/products');
      router.push('/products');
    }
  };

  const handleReset = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedPlatforms([]);
    setSelectedBrands([]);
    setMinPrice(0);
    setMaxPrice(dynamicMaxPrice);
    setHasCustomMaxPrice(false);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('latest');
    setSearchQuery('');
    setCurrentPage(1);
    if (initialProducts.length > 0 && catalogVersion === 0) {
      setProducts(initialProducts);
    }
    window.dispatchEvent(new CustomEvent('tech_clear_search'));
    syncToUrl({
      search: '',
      category: 'all',
      sub: 'all',
      stores: [],
      brands: [],
      minPrice: 0,
      maxPrice: dynamicMaxPrice,
      rating: 0,
      inStock: false,
      sort: 'latest',
      page: 1,
    });
    if (window.location.pathname !== '/products' || window.location.search) {
      window.history.replaceState(null, '', '/products');
      router.push('/products');
    }
  };

  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : selectedSubcategory !== 'all'
    ? selectedSubcategory
    : selectedCategory !== 'all'
    ? selectedCategory
    : 'All Products';

  // Active Category or Subcategory Rich Description (for SEO content block below pagination)
  const activeRichDescription = useMemo(() => {
    const isNotEmpty = (html?: string | null): html is string => {
      if (!html) return false;
      const clean = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      return clean.length > 0 || html.includes('<img');
    };

    // Subcategory page: ONLY show subcategory's own rich description. Never inherit category's description!
    if (selectedSubcategory && selectedSubcategory !== 'all') {
      for (const cat of categories) {
        const sub = cat.subcategories?.find(
          (s) =>
            s.name.toLowerCase() === selectedSubcategory.toLowerCase() ||
            s.slug.toLowerCase() === selectedSubcategory.toLowerCase()
        );
        if (sub && isNotEmpty(sub.richDescription)) {
          return sub.richDescription;
        }
      }
      return null;
    }

    // Category page (when no subcategory selected): ONLY show category's own rich description
    if (selectedCategory && selectedCategory !== 'all') {
      const cat = categories.find(
        (c) =>
          c.name.toLowerCase() === selectedCategory.toLowerCase() ||
          c.slug.toLowerCase() === selectedCategory.toLowerCase() ||
          c.id.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (cat && isNotEmpty(cat.richDescription)) {
        return cat.richDescription;
      }
      return null;
    }

    return null;
  }, [categories, selectedCategory, selectedSubcategory]);

  const renderFilterControls = () => (
    <>
      {/* 1. Category & Subcategory Hierarchy */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground/80">
          Categories
        </h3>

        <div className="space-y-1 text-xs">
          {/* All Categories option */}
          <Link
            href="/products"
            onClick={(e) => {
              e.preventDefault();
              handleSelectAllCategories();
            }}
            className={`w-full text-left py-2 px-2.5 rounded-none flex items-center justify-between transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
            }`}
          >
            <span className="tracking-tight">All Categories</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold tabular-nums transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white/20 dark:bg-black/15 text-white dark:text-slate-900'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {products.length}
            </span>
          </Link>

          {/* Dynamic Category tree with subcategories */}
          {categories.map((cat) => {
            const isCatSelected = doesProductMatchCategory(selectedCategory, cat.name, categories);
            const isExpanded = expandedCategories[cat.name] || isCatSelected;
            const catCount = products.filter((p) => matchesCategory(p, cat.name)).length;
            const catSlug = (cat.slug || getCategorySlug(categories, cat.name)).toLowerCase();

            return (
              <div key={cat.id} className="space-y-0.5">
                <div
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-none transition-all ${
                    isCatSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-blue-100/80 dark:border-blue-900/40'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 font-medium'
                  }`}
                >
                  <Link
                    href={`/products/${catSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectCategory(cat.name);
                    }}
                    className="flex-1 text-left truncate pr-1 cursor-pointer tracking-tight"
                  >
                    {cat.name}
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] tabular-nums font-semibold ${
                        isCatSelected
                          ? 'text-blue-600/80 dark:text-blue-400/80'
                          : 'text-muted-foreground/70'
                      }`}
                    >
                      ({catCount})
                    </span>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryExpand(cat.name);
                        }}
                        className={`p-1 rounded-none transition-colors cursor-pointer ${
                          isCatSelected
                            ? 'text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-900/50'
                            : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                        }`}
                        title="Toggle subcategories"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategories nested under category */}
                {isExpanded && cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="pl-3 py-1 space-y-1 border-l-2 border-blue-500/20 ml-2.5">
                    {cat.subcategories.map((sub) => {
                      const isSubSelected =
                        isCatSelected &&
                        doesProductMatchSubcategory(selectedSubcategory, sub.name, cat.name, categories);
                      const subCount = products.filter(
                        (p) => matchesCategory(p, cat.name) && matchesSubcategory(p, sub.name, cat.name)
                      ).length;
                      const subSlug = (sub.slug || getSubcategorySlug(cat, sub.name)).toLowerCase();

                      return (
                        <Link
                          key={sub.id}
                          href={`/products/${catSlug}/${subSlug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSelectSubcategory(cat.name, sub.name);
                          }}
                          className={`w-full text-left py-1 px-2 text-[11px] rounded-none flex items-center justify-between transition-all cursor-pointer ${
                            isSubSelected
                              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/40'
                              : 'text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-100/70 dark:hover:bg-slate-800/40 font-medium'
                          }`}
                        >
                          <span className="truncate pr-1">{sub.name}</span>
                          <span className="text-[10px] opacity-70 tabular-nums">({subCount})</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Platform / Store Filter */}
      <div className="space-y-2.5 pt-3 border-t border-border/60">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
          Platform / Store
        </h3>

        <div className="space-y-1.5 text-xs font-medium">
          {availablePlatforms.map((store) => {
            const isChecked = selectedPlatforms.some(
              (p) => p.toLowerCase() === store.id.toLowerCase()
            );
            const storeCount = products.filter((p) =>
              (p.offers || []).some((o) => {
                const rId = (o.retailer || '').toLowerCase();
                const rName = (o.retailerName || '').trim().toLowerCase();
                const sId = store.id.toLowerCase();
                const sName = store.name.trim().toLowerCase();
                return rId === sId || (rName && rName === sName);
              })
            ).length;

            // Only show stores that have offers, or are the default top 4 stores
            if (
              storeCount === 0 &&
              !['amazon', 'walmart', 'bestbuy', 'target'].includes(store.id.toLowerCase())
            ) {
              return null;
            }

            return (
              <label
                key={store.id}
                className="flex items-center justify-between py-0.5 cursor-pointer text-muted-foreground hover:text-foreground select-none transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePlatform(store.id)}
                    className="w-3.5 h-3.5 border-border text-slate-900 focus:ring-0 cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: store.color }}
                    />
                    <span className={isChecked ? 'font-bold text-foreground' : ''}>
                      {store.name}
                    </span>
                  </span>
                </div>
                <span className="text-[10px] opacity-70 tabular-nums">({storeCount})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Price Filter (Slider & Inputs) */}
      <div className="space-y-2.5 pt-3 border-t border-border/60">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
            Price Range
          </h3>
          <span className="text-xs font-bold text-foreground">
            ${minPrice} - ${maxPrice}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={dynamicMaxPrice}
          step={dynamicMaxPrice > 5000 ? 50 : 25}
          value={Math.min(maxPrice, dynamicMaxPrice)}
          onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 border border-border px-2 py-1 flex-1 bg-background">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => handleMinPriceChange(Number(e.target.value))}
              className="w-full bg-transparent focus:outline-none text-xs font-semibold"
              placeholder="0"
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex items-center gap-1 border border-border px-2 py-1 flex-1 bg-background">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
              className="w-full bg-transparent focus:outline-none text-xs font-semibold"
              placeholder={String(dynamicMaxPrice)}
            />
          </div>
        </div>
      </div>

      {/* 4. Brand Filter */}
      {availableBrands.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t border-border/60">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
            Brands
          </h3>

          <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs font-medium pr-1">
            {availableBrands.map(({ brand, count }) => {
              const isChecked = selectedBrands.some(
                (b) => b.toLowerCase().trim() === brand.toLowerCase().trim()
              );
              return (
                <label
                  key={brand}
                  className="flex items-center justify-between py-0.5 cursor-pointer text-muted-foreground hover:text-foreground select-none"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleBrand(brand)}
                      className="w-3.5 h-3.5 border-border text-slate-900 focus:ring-0 cursor-pointer"
                    />
                    <span className={isChecked ? 'font-bold text-foreground' : ''}>
                      {brand}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-60">({count})</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Rating & Availability Filter */}
      <div className="space-y-2.5 pt-3 border-t border-border/60">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
          Rating & Stock
        </h3>

        <div className="space-y-2 text-xs font-medium">
          {/* Rating Checkboxes */}
          <div className="space-y-1.5">
            {[4, 3, 2].map((starVal) => {
              const isChecked = minRating === starVal;
              return (
                <label
                  key={starVal}
                  className="flex items-center justify-between py-1 px-1 cursor-pointer text-muted-foreground hover:text-foreground select-none transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleRatingChange(starVal)}
                      className="w-3.5 h-3.5 border-border text-blue-600 focus:ring-0 cursor-pointer accent-blue-600"
                    />
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < starVal ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                      <span
                        className={`text-[11px] ml-1 ${
                          isChecked ? 'font-bold text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {starVal}★ & above
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* In Stock toggle */}
          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => handleInStockChange(e.target.checked)}
              className="w-3.5 h-3.5 border-border text-slate-900 focus:ring-0 cursor-pointer"
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* SearchParams listener inside Suspense so SearchResultsClient pre-renders static HTML */}
      <Suspense fallback={null}>
        <SearchParamsWatcher onChange={handleParamsUpdate} />
      </Suspense>

      {/* Breadcrumbs */}
      <nav
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pb-2.5 border-b border-border/60 overflow-x-auto whitespace-nowrap scrollbar-none [&::-webkit-scrollbar]:hidden py-1"
      >
        <Link href="/" className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
        <button
          onClick={handleReset}
          className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap cursor-pointer"
        >
          Products
        </button>
        {selectedCategory !== 'all' && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <button
              onClick={() => {
                setSelectedSubcategory('all');
                syncToUrl({ sub: 'all', page: 1 });
              }}
              className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap cursor-pointer font-semibold"
            >
              {selectedCategory}
            </button>
          </>
        )}
        {selectedSubcategory !== 'all' && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <span className="text-foreground font-bold shrink-0 whitespace-nowrap">{selectedSubcategory}</span>
          </>
        )}
        {searchQuery && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0 whitespace-nowrap">
              &quot;{searchQuery}&quot;
            </span>
          </>
        )}
      </nav>

      {/* Ad Placement: Below Breadcrumbs Banner */}
      <AdSlot placement="products_below_breadcrumb" />

      {/* Mobile Slide-in Filter Drawer Backdrop & Drawer (Portaled to document.body with z-[100] to always start from screen top-0) */}
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
                  Show {filteredProducts.length} Results
                </Button>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* Main Two-Column Layout: Left Sidebar (Desktop Only) + Right Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: Categories, Subcategories & Filter Systems (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="border border-border/80 bg-card p-4 space-y-6 shadow-sm">
            {/* Sidebar Header & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 whitespace-nowrap">
                <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Filters & Categories
              </span>
              <button
                onClick={handleReset}
                title="Reset all filters"
                aria-label="Reset all filters"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {renderFilterControls()}
          </div>

          {/* Ad Placement: Left Sidebar Bottom Square Ad */}
          <AdSlot placement="products_sidebar_bottom" />
        </aside>

        {/* RIGHT MAIN PRODUCT AREA */}
        <main className="lg:col-span-9 space-y-5">
          {/* Top Bar: Title & Desktop Sort Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-foreground tracking-tight">
                  {pageTitle}
                </h1>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                    title="Clear search keyword"
                  >
                    <span>Clear Search</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing{' '}
                {filteredProducts.length === 0
                  ? 0
                  : `${(currentPage - 1) * productsPerPage + 1} - ${Math.min(
                      currentPage * productsPerPage,
                      filteredProducts.length
                    )} of ${filteredProducts.length}`}{' '}
                verified products with live 4-store price comparisons
              </p>
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="h-8 px-2.5 border border-border bg-background text-xs font-semibold text-foreground focus:outline-none cursor-pointer rounded-none"
              >
                <option value="latest">Latest Products</option>
                <option value="lowest-price">Lowest Price</option>
                <option value="highest-savings">Highest Savings</option>
                <option value="top-rated">Top Rated</option>
                <option value="highest-price">Highest Price</option>
              </select>
            </div>
          </div>

          {/* Mobile Toolbar: Filter & Category Button + Sort By Box (Side by Side) */}
          <div className="grid grid-cols-2 gap-2.5 lg:hidden">
            {/* Box 1: Filters & Categories Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="h-10 px-3 border border-border bg-card hover:bg-muted/50 text-xs font-bold text-foreground flex items-center justify-between gap-1.5 transition-colors cursor-pointer shadow-xs rounded-none"
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

            {/* Box 2: Sort By Box */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full h-10 pl-3 pr-7 border border-border bg-card text-xs font-bold text-foreground focus:outline-none cursor-pointer appearance-none rounded-none shadow-xs"
              >
                <option value="latest">Sort: Latest</option>
                <option value="lowest-price">Sort: Lowest Price</option>
                <option value="highest-savings">Sort: Highest Savings</option>
                <option value="top-rated">Sort: Top Rated</option>
                <option value="highest-price">Sort: Highest Price</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>


          {/* Product Grid (with 5:4 aspect ratio cards) */}
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-muted-foreground">Scanning retailer price feeds...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3 border border-dashed border-border p-8 bg-card">
              <p className="text-sm font-bold text-foreground">No matching products found</p>
              <p className="text-xs text-muted-foreground">
                Try resetting your filters or selecting a different category.
              </p>
              <Button onClick={handleReset} variant="outline" size="sm" className="text-xs font-bold">
                Reset All Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-5">
                {paginatedProducts.map((product, idx) => (
                  <DealCard key={product.id} product={product} priority={idx < 4} />
                ))}
              </div>

              {/* Pagination Bar (15 products per page) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-[30px] border-t border-border/60">
                  <div className="text-xs text-muted-foreground font-medium whitespace-nowrap text-center sm:text-left">
                    Page <span className="font-bold text-foreground">{currentPage}</span> of{' '}
                    <span className="font-bold text-foreground">{totalPages}</span>{' '}
                    <span className="text-muted-foreground/80">({filteredProducts.length} total products)</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-nowrap shrink-0 overflow-x-auto max-w-full py-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-none flex items-center gap-1 shrink-0 whitespace-nowrap"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (
                          totalPages > 7 &&
                          pageNum !== 1 &&
                          pageNum !== totalPages &&
                          Math.abs(pageNum - currentPage) > 1
                        ) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return (
                              <span key={pageNum} className="px-1 text-xs text-muted-foreground">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 text-xs font-bold border transition-colors ${
                              isActive
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                                : 'border-border bg-card text-foreground hover:bg-muted'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-none flex items-center gap-1 shrink-0 whitespace-nowrap"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Active Category or Subcategory Rich Description Content (SEO Area below Pagination/Products) */}
          {activeRichDescription && (
            <div
              style={{ marginTop: '70px' }}
              className="!mt-[70px] sm:!mt-[80px] p-6 sm:p-8 bg-card border border-border/80 shadow-2xs"
            >
              <div
                className="text-xs sm:text-sm text-foreground/90 font-normal leading-relaxed prose dark:prose-invert max-w-none [&_h1]:text-xl [&_h1]:font-black [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_img]:rounded-md [&_img]:max-w-full [&_img]:my-3"
                dangerouslySetInnerHTML={{ __html: activeRichDescription }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

