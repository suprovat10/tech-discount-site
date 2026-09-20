import { ProductOffer, RetailerId, UnifiedProduct } from '@/types/product';
import { calculateSavings, getRetailerDisplayName } from '@/lib/utils';

export const RETAILER_NAMES: Record<string, string> = {
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
