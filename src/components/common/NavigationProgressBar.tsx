'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * High-performance, zero-dependency Top Navigation Progress Bar.
 * Gives instant visual feedback (0ms) the moment any link is clicked,
 * completely eliminating perceived "dead click" or "double click" issues.
 */
export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete progress whenever route actually changes
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept click on internal links to show progress immediately
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');

      // Ignore external links, new tabs, anchors (#), or empty hrefs
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || target === '_blank') {
        return;
      }

      // Ignore modifier keys (Cmd+click, Ctrl+click opens new tab)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      try {
        const url = new URL(anchor.href, window.location.origin);
        // Only trigger for internal links that actually change the path or query
        if (url.origin === window.location.origin) {
          const currentUrl = window.location.pathname + window.location.search;
          const nextUrl = url.pathname + url.search;

          if (currentUrl !== nextUrl) {
            setLoading(true);
            setProgress(25);

            // Animate progress smoothly while waiting
            setTimeout(() => setProgress(65), 150);
            setTimeout(() => setProgress(85), 400);
          }
        }
      } catch {}
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[2.5px] bg-transparent"
    >
      <div
        className="h-full bg-blue-600 transition-all ease-out shadow-[0_0_8px_rgba(37,99,235,0.7)]"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '150ms' : '300ms',
        }}
      />
    </div>
  );
}
