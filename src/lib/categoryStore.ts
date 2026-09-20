import { CATEGORIES as DEFAULT_CATEGORIES, CategoryDefinition } from '@/data/catalog';

const CATEGORIES_STORAGE_KEY = 'smarttech_categories_catalog';
let isInitialCategoryFetchTriggered = false;

/**
 * Sync fresh categories from server/database into client localStorage
 */
export async function fetchAndSyncCategoriesFromServer(): Promise<CategoryDefinition[]> {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const res = await fetch('/api/categories', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(json.data));
        window.dispatchEvent(new Event('smarttech_categories_updated'));
        return json.data;
      }
    }
  } catch (e) {
    console.warn('Could not sync categories from server:', e);
  }
  return getCategories();
}

/**
 * Get all categories from localStorage if available, otherwise from DEFAULT_CATEGORIES.
 * Automatically triggers a background server sync on client load so all devices get the latest data.
 */
export function getCategories(): CategoryDefinition[] {
  if (typeof window === 'undefined') {
    return DEFAULT_CATEGORIES;
  }

  // Trigger background server sync once per page session
  if (!isInitialCategoryFetchTriggered) {
    isInitialCategoryFetchTriggered = true;
    fetchAndSyncCategoriesFromServer().catch(() => {});
  }

  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed: CategoryDefinition[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((cat) => {
          const defaultCat = DEFAULT_CATEGORIES.find((d) => d.id === cat.id);
          if (!defaultCat) return cat;
          return {
            ...defaultCat,
            ...cat,
            imageUrl: cat.imageUrl || defaultCat.imageUrl,
            description: cat.description || defaultCat.description,
            isFeaturedOnHome:
              cat.isFeaturedOnHome !== undefined ? cat.isFeaturedOnHome : defaultCat.isFeaturedOnHome,
            showInTopSlider:
              cat.showInTopSlider !== undefined ? cat.showInTopSlider : defaultCat.showInTopSlider,
            subcategories: (cat.subcategories || []).map((sub) => {
              const defaultSub = defaultCat.subcategories?.find((ds) => ds.id === sub.id);
              if (!defaultSub) return sub;
              return {
                ...defaultSub,
                ...sub,
                imageUrl: sub.imageUrl || defaultSub.imageUrl,
                showInTopSlider:
                  sub.showInTopSlider !== undefined ? sub.showInTopSlider : defaultSub.showInTopSlider,
              };
            }),
          };
        });
      }
    }
  } catch (e) {
    console.error('Error reading categories from localStorage:', e);
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Save categories to localStorage and sync with server
 */
export function saveCategories(categories: CategoryDefinition[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('smarttech_categories_updated'));
    syncCategoriesToServer(categories);
  } catch (e) {
    console.error('Error saving categories to localStorage:', e);
  }
}

/**
 * Add a new category
 */
export function addCategory(category: CategoryDefinition): CategoryDefinition[] {
  const current = getCategories();
  const exists = current.some((c) => c.id === category.id || c.slug === category.slug);
  const updated = exists
    ? current.map((c) => (c.id === category.id ? category : c))
    : [...current, category];
  saveCategories(updated);
  return updated;
}

/**
 * Update an existing category
 */
export function updateCategory(category: CategoryDefinition): CategoryDefinition[] {
  const current = getCategories();
  const updated = current.map((c) => (c.id === category.id ? { ...c, ...category } : c));
  saveCategories(updated);
  return updated;
}

/**
 * Delete a category by id
 */
export function deleteCategory(id: string): CategoryDefinition[] {
  const current = getCategories();
  const updated = current.filter((c) => c.id !== id);
  saveCategories(updated);
  return updated;
}

/**
 * Add a subcategory to a specific category
 */
export function addSubcategory(
  categoryId: string,
  subcategory: { id: string; name: string; slug: string; imageUrl?: string; showInTopSlider?: boolean }
): CategoryDefinition[] {
  const current = getCategories();
  const updated = current.map((cat) => {
    if (cat.id === categoryId) {
      const subExists = cat.subcategories.some((s) => s.id === subcategory.id || s.slug === subcategory.slug);
      return {
        ...cat,
        subcategories: subExists
          ? cat.subcategories.map((s) => (s.id === subcategory.id ? { ...s, ...subcategory } : s))
          : [...cat.subcategories, subcategory],
      };
    }
    return cat;
  });
  saveCategories(updated);
  return updated;
}

/**
 * Update an existing subcategory inside a category
 */
export function updateSubcategory(
  categoryId: string,
  subcategory: { id: string; name: string; slug: string; imageUrl?: string; showInTopSlider?: boolean }
): CategoryDefinition[] {
  const current = getCategories();
  const updated = current.map((cat) => {
    if (cat.id === categoryId) {
      return {
        ...cat,
        subcategories: cat.subcategories.map((s) => (s.id === subcategory.id ? { ...s, ...subcategory } : s)),
      };
    }
    return cat;
  });
  saveCategories(updated);
  return updated;
}

/**
 * Delete a subcategory from a category
 */
export function deleteSubcategory(categoryId: string, subcategoryId: string): CategoryDefinition[] {
  const current = getCategories();
  const updated = current.map((cat) => {
    if (cat.id === categoryId) {
      return {
        ...cat,
        subcategories: cat.subcategories.filter((s) => s.id !== subcategoryId),
      };
    }
    return cat;
  });
  saveCategories(updated);
  return updated;
}

/**
 * Toggle feature category on homepage (MAX 4 categories allowed)
 */
export function toggleFeaturedOnHome(categoryId: string): {
  success: boolean;
  categories: CategoryDefinition[];
  error?: string;
} {
  const current = getCategories();
  const target = current.find((c) => c.id === categoryId);
  if (!target) return { success: false, categories: current, error: 'Category not found' };

  const isCurrentlyFeatured = !!target.isFeaturedOnHome;
  if (!isCurrentlyFeatured) {
    const featuredCount = current.filter((c) => c.isFeaturedOnHome).length;
    if (featuredCount >= 4) {
      return {
        success: false,
        categories: current,
        error: 'Maximum 4 categories can be featured on the homepage. Please unfeature another category first.',
      };
    }
  }

  const updated = current.map((c) =>
    c.id === categoryId ? { ...c, isFeaturedOnHome: !isCurrentlyFeatured } : c
  );
  saveCategories(updated);
  return { success: true, categories: updated };
}

/**
 * Toggle inclusion in the top slider for category or subcategory
 */
export function toggleTopSlider(categoryId: string, subcategoryId?: string): CategoryDefinition[] {
  const current = getCategories();
  const updated = current.map((cat) => {
    if (cat.id === categoryId) {
      if (subcategoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map((s) =>
            s.id === subcategoryId ? { ...s, showInTopSlider: !s.showInTopSlider } : s
          ),
        };
      }
      return {
        ...cat,
        showInTopSlider: !cat.showInTopSlider,
      };
    }
    return cat;
  });
  saveCategories(updated);
  return updated;
}

/**
 * Sync updated categories with the server API
 */
async function syncCategoriesToServer(categories: CategoryDefinition[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
  } catch (err) {
    console.warn('Background category server sync failed:', err);
  }
}

/**
 * Find category by slug or name (case-insensitive)
 */
export function findCategoryBySlugOrName(categories: CategoryDefinition[], identifier: string): CategoryDefinition | undefined {
  if (!identifier) return undefined;
  const target = identifier.toLowerCase().trim();
  return categories.find(
    (c) =>
      c.slug.toLowerCase() === target ||
      c.name.toLowerCase() === target ||
      c.id.toLowerCase() === target
  );
}

/**
 * Find subcategory by slug or name inside a category
 */
export function findSubcategoryBySlugOrName(category: CategoryDefinition, identifier: string): import('@/data/catalog').SubcategoryDefinition | undefined {
  if (!identifier || !category?.subcategories) return undefined;
  const target = identifier.toLowerCase().trim();
  return category.subcategories.find(
    (s) =>
      s.slug.toLowerCase() === target ||
      s.name.toLowerCase() === target ||
      s.id.toLowerCase() === target
  );
}

/**
 * Get clean SEO slug for a category name
 */
export function getCategorySlug(categories: CategoryDefinition[], categoryName: string): string {
  const match = findCategoryBySlugOrName(categories, categoryName);
  if (match && match.slug) return match.slug;
  return categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Get clean SEO slug for a subcategory name
 */
export function getSubcategorySlug(category: CategoryDefinition | undefined, subcategoryName: string): string {
  if (category) {
    const match = findSubcategoryBySlugOrName(category, subcategoryName);
    if (match && match.slug) return match.slug;
  }
  return subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

