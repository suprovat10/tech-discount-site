import { MetadataRoute } from 'next';
import { getServerSettingsAsync } from '@/lib/settingsServer';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getServerSettingsAsync();
  const baseUrl = settings.canonicalUrl?.replace(/\/$/, '') || 'https://www.techpricedrop.com';

  const isIndexingAllowed = settings.indexingEnabled !== false;

  return {
    rules: [
      {
        userAgent: '*',
        allow: isIndexingAllowed ? '/' : undefined,
        disallow: isIndexingAllowed ? ['/supro111vat29/', '/admin/', '/api/', '/go/'] : '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
