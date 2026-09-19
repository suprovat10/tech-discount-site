import React from 'react';
import { Search, Scale, Sparkles, ShoppingBag } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    step: '01',
    title: 'Search Any Tech Item',
    description: 'Type in any gadget, brand name, or model number. We fetch live pricing data directly from authorized retailer APIs.',
  },
  {
    icon: Scale,
    step: '02',
    title: 'Compare 4 Major Stores',
    description: 'Our engine cross-references Amazon, Walmart, Best Buy, and Target in parallel to find real availability and shipping speeds.',
  },
  {
    icon: Sparkles,
    step: '03',
    title: 'Spot the Lowest Price',
    description: 'We calculate verified savings, highlight the cheapest store, and surface active manufacturer promo codes.',
  },
  {
    icon: ShoppingBag,
    step: '04',
    title: 'Checkout Direct',
    description: 'Click through securely to the official store to complete your order at the guaranteed discounted price.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-16 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          How Our Comparison Engine Works
        </h2>
        <p className="text-sm text-muted-foreground">
          Clean, real-time comparison designed to save you money without tracking or fake discounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="relative p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-muted-foreground/30 font-mono">
                  {item.step}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-base text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
