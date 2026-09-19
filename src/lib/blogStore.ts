import { BLOG_POSTS as DEFAULT_BLOGS, DEFAULT_BLOG_CATEGORIES, BlogPost, BlogCategory } from '@/data/blogs';

const BLOG_CATEGORIES_STORAGE_KEY = 'smarttech_blog_categories';
const BLOG_POSTS_STORAGE_KEY = 'smarttech_blog_posts';

/**
 * Get Blog Categories from localStorage with default fallbacks
 */
export function getBlogCategories(): BlogCategory[] {
  if (typeof window === 'undefined') {
    return DEFAULT_BLOG_CATEGORIES;
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
 * Save Blog Categories
 */
export function saveBlogCategories(categories: BlogCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BLOG_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving blog categories to localStorage:', e);
  }
}

/**
 * Add a new Blog Category
 */
export function addBlogCategory(category: BlogCategory): BlogCategory[] {
  const current = getBlogCategories();
  const exists = current.some((c) => c.id === category.id || c.name.toLowerCase() === category.name.toLowerCase());
  const updated = exists
    ? current.map((c) => (c.id === category.id ? category : c))
    : [...current, category];
  saveBlogCategories(updated);
  return updated;
}

/**
 * Update an existing Blog Category
 */
export function updateBlogCategory(category: BlogCategory): BlogCategory[] {
  const current = getBlogCategories();
  const updated = current.map((c) => (c.id === category.id ? category : c));
  saveBlogCategories(updated);
  return updated;
}

/**
 * Delete a Blog Category
 */
export function deleteBlogCategory(id: string): BlogCategory[] {
  const current = getBlogCategories();
  const updated = current.filter((c) => c.id !== id);
  saveBlogCategories(updated);
  return updated;
}

/**
 * Get All Blog Posts
 */
export function getBlogs(): BlogPost[] {
  if (typeof window === 'undefined') {
    return DEFAULT_BLOGS;
  }
  try {
    const raw = localStorage.getItem(BLOG_POSTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const parsedIds = new Set(parsed.map((p: any) => p.id));
        const missing = DEFAULT_BLOGS.filter((b) => !parsedIds.has(b.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading blogs from localStorage:', e);
  }
  try {
    localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(DEFAULT_BLOGS));
  } catch (e) {
    console.error('Error saving blogs to localStorage:', e);
  }
  return DEFAULT_BLOGS;
}

/**
 * Get Single Blog Post by ID or Slug
 */
export function getBlogById(idOrSlug: string): BlogPost | undefined {
  const blogs = getBlogs();
  return blogs.find((b) => b.id === idOrSlug || b.slug === idOrSlug);
}

/**
 * Save All Blog Posts
 */
export function saveBlogs(blogs: BlogPost[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BLOG_POSTS_STORAGE_KEY, JSON.stringify(blogs));
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
 * Add Blog Post (Placed at the very top / first in list)
 */
export function addBlog(blog: BlogPost): BlogPost[] {
  const current = getBlogs();
  const updated = [blog, ...current.filter((b) => b.id !== blog.id)];
  saveBlogs(updated);
  syncBlogToServer(blog);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('smarttech_blogs_updated'));
  }
  return updated;
}

/**
 * Update Blog Post (Moved to the very top / first in list)
 */
export function updateBlog(blog: BlogPost): BlogPost[] {
  const current = getBlogs();
  const updated = [blog, ...current.filter((b) => b.id !== blog.id)];
  saveBlogs(updated);
  syncBlogToServer(blog);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('smarttech_blogs_updated'));
  }
  return updated;
}

/**
 * Duplicate Blog Post
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('smarttech_blogs_updated'));
  }
  return updated;
}

/**
 * Delete Blog Post
 */
export function deleteBlog(id: string): BlogPost[] {
  const current = getBlogs();
  const updated = current.filter((b) => b.id !== id);
  saveBlogs(updated);
  syncBlogDeleteToServer(id);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('smarttech_blogs_updated'));
  }
  return updated;
}
