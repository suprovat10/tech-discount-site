import type { Metadata } from 'next';
import { CouponsClient } from './CouponsClient';

import { getServerSettings } from '@/lib/settingsServer';

export async function generateMetadata(): Promise<Metadata> {
  const settings = getServerSettings();
  const brand = settings.siteBrandName || 'suprodesign';
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';

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
