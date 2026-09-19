'use client';

import { useState, useEffect, useCallback } from 'react';
import { UnifiedProduct } from '@/types/product';

const WATCHLIST_STORAGE_KEY = 'techprice_saved_items_v1';
export const WATCHLIST_SYNC_EVENT = 'techprice_watchlist_sync';

export interface WatchlistToastData {
  type: 'add' | 'remove' | 'clear';
  productTitle?: string;
  count: number;
}

// Global in-memory singleton cache
let globalWatchlist: UnifiedProduct[] = [];
let isStoreInitialized = false;
const subscribers = new Set<() => void>();

function initStoreIfNeeded() {
  if (isStoreInitialized || typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (stored) {
      globalWatchlist = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load watchlist from localStorage:', e);
  }
  isStoreInitialized = true;
}

function notifySubscribers() {
  subscribers.forEach((callback) => {
    try {
      callback();
    } catch (e) {
      console.error('Watchlist listener error:', e);
    }
  });
}

function updateWatchlist(
  newItems: UnifiedProduct[],
  toastInfo?: { type: 'add' | 'remove' | 'clear'; productTitle?: string }
) {
  globalWatchlist = newItems;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to persist watchlist to localStorage:', e);
    }

    // Dispatch custom event for toasts & external listeners
    const eventData: WatchlistToastData = {
      type: toastInfo?.type || 'add',
      productTitle: toastInfo?.productTitle,
      count: newItems.length,
    };
    window.dispatchEvent(
      new CustomEvent(WATCHLIST_SYNC_EVENT, {
        detail: eventData,
      })
    );
  }
  notifySubscribers();
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<UnifiedProduct[]>(() => {
    if (typeof window !== 'undefined') {
      initStoreIfNeeded();
      return globalWatchlist;
    }
    return [];
  });
  const [isLoaded, setIsLoaded] = useState(isStoreInitialized);

  useEffect(() => {
    initStoreIfNeeded();
    setWatchlist([...globalWatchlist]);
    setIsLoaded(true);

    const handleUpdate = () => {
      setWatchlist([...globalWatchlist]);
    };

    subscribers.add(handleUpdate);

    // Cross-tab sync via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WATCHLIST_STORAGE_KEY) {
        try {
          globalWatchlist = e.newValue ? JSON.parse(e.newValue) : [];
        } catch {
          globalWatchlist = [];
        }
        notifySubscribers();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscribers.delete(handleUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isSaved = useCallback(
    (productIdOrSlug: string) => {
      if (!productIdOrSlug) return false;
      return watchlist.some(
        (item) => item.id === productIdOrSlug || item.slug === productIdOrSlug
      );
    },
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    (product: UnifiedProduct) => {
      if (!product) return;
      initStoreIfNeeded();
      const alreadySaved = globalWatchlist.some(
        (item) => item.id === product.id || item.slug === product.slug
      );

      if (alreadySaved) {
        const next = globalWatchlist.filter(
          (item) => item.id !== product.id && item.slug !== product.slug
        );
        updateWatchlist(next, { type: 'remove', productTitle: product.title });
      } else {
        const next = [product, ...globalWatchlist];
        updateWatchlist(next, { type: 'add', productTitle: product.title });
      }
    },
    []
  );

  const removeFromWatchlist = useCallback((productIdOrSlug: string) => {
    if (!productIdOrSlug) return;
    initStoreIfNeeded();
    const itemToRemove = globalWatchlist.find(
      (item) => item.id !== productIdOrSlug || item.slug !== productIdOrSlug
    );
    const next = globalWatchlist.filter(
      (item) => item.id !== productIdOrSlug && item.slug !== productIdOrSlug
    );
    updateWatchlist(next, {
      type: 'remove',
      productTitle: itemToRemove?.title || 'Product',
    });
  }, []);

  const clearWatchlist = useCallback(() => {
    initStoreIfNeeded();
    updateWatchlist([], { type: 'clear' });
  }, []);

  return {
    watchlist,
    isLoaded,
    isSaved,
    toggleWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    count: watchlist.length,
  };
}
