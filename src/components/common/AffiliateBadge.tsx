import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import Link from 'next/link';

export function AffiliateBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link
        href="/affiliate-disclosure"
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 hover:text-foreground transition-colors"
        title="We may earn an affiliate commission from qualifying purchases at no extra cost to you."
      >
        <Info className="w-3 h-3 text-indigo-500" />
        <span>Ad / Affiliate Links</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
      <span>
        Prices & deals verified in real-time. We may earn a commission from retailers.
        <Link href="/affiliate-disclosure" className="ml-1 text-indigo-600 dark:text-indigo-400 underline underline-offset-2">
          Disclosure
        </Link>
      </span>
    </div>
  );
}
