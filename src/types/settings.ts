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
  googleAdSenseId?: string;
  globalAdHeaderCode?: string;
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
  heroImageLink?: string;
  heroImageNewTab?: boolean;
  heroPrimaryBtnText?: string;
  heroPrimaryBtnUrl?: string;
  heroPrimaryBtnNewTab?: boolean;
  heroPrimaryBtnShowIcon?: boolean;
  heroSecondaryBtnText?: string;
  heroSecondaryBtnUrl?: string;
  heroSecondaryBtnNewTab?: boolean;
  heroSecondaryBtnShowIcon?: boolean;
  heroBadgeText?: string;
  categorySliderAlignment?: 'left' | 'center' | 'right';
  categorySliderLayout?: 'slider' | 'wrap';
  categorySliderHidden?: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'TechPriceDrop - Real-Time Tech Price Comparison & Deals',
  metaDescription:
    'Find the lowest prices and best discounts on tech gadgets, laptops, smartphones, and accessories across major US retailers like Amazon, Walmart, Best Buy, and Target.',
  keywords:
    'deals, discounts, price comparison, amazon, walmart, best buy, target, tech gadgets, laptops, electronics price tracker',
  canonicalUrl: 'https://www.techpricedrop.com',
  ogImageUrl:
    'https://res.cloudinary.com/koayelts/image/upload/f_auto,q_auto,w_1600,c_limit/v1790111032/techpricedrop/branding/uc66jnomvw4tnewyy2mq.jpg',
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
  googleAnalyticsId: 'G-7LLKVZYHWG',
  googleTagManagerId: '',
  facebookPixelId: '',
  tiktokPixelId: '',
  googleSiteVerification: '',
  bingSiteVerification: '',
  googleAdSenseId: '',
  globalAdHeaderCode: '',
  amazonTag: 'smarttechdeals-20',
  walmartPartnerId: 'WMT-PARTNER-40291',
  bestBuyAffiliateId: 'BBY-CJ-908122',
  targetImpactId: 'TGT-IMPACT-18274',
  defaultCurrency: 'USD ($)',
  priceCheckIntervalMinutes: 60,
  heroTitleLine1: 'Compare tech prices.',
  heroTitleLine2: 'Never overpay today!',
  heroSubtitle:
    'Instantly compare real-time offers and verified discounts from Amazon, Walmart, Best Buy, and Target before making any purchase.',
  heroImageUrl:
    'https://res.cloudinary.com/koayelts/image/upload/f_auto,q_auto,w_1600,c_limit/v1790111669/techpricedrop/hero/brrklc8lesvqxe3zkqrg.jpg',
  heroImageAlt: 'MacBook and Tech Gear',
  heroImageLink: '',
  heroImageNewTab: false,
  heroPrimaryBtnText: 'Browse Products',
  heroPrimaryBtnUrl: '/products',
  heroPrimaryBtnNewTab: false,
  heroPrimaryBtnShowIcon: true,
  heroSecondaryBtnText: "Today's Best Deals",
  heroSecondaryBtnUrl: '/products?sort=highest-savings',
  heroSecondaryBtnNewTab: false,
  heroSecondaryBtnShowIcon: true,
  heroBadgeText: '',
  categorySliderAlignment: 'center',
  categorySliderLayout: 'slider',
  categorySliderHidden: false,
};
