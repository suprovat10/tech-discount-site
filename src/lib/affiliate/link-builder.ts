import { adapterRegistry } from '../adapters';
import { RetailerId } from '@/types/product';

export class AffiliateLinkBuilder {
  /**
   * Generates a fully formed, verified affiliate tracking URL for any retailer
   */
  static generateDirectUrl(retailer: RetailerId, itemId: string, rawProductUrl?: string): string {
    const adapter = adapterRegistry.getAdapter(retailer as any);
    if (!adapter) {
      return rawProductUrl || '#';
    }

    const fallbackUrl = this.getDefaultProductUrl(retailer, itemId);
    return adapter.buildAffiliateUrl(rawProductUrl || fallbackUrl, itemId);
  }

  /**
   * Generates our secure internal redirect URL
   */
  static generateInternalGoUrl(retailer: RetailerId, itemId: string): string {
    return `/go/${retailer}/${encodeURIComponent(itemId)}`;
  }

  private static getDefaultProductUrl(retailer: RetailerId, itemId: string): string {
    switch (retailer) {
      case 'amazon':
        return `https://www.amazon.com/dp/${encodeURIComponent(itemId)}`;
      case 'walmart':
        return `https://www.walmart.com/ip/${encodeURIComponent(itemId)}`;
      case 'bestbuy':
        return `https://www.bestbuy.com/site/${encodeURIComponent(itemId)}.p`;
      case 'target':
        return `https://www.target.com/p/-/A-${encodeURIComponent(itemId)}`;
      default:
        return '#';
    }
  }
}
