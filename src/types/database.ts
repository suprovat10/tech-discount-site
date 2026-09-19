import { RetailerId } from './product';

export interface DbProduct {
  id: string;
  upc: string | null;
  sku: string | null;
  model_number: string | null;
  brand: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  main_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRetailerProduct {
  id: string;
  product_id: string;
  retailer: RetailerId;
  retailer_item_id: string;
  product_url: string;
  created_at: string;
  updated_at: string;
}

export interface DbOffer {
  id: string;
  retailer_product_id: string;
  product_id: string;
  retailer: RetailerId;
  price: number;
  regular_price: number | null;
  currency: string;
  is_in_stock: boolean;
  availability_status: string;
  shipping_info: string | null;
  affiliate_url: string;
  last_checked_at: string;
  expires_at: string;
  created_at: string;
}

export interface DbCoupon {
  id: string;
  retailer: RetailerId;
  code: string | null;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number | null;
  min_purchase: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_verified: boolean;
  affiliate_url: string | null;
  created_at: string;
}

export interface DbSearchCache {
  id: string;
  query_hash: string;
  query_text: string;
  results_json: any;
  created_at: string;
  expires_at: string;
}

export interface DbAffiliateClick {
  id: string;
  retailer: RetailerId;
  retailer_item_id: string;
  product_id: string | null;
  ip_hash: string;
  user_agent: string | null;
  referrer: string | null;
  destination_url: string;
  created_at: string;
}
