import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDatabaseProductBySlug, getDatabaseProducts } from '@/lib/catalogDb';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { getServerSettings } from '@/lib/settingsServer';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import { ProductDetailClient } from './ProductDetailClient';
import { getCategories, getCategorySlug } from '@/lib/categoryStore';

import { optimizeImageUrl } from '@/lib/imageOptimization';

export const revalidate = 30;

export async function generateStaticParams() {
  const products = await getDatabaseProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

import { buildOpenGraphImages } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';

  const rawProduct = await getDatabaseProductBySlug(slug);
  const product = rawProduct ? transformCatalogItemToUnified(rawProduct) : null;

  if (!product) {
    const formattedTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { title: `${formattedTitle} | ${brand}` };
  }

  const metaTitle =
    product.seo?.metaTitle ||
    `${product.title} - Compare Prices across Amazon, Walmart, Best Buy, Target | ${brand}`;
  const metaDescription =
    product.seo?.metaDescription ||
    `Compare verified prices for ${product.title}. Lowest live price is $${product.lowestPrice}${
      product.maxSavingsPercentage && product.maxSavingsPercentage > 0 ? ` (Save ${product.maxSavingsPercentage}% OFF)` : ''
    }. Check stock and offers from top US retailers.`;
  const rawOgImage = product.seo?.ogImageUrl || product.imageUrl || product.images?.[0];
  const ogData = buildOpenGraphImages(
    rawOgImage,
    siteUrl,
    settings.ogImageUrl || `${siteUrl}/hero.webp`,
    product.seo?.ogImageAlt || product.imageAlt || product.title
  );
  const productUrl = `${siteUrl}/product/${product.slug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: productUrl,
      siteName: brand,
      locale: 'en_US',
      type: 'website',
      images: ogData.images,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: ogData.twitterImages,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';

  const rawProduct = await getDatabaseProductBySlug(slug);
  const product = rawProduct ? transformCatalogItemToUnified(rawProduct) : null;

  // Product deleted or not found — show 404
  if (!product) {
    notFound();
  }

  const allCatalog = await getDatabaseProducts();

  // Related products strictly from the same category
  let relatedRaw = product
    ? allCatalog.filter(
        (p) =>
          p.slug !== product.slug &&
          p.id !== product.id &&
          p.category &&
          product.category &&
          p.category.toLowerCase().trim() === product.category.toLowerCase().trim()
      )
    : [];

  if (relatedRaw.length === 0) {
    relatedRaw = allCatalog.filter((p) => !product || (p.slug !== product.slug && p.id !== product.id));
  }

  const relatedProducts = relatedRaw.slice(0, 4).map(transformCatalogItemToUnified);

  const productJsonLd = product ? generateProductJsonLd(product, siteUrl) : null;
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: 'Home', url: '/' },
      {
        name: product?.category || 'Products',
        url: product?.category
          ? `/products/${getCategorySlug(getCategories(), product.category)}`
          : '/products',
      },
      { name: product?.title || slug, url: `/product/${product?.slug || slug}` },
    ],
    siteUrl
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      {/* High-priority Image Preload for LCP */}
      {product?.imageUrl && (
        <link
          rel="preload"
          as="image"
          href={optimizeImageUrl(product.imageUrl, 640)}
          fetchPriority="high"
        />
      )}

      {/* Schema.org Product Structured Data */}
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {/* Schema.org Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ProductDetailClient
        key={slug}
        product={product}
        slug={slug}
        relatedProducts={relatedProducts}
      />
    </div>
  );
}
