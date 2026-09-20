import { BlogPost, BlogCategory, BLOG_POSTS as DEFAULT_BLOGS, DEFAULT_BLOG_CATEGORIES } from '@/data/blogs';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

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
 * Get all blogs on the server from MongoDB/site_kv or blogs.json fallback
 */
export async function getServerBlogs(): Promise<BlogPost[]> {
  try {
    const cloud = await getSiteKV<BlogPost[]>('site_blogs');
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      return cloud;
    }
  } catch (e) {
    console.warn('Failed to read blogs from cloud store:', e);
  }

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'blogs.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Auto-seed to site_kv
          setSiteKV('site_blogs', parsed).catch(() => {});
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Error reading local blogs.json:', err);
    }
  }

  return DEFAULT_BLOGS;
}

/**
 * Get single blog post by slug or id on the server
 */
export async function getServerBlogBySlug(slug: string): Promise<BlogPost | undefined> {
  const blogs = await getServerBlogs();
  const clean = slug.toLowerCase().trim();
  return (
    blogs.find((b) => b.slug.toLowerCase().trim() === clean || b.id === slug) ||
    DEFAULT_BLOGS.find((b) => b.slug.toLowerCase().trim() === clean || b.id === slug)
  );
}

/**
 * Save or update a blog post on the server
 */
export async function saveServerBlog(blog: BlogPost): Promise<BlogPost[]> {
  const current = await getServerBlogs();
  const index = current.findIndex((b) => b.id === blog.id || b.slug === blog.slug);
  let updated: BlogPost[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = blog;
  } else {
    updated = [blog, ...current];
  }

  await setSiteKV('site_blogs', updated);

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
 * Delete a blog post on the server
 */
export async function deleteServerBlog(idOrSlug: string): Promise<BlogPost[]> {
  const current = await getServerBlogs();
  const updated = current.filter((b) => b.id !== idOrSlug && b.slug !== idOrSlug);
  await setSiteKV('site_blogs', updated);

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
 * Get all blog categories on the server
 */
export async function getServerBlogCategories(): Promise<BlogCategory[]> {
  try {
    const cloud = await getSiteKV<BlogCategory[]>('blog_categories');
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      return cloud;
    }
  } catch {}

  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'blog_categories.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }

  return DEFAULT_BLOG_CATEGORIES;
}

/**
 * Save blog categories on the server
 */
export async function saveServerBlogCategories(cats: BlogCategory[]): Promise<void> {
  await setSiteKV('blog_categories', cats);

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
