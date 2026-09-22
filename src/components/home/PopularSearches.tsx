import React from 'react';
import Link from 'next/link';
import { Headphones, Laptop, Gamepad2, Tv, Watch, Smartphone, Camera, Speaker } from 'lucide-react';

const CATEGORIES = [
  { name: 'Headphones', icon: Headphones, query: 'headphones' },
  { name: 'Laptops', icon: Laptop, query: 'laptop' },
  { name: 'Gaming', icon: Gamepad2, query: 'gaming' },
  { name: 'Smart TVs', icon: Tv, query: 'tv' },
  { name: 'Smartwatches', icon: Watch, query: 'smartwatch' },
  { name: 'Tablets', icon: Smartphone, query: 'tablet' },
  { name: 'Cameras', icon: Camera, query: 'camera' },
  { name: 'Speakers', icon: Speaker, query: 'speaker' },
];

export function PopularSearches() {
  return (
    <section className="py-6 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.name}
              href={`/products?search=${encodeURIComponent(cat.query)}`}
              prefetch={true}
              className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-border bg-card hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 hover:border-indigo-400 transition-all text-center space-y-2.5 shadow-sm"
            >
              <div className="p-3.5 rounded-2xl bg-muted group-hover:bg-indigo-600 group-hover:text-white transition-colors text-muted-foreground">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
