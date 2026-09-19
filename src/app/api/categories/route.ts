import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { CATEGORIES, CategoryDefinition } from '@/data/catalog';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let dynamicCategories: CategoryDefinition[] = [...CATEGORIES];

export async function GET() {
  try {
    const cloudCategories = await getSiteKV<CategoryDefinition[]>('categories_catalog');
    if (cloudCategories && Array.isArray(cloudCategories) && cloudCategories.length > 0) {
      dynamicCategories = cloudCategories;
      return NextResponse.json({
        success: true,
        count: cloudCategories.length,
        data: cloudCategories,
      });
    }
  } catch {}

  return NextResponse.json({
    success: true,
    count: dynamicCategories.length,
    data: dynamicCategories,
  });
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

    const newCategory: CategoryDefinition = {
      id: body.id || `cat-${Date.now()}`,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: body.icon || 'Laptop',
      subcategories: body.subcategories || [],
    };

    dynamicCategories.push(newCategory);

    try {
      await setSiteKV('categories_catalog', dynamicCategories);
      revalidatePath('/', 'layout');
    } catch {}

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
      dynamicCategories = body.categories;
      try {
        await setSiteKV('categories_catalog', dynamicCategories);
        revalidatePath('/', 'layout');
      } catch {}

      return NextResponse.json({
        success: true,
        count: dynamicCategories.length,
        data: dynamicCategories,
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
    dynamicCategories = dynamicCategories.filter((c) => c.id !== id);
    try {
      await setSiteKV('categories_catalog', dynamicCategories);
      revalidatePath('/', 'layout');
    } catch {}

    return NextResponse.json({ success: true, count: dynamicCategories.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

