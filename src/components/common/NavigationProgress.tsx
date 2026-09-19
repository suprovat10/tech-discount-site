'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete navigation when path/params change
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept all internal link clicks for 0ms visual confirmation
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Ignore external links, anchors, new tabs, mailto
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // If already on this exact url, don't trigger
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Start progress bar instantly
      setIsNavigating(true);
      setProgress(25);

      const t1 = setTimeout(() => setProgress(60), 100);
      const t2 = setTimeout(() => setProgress(85), 300);

      // Safety timeout: reset if navigation doesn't happen within 4s
      const safety = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 4000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(safety);
      };
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => document.removeEventListener('click', handleDocumentClick, { capture: true });
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] h-[2.5px] pointer-events-none transition-all duration-200 ease-out"
      style={{
        width: `${progress}%`,
        backgroundColor: '#2563eb', // Blue-600
        boxShadow: '0 0 10px rgba(37, 99, 235, 0.7)',
        opacity: progress === 100 ? 0 : 1,
      }}
    />
  );
}
