'use client';

import React from 'react';
import Link from 'next/link';
import { usePage } from '@/hooks/usePage';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface PolicyPageClientProps {
  slug: string;
}

export function PolicyPageClient({ slug }: PolicyPageClientProps) {
  const page = usePage(slug);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [slug]);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl space-y-8">
      {/* Header */}
      <div className="space-y-3">
        {page.badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{page.badge}</span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          {page.title}
        </h1>

        {page.subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {page.subtitle}
          </p>
        )}

        <div className="text-xs text-muted-foreground pt-1">
          Last updated: {page.lastUpdated || 'Recent'}
        </div>
      </div>

      {/* Main Content Card with rich typography */}
      <div className="p-6 sm:p-10 border border-border bg-card shadow-sm prose dark:prose-invert max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-bold prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-base prose-p:leading-relaxed prose-li:my-1 prose-a:text-blue-600 prose-a:underline rich-text-content [&_[id]]:scroll-mt-24">
        <div dangerouslySetInnerHTML={{ __html: page.content }} />
      </div>

      {/* Back to Home / Search Navigation */}
      <div className="pt-4 flex items-center justify-between text-xs font-semibold">
        <Link href="/" prefetch={true} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <Link href="/products" prefetch={true} className="text-blue-600 hover:underline">
          Explore Verified Tech Deals &rarr;
        </Link>
      </div>
    </div>
  );
}
