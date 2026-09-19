import React from 'react';
import { Metadata } from 'next';
import { getServerSettingsAsync } from '@/lib/settingsServer';
import { getServerBlogs, getServerBlogBySlug } from '@/lib/blogServer';
import { BlogDetailClient } from './BlogDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogDetailProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerSettingsAsync();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';

  const post = getServerBlogBySlug(slug);

  if (!post) {
    const formattedTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `${formattedTitle} | ${brand} Blog`,
      description: `Read the latest tech guides and deal analysis on ${brand}.`,
    };
  }

  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: `${post.title} | ${brand} Blog`,
    description: post.excerpt,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: postUrl,
      siteName: brand,
      type: 'article',
      publishedTime: post.date,
      images: post.imageUrl ? [{ url: post.imageUrl, alt: post.imageAlt || post.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const settings = await getServerSettingsAsync();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const logoUrl = settings.logoUrl || '/logo.png';

  const allBlogs = getServerBlogs();
  const post = allBlogs.find((p) => p.slug === slug || p.id === slug) || null;
  const relatedPosts = post
    ? allBlogs.filter((p) => p.slug !== post.slug).slice(0, 2)
    : allBlogs.slice(0, 2);

  return (
    <div className="container max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <BlogDetailClient
        key={slug}
        slug={slug}
        initialPost={post}
        initialRelatedPosts={relatedPosts}
        siteUrl={siteUrl}
        brand={brand}
        logoUrl={logoUrl}
      />
    </div>
  );
}
