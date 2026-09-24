import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SearchResultsClient } from '@/app/search/SearchResultsClient';
import { Loader2 } from 'lucide-react';
import { getServerSettings } from '@/lib/settingsServer';
import { getCategories } from '@/lib/categoryStore';
import { getDatabaseCategories } from '@/lib/categoryServer';
import { getDatabaseProducts } from '@/lib/catalogDb';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { UnifiedProduct } from '@/types/product';
import { buildOpenGraphImages } from '@/lib/seo/metadata';

// Catalog and category pages revalidate every 6 hours (or on-demand when items are saved)
export const revalidate = 21600;

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
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';

  const catSlug = slugs[0];
  const subSlug = slugs[1];

  let title = `All Products - Compare Live Prices & Deals | ${brand}`;
  let description = `Browse verified consumer electronics and tech deals. Compare live inventory and discounts across Amazon, Walmart, Best Buy, and Target.`;
  let canonicalPath = '/products';
  let keywords: string[] | undefined = undefined;
  let ogImageUrl: string | undefined = undefined;
  let isNoIndex = false;

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
          title = sub.seo?.metaTitle || `${sub.name} Deals - Compare Best Prices | ${brand}`;
          description = sub.seo?.metaDescription || sub.description || `Find lowest verified prices on ${sub.name} in ${cat.name}. Real-time discounts across major retailers.`;
          keywords = sub.seo?.keywords ? sub.seo.keywords.split(',').map((k) => k.trim()) : undefined;
          canonicalPath = sub.seo?.canonicalUrl || `/products/${cat.slug}/${sub.slug}`;
          ogImageUrl = sub.seo?.ogImageUrl || sub.imageUrl;
          isNoIndex = Boolean(sub.seo?.noIndex);
        } else {
          title = cat.seo?.metaTitle || `${cat.name} Deals - Compare Best Prices | ${brand}`;
          description = cat.seo?.metaDescription || cat.description || `Compare verified live prices on ${cat.name} across Amazon, Walmart, Best Buy, and Target.`;
          keywords = cat.seo?.keywords ? cat.seo.keywords.split(',').map((k) => k.trim()) : undefined;
          canonicalPath = cat.seo?.canonicalUrl || `/products/${cat.slug}`;
          ogImageUrl = cat.seo?.ogImageUrl || cat.imageUrl;
          isNoIndex = Boolean(cat.seo?.noIndex);
        }
      } else {
        title = cat.seo?.metaTitle || `${cat.name} Deals - Compare Best Prices | ${brand}`;
        description = cat.seo?.metaDescription || cat.description || `Compare verified live prices on ${cat.name} across Amazon, Walmart, Best Buy, and Target.`;
        keywords = cat.seo?.keywords ? cat.seo.keywords.split(',').map((k) => k.trim()) : undefined;
        canonicalPath = cat.seo?.canonicalUrl || `/products/${cat.slug}`;
        ogImageUrl = cat.seo?.ogImageUrl || cat.imageUrl;
        isNoIndex = Boolean(cat.seo?.noIndex);
      }
    }
  }

  const fullCanonicalUrl = canonicalPath.startsWith('http') ? canonicalPath : `${siteUrl}${canonicalPath}`;
  const fallbackOg = settings.ogImageUrl || `${siteUrl}/hero.webp`;
  const ogData = buildOpenGraphImages(ogImageUrl, siteUrl, fallbackOg, title);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: fullCanonicalUrl,
    },
    robots: {
      index: !isNoIndex,
      follow: !isNoIndex,
    },
    openGraph: {
      title,
      description,
      url: fullCanonicalUrl,
      siteName: brand,
      locale: 'en_US',
      type: 'website',
      images: ogData.images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogData.twitterImages,
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
