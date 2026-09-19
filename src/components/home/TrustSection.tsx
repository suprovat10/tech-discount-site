import React from 'react';
import { ShieldCheck, Database, Ban, Cpu, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function TrustSection() {
  return (
    <section className="py-12 border-y border-border/70 bg-muted/20 my-12 rounded-3xl p-6 sm:p-10 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Zero Manipulation Guarantee
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Real Retail Data. No Fake 'Original' Prices.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Many deal sites inflate regular prices or promote questionable third-party marketplace sellers. TechPrice US connects directly to official retail APIs to show real, in-stock prices from authorized retailers.
          </p>

          <ul className="space-y-2.5 pt-2 text-xs font-medium text-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Only authorized US retailer inventories (Amazon, Walmart, Best Buy, Target)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Independent price ranking: the lowest price is always featured first</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>No user account, credit card, or personal information required to compare</span>
            </li>
          </ul>

          <div className="pt-2">
            <Link
              href="/price-methodology"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              Read our full Price Methodology & Standards →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 w-fit">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Direct API Feeds</h4>
            <p className="text-xs text-muted-foreground">
              Direct structured requests without unauthorized web scraping.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 w-fit">
              <Ban className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">No Spam Codes</h4>
            <p className="text-xs text-muted-foreground">
              Only verified merchant promotions that actually discount your cart.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">FTC Compliant</h4>
            <p className="text-xs text-muted-foreground">
              Clear affiliate disclosures next to all merchant outbound links.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2.5">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 w-fit">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Tech-Focused</h4>
            <p className="text-xs text-muted-foreground">
              Specialized catalog indexing for laptops, headphones, TVs & gaming.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
