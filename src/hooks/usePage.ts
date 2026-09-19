'use client';

import { useState, useEffect } from 'react';
import { getPageBySlug } from '@/lib/pageStore';
import { DEFAULT_PAGES, SitePage } from '@/data/defaultPages';

export function usePage(slug: string): SitePage {
  const fallback = DEFAULT_PAGES.find((p) => p.slug === slug) || {
    id: `page-${slug}`,
    slug,
    title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
    content: '<p>Content coming soon...</p>',
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  const [page, setPage] = useState<SitePage>(fallback);

  useEffect(() => {
    const loaded = getPageBySlug(slug);
    if (loaded) {
      setPage(loaded);
    }

    const handleUpdate = () => {
      const updated = getPageBySlug(slug);
      if (updated) {
        setPage(updated);
      }
    };

    window.addEventListener('smarttech_pages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('smarttech_pages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [slug]);

  return page;
}
