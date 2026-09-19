'use client';

import React from 'react';
import Link from 'next/link';
import { useBranding } from '@/hooks/useBranding';
import {
  ShieldCheck,
  Mail,
  Sparkles,
  BadgeCheck,
  ArrowUpRight,
  Headphones,
} from 'lucide-react';

export function Footer() {
  const branding = useBranding();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/70 bg-card/50 text-muted-foreground text-xs transition-all mt-20">
      {/* Top Value / Trust Highlights Bar */}
      <div className="border-b border-border/50 bg-muted/20">
        <div className="container max-w-[1240px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-foreground text-[11px] sm:text-xs">100% Verified Prices</p>
                <p className="text-[10px] text-muted-foreground">Live merchant inventory</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-foreground text-[11px] sm:text-xs">Independent & Unbiased</p>
                <p className="text-[10px] text-muted-foreground">No paid position rankings</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="font-bold text-foreground text-[11px] sm:text-xs">FTC Affiliate Compliant</p>
                <p className="text-[10px] text-muted-foreground">Transparent monetization</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold text-foreground text-[11px] sm:text-xs">Direct Support</p>
                <p className="text-[10px] text-muted-foreground">Prompt discrepancy resolution</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 4-Column Footer */}
      <div className="container max-w-[1240px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <Link href="/" className="inline-block group">
              <img
                src={branding.logoUrl || '/logo.png'}
                alt={branding.brandName || 'TechPriceDrop'}
                className="h-8 w-auto max-w-[170px] object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/logo.png';
                }}
              />
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {branding.footerBioText || `${branding.brandName || 'TechPriceDrop'} is a real-time price comparison and deals discovery engine. We scan authorized retailers like Amazon, Walmart, Best Buy, and Target so you never overpay for tech.`}
            </p>

            {/* Social Media Follow Icons */}
            {(branding.socialFacebook || branding.socialInstagram || branding.socialYoutube || branding.socialTwitter) && (
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  {branding.socialFacebook && (
                    <a
                      href={branding.socialFacebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-none border border-border bg-muted/40 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-muted-foreground transition-all flex items-center justify-center cursor-pointer shadow-xs"
                      title="Follow on Facebook"
                      aria-label="Facebook"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}

                  {branding.socialInstagram && (
                    <a
                      href={branding.socialInstagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-none border border-border bg-muted/40 hover:bg-pink-600 hover:text-white hover:border-pink-600 text-muted-foreground transition-all flex items-center justify-center cursor-pointer shadow-xs"
                      title="Follow on Instagram"
                      aria-label="Instagram"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                  )}

                  {branding.socialYoutube && (
                    <a
                      href={branding.socialYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-none border border-border bg-muted/40 hover:bg-red-600 hover:text-white hover:border-red-600 text-muted-foreground transition-all flex items-center justify-center cursor-pointer shadow-xs"
                      title="Follow on YouTube"
                      aria-label="YouTube"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  )}

                  {branding.socialTwitter && (
                    <a
                      href={branding.socialTwitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-none border border-border bg-muted/40 hover:bg-slate-900 hover:text-white hover:border-slate-900 dark:hover:bg-white dark:hover:text-slate-900 text-muted-foreground transition-all flex items-center justify-center cursor-pointer shadow-xs"
                      title="Follow on X / Twitter"
                      aria-label="Twitter"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Explore & Deals */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              Explore Deals
            </h3>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/products" className="hover:text-foreground transition-colors">
                  All Products & Deals
                </Link>
              </li>
              <li>
                <Link href="/coupons" className="hover:text-foreground transition-colors flex items-center gap-1.5 group">
                  <span>Coupons & Promo Codes</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xs">
                    Hot
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="hover:text-foreground transition-colors">
                  Saved Deals / Watchlist
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Tech Buying Guides & Blog
                </Link>
              </li>
              <li>
                <Link href="/products/laptops" className="hover:text-foreground transition-colors">
                  Laptops & Computers
                </Link>
              </li>
              <li>
                <Link href="/products/audio" className="hover:text-foreground transition-colors">
                  Audio & Headphones
                </Link>
              </li>
              <li>
                <Link href="/products/mobile" className="hover:text-foreground transition-colors">
                  Smartphones & Watches
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Affiliate & Monetization Transparency */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              Affiliate & Transparency
            </h3>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/affiliate-disclosure" className="hover:text-foreground transition-colors font-bold text-foreground/90 flex items-center gap-1">
                  <span>FTC Affiliate Disclosure</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-foreground transition-colors">
                  How Price Tracking Works
                </Link>
              </li>
              <li>
                <Link href="/price-methodology" className="hover:text-foreground transition-colors">
                  Price Accuracy Methodology
                </Link>
              </li>
              <li>
                <Link href="/retailers" className="hover:text-foreground transition-colors">
                  Supported Retailer Partners
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Affiliate & Brand Partnerships
                </Link>
              </li>
              <li>
                <Link href="/affiliate-disclosure#integrity" className="hover:text-foreground transition-colors">
                  Editorial Independence Guarantee
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Legal */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              Company & Legal
            </h3>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors font-bold text-foreground/90 flex items-center gap-1">
                  <span>Contact Us</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Us & Mission
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Report a Price Discrepancy
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Retailer Affiliate Statement & Copyright */}
      <div className="border-t border-border/50 bg-muted/10 py-6">
        <div className="container max-w-[1240px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="text-[11px] leading-relaxed text-muted-foreground/80 space-y-1.5">
            <p>
              <strong>Affiliate Disclosure:</strong> {branding.brandName || 'TechPriceDrop'} is an independent, advertising-supported comparison service. We are a participant in the Amazon Services LLC Associates Program, the Walmart Affiliate Network, the Best Buy Affiliate Program, the Target Partner Program, and other verified merchant affiliate networks. When you click on retailer links and make qualifying purchases, we may earn an affiliate commission at no additional cost to you.
            </p>
            <p>
              Product prices, stock availability, and shipping terms are accurate as of the last API crawl and are subject to immediate change by individual merchants. Any price and availability information displayed on merchant websites at the time of purchase will apply to the purchase of the product.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground border-t border-border/40">
            <p>
              © {currentYear} {branding.brandName || 'TechPriceDrop'}. All rights reserved. Built for smart tech shoppers.
            </p>

            <div className="flex items-center gap-4 text-[11px] font-medium">
              <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
              <span>•</span>
              <Link href="/affiliate-disclosure" className="hover:underline">FTC Disclosure</Link>
              <span>•</span>
              <Link href="/contact" className="hover:underline">Contact Us</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
