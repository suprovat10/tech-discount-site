import { getSiteKV, setSiteKV } from '../db/kv';
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
  try {
    const clicks = (await getSiteKV<any[]>('affiliate_clicks')) || [];
    const newClick = {
      id: `clk-${Date.now()}`,
      retailer: options.retailer,
      retailerItemId: options.retailerItemId,
      productId: options.productId,
      ipHash,
      userAgent: options.userAgent,
      referrer: options.referrer,
      destinationUrl: options.destinationUrl,
      timestamp: new Date().toISOString(),
    };
    const updated = [newClick, ...clicks.slice(0, 999)];
    await setSiteKV('affiliate_clicks', updated);
  } catch (err) {
    console.warn('Failed to log affiliate click:', err);
  }
}
