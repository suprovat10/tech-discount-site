import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';
import { getServerSettings } from '@/lib/settingsServer';
import { getDatabasePageBySlug, getDatabasePages } from '@/lib/pageServer';
import { buildOpenGraphImages } from '@/lib/seo/metadata';

// Custom CMS and policy pages revalidate every 24 hours (or on-demand when edited)
export const revalidate = 86400;

export async function generateStaticParams() {
  const pages = await getDatabasePages();
  return pages.map((p) => ({
    slug: p.slug,
  }));
}

interface CustomPageRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CustomPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerSettings();
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const page = await getDatabasePageBySlug(slug);
  const title = page?.title || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  const description = page?.metaDescription || `${title} - Information and policies for ${brand}.`;
  const ogData = buildOpenGraphImages(settings.ogImageUrl, siteUrl, `${siteUrl}/hero.webp`, title);

  return {
    title: `${title} | ${brand}`,
    description,
    openGraph: {
      title: `${title} | ${brand}`,
      description,
      url: `${siteUrl}/page/${slug}`,
      siteName: brand,
      locale: 'en_US',
      type: 'website',
      images: ogData.images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${brand}`,
      description,
      images: ogData.twitterImages,
    },
  };
}

export default async function CustomPageRoute({ params }: CustomPageRouteProps) {
  const { slug } = await params;
  return <PolicyPageClient slug={slug} />;
}
