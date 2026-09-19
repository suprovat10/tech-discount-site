import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { PRODUCTS_CATALOG, CatalogItem, upsertInMemoryCatalogProduct, deleteInMemoryCatalogProduct } from '@/data/catalog';
import { adapterRegistry } from '@/lib/adapters';
import { getSupabaseAdminClient } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function purgeServerCaches(slug?: string) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/products', 'layout');
    revalidatePath('/products', 'page');
    revalidatePath('/search', 'page');
    revalidatePath('/brand/[slug]', 'page');
    revalidatePath('/product/[slug]', 'page');
    if (slug) {
      revalidatePath(`/product/${slug}`, 'page');
    }
  } catch (e) {
    console.warn('Cache purge warning:', e);
  }
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
      let allCatalog: CatalogItem[] = [...PRODUCTS_CATALOG];
      try {
        const { getSiteKV } = await import('@/lib/db/kv');
        const cloudProducts = await getSiteKV<CatalogItem[]>('custom_products');
        if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
          const map = new Map<string, CatalogItem>();
          allCatalog.forEach((p) => map.set(p.id, p));
          cloudProducts.forEach((p) => map.set(p.id, p));
          allCatalog = Array.from(map.values());
        }

        const deletedIds = await getSiteKV<string[]>('deleted_product_ids');
        if (deletedIds && Array.isArray(deletedIds) && deletedIds.length > 0) {
          const delSet = new Set(deletedIds);
          allCatalog = allCatalog.filter((p) => !delSet.has(p.id) && !delSet.has(p.slug));
        }
      } catch (kvErr) {
        console.warn('Could not read site_kv in GET products:', kvErr);
      }

      return NextResponse.json({
        success: true,
        count: allCatalog.length,
        data: allCatalog,
      });
    }

    const products = await adapterRegistry.searchAllRetailers({
      query,
      category: category || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.brand) {
      return NextResponse.json(
        { success: false, error: 'Title and Brand are required' },
        { status: 400 }
      );
    }

    const newProduct: CatalogItem = {
      id: body.id || `prod-dyn-${Date.now()}`,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: body.title,
      brand: body.brand,
      category: body.category || 'Electronics',
      subcategory: body.subcategory || '',
      rating: body.rating || 4.8,
      reviewCount: body.reviewCount || 100,
      badge: body.badge || 'New',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80',
      images: body.images && body.images.length > 0 ? body.images : [body.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80'],
      description: body.description || '',
      richDescription: body.richDescription || '',
      features: body.features || [],
      specs: body.specs || {},
      faqs: body.faqs || [],
      seo: body.seo || {},
      offers: body.offers || [],
      updatedAt: new Date().toISOString(),
    };

    upsertInMemoryCatalogProduct(newProduct);

    // Save to Supabase permanent cloud database (survives Git pushes and Vercel rebuilds)
    try {
      const { getSiteKV, setSiteKV } = await import('@/lib/db/kv');
      const existingCustom = (await getSiteKV<CatalogItem[]>('custom_products')) || [];
      const idx = existingCustom.findIndex(
        (p) => p.id === newProduct.id || p.slug === newProduct.slug
      );
      let updatedCustom: CatalogItem[];
      if (idx >= 0) {
        updatedCustom = [...existingCustom];
        updatedCustom[idx] = newProduct;
      } else {
        updatedCustom = [newProduct, ...existingCustom];
      }
      await setSiteKV('custom_products', updatedCustom);

      // If it was previously marked deleted, un-delete it
      const deletedIds = (await getSiteKV<string[]>('deleted_product_ids')) || [];
      if (deletedIds.includes(newProduct.id) || deletedIds.includes(newProduct.slug)) {
        await setSiteKV(
          'deleted_product_ids',
          deletedIds.filter((x) => x !== newProduct.id && x !== newProduct.slug)
        );
      }

      // Purge Supabase search cache table
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        await supabase.from('search_cache').delete().neq('query_hash', '__purge__');
      }
    } catch (dbErr) {
      console.warn('Failed to persist product to Supabase site_kv:', dbErr);
    }

    purgeServerCaches(newProduct.slug);

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

    const existing = PRODUCTS_CATALOG.find((p) => p.id === id || p.slug === id);
    if (existing) {
      const imagesToDelete = [existing.imageUrl, ...(existing.images || [])];
      try {
        const { deleteUploadedFiles } = await import('@/lib/cleanup');
        await deleteUploadedFiles(imagesToDelete);
      } catch (cleanupErr) {
        console.warn('Product image cleanup warning:', cleanupErr);
      }
    }

    deleteInMemoryCatalogProduct(id);

    // Remove from Supabase permanent cloud database & track in deleted_product_ids
    try {
      const { getSiteKV, setSiteKV } = await import('@/lib/db/kv');
      const existingCustom = (await getSiteKV<CatalogItem[]>('custom_products')) || [];
      const filtered = existingCustom.filter((p) => p.id !== id && p.slug !== id);
      await setSiteKV('custom_products', filtered);

      const deletedIds = (await getSiteKV<string[]>('deleted_product_ids')) || [];
      if (!deletedIds.includes(id)) {
        await setSiteKV('deleted_product_ids', [...deletedIds, id]);
      }

      // Purge Supabase search cache table
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        await supabase.from('search_cache').delete().neq('query_hash', '__purge__');
      }
    } catch (dbErr) {
      console.warn('Failed to delete product from Supabase site_kv:', dbErr);
    }

    purgeServerCaches(existing?.slug);

    return NextResponse.json({
      success: true,
      message: `Product ${id} and associated assets removed successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}

