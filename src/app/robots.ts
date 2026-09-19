import { MetadataRoute } from 'next';
import { getServerSettings } from '@/lib/settingsServer';

export default function robots(): MetadataRoute.Robots {
  const settings = getServerSettings();
  const baseUrl = settings.canonicalUrl?.replace(/\/$/, '') || 'https://suprodesign.com';

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
