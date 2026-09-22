/**
 * Client-safe image optimization helpers for Cloudinary and responsive images.
 */

/**
 * Optimizes a Cloudinary image URL by injecting dynamic width, auto format, and auto quality.
 * If the URL is not from Cloudinary, it returns the original URL unchanged.
 *
 * @param url The image URL
 * @param width Optional target width in pixels (e.g. 480, 800, 1200)
 */
export function optimizeCloudinaryUrl(url?: string, width?: number): string {
  if (!url || typeof url !== 'string') return url || '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) {
    return url;
  }

  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return url;
    const prefix = parts[0] + '/image/upload/';
    let rest = parts[1];

    // Strip existing transformations if present (e.g. f_auto,q_auto,w_...,c_...)
    const segments = rest.split('/');
    if (
      segments.length > 1 &&
      !/^v\d+$/.test(segments[0]) &&
      (segments[0].includes(',') ||
        segments[0].includes('_') ||
        ['f_auto', 'q_auto'].some((t) => segments[0].includes(t)))
    ) {
      rest = segments.slice(1).join('/');
    }

    const transform = width ? `f_auto,q_auto:eco,w_${width},c_limit` : 'f_auto,q_auto:eco';
    return `${prefix}${transform}/${rest}`;
  } catch {
    return url;
  }
}

/**
 * Universal image optimization helper supporting Cloudinary and Unsplash.
 * If the URL is neither, returns original.
 */
export function optimizeImageUrl(url?: string, width?: number): string {
  if (!url || typeof url !== 'string') return url || '';

  // Cloudinary
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    return optimizeCloudinaryUrl(url, width);
  }

  // Unsplash
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      if (width) {
        u.searchParams.set('w', width.toString());
      }
      u.searchParams.set('auto', 'format');
      u.searchParams.set('q', '75');
      return u.toString();
    } catch {
      return url;
    }
  }

  if (url === '/hero.webp' || url === '/hero-mobile.webp' || url.startsWith('/hero')) {
    return width && width <= 480 ? '/hero-mobile.webp' : '/hero.webp';
  }

  return url;
}

/**
 * Checks whether an image URL is hosted on Cloudinary
 */
export function isCloudinaryUrl(url?: string): boolean {
  return Boolean(url && typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/image/upload/'));
}

export function getAdSrcSet(url?: string, isBanner: boolean = true): string | undefined {
  if (!url || !isCloudinaryUrl(url)) return undefined;

  if (isBanner) {
    return [
      `${optimizeCloudinaryUrl(url, 380)} 380w`,
      `${optimizeCloudinaryUrl(url, 640)} 640w`,
      `${optimizeCloudinaryUrl(url, 768)} 768w`,
      `${optimizeCloudinaryUrl(url, 1024)} 1024w`,
      `${optimizeCloudinaryUrl(url, 1200)} 1200w`,
    ].join(', ');
  }

  // Square ad (max display ~320px)
  return [
    `${optimizeCloudinaryUrl(url, 280)} 280w`,
    `${optimizeCloudinaryUrl(url, 320)} 320w`,
    `${optimizeCloudinaryUrl(url, 640)} 640w`,
  ].join(', ');
}

/**
 * Generate sizes attribute matching the ad slot display dimensions
 */
export function getAdSizes(isBanner: boolean): string | undefined {
  if (isBanner) {
    return '(max-width: 480px) 380px, (max-width: 768px) 640px, (max-width: 1024px) 768px, 1024px';
  }
  return '(max-width: 480px) 280px, 320px';
}

/**
 * Responsive srcset for the Hero section image (LCP)
 */
export function getHeroSrcSet(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;

  if (url === '/hero.webp' || url === '/hero-mobile.webp' || url.startsWith('/hero')) {
    return '/hero-mobile.webp 480w, /hero.webp 768w';
  }

  if (
    (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) ||
    url.includes('images.unsplash.com')
  ) {
    return [
      `${optimizeImageUrl(url, 360)} 360w`,
      `${optimizeImageUrl(url, 480)} 480w`,
      `${optimizeImageUrl(url, 640)} 640w`,
      `${optimizeImageUrl(url, 800)} 800w`,
      `${optimizeImageUrl(url, 1024)} 1024w`,
    ].join(', ');
  }

  return undefined;
}

export function getHeroSizes(): string {
  return '(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 45vw, 500px';
}
