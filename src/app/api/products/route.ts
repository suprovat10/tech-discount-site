import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { CatalogItem } from '@/data/catalog';
import { adapterRegistry } from '@/lib/adapters';
import {
  getDatabaseProducts,
  saveDatabaseProduct,
  deleteDatabaseProduct,
} from '@/lib/catalogDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function purgeServerCaches(slug?: string) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/', 'page');
    revalidatePath('/products', 'layout');
    revalidatePath('/products', 'page');
    revalidatePath('/products/[[...slug]]', 'page');
    revalidatePath('/products/[[...slug]]', 'layout');
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
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Product title is required' },
        { status: 400 }
      );
    }

    const newProduct: CatalogItem = {
      id: body.id || `prod-dyn-${Date.now()}`,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: body.title,
      brand: body.brand || 'No Brand',
      category: body.category || 'Electronics',
      subcategory: body.subcategory || '',
      rating: typeof body.rating === 'number' ? body.rating : (parseFloat(body.rating) || 4.8),
      reviewCount: typeof body.reviewCount === 'number' ? body.reviewCount : (parseInt(body.reviewCount, 10) || 100),
      badge: body.badge || 'New',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80',
      imageAlt: body.imageAlt || '',
      images: body.images && body.images.length > 0 ? body.images : [body.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80'],
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

    // Save permanently to database
    await saveDatabaseProduct(newProduct);

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

    purgeServerCaches(existing?.slug);

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

