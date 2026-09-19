'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, X, Trash2, ArrowRight } from 'lucide-react';
import { WATCHLIST_SYNC_EVENT, WatchlistToastData } from '@/hooks/useWatchlist';

export function WatchlistToast() {
  const [toast, setToast] = useState<(WatchlistToastData & { id: number }) | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<WatchlistToastData>;
      if (!customEvent.detail || !customEvent.detail.type) return;

      const data = customEvent.detail;
      setToast({
        ...data,
        id: Date.now(),
      });

      clearTimeout(timer);
      timer = setTimeout(() => {
        setToast(null);
      }, 3500);
    };

    window.addEventListener(WATCHLIST_SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener(WATCHLIST_SYNC_EVENT, handleSync);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  const isAdd = toast.type === 'add';
  const isClear = toast.type === 'clear';

  return (
    <aside
      aria-label="Saved Watchlist Notification"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-40px)] animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="bg-slate-900 text-white dark:bg-card dark:text-foreground dark:border dark:border-border p-4 shadow-xl border-l-4 flex items-start justify-between gap-3 relative rounded-none border-l-rose-500">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-white/10 dark:bg-muted shrink-0 text-rose-500 flex items-center justify-center">
            {isClear ? (
              <Trash2 className="w-4 h-4 text-slate-300 dark:text-muted-foreground" />
            ) : (
              <Heart className={`w-4 h-4 ${isAdd ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
            )}
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight">
                {isAdd
                  ? 'Added to Saved'
                  : isClear
                  ? 'Watchlist Cleared'
                  : 'Removed from Saved'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-muted-foreground font-medium">
                ({toast.count} {toast.count === 1 ? 'item' : 'items'})
              </span>
            </div>

            {toast.productTitle && (
              <p className="text-[11px] text-slate-300 dark:text-muted-foreground line-clamp-1">
                {toast.productTitle}
              </p>
            )}

            {isAdd && (
              <div className="pt-1.5">
                <Link
                  href="/watchlist"
                  onClick={() => setToast(null)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 underline underline-offset-2"
                >
                  <span>View Saved List</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setToast(null)}
          className="text-slate-400 hover:text-white dark:hover:text-foreground p-1 shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
