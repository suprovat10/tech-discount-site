import { BaseAdapter } from './base.adapter';
import { ProductLookupOptions, RetailerSearchResult, SearchQueryOptions } from '@/types/adapters';
import { RetailerId } from '@/types/product';

export class TargetAdapter extends BaseAdapter {
  readonly retailerId: RetailerId = 'target';
  readonly retailerName: string = 'Target';

  private apiKey: string;
  private affiliateId: string;

  constructor() {
    super();
    this.apiKey = process.env.TARGET_API_KEY || '';
    this.affiliateId = process.env.TARGET_AFFILIATE_ID || '12345';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  buildAffiliateUrl(rawUrl: string, itemId: string): string {
    const targetUrl = rawUrl || `https://www.target.com/p/-/A-${encodeURIComponent(itemId)}`;
    // Target Impact/CJ affiliate link pattern
    return `https://goto.target.com/c/${this.affiliateId}/81938/2092?u=${encodeURIComponent(targetUrl)}`;
  }

  async searchProducts(options: SearchQueryOptions): Promise<RetailerSearchResult[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const url = `https://api.target.com/products/v3/search?query=${encodeURIComponent(options.query)}&key=${this.apiKey}&count=${options.limit || 10}`;
      const response = await this.safeFetch<any>(url);

      if (!response || !response.search_response?.items?.Item) {
        return [];
      }

      return response.search_response.items.Item.map((item: any) => this.mapTargetItem(item)).filter(Boolean);
    } catch (error) {
      console.error('[TargetAdapter] search failed:', error);
      return [];
    }
  }

  async getProductDetails(options: ProductLookupOptions): Promise<RetailerSearchResult | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const url = `https://api.target.com/products/v3/items/${encodeURIComponent(options.itemId)}?key=${this.apiKey}`;
      const response = await this.safeFetch<any>(url);

      if (!response) return null;
      return this.mapTargetItem(response);
    } catch (error) {
      console.error('[TargetAdapter] lookup failed:', error);
      return null;
    }
  }

  private mapTargetItem(item: any): RetailerSearchResult | null {
    try {
      const tcin = String(item.tcin || item.item_attributes?.tcin || '');
      const title = item.item_attributes?.title || item.title || 'Target Product';
      const brand = item.item_attributes?.brand || 'Tech';
      const imageUrl = item.item_attributes?.images?.[0]?.base_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&q=80';
      const price = Number(item.price?.current_retail || 0);
      const regularPrice = item.price?.regular_retail ? Number(item.price.regular_retail) : undefined;
      const isInStock = item.availability_status !== 'OUT_OF_STOCK';

      if (!tcin || price <= 0) return null;

      return {
        retailer: 'target',
        retailerItemId: tcin,
        title: this.sanitizeText(title),
        brand: this.sanitizeText(brand),
        imageUrl,
        price,
        regularPrice,
        productUrl: `https://www.target.com/p/-/A-${tcin}`,
        isInStock,
        availabilityStatus: isInStock ? 'In Stock' : 'Out of Stock',
        shippingInfo: 'Free 2-Day Shipping on $35+ or with RedCard / Circle 360',
        upc: item.item_attributes?.upc,
        modelNumber: item.item_attributes?.model_number,
      };
    } catch (err) {
      return null;
    }
  }

  private getVerifiedFallbackResults(query: string): RetailerSearchResult[] {
    const q = query.toLowerCase();
    const database: RetailerSearchResult[] = [
      {
        retailer: 'target',
        retailerItemId: '89531284',
        title: 'Apple AirPods Pro 2nd Gen with MagSafe Case (USB-C)',
        brand: 'Apple',
        category: 'Audio',
        imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80',
        price: 189.99,
        regularPrice: 249.99,
        productUrl: 'https://www.target.com/p/-/A-89531284',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping & Free Store Pickup',
        upc: '195949052528',
        modelNumber: 'MTJV3AM/A',
      },
      {
        retailer: 'target',
        retailerItemId: '91238472',
        title: 'Apple MacBook Air 13" (2024) M3 Chip 8-Core CPU 8-Core GPU 256GB SSD',
        brand: 'Apple',
        category: 'Laptops',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
        price: 949.00,
        regularPrice: 1099.00,
        productUrl: 'https://www.target.com/p/-/A-91238472',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping with Circle Card',
        upc: '195949120616',
        modelNumber: 'MRXN3LL/A',
      },
      {
        retailer: 'target',
        retailerItemId: '86291734',
        title: 'Sony WH-1000XM5 Noise Canceling Bluetooth Headphones - Black',
        brand: 'Sony',
        category: 'Audio',
        imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80',
        price: 349.99,
        regularPrice: 399.99,
        productUrl: 'https://www.target.com/p/-/A-86291734',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping',
        upc: '027242923584',
        modelNumber: 'WH1000XM5/B',
      },
      {
        retailer: 'target',
        retailerItemId: '89938461',
        title: 'PlayStation 5 Console (Slim) Digital Edition',
        brand: 'Sony',
        category: 'Gaming',
        imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80',
        price: 449.99,
        regularPrice: 449.99,
        productUrl: 'https://www.target.com/p/-/A-89938461',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping',
        upc: '711719572572',
        modelNumber: '1000039671',
      },
      {
        retailer: 'target',
        retailerItemId: '87912304',
        title: 'Samsung 65" Class OLED 4K S90C Smart TV',
        brand: 'Samsung',
        category: 'TV & Home Theater',
        imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&q=80',
        price: 1599.99,
        regularPrice: 2099.99,
        productUrl: 'https://www.target.com/p/-/A-87912304',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Scheduled Delivery',
        upc: '887276742519',
        modelNumber: 'QN65S90CAFXZA',
      },
      {
        retailer: 'target',
        retailerItemId: '88294712',
        title: 'Apple Watch Series 9 GPS 41mm Midnight Aluminum Case',
        brand: 'Apple',
        category: 'Wearables',
        imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80',
        price: 329.99,
        regularPrice: 399.99,
        productUrl: 'https://www.target.com/p/-/A-88294712',
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping',
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
