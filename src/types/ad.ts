export type AdPlacementId =
  | 'home_below_hero'
  | 'home_below_latest'
  | 'products_below_breadcrumb'
  | 'products_sidebar_bottom'
  | 'product_detail_below_related'
  | 'product_detail_sidebar_bottom'
  | 'coupons_below_breadcrumb'
  | 'blog_top'
  | 'blog_detail_sidebar_top'
  | 'blog_detail_sidebar_above_brands'
  | 'blog_detail_above_related';

export type AdType = 'image' | 'html';

export type AdFormat = 'banner' | 'square';

export interface AdItem {
  id: string;
  placement: AdPlacementId;
  title: string;
  adType: AdType; // 'image' | 'html'
  format: AdFormat; // 'banner' | 'square'
  
  // Image Ad specific fields
  imageUrl?: string;
  targetUrl?: string;
  altText?: string;
  openInNewTab?: boolean;

  // HTML / AdSense / Script specific fields
  htmlCode?: string;

  // Status & Scheduling / Timer
  enabled: boolean;
  hasTimer?: boolean;
  startDate?: string; // e.g. "2026-09-22T00:00" or ISO
  endDate?: string;   // e.g. "2026-10-01T23:59" or ISO (auto-removes when reached)

  createdAt?: string;
  updatedAt?: string;
}

export interface AdPlacementConfig {
  id: AdPlacementId;
  name: string;
  page: 'Homepage' | 'Products' | 'Product Detail' | 'Coupons' | 'Blog' | 'Blog Detail';
  format: AdFormat;
  description: string;
  recommendedSize: string;
}

export const AD_PLACEMENTS: AdPlacementConfig[] = [
  // 1. Homepage
  {
    id: 'home_below_hero',
    name: 'Homepage - Below Hero Section',
    page: 'Homepage',
    format: 'banner',
    description: 'Prominent horizontal banner displayed right below the hero search/slider area.',
    recommendedSize: '728x90 or 970x250 (Responsive Banner)',
  },
  {
    id: 'home_below_latest',
    name: 'Homepage - Below Latest Products',
    page: 'Homepage',
    format: 'banner',
    description: 'Full-width horizontal banner right beneath the Latest Products deal grid.',
    recommendedSize: '728x90 or 970x250 (Responsive Banner)',
  },

  // 2. All Products Page
  {
    id: 'products_below_breadcrumb',
    name: 'All Products - Below Breadcrumbs',
    page: 'Products',
    format: 'banner',
    description: 'High-visibility horizontal banner under the navigation breadcrumbs bar.',
    recommendedSize: '728x90 or 970x90 (Responsive Banner)',
  },
  {
    id: 'products_sidebar_bottom',
    name: 'All Products - Left Sidebar Bottom',
    page: 'Products',
    format: 'square',
    description: 'Square or medium rectangle ad anchored at the bottom of the left filter sidebar.',
    recommendedSize: '300x250 or 250x250 (Square)',
  },

  // 3. Product View Page
  {
    id: 'product_detail_sidebar_bottom',
    name: 'Product Detail - Left Sidebar Bottom',
    page: 'Product Detail',
    format: 'square',
    description: 'Square ad positioned at the bottom of the left category/spec sidebar.',
    recommendedSize: '300x250 or 250x250 (Square)',
  },
  {
    id: 'product_detail_below_related',
    name: 'Product Detail - Below Related Products',
    page: 'Product Detail',
    format: 'banner',
    description: 'Horizontal banner displayed directly below the Related Products section.',
    recommendedSize: '728x90 or 970x250 (Responsive Banner)',
  },

  // 4. Coupons Page
  {
    id: 'coupons_below_breadcrumb',
    name: 'Coupons - Below Breadcrumbs',
    page: 'Coupons',
    format: 'banner',
    description: 'Horizontal banner positioned right beneath the coupon navigation breadcrumbs.',
    recommendedSize: '728x90 or 970x90 (Responsive Banner)',
  },

  // 5. Blog Listing Page
  {
    id: 'blog_top',
    name: 'Blog - Top Banner',
    page: 'Blog',
    format: 'banner',
    description: 'Top-of-page banner displayed directly above the articles grid.',
    recommendedSize: '728x90 or 970x250 (Responsive Banner)',
  },

  // 6. Individual Blog Post View Page
  {
    id: 'blog_detail_sidebar_top',
    name: 'Blog Post - Right Sidebar Top',
    page: 'Blog Detail',
    format: 'square',
    description: 'Square ad at the very top of the right sidebar next to the article content.',
    recommendedSize: '300x250 (Square)',
  },
  {
    id: 'blog_detail_sidebar_above_brands',
    name: 'Blog Post - Right Sidebar Above Brands',
    page: 'Blog Detail',
    format: 'square',
    description: 'Square ad in the right sidebar positioned directly above the Popular Brands widget.',
    recommendedSize: '300x250 (Square)',
  },
  {
    id: 'blog_detail_above_related',
    name: 'Blog Post - Above Related Articles',
    page: 'Blog Detail',
    format: 'banner',
    description: 'Horizontal banner displayed between the post content and the Related Articles grid.',
    recommendedSize: '728x90 or 970x250 (Responsive Banner)',
  },
];
