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

    const transform = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';
    return `${prefix}${transform}/${rest}`;
  } catch {
    return url;
  }
}

/**
 * Checks whether an image URL is hosted on Cloudinary
 */
export function isCloudinaryUrl(url?: string): boolean {
  return Boolean(url && typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/image/upload/'));
}

/**
 * Generate responsive srcSet for ad images
 */
export function getAdSrcSet(url?: string, isBanner: boolean = true): string | undefined {
  if (!url || !isCloudinaryUrl(url)) return undefined;

  if (isBanner) {
    return [
      `${optimizeCloudinaryUrl(url, 480)} 480w`,
      `${optimizeCloudinaryUrl(url, 800)} 800w`,
      `${optimizeCloudinaryUrl(url, 1200)} 1200w`,
    ].join(', ');
  }

  // Square ad (max display ~320px)
  return [
    `${optimizeCloudinaryUrl(url, 320)} 320w`,
    `${optimizeCloudinaryUrl(url, 640)} 640w`,
  ].join(', ');
}

/**
 * Generate sizes attribute matching the ad slot display dimensions
 */
export function getAdSizes(isBanner: boolean): string | undefined {
  if (isBanner) {
    return '(max-width: 640px) 480px, (max-width: 1024px) 800px, 1200px';
  }
  return '(max-width: 640px) 320px, 320px';
}
