import React from 'react';
import Link from 'next/link';
import { HeroSection } from '@/components/home/HeroSection';
import { DealCard } from '@/components/deals/DealCard';
import { TopCategorySlider } from '@/components/home/TopCategorySlider';
import { FeaturedCategorySections } from '@/components/home/FeaturedCategorySections';
import { BrandShowcaseSection } from '@/components/home/BrandShowcaseSection';
import { getDatabaseProducts } from '@/lib/catalogDb';
import { getDatabaseCategories } from '@/lib/categoryStore';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { UnifiedProduct } from '@/types/product';
import { ArrowRight } from 'lucide-react';
import { getServerSettings } from '@/lib/settingsServer';

export const revalidate = 30;

export default async function HomePage() {
  const settings = await getServerSettings();
  const categories = await getDatabaseCategories();
  let allProducts: UnifiedProduct[] = [];
  try {
    const catalog = await getDatabaseProducts();
    allProducts = catalog.map((item) => transformCatalogItemToUnified(item));
  } catch (e) {
    console.error('Failed to load initial products:', e);
  }

  const featuredDeals = allProducts.slice(0, 8);


  return (
    <div className="space-y-12 pb-16">
      <div className="container mx-auto px-4 sm:px-6 space-y-10">
        {/* 1. Minimal Hero Section */}
        <HeroSection initialSettings={settings} />

        {/* 2. Top Category & Subcategory Image Slider (No 'All' Button) */}
        <TopCategorySlider />

        {/* 3. Featured Deals Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Featured Deals
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified live prices across Amazon, Walmart, Best Buy, and Target
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
            {featuredDeals.map((product) => (
              <DealCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* 4. Popular Brand Partners Showcase Section */}
        <BrandShowcaseSection />

        {/* 5. Homepage Category Showcase Sections (Max 4 categories customizable via Admin) */}
        <FeaturedCategorySections initialCategories={categories} allProducts={allProducts} />
      </div>
    </div>
  );
}
