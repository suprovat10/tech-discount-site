import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { PRODUCTS_CATALOG, CatalogItem, upsertInMemoryCatalogProduct, deleteInMemoryCatalogProduct } from '@/data/catalog';
import { adapterRegistry } from '@/lib/adapters';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function purgeServerCaches(productSlug?: string) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/products', 'page');
    revalidatePath('/search', 'page');
    if (productSlug) {
      revalidatePath(`/product/${productSlug}`, 'page');
    }
    const { getSupabaseAdminClient } = await import('@/lib/db/client');
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from('search_cache').delete().neq('query_hash', '');
    }
  } catch (err) {
    console.warn('Cache purge non-fatal warning:', err);
  }
}

async function getActiveCatalogItems(): Promise<CatalogItem[]> {
  let allCatalogItems = [...PRODUCTS_CATALOG];
  try {
    const { getSiteKV } = await import('@/lib/db/kv');
    const deletedIds = (await getSiteKV<string[]>('deleted_product_ids')) || [];
    const cloudProducts = await getSiteKV<CatalogItem[]>('custom_products');

    const productMap = new Map<string, CatalogItem>();
    
    // 1. Add baseline catalog items if not deleted
    allCatalogItems
      .filter((p) => !deletedIds.includes(p.id) && !deletedIds.includes(p.slug))
      .forEach((p) => productMap.set(p.id, p));

    // 2. Add / override with cloud products (custom/edited) if not deleted
    if (cloudProducts && Array.isArray(cloudProducts)) {
      cloudProducts
        .filter((p) => !deletedIds.includes(p.id) && !deletedIds.includes(p.slug))
        .forEach((p) => productMap.set(p.id, p));
    }

    return Array.from(productMap.values());
  } catch (err) {
    console.warn('Failed to get active catalog items:', err);
    return allCatalogItems;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const format = searchParams.get('format');

  try {
    const activeCatalog = await getActiveCatalogItems();

    if (format === 'catalog') {
      let filtered = activeCatalog;
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (p) => p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
        );
      }
      if (category && category !== 'all') {
        filtered = filtered.filter((p) => p.category === category);
      }
      return NextResponse.json({
        success: true,
        count: filtered.length,
        catalog: filtered,
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
      catalog: activeCatalog,
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

      // If this product was in deleted_product_ids, un-delete it!
      const deletedIds = (await getSiteKV<string[]>('deleted_product_ids')) || [];
      if (deletedIds.includes(newProduct.id) || deletedIds.includes(newProduct.slug)) {
        await setSiteKV(
          'deleted_product_ids',
          deletedIds.filter((id) => id !== newProduct.id && id !== newProduct.slug)
        );
      }
    } catch (dbErr) {
      console.warn('Failed to persist product to Supabase site_kv:', dbErr);
    }

    await purgeServerCaches(newProduct.slug);

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

    // Support 1-click clearing of all dummy sample products
    if (searchParams.get('clearAll') === 'true') {
      try {
        const { getSiteKV, setSiteKV } = await import('@/lib/db/kv');
        const allBaselineIds = PRODUCTS_CATALOG.map((p) => p.id);
        const allBaselineSlugs = PRODUCTS_CATALOG.map((p) => p.slug);
        const deletedIds = Array.from(new Set([...allBaselineIds, ...allBaselineSlugs]));
        await setSiteKV('deleted_product_ids', deletedIds);
        await setSiteKV('custom_products', []);
        await purgeServerCaches();
        return NextResponse.json({
          success: true,
          message: 'All default sample products cleared successfully',
        });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

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

    // Remove from Supabase permanent cloud database & record in deleted_product_ids
    try {
      const { getSiteKV, setSiteKV } = await import('@/lib/db/kv');
      const existingCustom = (await getSiteKV<CatalogItem[]>('custom_products')) || [];
      const filtered = existingCustom.filter((p) => p.id !== id && p.slug !== id);
      await setSiteKV('custom_products', filtered);

      // Record in deleted_product_ids so baseline dummy products NEVER reappear!
      const deletedIds = (await getSiteKV<string[]>('deleted_product_ids')) || [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
      }
      if (existing && existing.slug && !deletedIds.includes(existing.slug)) {
        deletedIds.push(existing.slug);
      }
      await setSiteKV('deleted_product_ids', deletedIds);
    } catch (dbErr) {
      console.warn('Failed to delete product from Supabase site_kv:', dbErr);
    }

    await purgeServerCaches(existing?.slug || id);

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

