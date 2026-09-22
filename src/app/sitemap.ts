import { MetadataRoute } from 'next';
import { getServerSettings } from '@/lib/settingsServer';
import { getDatabaseCategories } from '@/lib/categoryServer';
import { getDatabaseProducts } from '@/lib/catalogDb';
import { getServerBlogs } from '@/lib/blogServer';
import { DEFAULT_BRANDS } from '@/data/brands';
import { DEFAULT_PAGES } from '@/data/defaultPages';
import { getProductTagsServer } from '@/lib/productTagServer';
import { slugifyTag } from '@/lib/productTagStore';
import { ProductTag } from '@/types/tag';

function formatW3CDate(dateInput?: string | null): string {
  if (!dateInput) return new Date().toISOString();
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getServerSettings();
  const categories = await getDatabaseCategories();
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
  categories.forEach((cat) => {
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

  // 3. Dynamic Products from Database
  const products = await getDatabaseProducts();
  const productRoutes = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: formatW3CDate(p.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // 4. Dynamic Blog Articles
  const blogs = await getServerBlogs();
  const blogRoutes = blogs.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: formatW3CDate(post.updatedAt || post.date),
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
    lastModified: formatW3CDate(page.lastUpdated),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // 7. Dynamic Product Tag Pages
  const productTags = await getProductTagsServer();
  const productTagRoutes = productTags
    .filter((tag: ProductTag) => !tag.seo?.noIndex)
    .map((tag: ProductTag) => ({
      url: `${baseUrl}/tag/${tag.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

  // 8. Dynamic Blog Tag Pages
  const uniqueBlogTagSlugs = new Set<string>();
  blogs.forEach((post) => {
    (post.tags || []).forEach((t) => {
      const s = slugifyTag(t);
      if (s) uniqueBlogTagSlugs.add(s);
    });
  });
  const blogTagRoutes = Array.from(uniqueBlogTagSlugs).map((slug) => ({
    url: `${baseUrl}/blog/tag/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  return [
    ...coreRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...blogRoutes,
    ...brandRoutes,
    ...cmsRoutes,
    ...productTagRoutes,
    ...blogTagRoutes,
  ];
}
