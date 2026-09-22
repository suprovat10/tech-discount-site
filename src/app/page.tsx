import React from 'react';
import Link from 'next/link';
import { HeroSection } from '@/components/home/HeroSection';
import { DealCard } from '@/components/deals/DealCard';
import { TopCategorySlider } from '@/components/home/TopCategorySlider';
import { FeaturedCategorySections } from '@/components/home/FeaturedCategorySections';
import { BrandShowcaseSection } from '@/components/home/BrandShowcaseSection';
import { getDatabaseProducts } from '@/lib/catalogDb';
import { getDatabaseCategories } from '@/lib/categoryServer';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { UnifiedProduct } from '@/types/product';
import { ArrowRight } from 'lucide-react';
import { getServerSettings } from '@/lib/settingsServer';
import { AdSlot } from '@/components/ads/AdSlot';
import { optimizeImageUrl, getHeroSrcSet, getHeroSizes } from '@/lib/imageOptimization';

export const revalidate = 10;

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

  // 1. Featured Deals: Most viewed / popular products
  const featuredDeals = [...allProducts]
    .sort((a, b) => {
      const viewsA = a.views ?? (a.ratingCount || 0);
      const viewsB = b.views ?? (b.ratingCount || 0);
      return viewsB - viewsA;
    })
    .slice(0, 8);

  // 2. Latest Products: Freshly added products in admin catalog arrangement
  const latestProducts = allProducts.slice(0, 8);

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
              prefetch={true}
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
              prefetch={true}
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
        <FeaturedCategorySections initialCategories={categories} allProducts={allProducts} />
      </div>
    </div>
  );
}
