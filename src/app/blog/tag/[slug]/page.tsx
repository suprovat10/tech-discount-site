import React from 'react';
import { Metadata } from 'next';
import { getServerBlogs, getServerBlogCategories } from '@/lib/blogServer';
import { getServerSettings } from '@/lib/settingsServer';
import { slugifyTag } from '@/lib/productTagStore';
import { BlogTagClient } from './BlogTagClient';

export const revalidate = 30;

interface BlogTagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogTagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const settings = await getServerSettings();
  const brand = settings.siteBrandName || 'suprodesign';
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';

  const tagName = cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const tagUrl = `${siteUrl}/blog/tag/${cleanSlug}`;

  return {
    title: `${tagName} - Tech Guides & Articles | ${brand}`,
    description: `Read in-depth tech buying guides, price drop reviews, and analysis tagged with #${tagName}. Compare deals and make smart purchasing decisions.`,
    alternates: {
      canonical: tagUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${tagName} Tech Articles & Guides | ${brand}`,
      description: `Expert articles and deal reviews tagged with #${tagName}.`,
      url: tagUrl,
      siteName: brand,
    },
  };
}

export default async function BlogTagPage({ params }: BlogTagPageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

  const settings = await getServerSettings();
  const brand = settings.siteBrandName || 'suprodesign';
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';

  const allPosts = await getServerBlogs();
  const categories = await getServerBlogCategories();

  // Find exact display tag name from actual post tags if available
  let matchedTagName = cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  for (const p of allPosts) {
    const t = p.tags?.find((tag) => slugifyTag(tag) === cleanSlug);
    if (t) {
      matchedTagName = t;
      break;
    }
  }

  const tagUrl = `${siteUrl}/blog/tag/${cleanSlug}`;

  const tagPosts = allPosts.filter((p) =>
    p.tags?.some((t) => slugifyTag(t) === cleanSlug)
  );

  // Schema.org Structured Data
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: matchedTagName, item: tagUrl },
    ],
  };

  const jsonLdCollection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${matchedTagName} - Tech Guides & Articles`,
    description: `Expert tech articles and buying advice tagged with #${matchedTagName}.`,
    url: tagUrl,
    publisher: {
      '@type': 'Organization',
      name: brand,
      url: siteUrl,
    },
  };

  return (
    <div className="container max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }}
      />
      <BlogTagClient
        slug={cleanSlug}
        tagName={matchedTagName}
        initialPosts={tagPosts}
        allCategories={categories}
      />
    </div>
  );
}
