import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getServerBlogs,
  getServerBlogBySlug,
  saveServerBlog,
  deleteServerBlog,
} from '@/lib/blogServer';
import { BlogPost } from '@/data/blogs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    if (slug) {
      const blog = getServerBlogBySlug(slug);
      if (!blog) {
        return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: blog });
    }

    if (id) {
      const blogs = getServerBlogs();
      const blog = blogs.find((b) => b.id === id);
      if (!blog) {
        return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: blog });
    }

    const blogs = getServerBlogs();
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

    const saved = saveServerBlog(body);
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/blog', 'page');
    } catch {}
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

    const blogs = getServerBlogs();
    const existing = blogs.find((b) => b.id === id || b.slug === id);
    if (existing?.imageUrl) {
      try {
        const { deleteUploadedFiles } = await import('@/lib/cleanup');
        await deleteUploadedFiles([existing.imageUrl]);
      } catch (cleanupErr) {
        console.warn('Blog image cleanup warning:', cleanupErr);
      }
    }

    deleteServerBlog(id);
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/blog', 'page');
    } catch {}
    return NextResponse.json({ success: true, message: 'Blog and associated assets deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete blog' }, { status: 500 });
  }
}
