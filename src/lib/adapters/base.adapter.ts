import {
  IRetailerAdapter,
  ProductLookupOptions,
  RetailerSearchResult,
  SearchQueryOptions,
} from '@/types/adapters';
import { RetailerId } from '@/types/product';

export abstract class BaseAdapter implements IRetailerAdapter {
  abstract readonly retailerId: RetailerId;
  abstract readonly retailerName: string;

  abstract isConfigured(): boolean;
  abstract searchProducts(options: SearchQueryOptions): Promise<RetailerSearchResult[]>;
  abstract getProductDetails(options: ProductLookupOptions): Promise<RetailerSearchResult | null>;
  abstract buildAffiliateUrl(rawUrl: string, itemId: string): string;

  /**
   * Helper to execute API requests with timeout and error protection
   */
  protected async safeFetch<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs = 8000
  ): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TechPriceEngine/1.0 (PriceComparisonBot)',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `[${this.retailerName} Adapter] HTTP error: ${response.status} ${response.statusText} for URL: ${url}`
        );
        return null;
      }

      return (await response.json()) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`[${this.retailerName} Adapter] Request timed out after ${timeoutMs}ms: ${url}`);
      } else {
        console.error(`[${this.retailerName} Adapter] Fetch exception:`, error.message);
      }
      return null;
    }
  }

  /**
   * Cleans text and strings returned by APIs
   */
  protected sanitizeText(text?: string | null): string {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '').trim();
  }
}
