import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_BRANDS, BrandItem } from '@/data/brands';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BRANDS_KEY = 'brands_catalog';

async function loadBrandsFromCloud(): Promise<BrandItem[]> {
  try {
    const cloud = await getSiteKV<BrandItem[]>(BRANDS_KEY);
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      return cloud;
    }
  } catch (e) {
    console.warn('Failed to load brands from site_kv:', e);
  }
  return [...DEFAULT_BRANDS];
}

function purgeBrandCaches() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/brand/[slug]', 'page');
    revalidatePath('/products', 'layout');
    revalidatePath('/products', 'page');
  } catch (e) {
    console.warn('revalidatePath brand warning:', e);
  }
}

export async function GET() {
  const brands = await loadBrandsFromCloud();
  return NextResponse.json({
    success: true,
    count: brands.length,
    data: brands,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Brand name is required' },
        { status: 400 }
      );
    }

    const brands = await loadBrandsFromCloud();
    const newBrand: BrandItem = {
      id: body.id || `brand-${Date.now()}`,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logoUrl: body.logoUrl || '',
      website: body.website || '',
      isFeatured: body.isFeatured ?? true,
      showOnHomepage: body.showOnHomepage ?? true,
      isActive: body.isActive ?? true,
      order: body.order ?? brands.length + 1,
    };

    const existingIndex = brands.findIndex(
      (b) => b.id === newBrand.id || b.slug === newBrand.slug
    );

    let updated: BrandItem[];
    if (existingIndex >= 0) {
      updated = [...brands];
      updated[existingIndex] = { ...updated[existingIndex], ...newBrand };
    } else {
      updated = [...brands, newBrand];
    }

    await setSiteKV(BRANDS_KEY, updated);
    purgeBrandCaches();

    return NextResponse.json({ success: true, data: newBrand, brands: updated });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to save brand' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const brands = body.brands;
    if (!Array.isArray(brands)) {
      return NextResponse.json(
        { success: false, error: 'brands must be an array' },
        { status: 400 }
      );
    }

    await setSiteKV(BRANDS_KEY, brands);
    purgeBrandCaches();

    return NextResponse.json({ success: true, count: brands.length, data: brands });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to update brands' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Brand id is required' },
        { status: 400 }
      );
    }

    const brands = await loadBrandsFromCloud();
    const updated = brands.filter((b) => b.id !== id && b.slug !== id);

    await setSiteKV(BRANDS_KEY, updated);
    purgeBrandCaches();

    return NextResponse.json({ success: true, message: `Brand ${id} removed`, data: updated });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to delete brand' },
      { status: 500 }
    );
  }
}
