import { NextResponse } from 'next/server';
import { PRODUCTS_CATALOG, CatalogItem, upsertInMemoryCatalogProduct, deleteInMemoryCatalogProduct } from '@/data/catalog';
import { adapterRegistry } from '@/lib/adapters';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
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
    } catch (dbErr) {
      console.warn('Failed to persist product to Supabase site_kv:', dbErr);
    }

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

    const existing = PRODUCTS_CATALOG.find((p) => p.id === id);
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

    // Remove from Supabase permanent cloud database
    try {
      const { getSiteKV, setSiteKV } = await import('@/lib/db/kv');
      const existingCustom = (await getSiteKV<CatalogItem[]>('custom_products')) || [];
      const filtered = existingCustom.filter((p) => p.id !== id);
      await setSiteKV('custom_products', filtered);
    } catch (dbErr) {
      console.warn('Failed to delete product from Supabase site_kv:', dbErr);
    }

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

