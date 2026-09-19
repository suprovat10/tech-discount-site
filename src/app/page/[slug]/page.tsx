import React from 'react';
import { Metadata } from 'next';
import { PolicyPageClient } from '@/components/common/PolicyPageClient';

interface CustomPageRouteProps {
  params: Promise<{ slug: string }>;
}

import { getServerSettings } from '@/lib/settingsServer';
import { getPageBySlug } from '@/lib/pageStore';

export async function generateMetadata({ params }: CustomPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = getServerSettings();
  const brand = settings.siteBrandName || 'suprodesign';
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
