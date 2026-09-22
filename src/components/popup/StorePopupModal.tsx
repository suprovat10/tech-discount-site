'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Copy, Check } from 'lucide-react';
import { PopupItem } from '@/types/popup';

export function StorePopupModal() {
  const pathname = usePathname();
  const [activePopup, setActivePopup] = useState<PopupItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // 0. Do NOT show popups on admin or internal routes
    if (!pathname || pathname.startsWith('/supro111vat29') || pathname.startsWith('/admin')) {
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout | null = null;

    const checkAndTriggerPopup = async () => {
      try {
        const res = await fetch(`/api/popups?activeOnly=true&path=${encodeURIComponent(pathname)}`);
        if (!res.ok) return;
        const popups: PopupItem[] = await res.json();
        if (!Array.isArray(popups) || popups.length === 0) return;

        // Find the first eligible popup based on frequency capping rules
        const eligible = popups.find((popup) => isEligibleToDisplay(popup));
        if (!eligible || !isMounted) return;

        setActivePopup(eligible);

        const delayMs = (eligible.delaySeconds || 0) * 1000;
        timer = setTimeout(() => {
          if (isMounted) {
            setIsOpen(true);
            recordDisplay(eligible);
          }
        }, delayMs);
      } catch {
        // Fail silently so storefront experience is never degraded
      }
    };

    checkAndTriggerPopup();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (activePopup) {
      recordDismiss(activePopup);
    }
    setIsOpen(false);
  };

  const handleCopyCode = () => {
    if (!activePopup?.couponCode) return;
    navigator.clipboard.writeText(activePopup.couponCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  if (!isOpen || !activePopup) {
    return null;
  }

  const hasImage = Boolean(activePopup.imageUrl && activePopup.imageUrl.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`relative bg-white text-slate-900 border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
          hasImage
            ? 'max-w-2xl w-full grid grid-cols-1 md:grid-cols-12'
            : 'max-w-md w-full p-6 sm:p-8 flex flex-col justify-center text-center space-y-4'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 p-1.5 z-20 transition-colors cursor-pointer rounded-xs hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Full-Height Cover Image (Only rendered if an image exists) */}
        {hasImage && (
          <div className="md:col-span-5 bg-slate-100 min-h-[200px] md:min-h-[380px] relative overflow-hidden">
            <img
              src={activePopup.imageUrl}
              alt={activePopup.imageAlt || activePopup.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Content Column */}
        <div
          className={
            hasImage
              ? 'md:col-span-7 p-6 sm:p-8 flex flex-col justify-center text-center space-y-4'
              : 'space-y-4 flex flex-col justify-center text-center'
          }
        >
          {/* Subtitle / Badge */}
          {activePopup.badgeText && (
            <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase text-slate-600 block">
              {activePopup.badgeText}
            </span>
          )}

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-tight">
            {activePopup.title}
          </h2>

          {/* Description */}
          {activePopup.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              {activePopup.description}
            </p>
          )}

          {/* Action: Coupon Code Copy */}
          {(activePopup.actionType === 'coupon' || activePopup.actionType === 'both') && (
            <div className="border border-slate-300 flex items-stretch overflow-hidden text-xs max-w-xs mx-auto w-full shadow-2xs">
              <span className="flex-1 py-2.5 px-3 font-mono font-bold tracking-wider text-slate-900 bg-slate-50 flex items-center justify-center select-all">
                {activePopup.couponCode || 'DEAL10'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-[11px] border-l border-slate-300 flex items-center gap-1.5 uppercase shrink-0 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{activePopup.couponBtnText || 'COPY CODE'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action: CTA Button */}
          {(activePopup.actionType === 'button' || activePopup.actionType === 'both') && (
            <div className="pt-1">
              <a
                href={activePopup.buttonUrl || '/products'}
                target={activePopup.openInNewTab ? '_blank' : '_self'}
                rel={activePopup.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={handleClose}
                className="inline-block w-full max-w-xs py-3 px-5 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider text-center transition-colors shadow-xs"
              >
                {activePopup.buttonText || 'Shop Deals'}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------- Frequency Evaluation Helpers -----------------

function isEligibleToDisplay(popup: PopupItem): boolean {
  if (typeof window === 'undefined') return false;

  const id = popup.id;
  const freq = popup.frequency || 'once_per_session';

  try {
    switch (freq) {
      case 'always':
        return true;

      case 'once_per_session': {
        const sessionSeen = sessionStorage.getItem(`smarttech_popup_session_${id}`);
        return !sessionSeen;
      }

      case 'once_forever': {
        const foreverSeen = localStorage.getItem(`smarttech_popup_seen_${id}`);
        return !foreverSeen;
      }

      case 'max_views': {
        const currentViews = parseInt(localStorage.getItem(`smarttech_popup_views_${id}`) || '0', 10);
        const max = popup.maxViews || 1;
        return currentViews < max;
      }

      case 'hide_days': {
        const hideUntil = localStorage.getItem(`smarttech_popup_hide_until_${id}`);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
      }

      default:
        return true;
    }
  } catch {
    return true;
  }
}

function recordDisplay(popup: PopupItem): void {
  if (typeof window === 'undefined') return;

  const id = popup.id;
  const freq = popup.frequency || 'once_per_session';

  try {
    switch (freq) {
      case 'once_per_session':
        sessionStorage.setItem(`smarttech_popup_session_${id}`, '1');
        break;

      case 'once_forever':
        localStorage.setItem(`smarttech_popup_seen_${id}`, '1');
        break;

      case 'max_views': {
        const currentViews = parseInt(localStorage.getItem(`smarttech_popup_views_${id}`) || '0', 10);
        localStorage.setItem(`smarttech_popup_views_${id}`, (currentViews + 1).toString());
        break;
      }

      default:
        break;
    }
  } catch {
    // ignore
  }
}

function recordDismiss(popup: PopupItem): void {
  if (typeof window === 'undefined') return;

  const id = popup.id;
  const freq = popup.frequency || 'once_per_session';

  try {
    if (freq === 'hide_days') {
      const days = popup.hideDays || 7;
      const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(`smarttech_popup_hide_until_${id}`, expireTime.toString());
    }
  } catch {
    // ignore
  }
}
