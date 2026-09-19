import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DEFAULT_BRANDS } from '@/data/brands';
import { adapterRegistry } from '@/lib/adapters';
import { BrandDetailClient } from './BrandDetailClient';

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

import { getServerSettings } from '@/lib/settingsServer';

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = getServerSettings();
  const siteBrand = settings.siteBrandName || 'suprodesign';
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';

  const brand = DEFAULT_BRANDS.find(
    (b) => b.slug.toLowerCase() === slug.toLowerCase() || b.name.toLowerCase() === slug.toLowerCase()
  );
  const brandName = brand?.name || slug.toUpperCase();
  const brandUrl = `${siteUrl}/brand/${slug}`;

  return {
    title: `${brandName} Deals & Lowest Prices | ${siteBrand}`,
    description: `Compare live prices on all ${brandName} electronics and gadgets across Amazon, Walmart, Best Buy, and Target.`,
    alternates: {
      canonical: brandUrl,
    },
    openGraph: {
      title: `${brandName} Deals & Price Comparison | ${siteBrand}`,
      description: `Compare verified prices for ${brandName} products across major retailers.`,
      url: brandUrl,
      siteName: siteBrand,
    },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

  const brand = DEFAULT_BRANDS.find(
    (b) => b.slug.toLowerCase() === cleanSlug || b.name.toLowerCase() === cleanSlug
  );

  const brandName = brand ? brand.name : cleanSlug.replace(/-/g, ' ');

  // Fetch all products matching this brand
  const allProducts = await adapterRegistry.searchAllRetailers({ query: '' });
  const brandProducts = allProducts.filter(
    (p) => p.brand && p.brand.toLowerCase().trim() === brandName.toLowerCase().trim()
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <BrandDetailClient
        slug={cleanSlug}
        initialBrand={brand}
        initialProducts={brandProducts}
      />
    </div>
  );
}
