import { BlogPost, BlogCategory, BLOG_POSTS as DEFAULT_BLOGS, DEFAULT_BLOG_CATEGORIES } from '@/data/blogs';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const DB_BLOGS_KEY = 'site_blogs';
export const DB_BLOG_CATEGORIES_KEY = 'blog_categories';
export const DELETED_BLOG_IDS_KEY = 'deleted_blog_ids';
export const DELETED_BLOG_CAT_IDS_KEY = 'deleted_blog_cat_ids';

function getFs(): any {
  if (typeof window === 'undefined') {
    try {
      return eval('require')('fs');
    } catch {
      return null;
    }
  }
  return null;
}

function getPath(): any {
  if (typeof window === 'undefined') {
    try {
      return eval('require')('path');
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get all blogs on the server from MongoDB/site_kv
 * Single source of truth for blogs across the entire platform.
 */
export async function getServerBlogs(): Promise<BlogPost[]> {
  try {
    const [oldDeletedRaw, cloud] = await Promise.all([
      getSiteKV<string[]>(DELETED_BLOG_IDS_KEY),
      getSiteKV<BlogPost[]>(DB_BLOGS_KEY),
    ]);
    const oldDeleted = oldDeletedRaw || [];
    const delSet = new Set(oldDeleted);

    if (cloud !== null && Array.isArray(cloud)) {
      if (delSet.size > 0) {
        return cloud.filter((b) => !delSet.has(b.id) && !delSet.has(b.slug));
      }
      return cloud;
    }

    // Seed initial blogs to cloud database
    let initialBlogs = [...DEFAULT_BLOGS];
    if (delSet.size > 0) {
      initialBlogs = initialBlogs.filter((b) => !delSet.has(b.id) && !delSet.has(b.slug));
    }

    await setSiteKV(DB_BLOGS_KEY, initialBlogs);
    return initialBlogs;
  } catch (err) {
    console.warn('Error reading site_blogs from database:', err);
    return DEFAULT_BLOGS;
  }
}

/**
 * Get single blog post by slug or id on the server
 */
export async function getServerBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  const blogs = await getServerBlogs();
  if (!slug) return undefined;
  let clean = slug.toLowerCase().trim();
  try {
    clean = decodeURIComponent(slug).toLowerCase().trim();
  } catch {}
  const rawClean = slug.toLowerCase().trim();
  const cleanParam = clean.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return blogs.find((b) => {
    if (!b) return false;
    if (b.id === slug || b.id === clean) return true;
    if (!b.slug) return false;
    const s = b.slug.toLowerCase().trim();
    if (s === clean || s === rawClean) return true;
    const cleanS = s.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return cleanS.length > 0 && cleanS === cleanParam;
  });
}

/**
 * Save or update a blog post on the server / MongoDB
 */
export async function saveServerBlog(blog: BlogPost): Promise<BlogPost[]> {
  // If previously marked deleted, unmark it
  try {
    const oldDeleted = (await getSiteKV<string[]>(DELETED_BLOG_IDS_KEY)) || [];
    if (oldDeleted.includes(blog.id) || (blog.slug && oldDeleted.includes(blog.slug))) {
      const updatedDeleted = oldDeleted.filter((id) => id !== blog.id && id !== blog.slug);
      await setSiteKV(DELETED_BLOG_IDS_KEY, updatedDeleted);
    }
  } catch {}

  const current = await getServerBlogs();
  const index = current.findIndex((b) => b.id === blog.id || b.slug === blog.slug);
  let updated: BlogPost[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = blog;
  } else {
    updated = [blog, ...current];
  }

  await setSiteKV(DB_BLOGS_KEY, updated);

  // Sync to local json fallback if writable filesystem exists
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'blogs.json');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  }

  return updated;
}

/**
 * Delete a blog post permanently from the server / MongoDB
 */
export async function deleteServerBlog(idOrSlug: string): Promise<BlogPost[]> {
  const current = await getServerBlogs();
  const target = current.find((b) => b.id === idOrSlug || b.slug === idOrSlug);
  const updated = current.filter((b) => b.id !== idOrSlug && b.slug !== idOrSlug);
  await setSiteKV(DB_BLOGS_KEY, updated);

  // Permanently record deletion in deleted_blog_ids
  try {
    const oldDeleted = (await getSiteKV<string[]>(DELETED_BLOG_IDS_KEY)) || [];
    const toAdd = [idOrSlug];
    if (target) {
      if (target.id) toAdd.push(target.id);
      if (target.slug) toAdd.push(target.slug);
    }
    const newDeleted = Array.from(new Set([...oldDeleted, ...toAdd]));
    await setSiteKV(DELETED_BLOG_IDS_KEY, newDeleted);
  } catch (err) {
    console.warn('Error updating deleted_blog_ids:', err);
  }

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'blogs.json');
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  }

  return updated;
}

/**
 * Get all blog categories on the server from MongoDB/site_kv
 */
export async function getServerBlogCategories(): Promise<BlogCategory[]> {
  try {
    const [oldDeletedRaw, cloud] = await Promise.all([
      getSiteKV<string[]>(DELETED_BLOG_CAT_IDS_KEY),
      getSiteKV<BlogCategory[]>(DB_BLOG_CATEGORIES_KEY),
    ]);
    const oldDeleted = oldDeletedRaw || [];
    const delSet = new Set(oldDeleted);

    if (cloud !== null && Array.isArray(cloud)) {
      if (delSet.size > 0) {
        return cloud.filter((c) => !delSet.has(c.id) && !delSet.has(c.slug));
      }
      return cloud;
    }

    // Seed initial categories to cloud database
    let initialCategories = [...DEFAULT_BLOG_CATEGORIES];
    if (delSet.size > 0) {
      initialCategories = initialCategories.filter((c) => !delSet.has(c.id) && !delSet.has(c.slug));
    }

    await setSiteKV(DB_BLOG_CATEGORIES_KEY, initialCategories);
    return initialCategories;
  } catch (err) {
    console.warn('Error reading blog_categories from database:', err);
    return DEFAULT_BLOG_CATEGORIES;
  }
}

/**
 * Save or update a blog category on the server / MongoDB
 */
export async function saveServerBlogCategory(cat: BlogCategory): Promise<BlogCategory[]> {
  try {
    const oldDeleted = (await getSiteKV<string[]>(DELETED_BLOG_CAT_IDS_KEY)) || [];
    if (oldDeleted.includes(cat.id) || (cat.slug && oldDeleted.includes(cat.slug))) {
      const updatedDeleted = oldDeleted.filter((id) => id !== cat.id && id !== cat.slug);
      await setSiteKV(DELETED_BLOG_CAT_IDS_KEY, updatedDeleted);
    }
  } catch {}

  const current = await getServerBlogCategories();
  const index = current.findIndex((c) => c.id === cat.id || c.slug === cat.slug);
  let updated: BlogCategory[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = cat;
  } else {
    updated = [...current, cat];
  }

  await setSiteKV(DB_BLOG_CATEGORIES_KEY, updated);

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'blog_categories.json');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  }

  return updated;
}

/**
 * Save all blog categories on the server / MongoDB
 */
export async function saveServerBlogCategories(cats: BlogCategory[]): Promise<void> {
  await setSiteKV(DB_BLOG_CATEGORIES_KEY, cats);

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'blog_categories.json');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(cats, null, 2), 'utf-8');
    } catch {}
  }
}

/**
 * Delete a blog category permanently from the server / MongoDB
 */
export async function deleteServerBlogCategory(idOrSlug: string): Promise<BlogCategory[]> {
  const current = await getServerBlogCategories();
  const target = current.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  const updated = current.filter((c) => c.id !== idOrSlug && c.slug !== idOrSlug);
  await setSiteKV(DB_BLOG_CATEGORIES_KEY, updated);

  try {
    const oldDeleted = (await getSiteKV<string[]>(DELETED_BLOG_CAT_IDS_KEY)) || [];
    const toAdd = [idOrSlug];
    if (target) {
      if (target.id) toAdd.push(target.id);
      if (target.slug) toAdd.push(target.slug);
    }
    const newDeleted = Array.from(new Set([...oldDeleted, ...toAdd]));
    await setSiteKV(DELETED_BLOG_CAT_IDS_KEY, newDeleted);
  } catch (err) {
    console.warn('Error updating deleted_blog_cat_ids:', err);
  }

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'blog_categories.json');
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  }

  return updated;
}
