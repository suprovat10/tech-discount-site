import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { CatalogItem } from '@/data/catalog';
import { adapterRegistry } from '@/lib/adapters';
import {
  getDatabaseProducts,
  saveDatabaseProduct,
  saveDatabaseProductsBatch,
  saveReorderedProductsCatalog,
  deleteDatabaseProduct,
} from '@/lib/catalogDb';

import { purgeAllCaches } from '@/lib/cachePurge';
import { isRequestAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function purgeServerCaches(slug?: string, category?: string) {
  const categorySlug = category ? category.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : undefined;
  purgeAllCaches({ productSlug: slug, categorySlug });
}

function sanitizeProductItem(body: any): CatalogItem {
  return {
    id: body.id || `prod-dyn-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    slug: body.slug || (body.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: body.title || 'Untitled Product',
    brand: body.brand || 'No Brand',
    category: body.category || 'Electronics',
    subcategory: body.subcategory || '',
    rating: typeof body.rating === 'number' ? body.rating : (parseFloat(body.rating) || 4.8),
    reviewCount: typeof body.reviewCount === 'number' ? body.reviewCount : (parseInt(body.reviewCount, 10) || 100),
    badge: body.badge || 'New',
    tags: Array.isArray(body.tags) ? body.tags : (typeof body.tags === 'string' ? [body.tags] : undefined),
    imageUrl: body.imageUrl || '',
    imageAlt: body.imageAlt || '',
    images: body.images && body.images.length > 0 ? body.images : (body.imageUrl ? [body.imageUrl] : []),
    imageAlts: Array.isArray(body.imageAlts) ? body.imageAlts : [],
    description: body.description || '',
    richDescription: body.richDescription || '',
    features: Array.isArray(body.features) ? body.features : [],
    specs: (typeof body.specs === 'object' && body.specs !== null) ? body.specs : {},
    keySpecs: (typeof body.keySpecs === 'object' && body.keySpecs !== null) ? body.keySpecs : {},
    faqs: Array.isArray(body.faqs) ? body.faqs : [],
    seo: body.seo || {},
    offers: Array.isArray(body.offers) ? body.offers : [],
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const rawCatalog = searchParams.get('rawCatalog') === 'true';

  try {
    // If rawCatalog is requested (for admin inventory management)
    if (rawCatalog) {
      const allCatalog = await getDatabaseProducts();
      return NextResponse.json(
        {
          success: true,
          count: allCatalog.length,
          data: allCatalog,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }

    const products = await adapterRegistry.searchAllRetailers({
      query,
      category: category || undefined,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        count: products.length,
        data: products,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isRequestAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check if this is a bulk import batch (either raw array or { products: [...] })
    const isBatch = Array.isArray(body) || (body && Array.isArray(body.products));
    if (isBatch) {
      const rawList: any[] = Array.isArray(body) ? body : body.products;
      const validItems = rawList.filter((item) => item && typeof item === 'object' && (item.title || item.name));
      if (validItems.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid products found in import batch. Each product must have a title.' },
          { status: 400 }
        );
      }

      const sanitizedList = validItems.map(sanitizeProductItem);
      const updatedCatalog = await saveDatabaseProductsBatch(sanitizedList);
      purgeServerCaches();

      return NextResponse.json(
        {
          success: true,
          count: sanitizedList.length,
          totalInCatalog: updatedCatalog.length,
          products: sanitizedList,
        },
        { status: 201 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Product title is required' },
        { status: 400 }
      );
    }

    const newProduct = sanitizeProductItem(body);

    // Save permanently to database
    await saveDatabaseProduct(newProduct);
    purgeServerCaches(newProduct.slug, newProduct.category);

    return NextResponse.json(
      { success: true, product: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isRequestAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {
        // no body provided
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required for deletion' },
        { status: 400 }
      );
    }

    const currentCatalog = await getDatabaseProducts();
    const existing = currentCatalog.find((p) => p.id === id || p.slug === id);
    if (existing) {
      const imagesToDelete = [existing.imageUrl, ...(existing.images || [])];
      try {
        const { deleteUploadedFiles } = await import('@/lib/cleanup');
        await deleteUploadedFiles(imagesToDelete);
      } catch (cleanupErr) {
        console.warn('Product image cleanup warning:', cleanupErr);
      }
    }

    // Permanently remove from database
    await deleteDatabaseProduct(id);

    purgeServerCaches(existing?.slug, existing?.category);

    return NextResponse.json({
      success: true,
      message: `Product ${id} and associated assets removed permanently from database`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!isRequestAdminAuthenticated(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Case 1: Reorder via productIds array
    if (body && Array.isArray(body.productIds)) {
      const current = await getDatabaseProducts(true);
      const map = new Map(current.map((p) => [p.id, p]));
      const reordered: CatalogItem[] = [];

      for (const id of body.productIds) {
        const item = map.get(id);
        if (item) {
          reordered.push(item);
          map.delete(id);
        }
      }
      for (const item of map.values()) {
        reordered.push(item);
      }

      await saveReorderedProductsCatalog(reordered);
      purgeServerCaches();

      return NextResponse.json({ success: true, count: reordered.length });
    }

    // Case 2: Full products array
    if (body && Array.isArray(body.products)) {
      const validItems = body.products.filter(
        (item: any) => item && typeof item === 'object' && (item.title || item.name)
      );
      const sanitizedList = validItems.map(sanitizeProductItem);
      await saveReorderedProductsCatalog(sanitizedList);
      purgeServerCaches();

      return NextResponse.json({ success: true, count: sanitizedList.length });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid products or productIds payload' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update products order' },
      { status: 500 }
    );
  }
}

