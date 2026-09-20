import React from 'react';
import { Metadata } from 'next';
import { getServerSettings } from '@/lib/settingsServer';
import { getServerBlogs, getServerBlogBySlug } from '@/lib/blogServer';
import { BlogDetailClient } from './BlogDetailClient';

interface BlogDetailProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 30;

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';
  const brand = settings.siteBrandName || 'suprodesign';

  const post = await getServerBlogBySlug(slug);

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
  const settings = getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';
  const brand = settings.siteBrandName || 'suprodesign';
  const logoUrl = settings.logoUrl || '/logo.png';

  const allBlogs = await getServerBlogs();
  const post = allBlogs.find((p) => p.slug === slug || p.id === slug) || null;
  const relatedPosts = post
    ? allBlogs.filter((p) => p.slug !== post.slug).slice(0, 2)
    : allBlogs.slice(0, 2);

  return (
    <div className="container max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <BlogDetailClient
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
