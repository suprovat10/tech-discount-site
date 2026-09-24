'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizeImageUrl } from '@/lib/imageOptimization';

interface ProductImageGalleryProps {
  images: string[];
  title: string;
  imageAlt?: string;
  imageAlts?: string[];
  productId?: string;
  productSlug?: string;
}

export function ProductImageGallery({
  images,
  title,
  imageAlt,
  imageAlts,
  productId,
  productSlug,
}: ProductImageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Background product view tracking (non-blocking)
  useEffect(() => {
    if (!productId && !productSlug) return;
    try {
      fetch('/api/products/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, slug: productSlug }),
      }).catch(() => {});
    } catch {}
  }, [productId, productSlug]);

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="md:col-span-6 space-y-3">
      {/* 5:4 Main Slide */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-muted/20 border-0 md:border border-border/50 group">
        {images.length > 0 && images[activeImageIndex] ? (
          <Image
            src={optimizeImageUrl(images[activeImageIndex], 640)}
            alt={
              (activeImageIndex === 0
                ? imageAlt
                : imageAlts?.[activeImageIndex]) ||
              `${title} - Slide ${activeImageIndex + 1}`
            }
            fill
            priority
            loading="eager"
            className="object-cover transition-all duration-300"
            sizes="(max-width: 768px) 100vw, 40vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground p-6 text-center">
            <span className="text-xs font-semibold opacity-60">No Product Image Available</span>
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous Image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next Image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter Badge */}
        {images.length > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold">
            {activeImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails Underneath */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={`relative w-16 h-14 shrink-0 overflow-hidden border-2 transition-all ${
                activeImageIndex === idx
                  ? 'border-blue-600 ring-1 ring-blue-600 opacity-100'
                  : 'border-border opacity-70 hover:opacity-100 hover:border-muted-foreground'
              }`}
            >
              <Image
                src={optimizeImageUrl(img, 160)}
                alt={
                  (idx === 0 ? imageAlt : imageAlts?.[idx]) ||
                  `${title} thumbnail ${idx + 1}`
                }
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
