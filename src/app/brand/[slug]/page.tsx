import React from 'react';
import { Metadata } from 'next';
import { DEFAULT_BRANDS } from '@/data/brands';
import { getDatabaseProducts } from '@/lib/catalogDb';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { BrandDetailClient } from './BrandDetailClient';

// Brand pages revalidate every 48 hours (or on-demand when brand items change)
export const revalidate = 172800;

export async function generateStaticParams() {
  return DEFAULT_BRANDS.map((b) => ({
    slug: b.slug,
  }));
}

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

import { getServerSettings } from '@/lib/settingsServer';
import { getDatabaseBrands } from '@/lib/brandServer';
import { buildOpenGraphImages } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerSettings();
  const siteBrand = settings.siteBrandName || 'TechPriceDrop';
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';

  const allBrands = await getDatabaseBrands();
  const brand = allBrands.find(
    (b) => b.slug.toLowerCase() === slug.toLowerCase() || b.name.toLowerCase() === slug.toLowerCase()
  );
  const brandName = brand?.name || slug.toUpperCase();
  const canonicalPath = brand?.seo?.canonicalUrl || `/brand/${slug}`;
  const fullCanonicalUrl = canonicalPath.startsWith('http') ? canonicalPath : `${siteUrl}${canonicalPath}`;

  const title = brand?.seo?.metaTitle || `${brandName} Deals & Lowest Prices | ${siteBrand}`;
  const description =
    brand?.seo?.metaDescription ||
    brand?.description ||
    `Compare live prices on all ${brandName} electronics and gadgets across Amazon, Walmart, Best Buy, and Target.`;
  const keywords = brand?.seo?.keywords ? brand.seo.keywords.split(',').map((k) => k.trim()) : undefined;
  const isNoIndex = Boolean(brand?.seo?.noIndex);
  const ogData = buildOpenGraphImages(
    brand?.seo?.ogImageUrl || brand?.logoUrl,
    siteUrl,
    settings.ogImageUrl || `${siteUrl}/hero.webp`,
    brandName
  );

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
      siteName: siteBrand,
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

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

  const allBrands = await getDatabaseBrands();
  const brand = allBrands.find(
    (b) => b.slug.toLowerCase() === cleanSlug || b.name.toLowerCase() === cleanSlug
  );

  const brandName = brand ? brand.name : cleanSlug.replace(/-/g, ' ');

  // Fetch all products matching this brand directly (0.05ms)
  const allCatalog = await getDatabaseProducts();
  const brandProducts = allCatalog
    .filter((p) => p.brand && p.brand.toLowerCase().trim() === brandName.toLowerCase().trim())
    .map(transformCatalogItemToUnified);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <BrandDetailClient
        key={cleanSlug}
        slug={cleanSlug}
        initialBrand={brand}
        initialProducts={brandProducts}
      />
    </div>
  );
}
