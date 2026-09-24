import React from 'react';
import { Metadata } from 'next';
import { getServerBlogs, getServerBlogCategories } from '@/lib/blogServer';
import { BlogListClient } from './BlogListClient';
import { getServerSettings } from '@/lib/settingsServer';
import { AdSlot } from '@/components/ads/AdSlot';
import { optimizeImageUrl } from '@/lib/imageOptimization';

import { buildOpenGraphImages } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerSettings();
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const title = `Tech Buying Guides & Price Analysis Blog | ${brand}`;
  const description = `In-depth price comparisons, tech buying guides, and electronics deal reviews across US retailers like Amazon, Walmart, Best Buy, and Target.`;
  const ogData = buildOpenGraphImages(
    settings.ogImageUrl,
    siteUrl,
    `${siteUrl}/hero.webp`,
    title
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/blog`,
    },
    openGraph: {
      title: `Tech Buying Guides & Deal Reviews | ${brand}`,
      description,
      url: `${siteUrl}/blog`,
      siteName: brand,
      locale: 'en_US',
      type: 'website',
      images: ogData.images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Tech Buying Guides & Deal Reviews | ${brand}`,
      description,
      images: ogData.twitterImages,
    },
  };
}

// Blog listing revalidates every 24 hours (or on-demand when a blog is published/edited)
export const revalidate = 86400;

export default async function BlogListingPage() {
  const posts = await getServerBlogs();
  const categories = await getServerBlogCategories();
  const firstPostImage = posts.length > 0 && posts[0].imageUrl ? optimizeImageUrl(posts[0].imageUrl, 640) : null;

  return (
    <div className="container max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      {firstPostImage && (
        <link
          rel="preload"
          as="image"
          href={firstPostImage}
          fetchPriority="high"
        />
      )}

      {/* Ad Placement: Top of Blog Page Banner */}
      <AdSlot placement="blog_top" />

      <React.Suspense
        fallback={
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-xs font-bold text-muted-foreground">Loading articles...</div>
          </div>
        }
      >
        <BlogListClient
          initialPosts={posts}
          initialCategories={categories}
        />
      </React.Suspense>
    </div>
  );
}
