import { logAffiliateClick } from '../db/queries';
import { RedirectGuard } from './redirect-guard';
import { RetailerId } from '@/types/product';

export async function trackAffiliateClick(options: {
  retailer: RetailerId;
  retailerItemId: string;
  destinationUrl: string;
  ip: string;
  userAgent?: string;
  referrer?: string;
  productId?: string;
}): Promise<void> {
  const ipHash = RedirectGuard.hashIpAddress(options.ip);

  // Fire and forget so user redirect isn't blocked
  logAffiliateClick({
    retailer: options.retailer,
    retailerItemId: options.retailerItemId,
    productId: options.productId,
    ipHash,
    userAgent: options.userAgent,
    referrer: options.referrer,
    destinationUrl: options.destinationUrl,
  }).catch((err) => {
    console.error('Failed to log affiliate click asynchronously:', err);
  });
}
