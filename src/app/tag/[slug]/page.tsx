import React from 'react';
import { Metadata } from 'next';
import { getProductTagsServer } from '@/lib/productTagServer';
import { ProductTag } from '@/types/tag';
import { getDatabaseProducts } from '@/lib/catalogDb';
import { transformCatalogItemToUnified } from '@/lib/productTransform';
import { slugifyTag } from '@/lib/productTagStore';
import { getServerSettings } from '@/lib/settingsServer';
import { TagDetailClient } from './TagDetailClient';

export const revalidate = 30;

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const settings = await getServerSettings();
  const siteBrand = settings.siteBrandName || 'suprodesign';
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';

  const allTags = await getProductTagsServer();
  const matchedTag = allTags.find((t: ProductTag) => t.slug === cleanSlug || slugifyTag(t.name) === cleanSlug);
  const tagName = matchedTag?.name || cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const tagUrl = `${siteUrl}/tag/${cleanSlug}`;

  return {
    title: `${tagName} Deals, Discounts & Price Drops | ${siteBrand}`,
    description: matchedTag?.description || `Explore the best discounts, price drops, and verified multi-store deals for ${tagName}. Compare prices across top retailers.`,
    alternates: {
      canonical: tagUrl,
    },
    openGraph: {
      title: `${tagName} Deals & Price Drops | ${siteBrand}`,
      description: matchedTag?.description || `Compare live prices and discounts on ${tagName} products across Amazon, Walmart, Best Buy, and Target.`,
      url: tagUrl,
      siteName: siteBrand,
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

  const allTags = await getProductTagsServer();
  const matchedTag = allTags.find((t: ProductTag) => t.slug === cleanSlug || slugifyTag(t.name) === cleanSlug);
  const tagName = matchedTag?.name || cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Fetch all products matching this tag
  const allCatalog = await getDatabaseProducts();
  const tagProducts = allCatalog
    .filter((p) => {
      // 1. Explicit tags check
      if (Array.isArray(p.tags) && p.tags.some((t) => slugifyTag(t) === cleanSlug)) {
        return true;
      }
      // 2. Fallback check on brand, category, subcategory
      if (p.brand && slugifyTag(p.brand) === cleanSlug) return true;
      if (p.category && slugifyTag(p.category) === cleanSlug) return true;
      if (p.subcategory && slugifyTag(p.subcategory) === cleanSlug) return true;
      return false;
    })
    .map(transformCatalogItemToUnified);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <TagDetailClient
        key={cleanSlug}
        slug={cleanSlug}
        initialTag={matchedTag}
        tagName={tagName}
        initialProducts={tagProducts}
      />
    </div>
  );
}
