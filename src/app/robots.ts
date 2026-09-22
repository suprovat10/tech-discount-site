import { MetadataRoute } from 'next';
import { getServerSettings } from '@/lib/settingsServer';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getServerSettings();
  const baseUrl = settings.canonicalUrl?.replace(/\/$/, '') || 'https://www.techpricedrop.com';

  const isIndexingAllowed = settings.indexingEnabled !== false;

  return {
    rules: [
      {
        userAgent: '*',
        allow: isIndexingAllowed ? '/' : undefined,
        disallow: isIndexingAllowed ? ['/admin/', '/api/', '/go/'] : '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
