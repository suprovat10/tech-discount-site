import { AvailabilityStatus, RetailerId } from './product';

export interface SearchQueryOptions {
  query: string;
  category?: string;
  limit?: number;
}

export interface ProductLookupOptions {
  itemId: string;
  upc?: string;
}

export interface RetailerSearchResult {
  retailer: RetailerId;
  retailerItemId: string;
  title: string;
  brand: string;
  category?: string;
  imageUrl: string;
  price: number;
  regularPrice?: number;
  productUrl: string;
  isInStock: boolean;
  availabilityStatus: AvailabilityStatus;
  shippingInfo?: string;
  upc?: string;
  modelNumber?: string;
  description?: string;
  condition?: 'New' | 'Refurbished';
  rating?: number;
  ratingCount?: number;
}

export interface IRetailerAdapter {
  readonly retailerId: RetailerId;
  readonly retailerName: string;
  isConfigured(): boolean;
  searchProducts(options: SearchQueryOptions): Promise<RetailerSearchResult[]>;
  getProductDetails(options: ProductLookupOptions): Promise<RetailerSearchResult | null>;
  buildAffiliateUrl(rawUrl: string, itemId: string): string;
}

export interface AdapterExecutionResult {
  retailerId: RetailerId;
  status: 'fulfilled' | 'rejected';
  data?: RetailerSearchResult[];
  error?: string;
  durationMs: number;
}
