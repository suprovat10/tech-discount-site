import type { Metadata } from 'next';
import { CouponsClient } from './CouponsClient';
import { getServerSettings } from '@/lib/settingsServer';
import { getSiteKV } from '@/lib/db/kv';
import { DEFAULT_COUPONS, CouponItem } from '@/data/coupons';

// Coupons page revalidates every 12 hours (or on-demand when coupons are updated in admin)
export const revalidate = 43200;

import { buildOpenGraphImages } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerSettings();
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const title = `Verified Tech Coupons & Promo Codes | ${brand}`;
  const description = `Save with verified working discount codes, promo codes, and special tech deals across Amazon, Best Buy, Walmart, Target, and leading tech stores.`;
  const ogData = buildOpenGraphImages(
    settings.ogImageUrl,
    siteUrl,
    `${siteUrl}/hero.webp`,
    title
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/coupons`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/coupons`,
      siteName: brand,
      locale: 'en_US',
      type: 'website',
      images: ogData.images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogData.twitterImages,
    },
  };
}

export default async function CouponsPage() {
  let initialCoupons: CouponItem[] = DEFAULT_COUPONS;
  try {
    const cloud = await getSiteKV<CouponItem[]>('coupons_catalog');
    if (cloud !== null && Array.isArray(cloud)) {
      initialCoupons = cloud;
    }
  } catch (err) {
    console.warn('Failed to load cloud coupons for SSR:', err);
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <CouponsClient initialCoupons={initialCoupons} />
    </div>
  );
}

