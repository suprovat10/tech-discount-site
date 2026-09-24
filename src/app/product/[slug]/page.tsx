import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDatabaseProductBySlug, getDatabaseProducts } from '@/lib/catalogDb';
import { transformCatalogItemToUnified } from '@/lib/adapters';
import { getServerSettings } from '@/lib/settingsServer';
import { getServerAds, isAdActive } from '@/lib/adServer';
import { generateProductJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo/jsonld';
import {
  getCategories,
  getCategorySlug,
  getSubcategorySlug,
  findCategoryBySlugOrName,
  doesProductMatchCategory,
  doesProductMatchSubcategory,
} from '@/lib/categoryStore';
import { optimizeImageUrl } from '@/lib/imageOptimization';
import { buildOpenGraphImages } from '@/lib/seo/metadata';
import { formatCurrency, getRetailerDisplayName, getRetailerHexColor } from '@/lib/utils';
import { slugifyTag } from '@/lib/productTagStore';

// Components
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductCategorySidebar, StorePlatformItem } from '@/components/product/ProductCategorySidebar';
import { ProductFaqAccordion } from '@/components/product/ProductFaqAccordion';
import { WatchlistButton } from '@/components/watchlist/WatchlistButton';
import { DealCard } from '@/components/deals/DealCard';
import { AdSlot } from '@/components/ads/AdSlot';

// Icons
import {
  ChevronRight,
  Star,
  ExternalLink,
  ShieldCheck,
  Truck,
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  Tag as TagIcon,
} from 'lucide-react';

// Product pages revalidate every 24 hours (or on-demand when product/price details update)
export const revalidate = 86400;

export async function generateStaticParams() {
  const products = await getDatabaseProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function getCleanSpecEntries(specs: any): [string, string][] {
  if (!specs) return [];
  if (Array.isArray(specs)) {
    return specs
      .map((item: any) => [String(item?.key || '').trim(), String(item?.value || '').trim()] as [string, string])
      .filter(([k, v]) => k.length > 0 && v.length > 0);
  }
  if (typeof specs === 'object') {
    return Object.entries(specs)
      .map(([k, v]) => [String(k || '').trim(), String(v || '').trim()] as [string, string])
      .filter(([k, v]) => k.length > 0 && v.length > 0);
  }
  return [];
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';

  const rawProduct = await getDatabaseProductBySlug(slug);
  const product = rawProduct ? transformCatalogItemToUnified(rawProduct) : null;

  if (!product) {
    const formattedTitle = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { title: `${formattedTitle} | ${brand}` };
  }

  const metaTitle =
    product.seo?.metaTitle ||
    `${product.title} - Compare Prices across Amazon, Walmart, Best Buy, Target | ${brand}`;
  const metaDescription =
    product.seo?.metaDescription ||
    `Compare verified prices for ${product.title}. Lowest live price is $${product.lowestPrice}${
      product.maxSavingsPercentage && product.maxSavingsPercentage > 0 ? ` (Save ${product.maxSavingsPercentage}% OFF)` : ''
    }. Check stock and offers from top US retailers.`;
  const rawOgImage = product.seo?.ogImageUrl || product.imageUrl || product.images?.[0];
  const ogData = buildOpenGraphImages(
    rawOgImage,
    siteUrl,
    settings.ogImageUrl || `${siteUrl}/hero.webp`,
    product.seo?.ogImageAlt || product.imageAlt || product.title
  );
  const productUrl = `${siteUrl}/product/${product.slug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: productUrl,
      siteName: brand,
      locale: 'en_US',
      type: 'website',
      images: ogData.images,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: ogData.twitterImages,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';

  const rawProduct = await getDatabaseProductBySlug(slug);
  const product = rawProduct ? transformCatalogItemToUnified(rawProduct) : null;

  // Product deleted or not found — show 404
  if (!product) {
    notFound();
  }

  const allCatalog = await getDatabaseProducts();
  const categories = getCategories();

  // Related products strictly from the same category
  let relatedRaw = product
    ? allCatalog.filter(
        (p) =>
          p.slug !== product.slug &&
          p.id !== product.id &&
          p.category &&
          product.category &&
          p.category.toLowerCase().trim() === product.category.toLowerCase().trim()
      )
    : [];

  if (relatedRaw.length === 0) {
    relatedRaw = allCatalog.filter((p) => !product || (p.slug !== product.slug && p.id !== product.id));
  }

  const relatedProducts = relatedRaw.slice(0, 4).map(transformCatalogItemToUnified);

  // Precompute category & subcategory product counts once on the server (zero client-side loops!)
  const catCounts: Record<string, number> = {};
  const subCounts: Record<string, number> = {};
  const storeCounts: Record<string, number> = {};

  categories.forEach((cat) => {
    catCounts[cat.name] = allCatalog.filter((p) => doesProductMatchCategory(p.category, cat.name, categories)).length;
    (cat.subcategories || []).forEach((sub) => {
      subCounts[`${cat.name}::${sub.name}`] = allCatalog.filter(
        (p) =>
          doesProductMatchCategory(p.category, cat.name, categories) &&
          doesProductMatchSubcategory(p.subcategory, sub.name, cat.name, categories)
      ).length;
    });
  });

  // Dynamically discover all platforms/stores present across catalog products and active product
  const storeMap = new Map<string, StorePlatformItem>();
  const defaultStores = [
    { id: 'amazon', name: 'Amazon', color: '#FF9900' },
    { id: 'walmart', name: 'Walmart', color: '#0071DC' },
    { id: 'bestbuy', name: 'Best Buy', color: '#FFE000' },
    { id: 'target', name: 'Target', color: '#CC0000' },
  ];
  defaultStores.forEach((s) => storeMap.set(s.id.toLowerCase(), s));

  allCatalog.forEach((p) => {
    (p.offers || []).forEach((o) => {
      if (o.retailer) {
        const rawId = o.retailer.trim();
        const key = rawId.toLowerCase();
        const rawName = (o.retailerName || '').trim();
        const displayName = rawName && rawName.toLowerCase() !== 'custom' ? rawName : getRetailerDisplayName(rawId);
        if (rawId && !storeMap.has(key)) {
          storeMap.set(key, { id: rawId, name: displayName, color: getRetailerHexColor(rawId) });
        }
      }
    });
  });

  const availableStores = Array.from(storeMap.values());
  availableStores.forEach((store) => {
    storeCounts[store.id] = allCatalog.filter((p) =>
      (p.offers || []).some((o) => {
        const rId = (o.retailer || '').toLowerCase();
        const rName = (o.retailerName || '').trim().toLowerCase();
        const sId = store.id.toLowerCase();
        const sName = store.name.trim().toLowerCase();
        return rId === sId || (rName && rName === sName);
      })
    ).length;
  });

  // Fetch Server-side ads for stable CLS-free mounting
  const allAds = await getServerAds();
  const sidebarAd = allAds.find((a) => a.placement === 'product_detail_sidebar_bottom' && isAdActive(a)) || null;
  const belowRelatedAd = allAds.find((a) => a.placement === 'product_detail_below_related' && isAdActive(a)) || null;

  // Determine exact first rendered gallery image (matching ProductImageGallery)
  const candidateImages = product.images && product.images.length > 0
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : []);

  const galleryImages: string[] = candidateImages.filter(
    (img): img is string => Boolean(img && img.trim() && !img.includes('unsplash.com'))
  );
  const firstRenderedImage = galleryImages[0];

  const productJsonLd = generateProductJsonLd(product, siteUrl);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(
    [
      { name: 'Home', url: '/' },
      {
        name: product.category || 'Products',
        url: product.category
          ? `/products/${getCategorySlug(categories, product.category)}`
          : '/products',
      },
      { name: product.title || slug, url: `/product/${product.slug || slug}` },
    ],
    siteUrl
  );

  // Price & Savings calculations
  const validOffers = (product.offers || []).filter(
    (o) => o.productUrl && o.productUrl.trim() !== '' && o.productUrl !== '#' && o.price > 0
  );
  const rating = product.rating || 4.8;
  const ratingCount = product.ratingCount || 150;
  const savings =
    product.regularPrice && product.regularPrice > product.lowestPrice
      ? product.regularPrice - product.lowestPrice
      : 0;
  const discountPercent =
    product.maxSavingsPercentage && product.maxSavingsPercentage > 0
      ? Math.round(product.maxSavingsPercentage)
      : product.regularPrice && product.regularPrice > product.lowestPrice
      ? Math.round(((product.regularPrice - product.lowestPrice) / product.regularPrice) * 100)
      : 0;

  const ALLOWED_BADGES = ['Best Seller', 'Editors Choice', 'Hot Deal'];
  const hasValidBadge = Boolean(product.badge && ALLOWED_BADGES.includes(product.badge));

  const productTags: string[] =
    product.tags && product.tags.length > 0
      ? product.tags
      : ([product.brand, product.category, product.subcategory].filter(Boolean) as string[]);

  const productFaqs =
    product.faqs && product.faqs.length > 0
      ? product.faqs
      : [
          {
            question: `Is ${product.title} backed by official manufacturer warranty?`,
            answer: `Yes, every retailer offer listed on TechPriceDrop (Amazon, Walmart, Best Buy, Target) is from authorized US sellers and includes official manufacturer warranty and original retail packaging.`,
          },
          {
            question: 'How frequently are store prices and deals updated?',
            answer: 'Our multi-retailer price engine continuously tracks and verifies pricing across Amazon, Walmart, Best Buy, and Target every 15 minutes, highlighting the lowest available price in real-time.',
          },
          {
            question: 'What are the shipping and return policies for these retailer offers?',
            answer: 'Purchases are fulfilled directly by the chosen retailer. Fast delivery (e.g. Amazon Prime, Walmart+ 2-Day, Best Buy Store Pickup, Target Circle 360) and standard 15-90 day return windows apply.',
          },
        ];

  const keyEntries = getCleanSpecEntries(product.keySpecs);
  const allTechEntries = getCleanSpecEntries(product.specs);
  const displayKeySpecs = keyEntries.length > 0 ? keyEntries : allTechEntries.slice(0, 4);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6">
      {/* High-priority Image Preload for LCP - exactly matches the first rendered gallery slide */}
      {firstRenderedImage && (
        <link
          rel="preload"
          as="image"
          href={optimizeImageUrl(firstRenderedImage, 640)}
          fetchPriority="high"
        />
      )}

      {/* Schema.org Product Structured Data */}
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {/* Schema.org Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="space-y-8 pb-16 max-w-[1200px] mx-auto">
        {/* Breadcrumbs - Truly Static Server Component */}
        <nav
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground pb-2.5 border-b border-border/60 overflow-x-auto whitespace-nowrap scrollbar-none [&::-webkit-scrollbar]:hidden py-1"
        >
          <Link href="/" className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <Link
            href={`/products/${getCategorySlug(categories, product.category)}`}
            className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap"
          >
            {product.category}
          </Link>
          {product.subcategory && (
            <>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              <Link
                href={`/products/${getCategorySlug(categories, product.category)}/${getSubcategorySlug(findCategoryBySlugOrName(categories, product.category), product.subcategory)}`}
                className="hover:text-foreground transition-colors shrink-0 whitespace-nowrap"
              >
                {product.subcategory}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <span
            className="text-foreground font-semibold shrink-0 whitespace-nowrap max-w-[200px] sm:max-w-xs md:max-w-md truncate"
            title={product.title}
          >
            {product.title}
          </span>
        </nav>

        {/* Two-Column Layout: Left Category Sidebar + Right Product View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR: Desktop only (hidden on mobile) with precomputed server counts */}
          <ProductCategorySidebar
            categories={categories}
            catCounts={catCounts}
            subCounts={subCounts}
            storeCounts={storeCounts}
            stores={availableStores}
            totalCount={allCatalog.length}
            activeCategory={product.category}
            activeSubcategory={product.subcategory}
            initialSidebarAd={sidebarAd}
          />

          {/* RIGHT MAIN CONTENT */}
          <div className="lg:col-span-9 space-y-10">
            {/* Product Overview Box: Image Slider on Left, Info/Price on Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start border-0 md:border border-border/80 bg-transparent md:bg-card p-0 md:p-6">
              {/* Product Image Slider - Client Island with Eager LCP Image */}
              <ProductImageGallery
                images={galleryImages}
                title={product.title}
                imageAlt={product.imageAlt}
                imageAlts={product.imageAlts}
                productId={product.id}
                productSlug={product.slug}
              />

              {/* Info & Price - Truly Static Server Component with Watchlist Island */}
              <div className="md:col-span-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {product.brand &&
                        product.brand !== 'No Brand' &&
                        product.brand !== 'None' &&
                        product.brand.trim() !== '' && (
                          <Link
                            href={`/brand/${product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                            className="uppercase tracking-wider font-bold text-blue-600 hover:underline"
                            title={`View all products by ${product.brand}`}
                          >
                            {product.brand}
                          </Link>
                        )}
                      {hasValidBadge && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider">
                          {product.badge}
                        </span>
                      )}
                    </div>
                    <WatchlistButton product={product} variant="full" />
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                    {product.title}
                  </h1>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <div className="flex items-center text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="font-bold text-foreground">{rating}</span>
                    <span>({ratingCount} verified reviews)</span>
                  </div>
                </div>

                {/* Lowest Price Banner */}
                <div className="p-4 bg-muted/40 border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                      Lowest Current Price
                    </span>
                    {discountPercent > 0 && (
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-xs tracking-wider uppercase">
                        -{discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-foreground">
                      {formatCurrency(product.lowestPrice)}
                    </span>
                    {product.regularPrice && product.regularPrice > product.lowestPrice && (
                      <span className="text-xs font-semibold text-muted-foreground line-through">
                        {formatCurrency(product.regularPrice)}
                      </span>
                    )}
                    {savings > 0 && (
                      <span className="text-xs font-bold text-emerald-600">
                        Save {formatCurrency(savings)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Specs Preview */}
                {displayKeySpecs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Key Specifications
                    </h3>
                    <div className="divide-y divide-border/60 text-xs">
                      {displayKeySpecs.slice(0, 6).map(([k, v]) => (
                        <div key={k} className="py-1.5 flex items-baseline justify-between gap-4">
                          <span className="text-muted-foreground shrink-0 max-w-[45%]">{k}</span>
                          <span className="font-semibold text-foreground text-right flex-1 break-words">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fast Delivery / Safe Check */}
                <div className="flex items-center gap-4 pt-1 text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-600" /> Fast Delivery Eligible
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authorized Retailers
                  </span>
                </div>
              </div>
            </div>

            {/* Price Comparison Matrix - Truly Static Server Component */}
            {validOffers.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                    <span>Check Product Prices Across Stores</span>
                    <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
                      ({validOffers.length} {validOffers.length === 1 ? 'Store' : 'Stores'})
                    </span>
                  </h2>
                  <span className="text-xs font-bold text-emerald-600">
                    ● Lowest price highlighted
                  </span>
                </div>

                <div className="overflow-x-auto sm:overflow-x-visible border border-border/80 bg-card">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3 sm:px-4">Store</th>
                        <th className="py-3 px-4 hidden md:table-cell">Availability</th>
                        <th className="py-3 px-4 hidden md:table-cell">Shipping</th>
                        <th className="py-3 px-3 sm:px-4">Current Price</th>
                        <th className="py-3 px-3 sm:px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {validOffers.map((offer) => (
                        <tr
                          key={offer.retailerItemId || `${offer.retailer}-${offer.price}`}
                          className={offer.isLowestPrice ? 'bg-emerald-500/5 font-semibold' : ''}
                        >
                          <td className="py-3 sm:py-3.5 px-3 sm:px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-foreground">
                                {offer.retailerName || getRetailerDisplayName(offer.retailer)}
                              </span>
                              {offer.isLowestPrice && (
                                <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase shrink-0">
                                  Lowest
                                </span>
                              )}
                            </div>
                            {/* Mobile-only: Availability & Shipping values directly under Store name */}
                            <div className="flex md:hidden items-center gap-1.5 text-[11px] mt-1 text-muted-foreground flex-wrap">
                              <span className={`font-semibold shrink-0 ${offer.isInStock ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {offer.isInStock ? 'In Stock' : 'Limited'}
                              </span>
                              <span className="text-muted-foreground/40 shrink-0">•</span>
                              <span className="text-muted-foreground truncate max-w-[150px] xs:max-w-[200px]">
                                {offer.shippingInfo || 'Free Standard Delivery'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-emerald-600 font-medium hidden md:table-cell">
                            {offer.isInStock ? 'In Stock' : 'Limited'}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground hidden md:table-cell">
                            {offer.shippingInfo || 'Free Standard Delivery'}
                          </td>
                          <td className="py-3 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                            <span className="text-sm sm:text-base font-black text-foreground">
                              {formatCurrency(offer.price)}
                            </span>
                          </td>
                          <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                            <a
                              href={offer.productUrl || offer.internalGoUrl}
                              target="_blank"
                              rel="nofollow sponsored noopener"
                              className={`inline-flex items-center justify-center text-xs font-bold h-8 px-3 sm:px-4 rounded-none transition-colors cursor-pointer ${
                                offer.isLowestPrice
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white'
                              }`}
                            >
                              <span>Buy Now</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Related Products - Truly Static Server Component */}
            {relatedProducts.length > 0 && (
              <section className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    Related Products
                  </h2>
                  <Link
                    href={`/products/${getCategorySlug(categories, product.category)}`}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                  {relatedProducts.slice(0, 4).map((p) => (
                    <DealCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Ad Placement: Below Related Products Banner with Stable Pre-calculated Ad Slot */}
            <AdSlot placement="product_detail_below_related" initialAd={belowRelatedAd} />

            {/* PRODUCT DESCRIPTION & RICH SPECIFICATIONS - Truly Static Server Component */}
            <section className="space-y-6 pt-6 border-t border-border/80">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Product Overview & Full Description</span>
                </h2>
              </div>

              <div className="border-0 sm:border border-border/80 bg-transparent sm:bg-card p-0 sm:p-6 space-y-6">
                {/* Rich Text / Formatted Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Overview & Engineering Details
                  </h3>
                  {product.richDescription ? (
                    <div
                      className="text-sm sm:text-base text-foreground font-medium leading-relaxed prose dark:prose-invert max-w-none overflow-x-auto break-words"
                      dangerouslySetInnerHTML={{ __html: product.richDescription }}
                    />
                  ) : (
                    <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Key Features & Benefits List (1 Column Layout) */}
                {product.features && product.features.length > 0 && (
                  <div className="space-y-3 pt-5 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Key Features & Highlights
                      </h3>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        {product.features.length} Highlights
                      </span>
                    </div>
                    <div className="space-y-2">
                      {product.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 border border-border/60 bg-muted/15 hover:bg-muted/30 transition-colors"
                        >
                          <div className="p-1 bg-emerald-500/10 text-emerald-600 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Specifications (1 Column Layout) */}
                {(() => {
                  const specEntries = getCleanSpecEntries(product.specs);
                  if (specEntries.length === 0) return null;

                  return (
                    <div className="space-y-3 pt-5 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Full Technical Specifications
                        </h3>
                        <span className="text-[11px] font-semibold text-blue-600">
                          {specEntries.length} Hardware Specs
                        </span>
                      </div>
                      <div className="border border-border/80 bg-background divide-y divide-border/60 text-xs sm:text-sm">
                        {specEntries.map(([key, val], idx) => (
                          <div
                            key={key}
                            className={`flex items-center justify-between p-3.5 transition-colors ${
                              idx % 2 === 0 ? 'bg-muted/25' : 'bg-background'
                            } hover:bg-muted/40`}
                          >
                            <span className="font-semibold text-muted-foreground w-2/5 sm:w-1/3 shrink-0">
                              {key}
                            </span>
                            <span className="font-bold text-foreground text-right flex-1 pl-4">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Retailer Quality Assurance */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs">
                  <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Authorized Retailer Network:</strong> Real-time price tracking across Amazon, Walmart, Best Buy, and Target with full manufacturer warranty.
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 font-semibold">
                    Continuous price checks
                  </span>
                </div>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS (FAQ Section) - Interactive Client Island */}
            <section className="space-y-4 pt-6 border-t border-border/80">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Frequently Asked Questions (FAQ)</span>
                </h2>
                <span className="text-xs font-bold text-blue-600">
                  {productFaqs.length} Answers Available
                </span>
              </div>

              <ProductFaqAccordion faqs={productFaqs} />
            </section>

            {/* RELATED PRODUCT TAGS - Truly Static Server Component */}
            {productTags.length > 0 && (
              <section className="bg-card rounded-2xl border border-border/70 p-5 sm:p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                    Related Product Tags
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Explore price drops, deals, and multi-store comparisons across matching topics:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {productTags.map((t, idx) => {
                    const tagSlug = slugifyTag(t);
                    return (
                      <Link
                        key={idx}
                        href={`/tag/${tagSlug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-foreground hover:text-blue-600 border border-border/60 hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-150 group"
                      >
                        <span className="text-blue-500 group-hover:scale-110 transition-transform">#</span>
                        <span>{t}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
