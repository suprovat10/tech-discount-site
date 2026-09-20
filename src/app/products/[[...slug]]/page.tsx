import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SearchResultsClient } from '@/app/search/SearchResultsClient';
import { Loader2 } from 'lucide-react';
import { getServerSettings } from '@/lib/settingsServer';
import { getCategories, getDatabaseCategories } from '@/lib/categoryStore';
import { getDatabaseProducts } from '@/lib/catalogDb';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { UnifiedProduct } from '@/types/product';

export const revalidate = 30;

export async function generateStaticParams() {
  const categories = await getDatabaseCategories();
  const params: { slug?: string[] }[] = [{ slug: [] }];

  categories.forEach((cat) => {
    params.push({ slug: [cat.slug] });
    cat.subcategories?.forEach((sub) => {
      params.push({ slug: [cat.slug, sub.slug] });
    });
  });

  return params;
}

interface ProductsPageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slugs = resolvedParams.slug || [];
  const categories = await getDatabaseCategories();
  const settings = await getServerSettings();
  const brand = settings.siteBrandName || 'suprodesign';
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';

  const catSlug = slugs[0];
  const subSlug = slugs[1];

  let title = `All Products - Compare Live Prices & Deals | ${brand}`;
  let description = `Browse verified consumer electronics and tech deals. Compare live inventory and discounts across Amazon, Walmart, Best Buy, and Target.`;
  let canonicalPath = '/products';

  if (catSlug) {
    const cat = categories.find(
      (c) =>
        c.slug.toLowerCase() === catSlug.toLowerCase() ||
        c.id.toLowerCase() === catSlug.toLowerCase()
    );
    if (cat) {
      canonicalPath = `/products/${cat.slug}`;
      if (subSlug) {
        const sub = cat.subcategories?.find(
          (s) =>
            s.slug.toLowerCase() === subSlug.toLowerCase() ||
            s.id.toLowerCase() === subSlug.toLowerCase()
        );
        if (sub) {
          title = `${sub.name} Deals - Compare Best Prices | ${brand}`;
          description = `Find lowest verified prices on ${sub.name} in ${cat.name}. Real-time discounts across major retailers.`;
          canonicalPath = `/products/${cat.slug}/${sub.slug}`;
        } else {
          title = `${cat.name} Deals - Compare Best Prices | ${brand}`;
          description = `Compare verified live prices on ${cat.name} across Amazon, Walmart, Best Buy, and Target.`;
        }
      } else {
        title = `${cat.name} Deals - Compare Best Prices | ${brand}`;
        description = `Compare verified live prices on ${cat.name} across Amazon, Walmart, Best Buy, and Target.`;
      }
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
      siteName: brand,
    },
  };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const resolvedParams = await params;
  const slugs = resolvedParams.slug || [];
  const catSlug = slugs[0] || '';
  const subSlug = slugs[1] || '';

  let initialProducts: UnifiedProduct[] = [];
  let categories: any[] = [];
  try {
    const [catalog, cloudCats] = await Promise.all([
      getDatabaseProducts(),
      getDatabaseCategories(),
    ]);
    initialProducts = catalog.map((item) => transformCatalogItemToUnified(item));
    categories = cloudCats;
  } catch (e) {
    console.error('Failed to load initial products/categories for page:', e);
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <Suspense
        fallback={
          <div className="py-24 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm text-muted-foreground">Scanning retailer price feeds...</p>
          </div>
        }
      >
        <SearchResultsClient
          key={`${catSlug}-${subSlug}`}
          initialCategorySlug={catSlug}
          initialSubcategorySlug={subSlug}
          initialProducts={initialProducts}
          initialCategories={categories}
        />
      </Suspense>
    </div>
  );
}
