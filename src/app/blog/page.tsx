import React from 'react';
import { Metadata } from 'next';
import { getServerBlogs, getServerBlogCategories } from '@/lib/blogServer';
import { BlogListClient } from './BlogListClient';
import { getServerSettings } from '@/lib/settingsServer';

export async function generateMetadata(): Promise<Metadata> {
  const settings = getServerSettings();
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

export default function BlogListingPage() {
  const posts = getServerBlogs();
  const categories = getServerBlogCategories();

  return (
    <div className="container max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <BlogListClient
        initialPosts={posts}
        initialCategories={categories}
      />
    </div>
  );
}
