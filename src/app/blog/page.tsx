import React from 'react';
import { Metadata } from 'next';
import { getServerBlogs, getServerBlogCategories } from '@/lib/blogServer';
import { BlogListClient } from './BlogListClient';
import { getServerSettings } from '@/lib/settingsServer';
import { AdSlot } from '@/components/ads/AdSlot';
import { optimizeImageUrl } from '@/lib/imageOptimization';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerSettings();
  const brand = settings.siteBrandName || 'suprodesign';
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';

  return {
    title: `Tech Buying Guides & Price Analysis Blog | ${brand}`,
    description: `In-depth price comparisons, tech buying guides, and electronics deal reviews across US retailers like Amazon, Walmart, Best Buy, and Target.`,
    alternates: {
      canonical: `${siteUrl}/blog`,
    },
    openGraph: {
      title: `Tech Buying Guides & Deal Reviews | ${brand}`,
      description: `In-depth tech price comparisons and expert buying guides.`,
      url: `${siteUrl}/blog`,
      siteName: brand,
    },
  };
}

export const revalidate = 30;

interface BlogListingPageProps {
  searchParams?: Promise<{ category?: string; cat?: string }>;
}

export default async function BlogListingPage({ searchParams }: BlogListingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialCategory = resolvedSearchParams?.category || resolvedSearchParams?.cat || 'all';

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
          initialCategory={initialCategory}
        />
      </React.Suspense>
    </div>
  );
}
