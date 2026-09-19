export interface SiteSettings {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogImageUrl: string;
  indexingEnabled: boolean;
  logoUrl: string;
  faviconUrl: string;
  siteBrandName: string;
  footerBioText: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  socialTwitter: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  facebookPixelId: string;
  tiktokPixelId: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  amazonTag: string;
  walmartPartnerId: string;
  bestBuyAffiliateId: string;
  targetImpactId: string;
  defaultCurrency: string;
  priceCheckIntervalMinutes: number;
  heroTitleLine1?: string;
  heroTitleLine2?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  heroPrimaryBtnText?: string;
  heroPrimaryBtnUrl?: string;
  heroSecondaryBtnText?: string;
  heroSecondaryBtnUrl?: string;
  heroBadgeText?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'TechPriceDrop - Real-Time Tech Price Comparison & Deals',
  metaDescription:
    'Find the lowest prices and best discounts on tech gadgets, laptops, smartphones, and accessories across major US retailers like Amazon, Walmart, Best Buy, and Target.',
  keywords:
    'deals, discounts, price comparison, amazon, walmart, best buy, target, tech gadgets, laptops, electronics price tracker',
  canonicalUrl: 'https://www.techpricedrop.com',
  ogImageUrl:
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  indexingEnabled: true,
  logoUrl: '/logo-techpricedrop.png',
  faviconUrl: '/favicon-techpricedrop.png',
  siteBrandName: 'TechPriceDrop',
  footerBioText:
    'TechPriceDrop is a real-time price comparison and deals discovery engine. We scan authorized retailers like Amazon, Walmart, Best Buy, and Target so you never overpay for tech.',
  socialFacebook: 'https://facebook.com',
  socialInstagram: 'https://instagram.com',
  socialYoutube: 'https://youtube.com',
  socialTwitter: 'https://twitter.com',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',
  tiktokPixelId: '',
  googleSiteVerification: '',
  bingSiteVerification: '',
  amazonTag: 'smarttechdeals-20',
  walmartPartnerId: 'WMT-PARTNER-40291',
  bestBuyAffiliateId: 'BBY-CJ-908122',
  targetImpactId: 'TGT-IMPACT-18274',
  defaultCurrency: 'USD ($)',
  priceCheckIntervalMinutes: 60,
  heroTitleLine1: 'Compare tech prices.',
  heroTitleLine2: 'Never overpay.',
  heroSubtitle:
    'Instantly compare real-time offers and verified discounts from Amazon, Walmart, Best Buy, and Target before making any purchase.',
  heroImageUrl:
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&q=80',
  heroImageAlt: 'MacBook and Tech Gear',
  heroPrimaryBtnText: 'Browse Products',
  heroPrimaryBtnUrl: '/products',
  heroSecondaryBtnText: "Today's Best Deals",
  heroSecondaryBtnUrl: '/products?sort=highest-savings',
  heroBadgeText: '',
};
