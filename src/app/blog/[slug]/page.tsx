import React from 'react';
import { Metadata } from 'next';
import { getServerSettings } from '@/lib/settingsServer';
import { getServerBlogs, getServerBlogBySlug } from '@/lib/blogServer';
import { BlogDetailClient } from './BlogDetailClient';

export const revalidate = 30;

export async function generateStaticParams() {
  const blogs = await getServerBlogs();
  return blogs.map((b) => ({
    slug: b.slug,
  }));
}

interface BlogDetailProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerSettings();
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
      publishedTime: (() => {
        try {
          const d = new Date(post.date);
          return isNaN(d.getTime()) ? undefined : d.toISOString();
        } catch {
          return undefined;
        }
      })(),
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

import { getDatabaseProducts } from '@/lib/catalogDb';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { DEFAULT_BRANDS } from '@/data/brands';
import { optimizeImageUrl } from '@/lib/imageOptimization';

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'suprodesign';
  const logoUrl = settings.logoUrl || '/logo.png';

  const [allBlogs, catalog] = await Promise.all([
    getServerBlogs(),
    getDatabaseProducts().catch(() => []),
  ]);

  const post = allBlogs.find((p) => p.slug === slug || p.id === slug) || null;

  // 4 related articles from the same category
  let relatedPosts: typeof allBlogs = [];
  if (post) {
    const currentCategory = (post.category || '').trim().toLowerCase();
    const sameCatPosts = currentCategory
      ? allBlogs.filter((p) => p.slug !== post.slug && (p.category || '').trim().toLowerCase() === currentCategory)
      : [];
    const otherPosts = allBlogs.filter(
      (p) => p.slug !== post.slug && (p.category || '').trim().toLowerCase() !== currentCategory
    );
    relatedPosts = [...sameCatPosts, ...otherPosts].slice(0, 4);
  } else {
    relatedPosts = allBlogs.slice(0, 4);
  }

  // Top 4 featured products for right sidebar
  const allProducts = catalog.map(transformCatalogItemToUnified);
  const featuredProducts = [...allProducts]
    .sort((a, b) => (b.views || b.ratingCount || 0) - (a.views || a.ratingCount || 0))
    .slice(0, 4);

  const brands = DEFAULT_BRANDS.filter((b) => b.isActive !== false);

  return (
    <div className="container max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
      {post?.imageUrl && (
        <link
          rel="preload"
          as="image"
          href={optimizeImageUrl(post.imageUrl, 800)}
          fetchPriority="high"
        />
      )}
      <BlogDetailClient
        slug={slug}
        initialPost={post}
        initialRelatedPosts={relatedPosts}
        featuredProducts={featuredProducts}
        brands={brands}
        siteUrl={siteUrl}
        brand={brand}
        logoUrl={logoUrl}
      />
    </div>
  );
}
