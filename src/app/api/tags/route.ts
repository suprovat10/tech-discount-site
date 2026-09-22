import { NextRequest, NextResponse } from 'next/server';
import {
  getServerProductTags,
  saveServerProductTag,
  deleteServerProductTag,
} from '@/lib/productTagServer';
import { ProductTag } from '@/types/tag';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    const tags = await getServerProductTags();

    if (slug) {
      const tag = tags.find((t) => t.slug === slug);
      return NextResponse.json(tag || null, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    return NextResponse.json(tags, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error: any) {
    console.error('Error fetching product tags:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch product tags' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const tag: ProductTag = {
      id: body.id || `tag-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: body.name.trim(),
      slug: (body.slug || body.name)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      description: body.description?.trim() || '',
      featured: Boolean(body.featured),
      createdAt: body.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const updatedTags = await saveServerProductTag(tag);
    return NextResponse.json({ success: true, tag, allTags: updatedTags });
  } catch (error: any) {
    console.error('Error saving product tag:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save product tag' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing tag ID or slug' }, { status: 400 });
    }

    const updatedTags = await deleteServerProductTag(id);
    return NextResponse.json({ success: true, allTags: updatedTags });
  } catch (error: any) {
    console.error('Error deleting product tag:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete product tag' },
      { status: 500 }
    );
  }
}
