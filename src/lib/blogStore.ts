import { BLOG_POSTS as DEFAULT_BLOGS, DEFAULT_BLOG_CATEGORIES, BlogPost, BlogCategory } from '@/data/blogs';

const BLOG_CATEGORIES_STORAGE_KEY = 'smarttech_blog_categories';
const BLOG_POSTS_STORAGE_KEY = 'smarttech_blog_posts';

let isInitialBlogsFetchTriggered = false;
let isInitialBlogCatsFetchTriggered = false;

/**
 * Fetch and sync blogs from server / MongoDB into client localStorage
 */
export async function fetchAndSyncBlogsFromServer(): Promise<BlogPost[]> {
  if (typeof window === 'undefined') return DEFAULT_BLOGS;
  try {
    const res = await fetch('/api/blogs', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(json.data));
        window.dispatchEvent(new Event('smarttech_blogs_updated'));
        return json.data;
      }
    }
  } catch (e) {
    console.warn('Could not sync blogs from server:', e);
  }
  return getBlogs();
}

/**
 * Fetch and sync blog categories from server / MongoDB into client localStorage
 */
export async function fetchAndSyncBlogCategoriesFromServer(): Promise<BlogCategory[]> {
  if (typeof window === 'undefined') return DEFAULT_BLOG_CATEGORIES;
  try {
    const res = await fetch('/api/blogs/categories', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        localStorage.setItem(BLOG_CATEGORIES_STORAGE_KEY, JSON.stringify(json.data));
        window.dispatchEvent(new Event('smarttech_blog_categories_updated'));
        return json.data;
      }
    }
  } catch (e) {
    console.warn('Could not sync blog categories from server:', e);
  }
  return getBlogCategories();
}

/**
 * Get Blog Categories from localStorage with default fallbacks
 * Automatically triggers server sync in background.
 */
export function getBlogCategories(): BlogCategory[] {
  if (typeof window === 'undefined') {
    return DEFAULT_BLOG_CATEGORIES;
  }

  // Trigger background server sync once per session
  if (!isInitialBlogCatsFetchTriggered) {
    isInitialBlogCatsFetchTriggered = true;
    fetchAndSyncBlogCategoriesFromServer().catch(() => {});
  }

  try {
    const raw = localStorage.getItem(BLOG_CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading blog categories from localStorage:', e);
  }
  return DEFAULT_BLOG_CATEGORIES;
}

/**
 * Save Blog Categories to localStorage and sync to server
 */
export function saveBlogCategories(categories: BlogCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BLOG_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('smarttech_blog_categories_updated'));
  } catch (e) {
    console.error('Error saving blog categories to localStorage:', e);
  }
}

async function syncBlogCategoryToServer(category: BlogCategory) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/blogs/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
  } catch (e) {
    console.warn('Async server sync for blog category failed:', e);
  }
}

async function syncBlogCategoryDeleteToServer(id: string) {
  if (typeof window === 'undefined') return;
  try {
    await fetch(`/api/blogs/categories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Async server delete for blog category failed:', e);
  }
}

/**
 * Add a new Blog Category and sync to server / MongoDB
 */
export function addBlogCategory(category: BlogCategory): BlogCategory[] {
  const current = getBlogCategories();
  const exists = current.some((c) => c.id === category.id || c.name.toLowerCase() === category.name.toLowerCase());
  const updated = exists
    ? current.map((c) => (c.id === category.id ? category : c))
    : [...current, category];
  saveBlogCategories(updated);
  syncBlogCategoryToServer(category);
  return updated;
}

/**
 * Update an existing Blog Category and sync to server / MongoDB
 */
export function updateBlogCategory(category: BlogCategory): BlogCategory[] {
  const current = getBlogCategories();
  const updated = current.map((c) => (c.id === category.id ? category : c));
  saveBlogCategories(updated);
  syncBlogCategoryToServer(category);
  return updated;
}

/**
 * Delete a Blog Category and sync to server / MongoDB
 */
export function deleteBlogCategory(id: string): BlogCategory[] {
  const current = getBlogCategories();
  const updated = current.filter((c) => c.id !== id && c.slug !== id);
  saveBlogCategories(updated);
  syncBlogCategoryDeleteToServer(id);
  return updated;
}

/**
 * Get All Blog Posts from localStorage with server sync
 */
export function getBlogs(): BlogPost[] {
  if (typeof window === 'undefined') {
    return DEFAULT_BLOGS;
  }

  // Trigger background server sync once per session
  if (!isInitialBlogsFetchTriggered) {
    isInitialBlogsFetchTriggered = true;
    fetchAndSyncBlogsFromServer().catch(() => {});
  }

  try {
    const raw = localStorage.getItem(BLOG_POSTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading blogs from localStorage:', e);
  }
  return DEFAULT_BLOGS;
}

/**
 * Get Single Blog Post by ID or Slug
 */
export function getBlogById(idOrSlug: string): BlogPost | undefined {
  const blogs = getBlogs();
  if (!idOrSlug) return undefined;
  const clean = decodeURIComponent(idOrSlug).toLowerCase().trim();
  const rawClean = idOrSlug.toLowerCase().trim();
  return blogs.find(
    (b) =>
      b.id === idOrSlug ||
      b.id === clean ||
      b.slug.toLowerCase().trim() === clean ||
      b.slug.toLowerCase().trim() === rawClean
  );
}

/**
 * Save All Blog Posts to localStorage
 */
export function saveBlogs(blogs: BlogPost[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(blogs));
    window.dispatchEvent(new Event('smarttech_blogs_updated'));
  } catch (e) {
    console.error('Error saving blogs to localStorage:', e);
  }
}

async function syncBlogToServer(blog: BlogPost) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blog),
    });
  } catch (e) {
    console.warn('Async server sync for blog skipped/failed:', e);
  }
}

async function syncBlogDeleteToServer(id: string) {
  if (typeof window === 'undefined') return;
  try {
    await fetch(`/api/blogs?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Async server delete for blog skipped/failed:', e);
  }
}

/**
 * Add Blog Post (Placed at the very top / first in list) and sync to server / MongoDB
 */
export function addBlog(blog: BlogPost): BlogPost[] {
  const current = getBlogs();
  const updated = [blog, ...current.filter((b) => b.id !== blog.id)];
  saveBlogs(updated);
  syncBlogToServer(blog);
  return updated;
}

/**
 * Update Blog Post (Moved to the very top / first in list) and sync to server / MongoDB
 */
export function updateBlog(blog: BlogPost): BlogPost[] {
  const current = getBlogs();
  const updated = [blog, ...current.filter((b) => b.id !== blog.id)];
  saveBlogs(updated);
  syncBlogToServer(blog);
  return updated;
}

/**
 * Duplicate Blog Post and sync to server / MongoDB
 */
export function duplicateBlog(id: string): BlogPost[] {
  const current = getBlogs();
  const original = current.find((b) => b.id === id);
  if (!original) return current;

  const now = Date.now();
  const copyPost: BlogPost = {
    ...original,
    id: `post-${now}`,
    slug: `${original.slug}-copy-${Math.floor(Math.random() * 1000)}`,
    title: `${original.title} (Copy)`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  const updated = [copyPost, ...current];
  saveBlogs(updated);
  syncBlogToServer(copyPost);
  return updated;
}

/**
 * Delete Blog Post and sync to server / MongoDB
 */
export function deleteBlog(id: string): BlogPost[] {
  const current = getBlogs();
  const updated = current.filter((b) => b.id !== id);
  saveBlogs(updated);
  syncBlogDeleteToServer(id);
  return updated;
}

/**
 * Find blog category by slug, id, or name (case-insensitive and hyphen-normalized)
 */
export function findBlogCategory(
  categoryIdentifier: string,
  categories: BlogCategory[] = []
): BlogCategory | undefined {
  if (!categoryIdentifier || categoryIdentifier === 'all') return undefined;
  const target = categoryIdentifier.trim().toLowerCase();
  const cleanTarget = target.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return categories.find((c) => {
    const name = (c.name || '').trim().toLowerCase();
    const slug = (c.slug || '').trim().toLowerCase();
    const id = (c.id || '').trim().toLowerCase();
    const cleanName = name.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return (
      target === name ||
      target === slug ||
      target === id ||
      (cleanTarget && (cleanTarget === slug || cleanTarget === cleanName))
    );
  });
}

/**
 * Get slug for a blog category name or identifier
 */
export function getBlogCategorySlug(
  categoryNameOrSlug: string,
  categories: BlogCategory[] = []
): string {
  if (!categoryNameOrSlug || categoryNameOrSlug === 'all') return '';
  const def = findBlogCategory(categoryNameOrSlug, categories);
  if (def && def.slug) return def.slug;
  return categoryNameOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Accurately check if a blog post belongs to a selected category.
 * Prevents mismatch between slug, name, or id (e.g. 'laptops-computers' matches 'Laptops & Computers').
 */
export function doesBlogPostMatchCategory(
  postCategory: string | undefined | null,
  categoryIdentifier: string,
  categories: BlogCategory[] = []
): boolean {
  if (!categoryIdentifier || categoryIdentifier === 'all') return true;
  if (!postCategory) return false;

  const prodCat = postCategory.trim().toLowerCase();
  const target = categoryIdentifier.trim().toLowerCase();

  // 1. Direct exact string match
  if (prodCat === target) return true;

  // 2. Slugified match
  const cleanProdCat = prodCat.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const cleanTarget = target.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (cleanProdCat && cleanTarget && cleanProdCat === cleanTarget) return true;

  // 3. Category definition resolution
  if (categories && categories.length > 0) {
    const targetDef = findBlogCategory(categoryIdentifier, categories);
    if (targetDef) {
      const defName = (targetDef.name || '').trim().toLowerCase();
      const defSlug = (targetDef.slug || '').trim().toLowerCase();
      const defId = (targetDef.id || '').trim().toLowerCase();
      const cleanDefName = defName.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (prodCat === defName || prodCat === defSlug || prodCat === defId) return true;
      if (cleanProdCat && (cleanProdCat === defSlug || cleanProdCat === cleanDefName)) return true;
    }

    const postCatDef = findBlogCategory(postCategory, categories);
    if (postCatDef && targetDef) {
      return postCatDef.id === targetDef.id || postCatDef.slug.toLowerCase() === targetDef.slug.toLowerCase();
    }
  }

  return false;
}
