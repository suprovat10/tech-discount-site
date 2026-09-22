import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { CATEGORIES, CategoryDefinition } from '@/data/catalog';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadCategoriesFromCloud(): Promise<CategoryDefinition[]> {
  try {
    const cloudCats = await getSiteKV<CategoryDefinition[]>('categories_catalog');
    if (cloudCats && Array.isArray(cloudCats) && cloudCats.length > 0) {
      return cloudCats;
    }
  } catch (e) {
    console.warn('Failed to load categories from site_kv:', e);
  }
  return [...CATEGORIES];
}

import { purgeAllCaches } from '@/lib/cachePurge';

function purgeCategoryCaches(categorySlug?: string) {
  purgeAllCaches({ categorySlug });
}

export async function GET() {
  const categories = await loadCategoriesFromCloud();
  return NextResponse.json(
    {
      success: true,
      count: categories.length,
      data: categories,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const categories = await loadCategoriesFromCloud();
    const newCategory: CategoryDefinition = {
      id: body.id || `cat-${Date.now()}`,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: body.icon || 'Laptop',
      subcategories: body.subcategories || [],
      showInTopSlider: body.showInTopSlider ?? true,
      imageUrl: body.imageUrl || '',
    };

    categories.push(newCategory);
    await setSiteKV('categories_catalog', categories);
    purgeCategoryCaches();

    return NextResponse.json(
      { success: true, category: newCategory },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (Array.isArray(body.categories)) {
      await setSiteKV('categories_catalog', body.categories);
      purgeCategoryCaches();
      return NextResponse.json({
        success: true,
        count: body.categories.length,
        data: body.categories,
      });
    }
    return NextResponse.json({ success: false, error: 'Invalid categories payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }
    const categories = await loadCategoriesFromCloud();
    const filtered = categories.filter((c) => c.id !== id && c.slug !== id);
    await setSiteKV('categories_catalog', filtered);
    purgeCategoryCaches();
    return NextResponse.json({ success: true, count: filtered.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

