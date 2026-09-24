import React from 'react';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroSection } from '@/components/home/HeroSection';
import { DealCard } from '@/components/deals/DealCard';
import { TopCategorySlider } from '@/components/home/TopCategorySlider';
import { getDatabaseProducts } from '@/lib/catalogDb';
import { getDatabaseCategories } from '@/lib/categoryServer';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { UnifiedProduct } from '@/types/product';
import { ArrowRight } from 'lucide-react';
import { getServerSettings } from '@/lib/settingsServer';
import { AdSlot } from '@/components/ads/AdSlot';
import { optimizeImageUrl, getHeroSrcSet, getHeroSizes } from '@/lib/imageOptimization';
import { buildOpenGraphImages } from '@/lib/seo/metadata';

// Below-fold components — code-split with next/dynamic to reduce initial JS chunk
const BrandShowcaseSection = dynamic(() => import('@/components/home/BrandShowcaseSection').then(m => ({ default: m.BrandShowcaseSection })));
const FeaturedCategorySections = dynamic(() => import('@/components/home/FeaturedCategorySections').then(m => ({ default: m.FeaturedCategorySections })));

// Homepage revalidates once every 6 hours (or instantly on-demand when admin saves updates)
export const revalidate = 21600;

export async function generateMetadata(): Promise<Metadata> {
  // Use cached settings — avoids duplicate MongoDB round-trip
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const title = settings.siteTitle || `${brand} - Compare Prices across Amazon, Walmart, Best Buy & Target`;
  const description =
    settings.metaDescription ||
    'Find the lowest prices and best discounts on tech gadgets, laptops, smartphones, and accessories across major US retailers.';
  const rawOgImg =
    settings.ogImageUrl && !settings.ogImageUrl.includes('photo-1519389950473-47ba0277781c')
      ? settings.ogImageUrl
      : 'https://res.cloudinary.com/koayelts/image/upload/f_auto,q_auto,w_1600,c_limit/v1790111032/techpricedrop/branding/uc66jnomvw4tnewyy2mq.jpg';

  const ogData = buildOpenGraphImages(rawOgImg, siteUrl, `${siteUrl}/hero.webp`, title);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
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

// Strip large unused fields (full description HTML, features, specs, faqs) to keep RSC Flight payload tiny
function toCardProduct(p: UnifiedProduct): UnifiedProduct {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    brand: p.brand || '',
    category: p.category || '',
    subcategory: p.subcategory || '',
    badge: p.badge,
    imageUrl: p.imageUrl,
    imageAlt: p.imageAlt,
    lowestPrice: p.lowestPrice,
    highestPrice: p.highestPrice || p.lowestPrice,
    regularPrice: p.regularPrice,
    maxSavingsPercentage: p.maxSavingsPercentage,
    rating: p.rating,
    ratingCount: p.ratingCount,
    views: p.views,
    updatedAt: p.updatedAt || '',
    offers: p.offers?.slice(0, 2).map((o) => ({
      retailer: o.retailer,
      retailerName: o.retailerName,
      retailerItemId: o.retailerItemId,
      productUrl: o.productUrl,
      directAffiliateUrl: '',
      internalGoUrl: o.internalGoUrl || '',
      price: o.price,
      regularPrice: o.regularPrice,
      currency: 'USD',
      isLowestPrice: o.isLowestPrice,
      isInStock: o.isInStock,
      availabilityStatus: o.availabilityStatus,
      condition: o.condition,
      lastUpdated: '',
    })) || [],
    description: '',
    richDescription: '',
    features: [],
    specs: {},
    keySpecs: {},
    faqs: [],
  };
}

export default async function HomePage() {
  const [settings, categories, catalog] = await Promise.all([
    getServerSettings(),
    getDatabaseCategories(),
    getDatabaseProducts().catch((e) => {
      console.error('Failed to load initial products:', e);
      return [];
    }),
  ]);

  const allProducts: UnifiedProduct[] = catalog.map((item) => transformCatalogItemToUnified(item));

  // 1. Featured Deals: Most viewed / popular products (compacted)
  const featuredDeals = [...allProducts]
    .sort((a, b) => {
      const viewsA = a.views ?? (a.ratingCount || 0);
      const viewsB = b.views ?? (b.ratingCount || 0);
      return viewsB - viewsA;
    })
    .slice(0, 8)
    .map(toCardProduct);

  // 2. Latest Products: Freshly added products (compacted)
  const latestProducts = allProducts.slice(0, 8).map(toCardProduct);

  // 3. Category Products: Only serialize the products needed for home featured categories
  const featuredCatProductsMap = new Map<string, UnifiedProduct>();
  const homeFeaturedCats = categories.filter((c) => c.isFeaturedOnHome);
  for (const cat of homeFeaturedCats) {
    const catNameLower = cat.name.toLowerCase();
    const catSlugLower = cat.slug.toLowerCase();
    const matched = allProducts.filter((p) => {
      const pCat = (p.category || '').toLowerCase();
      const pSub = (p.subcategory || '').toLowerCase();
      return (
        pCat.includes(catNameLower) ||
        catNameLower.includes(pCat) ||
        pCat.includes(catSlugLower) ||
        cat.subcategories?.some(
          (s) => pSub.includes(s.name.toLowerCase()) || pSub.includes(s.slug.toLowerCase())
        )
      );
    }).slice(0, 4);

    for (const m of matched) {
      featuredCatProductsMap.set(m.id, toCardProduct(m));
    }
  }

  // Fallbacks if fewer than 4 matched
  for (const p of allProducts.slice(0, 8)) {
    if (!featuredCatProductsMap.has(p.id)) {
      featuredCatProductsMap.set(p.id, toCardProduct(p));
    }
  }
  const homepageCategoryProducts = Array.from(featuredCatProductsMap.values());

  const isDefaultHero = !settings.heroImageUrl || settings.heroImageUrl.includes('v8wowdztetwveiot2ahw') || settings.heroImageUrl.includes('images.unsplash.com/photo-1517336714731-489689fd1ca8');
  const heroImageUrl = isDefaultHero ? '/hero.webp' : settings.heroImageUrl;
  const heroPreloadSrc = optimizeImageUrl(heroImageUrl, 480);
  const heroSrcSet = getHeroSrcSet(heroImageUrl);
  const heroSizes = getHeroSizes();

  return (
    <div className="space-y-12 pb-16">
      {/* High-priority preload for hero image LCP */}
      <link
        rel="preload"
        as="image"
        href={heroPreloadSrc}
        imageSrcSet={heroSrcSet}
        imageSizes={heroSizes}
        fetchPriority="high"
      />
      <div className="container mx-auto px-4 sm:px-6 space-y-10">
        {/* 1. Minimal Hero Section */}
        <HeroSection initialSettings={settings} />

        {/* Ad Placement: Below Hero Section */}
        <AdSlot placement="home_below_hero" />

        {/* 2. Top Category & Subcategory Image Slider (No 'All' Button) */}
        <TopCategorySlider initialSettings={settings} initialCategories={categories} />

        {/* 3. Featured Deals Grid (Most Viewed) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Featured Deals
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Most popular and viewed tech deals across Amazon, Walmart, Best Buy, and Target
              </p>
            </div>

            <Link
              href="/products"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
            {featuredDeals.map((product, idx) => (
              <DealCard key={product.id} product={product} priority={idx < 2} />
            ))}
          </div>
        </section>

        {/* 4. Latest Products Grid (Newest Uploads) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Latest Products
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Freshly added tech deals and price drops across authorized retailers
              </p>
            </div>

            <Link
              href="/products?sort=latest"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-5">
            {latestProducts.map((product) => (
              <DealCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Ad Placement: Below Latest Products */}
        <AdSlot placement="home_below_latest" />

        {/* 4. Popular Brand Partners Showcase Section */}
        <BrandShowcaseSection />

        {/* 5. Homepage Category Showcase Sections (Max 4 categories customizable via Admin) */}
        <FeaturedCategorySections initialCategories={categories} allProducts={homepageCategoryProducts} />
      </div>
    </div>
  );
}
