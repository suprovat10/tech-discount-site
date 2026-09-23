import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

export const revalidate = 300;

interface CustomPageRouteProps {
  params: Promise<{ slug: string }>;
}

import { getServerSettings } from '@/lib/settingsServer';
import { getDatabasePageBySlug } from '@/lib/pageServer';

export async function generateMetadata({ params }: CustomPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerSettings();
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const page = await getDatabasePageBySlug(slug);
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
