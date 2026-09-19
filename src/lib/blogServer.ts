import fs from 'fs';
import path from 'path';
import { BlogPost, BlogCategory, BLOG_POSTS as DEFAULT_BLOGS, DEFAULT_BLOG_CATEGORIES } from '@/data/blogs';

const BLOGS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'blogs.json');
const BLOG_CATS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'blog_categories.json');

/**
 * Get all blogs on the server from blogs.json
 */
export function getServerBlogs(): BlogPost[] {
  try {
    if (fs.existsSync(BLOGS_FILE_PATH)) {
      const content = fs.readFileSync(BLOGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading blogs.json on server:', error);
  }
  return DEFAULT_BLOGS;
}

/**
 * Get single blog post by slug or id on the server
 */
export function getServerBlogBySlug(slug: string): BlogPost | undefined {
  const blogs = getServerBlogs();
  const cleanSlug = slug.toLowerCase().trim();
  return blogs.find((b) => b.slug.toLowerCase().trim() === cleanSlug || b.id === slug);
}

/**
 * Save or update a blog post on the server
 */
export function saveServerBlog(blog: BlogPost): BlogPost[] {
  try {
    const current = getServerBlogs();
    const index = current.findIndex((b) => b.id === blog.id || b.slug === blog.slug);
    let updated: BlogPost[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = blog;
    } else {
      updated = [blog, ...current];
    }

    const dir = path.dirname(BLOGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BLOGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (error) {
    console.error('Error saving blog to blogs.json on server:', error);
    return getServerBlogs();
  }
}

/**
 * Delete a blog post on the server
 */
export function deleteServerBlog(idOrSlug: string): BlogPost[] {
  try {
    const current = getServerBlogs();
    const updated = current.filter((b) => b.id !== idOrSlug && b.slug !== idOrSlug);
    fs.writeFileSync(BLOGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (error) {
    console.error('Error deleting blog on server:', error);
    return getServerBlogs();
  }
}

/**
 * Get all blog categories on the server
 */
export function getServerBlogCategories(): BlogCategory[] {
  try {
    if (fs.existsSync(BLOG_CATS_FILE_PATH)) {
      const content = fs.readFileSync(BLOG_CATS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading blog_categories.json on server:', error);
  }
  return DEFAULT_BLOG_CATEGORIES;
}

/**
 * Save blog categories on the server
 */
export function saveServerBlogCategories(cats: BlogCategory[]): void {
  try {
    const dir = path.dirname(BLOG_CATS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BLOG_CATS_FILE_PATH, JSON.stringify(cats, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving blog_categories.json on server:', error);
  }
}
