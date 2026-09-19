'use client';

import React, { useState } from 'react';
import { RetailerCoupon } from '@/types/product';
import { Tag, Copy, Check, ExternalLink } from 'lucide-react';
import { getRetailerDisplayName, getRetailerBrandColor } from '@/lib/utils';
import { Button } from '../ui/button';

interface CouponListProps {
  coupons?: RetailerCoupon[];
}

export function CouponList({ coupons }: CouponListProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!coupons || coupons.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
          <Tag className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-foreground text-sm">
          Verified Active Retailer Coupons & Promos
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {coupons.map((coupon) => {
          const brand = getRetailerBrandColor(coupon.retailer);
          const isCopied = copiedCode === coupon.code;

          return (
            <div
              key={coupon.id}
              className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between gap-3 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${brand.badge}`}>
                    {getRetailerDisplayName(coupon.retailer)}
                  </span>
                  {coupon.isVerified && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified Active
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-xs text-foreground mt-2">{coupon.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{coupon.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                {coupon.code ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(coupon.code!)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 border border-dashed border-indigo-500/40 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 transition-all"
                  >
                    <span>{coupon.code}</span>
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground italic">No code required (Instant discount)</span>
                )}

                {coupon.affiliateUrl && (
                  <a
                    href={coupon.affiliateUrl}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                  >
                    <span>Apply Deal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
