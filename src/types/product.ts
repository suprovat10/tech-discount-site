export type RetailerId = 'amazon' | 'walmart' | 'bestbuy' | 'target' | (string & {});

export type AvailabilityStatus = 'In Stock' | 'Out of Stock' | 'Pre-order' | 'Limited Stock';

export interface ProductOffer {
  retailer: RetailerId;
  retailerName: string;
  retailerItemId: string; // ASIN, ItemId, SKU, TCIN
  productUrl: string;
  directAffiliateUrl: string;
  internalGoUrl: string;
  price: number;
  regularPrice?: number;
  currency: 'USD';
  savingsAmount?: number;
  savingsPercentage?: number;
  isLowestPrice: boolean;
  isInStock: boolean;
  availabilityStatus: AvailabilityStatus;
  shippingInfo?: string;
  condition: 'New' | 'Refurbished';
  lastUpdated: string;
  merchantName?: string;
}

export interface RetailerCoupon {
  id: string;
  retailer: RetailerId;
  code?: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue?: number;
  minPurchase?: number;
  expiresAt?: string;
  isVerified: boolean;
  affiliateUrl?: string;
}

export interface UnifiedProduct {
  id: string;
  title: string;
  slug: string;
  brand: string;
  category: string;
  subcategory?: string;
  badge?: string;
  upc?: string;
  sku?: string;
  modelNumber?: string;
  description: string;
  richDescription?: string;
  features?: string[];
  specs?: Record<string, string>;
  keySpecs?: Record<string, string>;
  faqs?: { question: string; answer: string }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    ogImageUrl?: string;
    ogImageAlt?: string;
    canonicalUrl?: string;
  };
  imageUrl: string;
  imageAlt?: string;
  images?: string[];
  imageAlts?: string[];
  lowestPrice: number;
  highestPrice: number;
  regularPrice?: number;
  maxSavingsPercentage?: number;
  offers: ProductOffer[];
  coupons?: RetailerCoupon[];
  rating?: number;
  ratingCount?: number;
  views?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt: string;
  lastUpdated?: string;
}

export interface SearchFilterState {
  query: string;
  category?: string;
  retailer?: RetailerId | 'all';
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'lowest_price' | 'highest_savings' | 'relevance';
}
