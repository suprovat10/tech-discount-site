export type PopupTargetPage = 'all' | 'home' | 'products' | 'coupons' | 'custom';

export type PopupFrequency =
  | 'always'           // Shows every reload / visit after delay
  | 'once_per_session' // Shows once per browser session (sessionStorage)
  | 'once_forever'     // Shows once per visitor lifetime (localStorage)
  | 'max_views'        // Shows up to X times per visitor
  | 'hide_days';       // Once closed or acted upon, hides for X days

export type PopupActionType =
  | 'coupon'           // Coupon code + Copy Code button + optional link
  | 'button'           // Action button with link
  | 'both'             // Coupon code with copy button AND action button
  | 'none';            // Only image, title, and description

export interface PopupItem {
  id: string;
  name: string;                // Admin label, e.g. "Welcome 10% Discount"
  enabled: boolean;            // Active status toggle

  // Targeting & Timing
  targetPage: PopupTargetPage; // 'all' | 'home' | 'products' | 'coupons' | 'custom'
  customPagePath?: string;     // e.g. '/product/apple-macbook-air-13-m3-chip' or '/deals'
  delaySeconds: number;        // Seconds to wait before showing (e.g. 0, 3, 5, 10)

  // Frequency Rules
  frequency: PopupFrequency;
  maxViews?: number;           // If frequency === 'max_views' (e.g. 1, 2, 3)
  hideDays?: number;           // If frequency === 'hide_days' (e.g. 7 days)

  // Visual Content (matching reference layout)
  imageUrl: string;            // Left column image URL
  imageAlt?: string;
  badgeText?: string;          // e.g. "LIMITED TIME SPECIAL OFFER"
  title: string;               // e.g. "NEW SEASON SALE!"
  description: string;         // e.g. "Save 10% on all qualifying orders"

  // Action / CTA
  actionType: PopupActionType;
  couponCode?: string;         // e.g. "NEWSEASON10"
  couponBtnText?: string;      // default: "COPY CODE"
  buttonText?: string;         // e.g. "Shop Deals" / "Explore Collections"
  buttonUrl?: string;          // e.g. "/products"
  openInNewTab?: boolean;      // Open button in new tab

  createdAt: string;
  updatedAt: string;
}
