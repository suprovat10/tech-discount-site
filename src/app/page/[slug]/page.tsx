import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

interface CustomPageRouteProps {
  params: Promise<{ slug: string }>;
}

import { getServerSettingsAsync } from '@/lib/settingsServer';
import { getPageBySlug } from '@/lib/pageStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: CustomPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerSettingsAsync();
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const page = getPageBySlug(slug);
  const title = page?.title || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

  return {
    title: `${title} | ${brand}`,
    description: page?.metaDescription || `${title} - Information and policies for ${brand}.`,
  };
}

export default async function CustomPageRoute({ params }: CustomPageRouteProps) {
  const { slug } = await params;
  return <PolicyPageClient slug={slug} />;
}
