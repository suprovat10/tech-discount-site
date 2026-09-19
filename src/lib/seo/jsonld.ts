import { UnifiedProduct } from '@/types/product';
import { BlogPost } from '@/data/blogs';

export function generateProductJsonLd(product: UnifiedProduct, siteUrl = 'https://suprodesign.com') {
  const inStockOffers = product.offers.filter((o) => o.isInStock);
  const bestOffer = product.offers.find((o) => o.isLowestPrice) || product.offers[0];

  const schema: Record<string, any> = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: product.imageUrl ? [product.imageUrl] : [],
    description: product.description || product.title,
    sku: product.sku || product.modelNumber || product.id,
    mpn: product.modelNumber || product.sku,
    category: product.category,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: product.lowestPrice,
      highPrice: product.highestPrice || product.lowestPrice,
      offerCount: product.offers.length,
      offers: product.offers.map((offer) => ({
        '@type': 'Offer',
        price: offer.price,
        priceCurrency: 'USD',
        priceValidUntil: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        itemCondition: 'https://schema.org/NewCondition',
        availability: offer.isInStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: offer.retailerName || offer.retailer,
        },
        url: `${siteUrl}/go/${offer.retailer}/${product.id}`,
      })),
    },
  };

  if (product.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: product.brand,
    };
  }

  if (product.rating && product.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.ratingCount || 12,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function generateWebsiteJsonLd(
  siteUrl = 'https://suprodesign.com',
  siteName = 'suprodesign'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateOrganizationJsonLd(
  siteUrl = 'https://suprodesign.com',
  siteName = 'suprodesign',
  logoUrl = '/logo.png',
  socials: string[] = []
) {
  const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${siteUrl}${logoUrl}`;
  const validSocials = socials.filter((s) => s && s.trim().length > 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: fullLogoUrl,
    ...(validSocials.length > 0 ? { sameAs: validSocials } : {}),
  };
}

export function generateArticleJsonLd(
  post: BlogPost,
  siteUrl = 'https://suprodesign.com',
  siteName = 'suprodesign',
  logoUrl = '/logo.png'
) {
  const fullLogoUrl = logoUrl.startsWith('http') ? logoUrl : `${siteUrl}${logoUrl}`;
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = post.imageUrl.startsWith('http') ? post.imageUrl : `${siteUrl}${post.imageUrl}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [imageUrl],
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    author: {
      '@type': 'Person',
      name: post.author || `${siteName} Editorial Team`,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: fullLogoUrl,
      },
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: { name: string; url?: string }[],
  siteUrl = 'https://suprodesign.com'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}` } : {}),
    })),
  };
}
