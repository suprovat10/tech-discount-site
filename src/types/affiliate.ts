import { RetailerId } from './product';

export interface AffiliateClickLog {
  id?: string;
  retailer: RetailerId;
  retailerItemId: string;
  productId?: string;
  ipHash: string;
  userAgent?: string;
  referrer?: string;
  destinationUrl: string;
  createdAt?: string;
}

export interface RedirectVerificationResult {
  valid: boolean;
  destinationUrl?: string;
  retailer?: RetailerId;
  itemId?: string;
  error?: string;
}

export interface RetailerSecurityRule {
  allowedDomains: string[];
  affiliateParamKey: string;
  defaultTag: string;
}
