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
  const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';

  const post = await getServerBlogBySlug(slug);

  if (!post) {
    const formattedTitle = decodedSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `${formattedTitle} | ${brand} Blog`,
      description: `Read the latest tech guides and deal analysis on ${brand}.`,
    };
  }

  const postUrl = post.seo?.canonicalUrl || `${siteUrl}/blog/${post.slug}`;
  const metaTitle = post.seo?.metaTitle || `${post.title} | ${brand} Blog`;
  const metaDescription = post.seo?.metaDescription || post.excerpt;
  const keywordsList = post.seo?.keywords
    ? post.seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : post.tags;

  const socialImgUrl = post.seo?.ogImageUrl || post.imageUrl || settings.ogImageUrl || '';
  const socialImgAlt = post.seo?.ogImageAlt || post.imageAlt || post.title;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywordsList,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.seo?.metaTitle || post.title,
      description: metaDescription,
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
      images: socialImgUrl ? [{ url: socialImgUrl, alt: socialImgAlt }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.metaTitle || post.title,
      description: metaDescription,
      images: socialImgUrl ? [socialImgUrl] : [],
    },
  };
}

import { getDatabaseProducts } from '@/lib/catalogDb';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { DEFAULT_BRANDS } from '@/data/brands';
import { optimizeImageUrl } from '@/lib/imageOptimization';

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
  const rawClean = slug.toLowerCase().trim();
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const logoUrl = settings.logoUrl || '/logo-techpricedrop.png';

  const [allBlogs, catalog] = await Promise.all([
    getServerBlogs(),
    getDatabaseProducts().catch(() => []),
  ]);

  const post =
    allBlogs.find(
      (p) =>
        p.slug.toLowerCase().trim() === decodedSlug ||
        p.slug.toLowerCase().trim() === rawClean ||
        p.id === slug ||
        p.id === decodedSlug
    ) || null;

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
