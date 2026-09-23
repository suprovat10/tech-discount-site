import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getServerBlogs,
  getServerBlogBySlug,
  saveServerBlog,
  deleteServerBlog,
  DB_BLOGS_KEY,
  DELETED_BLOG_IDS_KEY,
} from '@/lib/blogServer';
import { BlogPost, BLOG_POSTS as DEFAULT_BLOGS } from '@/data/blogs';
import { setSiteKV } from '@/lib/db/kv';

import { purgeAllCaches } from '@/lib/cachePurge';
import { isRequestAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function purgeBlogCaches(slug?: string) {
  purgeAllCaches({ blogSlug: slug });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    const blogs = await getServerBlogs();

    if (slug) {
      let cleanSlug = slug.toLowerCase().trim();
      try {
        cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
      } catch {}
      const cleanParam = cleanSlug.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const blog = blogs.find((b) => {
        if (!b) return false;
        if (b.id === slug || b.id === cleanSlug) return true;
        if (!b.slug) return false;
        const s = b.slug.toLowerCase().trim();
        if (s === cleanSlug || s === slug.toLowerCase().trim()) return true;
        const cleanS = s.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return cleanS.length > 0 && cleanS === cleanParam;
      });
      if (!blog) {
        return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: blog });
    }

    if (id) {
      const blog = blogs.find((b) => b.id === id);
      if (!blog) {
        return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: blog });
    }

    return NextResponse.json(
      { success: true, count: blogs.length, data: blogs },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const body: BlogPost = await req.json();
    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const updated = await saveServerBlog(body);
    purgeBlogCaches(body.slug);

    return NextResponse.json({ success: true, message: 'Blog saved successfully', data: body, count: updated.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save blog' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (Array.isArray(body.blogs)) {
      await setSiteKV(DB_BLOGS_KEY, body.blogs);
      purgeBlogCaches();
      return NextResponse.json({
        success: true,
        count: body.blogs.length,
        data: body.blogs,
      });
    }

    if (body.reset) {
      await setSiteKV(DB_BLOGS_KEY, DEFAULT_BLOGS);
      await setSiteKV(DELETED_BLOG_IDS_KEY, []);
      purgeBlogCaches();
      return NextResponse.json({
        success: true,
        message: 'Blogs reset to defaults',
        data: DEFAULT_BLOGS,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid blogs payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update blogs' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const blogs = await getServerBlogs();
    const existing = blogs.find((b) => b.id === id || b.slug === id);
    if (existing?.imageUrl) {
      try {
        const { deleteUploadedFiles } = await import('@/lib/cleanup');
        await deleteUploadedFiles([existing.imageUrl]);
      } catch (cleanupErr) {
        console.warn('Blog image cleanup warning:', cleanupErr);
      }
    }

    const updated = await deleteServerBlog(id);
    purgeBlogCaches(existing?.slug);

    return NextResponse.json({ success: true, message: 'Blog deleted successfully', count: updated.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete blog' }, { status: 500 });
  }
}
