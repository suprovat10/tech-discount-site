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
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const [allTags, allCatalog] = await Promise.all([
      getProductTagsServer(),
      getDatabaseProducts(),
    ]);

    const slugSet = new Set<string>();

    // 1. Explicit tags from database/store
    allTags.forEach((t: ProductTag) => {
      if (t.slug) slugSet.add(t.slug.toLowerCase().trim());
      else if (t.name) slugSet.add(slugifyTag(t.name));
    });

    // 2. Tags attached to products
    allCatalog.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag) => {
          if (tag) slugSet.add(slugifyTag(tag));
        });
      }
      if (p.brand) slugSet.add(slugifyTag(p.brand));
      if (p.category) slugSet.add(slugifyTag(p.category));
      if (p.subcategory) slugSet.add(slugifyTag(p.subcategory));
    });

    return Array.from(slugSet)
      .filter(Boolean)
      .map((slug) => ({ slug }));
  } catch (err) {
    console.error('Error generating static params for product tags:', err);
    return [];
  }
}

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
  const tagUrl = matchedTag?.seo?.canonicalUrl || `${siteUrl}/tag/${cleanSlug}`;

  const metaTitle = matchedTag?.seo?.metaTitle || `${tagName} Deals, Discounts & Price Drops | ${siteBrand}`;
  const metaDesc = matchedTag?.seo?.metaDescription || matchedTag?.description || `Explore the best discounts, price drops, and verified multi-store deals for ${tagName}. Compare prices across top retailers.`;
  const keywords = matchedTag?.seo?.keywords ? matchedTag.seo.keywords.split(',').map((k) => k.trim()) : undefined;
  const isNoIndex = Boolean(matchedTag?.seo?.noIndex);

  return {
    title: metaTitle,
    description: metaDesc,
    keywords,
    alternates: {
      canonical: tagUrl,
    },
    robots: {
      index: !isNoIndex,
      follow: !isNoIndex,
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: tagUrl,
      siteName: siteBrand,
      images: matchedTag?.seo?.ogImageUrl ? [{ url: matchedTag.seo.ogImageUrl }] : undefined,
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

  const settings = await getServerSettings();
  const siteBrand = settings.siteBrandName || 'suprodesign';
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';

  const allTags = await getProductTagsServer();
  const matchedTag = allTags.find((t: ProductTag) => t.slug === cleanSlug || slugifyTag(t.name) === cleanSlug);
  const tagName = matchedTag?.name || cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const tagUrl = `${siteUrl}/tag/${cleanSlug}`;

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

  // Schema.org Structured Data
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products` },
      { '@type': 'ListItem', position: 3, name: tagName, item: tagUrl },
    ],
  };

  const jsonLdCollection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${tagName} Deals & Price Drops`,
    description: `Compare prices and deals on ${tagName} products across top retailers.`,
    url: tagUrl,
    publisher: {
      '@type': 'Organization',
      name: siteBrand,
      url: siteUrl,
    },
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }}
      />
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
