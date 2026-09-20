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
  const offersList = Array.isArray(item.offers) ? item.offers : [];

  const validPrices = offersList
    .map((o: any) => (typeof o.price === 'number' ? o.price : parseFloat(o.price)))
    .filter((p: number) => !isNaN(p) && p > 0);

  const inStockPrices = offersList
    .filter((o: any) => o.isInStock)
    .map((o: any) => (typeof o.price === 'number' ? o.price : parseFloat(o.price)))
    .filter((p: number) => !isNaN(p) && p > 0);

  const lowestPrice = inStockPrices.length > 0
    ? Math.min(...inStockPrices)
    : (validPrices.length > 0 ? Math.min(...validPrices) : 0);
  const highestPrice = validPrices.length > 0 ? Math.max(...validPrices) : lowestPrice;

  const regularPrices = offersList
    .map((o: any) => (typeof o.regularPrice === 'number' ? o.regularPrice : parseFloat(o.regularPrice)))
    .filter((p: number) => !isNaN(p) && p > 0);
  const regularPrice = regularPrices.length > 0 ? Math.max(...regularPrices) : lowestPrice;
  const savings = calculateSavings(lowestPrice, regularPrice);

  const offers: ProductOffer[] = offersList.map((offer: any) => {
    const offerPrice = typeof offer.price === 'number' ? offer.price : (parseFloat(offer.price) || 0);
    const offerRegPrice = typeof offer.regularPrice === 'number' ? offer.regularPrice : (parseFloat(offer.regularPrice) || undefined);
    const offerSavings = calculateSavings(offerPrice, offerRegPrice);
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
      price: offerPrice,
      regularPrice: offerRegPrice,
      currency: 'USD',
      savingsAmount: offerSavings?.amount,
      savingsPercentage: offerSavings?.percentage,
      isLowestPrice: Boolean(offer.isInStock && offerPrice > 0 && offerPrice === lowestPrice),
      isInStock: Boolean(offer.isInStock),
      availabilityStatus: offer.availabilityStatus || 'In Stock',
      shippingInfo: offer.shippingInfo || 'Free Shipping',
      condition: 'New',
      lastUpdated: offer.lastUpdated || new Date().toISOString(),
    };
  });

  offers.sort((a, b) => {
    if (a.isInStock && !b.isInStock) return -1;
    if (!a.isInStock && b.isInStock) return 1;
    return a.price - b.price;
  });

  const dynTimestamp = item.id && typeof item.id === 'string' && item.id.startsWith('prod-dyn-')
    ? new Date(parseInt(item.id.replace('prod-dyn-', ''), 10)).toISOString()
    : undefined;

  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    brand: item.brand || 'No Brand',
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
    createdAt: item.createdAt || dynTimestamp || undefined,
    updatedAt: item.updatedAt || item.createdAt || dynTimestamp || undefined,
  };
}
