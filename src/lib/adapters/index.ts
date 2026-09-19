import { AmazonAdapter } from './amazon.adapter';
import { WalmartAdapter } from './walmart.adapter';
import { BestBuyAdapter } from './bestbuy.adapter';
import { TargetAdapter } from './target.adapter';
import { IRetailerAdapter, RetailerSearchResult, SearchQueryOptions } from '@/types/adapters';
import { ProductOffer, RetailerId, UnifiedProduct } from '@/types/product';
import { calculateSavings, slugify, getRetailerDisplayName } from '../utils';
import { PRODUCTS_CATALOG, CatalogItem } from '@/data/catalog';

export class AdapterRegistry {
  private adapters: Map<RetailerId, IRetailerAdapter> = new Map();

  constructor() {
    this.register(new AmazonAdapter());
    this.register(new WalmartAdapter());
    this.register(new BestBuyAdapter());
    this.register(new TargetAdapter());
  }

  register(adapter: IRetailerAdapter): void {
    this.adapters.set(adapter.retailerId, adapter);
  }

  getAdapter(retailerId: RetailerId): IRetailerAdapter | undefined {
    return this.adapters.get(retailerId);
  }

  getAllAdapters(): IRetailerAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Concurrently searches all 4 retailers with complete error isolation via Promise.allSettled
   * and blends with custom user catalog items defined in src/data/catalog.ts
   */
  async searchAllRetailers(options: SearchQueryOptions): Promise<UnifiedProduct[]> {
    const q = (options.query || '').trim().toLowerCase();
    const cat = (options.category || '').trim().toLowerCase();

    // 1. Merge baseline PRODUCTS_CATALOG with any Supabase custom products (persistent database)
    let allCatalogItems = PRODUCTS_CATALOG;
    try {
      const { getSiteKV } = await import('@/lib/db/kv');
      const cloudProducts = await getSiteKV<CatalogItem[]>('custom_products');
      if (cloudProducts && Array.isArray(cloudProducts) && cloudProducts.length > 0) {
        const productMap = new Map<string, CatalogItem>();
        allCatalogItems.forEach((p) => productMap.set(p.id, p));
        cloudProducts.forEach((p) => productMap.set(p.id, p));
        allCatalogItems = Array.from(productMap.values());
      }
    } catch {
      // fallback to baseline PRODUCTS_CATALOG
    }

    const catalogMatches = allCatalogItems.filter((item) => {
      const matchText =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q)) ||
        item.slug.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      const matchCat =
        !cat ||
        item.category.toLowerCase().includes(cat) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(cat));

      return matchText && matchCat;
    });

    // Transform catalog items into UnifiedProduct format
    const catalogProducts: UnifiedProduct[] = catalogMatches.map((item) => transformCatalogItemToUnified(item));


    // 2. Also check if any live retailer adapters are configured
    const configuredAdapters = this.getAllAdapters().filter((a) => a.isConfigured());

    if (configuredAdapters.length > 0 && q) {
      try {
        const searchPromises = configuredAdapters.map(async (adapter) => {
          try {
            return await adapter.searchProducts(options);
          } catch (e) {
            return [];
          }
        });

        const settled = await Promise.allSettled(searchPromises);
        const liveResults: RetailerSearchResult[] = [];
        settled.forEach((res) => {
          if (res.status === 'fulfilled') {
            liveResults.push(...res.value);
          }
        });

        if (liveResults.length > 0) {
          const normalizedLive = this.aggregateAndNormalizeResults(liveResults);
          // Combine and deduplicate
          const combined = [...catalogProducts];
          for (const liveItem of normalizedLive) {
            if (!combined.some((c) => c.slug === liveItem.slug || c.title === liveItem.title)) {
              combined.push(liveItem);
            }
          }
          return combined;
        }
      } catch (err) {
        console.error('Live search error:', err);
      }
    }

    return catalogProducts;
  }

  /**
   * Normalizes live API items
   */
  private aggregateAndNormalizeResults(results: RetailerSearchResult[]): UnifiedProduct[] {
    const productGroups = new Map<string, RetailerSearchResult[]>();

    for (const item of results) {
      let key = '';
      if (item.upc) {
        key = `upc:${item.upc}`;
      } else if (item.modelNumber && item.modelNumber.length > 2) {
        key = `model:${item.brand.toLowerCase()}-${item.modelNumber.toLowerCase()}`;
      } else {
        const titleStem = item.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ' ')
          .split(' ')
          .filter((w) => w.length > 3)
          .slice(0, 5)
          .join('-');
        key = `title:${item.brand.toLowerCase()}-${titleStem}`;
      }

      const existing = productGroups.get(key) || [];
      existing.push(item);
      productGroups.set(key, existing);
    }

    const unifiedProducts: UnifiedProduct[] = [];

    productGroups.forEach((groupItems) => {
      if (groupItems.length === 0) return;

      const representative = groupItems[0];
      const baseSlug = slugify(`${representative.brand}-${representative.title.slice(0, 45)}`);

      const inStockPrices = groupItems
        .filter((item) => item.isInStock && item.price > 0)
        .map((item) => item.price);

      const lowestPrice = inStockPrices.length > 0 ? Math.min(...inStockPrices) : Math.min(...groupItems.map((i) => i.price));
      const highestPrice = Math.max(...groupItems.map((i) => i.price));

      const offers: ProductOffer[] = groupItems.map((item) => {
        const savings = calculateSavings(item.price, item.regularPrice);
        const adapter = this.getAdapter(item.retailer);
        const directAffiliateUrl = adapter
          ? adapter.buildAffiliateUrl(item.productUrl, item.retailerItemId)
          : item.productUrl;

        return {
          retailer: item.retailer,
          retailerName: adapter?.retailerName || item.retailer,
          retailerItemId: item.retailerItemId,
          productUrl: item.productUrl,
          directAffiliateUrl,
          internalGoUrl: `/go/${item.retailer}/${encodeURIComponent(item.retailerItemId)}`,
          price: item.price,
          regularPrice: item.regularPrice,
          currency: 'USD',
          savingsAmount: savings?.amount,
          savingsPercentage: savings?.percentage,
          isLowestPrice: item.isInStock && item.price === lowestPrice,
          isInStock: item.isInStock,
          availabilityStatus: item.availabilityStatus,
          shippingInfo: item.shippingInfo,
          condition: item.condition || 'New',
          lastUpdated: new Date().toISOString(),
        };
      });

      offers.sort((a, b) => {
        if (a.isInStock && !b.isInStock) return -1;
        if (!a.isInStock && b.isInStock) return 1;
        return a.price - b.price;
      });

      const maxRegularPrice = Math.max(...groupItems.map((i) => i.regularPrice || i.price));
      const overallSavings = calculateSavings(lowestPrice, maxRegularPrice);

      unifiedProducts.push({
        id: `prod_${baseSlug}`,
        title: representative.title,
        slug: baseSlug,
        brand: representative.brand,
        category: representative.category || 'Tech & Electronics',
        description: representative.description || `Compare current prices for ${representative.title} across Amazon, Walmart, Best Buy, and Target.`,
        imageUrl: representative.imageUrl,
        lowestPrice,
        highestPrice,
        regularPrice: maxRegularPrice > lowestPrice ? maxRegularPrice : undefined,
        maxSavingsPercentage: overallSavings?.percentage,
        offers,
        rating: 4.8,
        ratingCount: 1250,
        updatedAt: new Date().toISOString(),
      });
    });

    return unifiedProducts;
  }
}

export const adapterRegistry = new AdapterRegistry();

const RETAILER_NAMES: Record<string, string> = {
  amazon: 'Amazon',
  walmart: 'Walmart',
  bestbuy: 'Best Buy',
  target: 'Target',
  bhphoto: 'B&H Photo',
  ebay: 'eBay',
  newegg: 'Newegg',
  apple: 'Apple Store',
  microcenter: 'Micro Center',
  aliexpress: 'AliExpress',
  custom: 'Custom Store',
};

export function transformCatalogItemToUnified(item: any): UnifiedProduct {
  const inStockPrices = (item.offers || [])
    .filter((o: any) => o.isInStock && o.price > 0)
    .map((o: any) => o.price);

  const lowestPrice = inStockPrices.length > 0
    ? Math.min(...inStockPrices)
    : Math.min(...(item.offers || [{ price: 0 }]).map((o: any) => o.price));
  const highestPrice = Math.max(...(item.offers || [{ price: 0 }]).map((o: any) => o.price));
  const regularPrice = Math.max(...(item.offers || []).map((o: any) => o.regularPrice || o.price));
  const savings = calculateSavings(lowestPrice, regularPrice);

  const offers: ProductOffer[] = (item.offers || []).map((offer: any) => {
    const offerSavings = calculateSavings(offer.price, offer.regularPrice);
    const resolvedRetailerName = (offer.retailerName && offer.retailerName.toLowerCase() !== 'custom')
      ? offer.retailerName
      : (RETAILER_NAMES[offer.retailer] || getRetailerDisplayName(offer.retailer));

    return {
      retailer: offer.retailer,
      retailerName: resolvedRetailerName,
      retailerItemId: offer.retailerItemId || offer.retailer,
      productUrl: offer.productUrl || '#',
      directAffiliateUrl: offer.productUrl || '#',
      internalGoUrl: `/go/${offer.retailer}/${encodeURIComponent(offer.retailerItemId || '')}`,
      price: offer.price,
      regularPrice: offer.regularPrice,
      currency: 'USD',
      savingsAmount: offerSavings?.amount,
      savingsPercentage: offerSavings?.percentage,
      isLowestPrice: offer.isInStock && offer.price === lowestPrice,
      isInStock: offer.isInStock,
      availabilityStatus: offer.availabilityStatus || 'In Stock',
      shippingInfo: offer.shippingInfo || 'Free Shipping',
      condition: 'New',
      lastUpdated: new Date().toISOString(),
    };
  });

  offers.sort((a, b) => {
    if (a.isInStock && !b.isInStock) return -1;
    if (!a.isInStock && b.isInStock) return 1;
    return a.price - b.price;
  });

  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    brand: item.brand,
    category: item.category,
    subcategory: item.subcategory,
    badge: item.badge,
    description: item.description,
    richDescription: item.richDescription,
    features: item.features || [],
    specs: item.specs || {},
    keySpecs: item.keySpecs,
    faqs: item.faqs || [],
    seo: item.seo,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    images: item.images && item.images.length > 0 ? item.images : [item.imageUrl],
    imageAlts: item.imageAlts,
    lowestPrice,
    highestPrice,
    regularPrice: regularPrice > lowestPrice ? regularPrice : undefined,
    maxSavingsPercentage: savings?.percentage,
    offers,
    rating: item.rating || 4.8,
    ratingCount: item.reviewCount || 100,
    updatedAt: new Date().toISOString(),
  };
}

