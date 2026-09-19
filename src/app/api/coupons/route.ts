import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_COUPONS, CouponItem } from '@/data/coupons';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const COUPONS_KEY = 'coupons_catalog';

async function loadCouponsFromCloud(): Promise<CouponItem[]> {
  try {
    const cloud = await getSiteKV<CouponItem[]>(COUPONS_KEY);
    if (cloud !== null && Array.isArray(cloud)) {
      return cloud;
    }
    // Seed initial coupons only if key was never created
    await setSiteKV(COUPONS_KEY, DEFAULT_COUPONS);
    return [...DEFAULT_COUPONS];
  } catch (e) {
    console.warn('Failed to load coupons from site_kv:', e);
    return [...DEFAULT_COUPONS];
  }
}

function purgeCouponCaches() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/coupons', 'layout');
    revalidatePath('/coupons', 'page');
    revalidatePath('/supro111vat29/coupons', 'page');
  } catch (e) {
    console.warn('revalidatePath coupon warning:', e);
  }
}

export async function GET() {
  const coupons = await loadCouponsFromCloud();
  return NextResponse.json(
    {
      success: true,
      count: coupons.length,
      data: coupons,
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
    if (!body.title || !body.store) {
      return NextResponse.json(
        { success: false, error: 'Title and Store are required' },
        { status: 400 }
      );
    }

    const coupons = await loadCouponsFromCloud();
    const newCoupon: CouponItem = {
      id: body.id || `cp-dyn-${Date.now()}`,
      store: body.store,
      storeSlug: body.storeSlug || body.store.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: body.title,
      description: body.description || '',
      code: body.code ? body.code.trim() : undefined,
      discountValue: body.discountValue || 'Special Deal',
      discountType: body.discountType || 'percentage',
      affiliateUrl: body.affiliateUrl || '',
      category: body.category || 'All',
      expiresAt: body.expiresAt || undefined,
      isVerified: body.isVerified ?? true,
      isFeatured: body.isFeatured ?? false,
      terms: body.terms || undefined,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = coupons.findIndex((c) => c.id === newCoupon.id);
    let updated: CouponItem[];
    if (existingIndex >= 0) {
      updated = [...coupons];
      updated[existingIndex] = { ...updated[existingIndex], ...newCoupon };
    } else {
      updated = [newCoupon, ...coupons];
    }

    await setSiteKV(COUPONS_KEY, updated);
    purgeCouponCaches();

    return NextResponse.json({ success: true, data: newCoupon, coupons: updated });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to save coupon' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const coupons = body.coupons;
    if (!Array.isArray(coupons)) {
      return NextResponse.json(
        { success: false, error: 'coupons must be an array' },
        { status: 400 }
      );
    }

    await setSiteKV(COUPONS_KEY, coupons);
    purgeCouponCaches();

    return NextResponse.json({ success: true, count: coupons.length, data: coupons });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to update coupons' },
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
        { success: false, error: 'Coupon id is required' },
        { status: 400 }
      );
    }

    const coupons = await loadCouponsFromCloud();
    const updated = coupons.filter((c) => c.id !== id);

    await setSiteKV(COUPONS_KEY, updated);
    purgeCouponCaches();

    return NextResponse.json({ success: true, message: `Coupon ${id} deleted`, data: updated });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
