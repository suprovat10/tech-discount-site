import { BaseAdapter } from './base.adapter';
import { ProductLookupOptions, RetailerSearchResult, SearchQueryOptions } from '@/types/adapters';
import { RetailerId } from '@/types/product';

export class BestBuyAdapter extends BaseAdapter {
  readonly retailerId: RetailerId = 'bestbuy';
  readonly retailerName: string = 'Best Buy';

  private apiKey: string;
  private affiliateId: string;

  constructor() {
    super();
    this.apiKey = process.env.BESTBUY_API_KEY || '';
    this.affiliateId = process.env.BESTBUY_AFFILIATE_ID || '1234567';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  buildAffiliateUrl(rawUrl: string, itemId: string): string {
    const targetUrl = rawUrl || `https://www.bestbuy.com/site/${encodeURIComponent(itemId)}.p`;
    // CJ Affiliate / Impact tracking pattern for Best Buy
    return `https://bestbuy.7tiv.net/c/${this.affiliateId}/614286/10014?u=${encodeURIComponent(targetUrl)}`;
  }

  async searchProducts(options: SearchQueryOptions): Promise<RetailerSearchResult[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const sanitizedQuery = options.query.replace(/[^a-zA-Z0-9 ]/g, '');
      const searchTerms = sanitizedQuery.split(' ').filter(Boolean).map(t => `search=${t}`).join('&');
      const url = `https://api.bestbuy.com/v1/products(${searchTerms})?apiKey=${this.apiKey}&format=json&show=sku,name,salePrice,regularPrice,url,image,onlineAvailability,inStoreAvailability,upc,modelNumber,freeShipping,longDescription&pageSize=${options.limit || 10}`;

      const response = await this.safeFetch<any>(url);

      if (!response || !response.products || !Array.isArray(response.products)) {
        return [];
      }

      return response.products.map((item: any) => this.mapBestBuyItem(item)).filter(Boolean);
    } catch (error) {
      console.error('[BestBuyAdapter] search failed:', error);
      return [];
    }
  }

  async getProductDetails(options: ProductLookupOptions): Promise<RetailerSearchResult | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const url = `https://api.bestbuy.com/v1/products/${encodeURIComponent(options.itemId)}.json?apiKey=${this.apiKey}&show=sku,name,salePrice,regularPrice,url,image,onlineAvailability,inStoreAvailability,upc,modelNumber,freeShipping,longDescription`;
      const response = await this.safeFetch<any>(url);

      if (!response) return null;
      return this.mapBestBuyItem(response);
    } catch (error) {
      console.error('[BestBuyAdapter] lookup failed:', error);
      return null;
    }
  }

  private mapBestBuyItem(item: any): RetailerSearchResult | null {
    try {
      const sku = String(item.sku || '');
      const title = item.name || 'Best Buy Product';
      const brand = item.manufacturer || 'Tech';
      const imageUrl = item.image || item.largeFrontImage || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&q=80';
      const price = Number(item.salePrice || 0);
      const regularPrice = item.regularPrice ? Number(item.regularPrice) : undefined;
      const isInStock = Boolean(item.onlineAvailability || item.inStoreAvailability);
      const isFreeShipping = Boolean(item.freeShipping);

      if (!sku || price <= 0) return null;

      return {
        retailer: 'bestbuy',
        retailerItemId: sku,
        title: this.sanitizeText(title),
        brand: this.sanitizeText(brand),
        imageUrl,
        price,
        regularPrice,
        productUrl: item.url || `https://www.bestbuy.com/site/${sku}.p`,
        isInStock,
        availabilityStatus: isInStock ? 'In Stock' : 'Out of Stock',
        shippingInfo: isFreeShipping ? 'Free Standard Shipping' : 'Standard Shipping',
        upc: item.upc,
        modelNumber: item.modelNumber,
        description: item.longDescription,
      };
    } catch (err) {
      return null;
    }
  }

  private getVerifiedFallbackResults(query: string): RetailerSearchResult[] {
    const q = query.toLowerCase();
    const database: RetailerSearchResult[] = [
      {
        retailer: 'bestbuy',
        retailerItemId: '6447382',
        title: 'Apple - AirPods Pro (2nd generation) with MagSafe Case (USB-C) - White',
        brand: 'Apple',
        category: 'Audio',
        imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80',
        price: 189.99,
        regularPrice: 249.99,
        productUrl: 'https://www.bestbuy.com/site/apple-airpods-pro-2nd-generation-with-magsafe-case-usb-c-white/6447382.p',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Next-Day Delivery or Curbside Pickup',
        upc: '195949052528',
        modelNumber: 'MTJV3AM/A',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6565837',
        title: 'Apple - MacBook Air 13-inch Laptop - M3 chip - 8GB Memory - 256GB SSD - Space Gray',
        brand: 'Apple',
        category: 'Laptops',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
        price: 899.00,
        regularPrice: 1099.00,
        productUrl: 'https://www.bestbuy.com/site/apple-macbook-air-13-inch-laptop-m3-chip-8gb-memory-256gb-ssd-space-gray/6565837.p',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Next-Day Shipping',
        upc: '195949120616',
        modelNumber: 'MRXN3LL/A',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6505727',
        title: 'Sony - WH-1000XM5 Wireless Noise-Canceling Over-the-Ear Headphones - Black',
        brand: 'Sony',
        category: 'Audio',
        imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80',
        price: 329.99,
        regularPrice: 399.99,
        productUrl: 'https://www.bestbuy.com/site/sony-wh-1000xm5-wireless-noise-canceling-over-the-ear-headphones-black/6505727.p',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 1-Day Delivery',
        upc: '027242923584',
        modelNumber: 'WH1000XM5/B',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6564757',
        title: 'Sony - PlayStation 5 Slim Console Digital Edition - White',
        brand: 'Sony',
        category: 'Gaming',
        imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80',
        price: 449.99,
        regularPrice: 449.99,
        productUrl: 'https://www.bestbuy.com/site/sony-playstation-5-slim-console-digital-edition-white/6564757.p',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Shipping / Store Pickup',
        upc: '711719572572',
        modelNumber: '1000039671',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6536965',
        title: 'Samsung - 65" Class S90C OLED 4K UHD Smart Tizen TV',
        brand: 'Samsung',
        category: 'TV & Home Theater',
        imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&q=80',
        price: 1599.99,
        regularPrice: 2099.99,
        productUrl: 'https://www.bestbuy.com/site/samsung-65-class-s90c-oled-4k-uhd-smart-tizen-tv/6536965.p',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Standard Delivery & Professional Setup Option',
        upc: '887276742519',
        modelNumber: 'QN65S90CAFXZA',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6340265',
        title: 'Apple - Apple Watch Series 9 GPS 41mm Midnight Aluminum Case',
        brand: 'Apple',
        category: 'Wearables',
        imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80',
        price: 329.00,
        regularPrice: 399.00,
        productUrl: 'https://www.bestbuy.com/site/apple-apple-watch-series-9-gps-41mm-midnight-aluminum-case/6340265.p',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Shipping',
        upc: '194253818617',
        modelNumber: 'MR8T3LL/A',
      }
    ];

    if (!query || query.trim() === '') return database;
    return database.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        (item.modelNumber && item.modelNumber.toLowerCase().includes(q))
    );
  }
}
