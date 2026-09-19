import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getServerBlogs,
  getServerBlogBySlug,
  saveServerBlog,
  deleteServerBlog,
} from '@/lib/blogServer';
import { BlogPost, BLOG_POSTS as DEFAULT_BLOGS } from '@/data/blogs';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadBlogsFromCloud(): Promise<BlogPost[]> {
  try {
    const cloudBlogs = await getSiteKV<BlogPost[]>('site_blogs');
    if (cloudBlogs && Array.isArray(cloudBlogs) && cloudBlogs.length > 0) {
      return cloudBlogs;
    }
  } catch (e) {
    console.warn('Failed to load blogs from site_kv:', e);
  }
  return getServerBlogs();
}

function purgeBlogCaches(slug?: string) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/blog', 'layout');
    revalidatePath('/blog', 'page');
    if (slug) {
      revalidatePath(`/blog/${slug}`, 'page');
    }
  } catch (e) {
    console.warn('Blog cache purge warning:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    const blogs = await loadBlogsFromCloud();

    if (slug) {
      const cleanSlug = slug.toLowerCase().trim();
      const blog = blogs.find((b) => b.slug.toLowerCase().trim() === cleanSlug || b.id === slug);
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

    return NextResponse.json({ success: true, count: blogs.length, data: blogs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: BlogPost = await req.json();
    if (!body || !body.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const blogs = await loadBlogsFromCloud();
    const index = blogs.findIndex((b) => b.id === body.id || b.slug === body.slug);
    let updated: BlogPost[];
    if (index >= 0) {
      updated = [...blogs];
      updated[index] = body;
    } else {
      updated = [body, ...blogs];
    }

    await setSiteKV('site_blogs', updated);
    saveServerBlog(body);
    purgeBlogCaches(body.slug);

    return NextResponse.json({ success: true, message: 'Blog saved successfully', data: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save blog' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const blogs = await loadBlogsFromCloud();
    const existing = blogs.find((b) => b.id === id || b.slug === id);
    if (existing?.imageUrl) {
      try {
        const { deleteUploadedFiles } = await import('@/lib/cleanup');
        await deleteUploadedFiles([existing.imageUrl]);
      } catch (cleanupErr) {
        console.warn('Blog image cleanup warning:', cleanupErr);
      }
    }

    const filtered = blogs.filter((b) => b.id !== id && b.slug !== id);
    await setSiteKV('site_blogs', filtered);
    deleteServerBlog(id);
    purgeBlogCaches(existing?.slug);

    return NextResponse.json({ success: true, message: 'Blog and associated assets deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete blog' }, { status: 500 });
  }
}
