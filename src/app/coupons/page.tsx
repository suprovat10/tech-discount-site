import type { Metadata } from 'next';
import { CouponsClient } from './CouponsClient';

import { getServerSettingsAsync } from '@/lib/settingsServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerSettingsAsync();
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';

  return {
    title: `Verified Tech Coupons & Promo Codes | ${brand}`,
    description: `Save with verified working discount codes, promo codes, and special tech deals across Amazon, Best Buy, Walmart, Target, and leading tech stores.`,
    alternates: {
      canonical: `${siteUrl}/coupons`,
    },
    openGraph: {
      title: `Verified Tech Coupons & Promo Codes | ${brand}`,
      description: `Save with verified working promo codes and discounts across Amazon, Best Buy, Walmart, and Target.`,
      url: `${siteUrl}/coupons`,
      siteName: brand,
    },
  };
}

export default function CouponsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      <CouponsClient />
    </div>
  );
}
