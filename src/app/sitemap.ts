import { MetadataRoute } from 'next';
import { getServerSettingsAsync } from '@/lib/settingsServer';
import { PRODUCTS_CATALOG, CATEGORIES } from '@/data/catalog';
import { BLOG_POSTS } from '@/data/blogs';
import { DEFAULT_BRANDS } from '@/data/brands';
import { DEFAULT_PAGES } from '@/data/defaultPages';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getServerSettingsAsync();
  const baseUrl = settings.canonicalUrl?.replace(/\/$/, '') || 'https://www.techpricedrop.com';

  const now = new Date().toISOString();

  // 1. Core Top-Level Routes
  const coreRoutes = [
    { route: '', priority: 1.0, changeFrequency: 'daily' as const },
    { route: '/products', priority: 0.9, changeFrequency: 'hourly' as const },
    { route: '/coupons', priority: 0.9, changeFrequency: 'daily' as const },
    { route: '/blog', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/watchlist', priority: 0.5, changeFrequency: 'weekly' as const },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // 2. Dynamic Category & Subcategory Pages
  const categoryRoutes: MetadataRoute.Sitemap = [];
  CATEGORIES.forEach((cat) => {
    categoryRoutes.push({
      url: `${baseUrl}/products/${cat.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    });
    cat.subcategories?.forEach((sub) => {
      categoryRoutes.push({
        url: `${baseUrl}/products/${cat.slug}/${sub.slug}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      });
    });
  });

  // 3. Dynamic Products
  const productRoutes = PRODUCTS_CATALOG.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updatedAt || now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 4. Dynamic Blog Articles
  const blogRoutes = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date || now,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  // 5. Dynamic Brand Showcase Pages
  const brandRoutes = DEFAULT_BRANDS.map((brand) => ({
    url: `${baseUrl}/brand/${brand.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 6. CMS & Information Pages
  const cmsRoutes = DEFAULT_PAGES.map((page) => ({
    url: `${baseUrl}/${page.slug.replace(/^\/+/, '')}`,
    lastModified: page.lastUpdated || now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...coreRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...blogRoutes,
    ...brandRoutes,
    ...cmsRoutes,
  ];
}
