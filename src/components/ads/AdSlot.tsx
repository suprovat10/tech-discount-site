'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AdItem, AdPlacementId } from '@/types/ad';
import {
  isAdActiveClient,
  getActiveAdForPlacementClient,
  clearActiveAdsCache,
  ADS_UPDATED_EVENT,
} from '@/lib/adStore';
import {
  optimizeCloudinaryUrl,
  getAdSrcSet,
  getAdSizes,
} from '@/lib/imageOptimization';

interface AdSlotProps {
  placement: AdPlacementId;
  initialAd?: AdItem | null;
  className?: string;
}

export function AdSlot({ placement, initialAd, className = '' }: AdSlotProps) {
  const [ad, setAd] = useState<AdItem | null>(() => {
    if (initialAd && isAdActiveClient(initialAd)) {
      return initialAd;
    }
    return null;
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch active ad for this placement using shared client-side cache
  const fetchAd = async () => {
    try {
      const activeAd = await getActiveAdForPlacementClient(placement);
      setAd(activeAd);
    } catch (err) {
      console.warn(`Error fetching ad for placement ${placement}:`, err);
    } finally {
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    fetchAd();

    // Re-check timer / expiration every 60 seconds
    const interval = setInterval(() => {
      setAd((current) => {
        if (current && !isAdActiveClient(current)) {
          return null; // Expired while user was browsing
        }
        return current;
      });
    }, 60000);

    // Listen for admin updates
    const handleUpdate = () => {
      clearActiveAdsCache();
      fetchAd();
    };
    window.addEventListener(ADS_UPDATED_EVENT, handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener(ADS_UPDATED_EVENT, handleUpdate);
    };
  }, [placement]);

  // Execute AdSense push if HTML ad contains adsbygoogle
  useEffect(() => {
    if (ad && ad.adType === 'html' && ad.htmlCode && ad.htmlCode.includes('adsbygoogle')) {
      try {
        if (typeof window !== 'undefined') {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        }
      } catch (e) {
        // AdSense push might throw if already pushed or blocked
      }
    }
  }, [ad]);

  // Zero Blank Space: If no active ad, render absolutely nothing!
  if (!ad || !isAdActiveClient(ad)) {
    return null;
  }

  const isBanner = ad.format === 'banner';
  const optimizedSrc = optimizeCloudinaryUrl(ad.imageUrl, isBanner ? 728 : 320);
  const srcSet = getAdSrcSet(ad.imageUrl, isBanner);
  const sizes = getAdSizes(isBanner);

  return (
    <div
      ref={containerRef}
      className={`relative w-full my-4 sm:my-6 flex items-center justify-center transition-opacity duration-300 animate-in fade-in ${className}`}
    >
      {/* IMAGE AD */}
      {ad.adType === 'image' && ad.imageUrl && (
        <div
          className={`relative overflow-hidden border border-border/80 bg-card group shadow-xs flex items-center justify-center ${
            isBanner
              ? 'w-auto max-w-full mx-auto'
              : 'w-auto max-w-[320px] aspect-square mx-auto'
          }`}
        >
          {/* Subtle Sponsored Badge */}
          <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs pointer-events-none">
            Ad
          </span>

          {ad.targetUrl ? (
            <a
              href={ad.targetUrl}
              target={ad.openInNewTab ? '_blank' : '_self'}
              rel="sponsored noopener noreferrer"
              className="inline-flex items-center justify-center cursor-pointer"
              title={ad.title}
            >
              <img
                src={optimizedSrc}
                srcSet={srcSet}
                sizes={sizes}
                alt={ad.altText || ad.title}
                className={`max-w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01] ${
                  isBanner
                    ? 'max-h-[120px] sm:max-h-[160px] lg:max-h-[220px]'
                    : 'max-h-[320px] max-w-[320px]'
                }`}
                loading="lazy"
                decoding="async"
              />
            </a>
          ) : (
            <img
              src={optimizedSrc}
              srcSet={srcSet}
              sizes={sizes}
              alt={ad.altText || ad.title}
              className={`max-w-full h-auto object-contain ${
                isBanner
                  ? 'max-h-[120px] sm:max-h-[160px] lg:max-h-[220px]'
                  : 'max-h-[320px] max-w-[320px]'
              }`}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      )}

      {/* HTML / GOOGLE ADSENSE AD */}
      {ad.adType === 'html' && ad.htmlCode && (
        <div
          className={`relative border border-border/60 bg-muted/10 p-1 flex items-center justify-center ${
            isBanner ? 'w-auto max-w-full min-h-[90px] mx-auto' : 'w-full max-w-[320px] min-h-[250px] mx-auto'
          }`}
        >
          <span className="absolute top-1 right-1 z-10 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-black/40 text-white pointer-events-none">
            Ad
          </span>
          <div
            className="w-auto max-w-full overflow-hidden flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: ad.htmlCode }}
          />
        </div>
      )}
    </div>
  );
}
