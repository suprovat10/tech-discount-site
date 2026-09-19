import crypto from 'crypto';
import { RetailerId } from '@/types/product';
import { RedirectVerificationResult } from '@/types/affiliate';

// Strict domain allowlist for retail partners
const ALLOWED_RETAILER_DOMAINS: Record<RetailerId, string[]> = {
  amazon: ['amazon.com', 'www.amazon.com', 'amzn.to', 'webservices.amazon.com'],
  walmart: ['walmart.com', 'www.walmart.com', 'goto.walmart.com'],
  bestbuy: ['bestbuy.com', 'www.bestbuy.com', 'bestbuy.7tiv.net'],
  target: ['target.com', 'www.target.com', 'goto.target.com'],
};

export class RedirectGuard {
  /**
   * Validates destination URL against strict domain allowlists to prevent Open Redirect attacks
   */
  static isDomainAllowed(urlStr: string, retailer: RetailerId): boolean {
    try {
      const url = new URL(urlStr);
      const hostname = url.hostname.toLowerCase();
      const allowed = ALLOWED_RETAILER_DOMAINS[retailer] || [];

      return allowed.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Generates an anonymized IP hash for compliant analytics without storing PII
   */
  static hashIpAddress(ip: string): string {
    const salt = process.env.REDIRECT_SIGNING_SECRET || 'affiliate-salt-default-key';
    return crypto
      .createHmac('sha256', salt)
      .update(ip || '127.0.0.1')
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Validates a redirect request for a given retailer and item ID
   */
  static verifyRedirect(
    retailerParam: string,
    itemId: string,
    rawDestination?: string
  ): RedirectVerificationResult {
    const validRetailers: RetailerId[] = ['amazon', 'walmart', 'bestbuy', 'target'];
    if (!validRetailers.includes(retailerParam as RetailerId)) {
      return { valid: false, error: 'Invalid retailer specified' };
    }

    const retailer = retailerParam as RetailerId;

    if (!itemId || itemId.length < 2 || !/^[a-zA-Z0-9\-_.]+$/.test(itemId)) {
      return { valid: false, error: 'Invalid product item identifier' };
    }

    if (rawDestination) {
      if (!this.isDomainAllowed(rawDestination, retailer)) {
        return { valid: false, error: 'Target URL is not within approved retailer domains' };
      }
    }

    return {
      valid: true,
      retailer,
      itemId,
      destinationUrl: rawDestination,
    };
  }
}
