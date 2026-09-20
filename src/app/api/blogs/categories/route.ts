import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getServerBlogCategories,
  saveServerBlogCategory,
  deleteServerBlogCategory,
  saveServerBlogCategories,
  DB_BLOG_CATEGORIES_KEY,
  DELETED_BLOG_CAT_IDS_KEY,
} from '@/lib/blogServer';
import { BlogCategory, DEFAULT_BLOG_CATEGORIES } from '@/data/blogs';
import { setSiteKV } from '@/lib/db/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function purgeBlogCategoriesCache() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/blog', 'layout');
    revalidatePath('/blog', 'page');
  } catch (e) {
    console.warn('Blog categories cache purge warning:', e);
  }
}

export async function GET() {
  try {
    const categories = await getServerBlogCategories();
    return NextResponse.json(
      { success: true, count: categories.length, data: categories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to get blog categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: BlogCategory = await req.json();
    if (!body || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const updatedCategory: BlogCategory = {
      id: body.id || body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: body.name.trim(),
      slug: body.slug ? body.slug.toLowerCase().trim() : body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: body.description?.trim() || undefined,
    };

    const updated = await saveServerBlogCategory(updatedCategory);
    purgeBlogCategoriesCache();

    return NextResponse.json(
      { success: true, message: 'Category saved successfully', data: updatedCategory, count: updated.length },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to save blog category' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (Array.isArray(body.categories)) {
      await saveServerBlogCategories(body.categories);
      purgeBlogCategoriesCache();
      return NextResponse.json({
        success: true,
        count: body.categories.length,
        data: body.categories,
      });
    }

    if (body.reset) {
      await setSiteKV(DB_BLOG_CATEGORIES_KEY, DEFAULT_BLOG_CATEGORIES);
      await setSiteKV(DELETED_BLOG_CAT_IDS_KEY, []);
      purgeBlogCategoriesCache();
      return NextResponse.json({
        success: true,
        message: 'Blog categories reset to defaults',
        data: DEFAULT_BLOG_CATEGORIES,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid categories payload' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update blog categories' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const updated = await deleteServerBlogCategory(id);
    purgeBlogCategoriesCache();

    return NextResponse.json({
      success: true,
      message: 'Blog category deleted successfully',
      count: updated.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete blog category' },
      { status: 500 }
    );
  }
}
