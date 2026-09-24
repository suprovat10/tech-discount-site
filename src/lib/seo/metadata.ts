/**
 * Utility to resolve social sharing (Open Graph & Twitter Card) images.
 * Ensures every page gets an absolute HTTPS URL and correct dimension metadata.
 */
export function buildOpenGraphImages(
  imageUrl: string | undefined | null,
  siteUrl: string,
  fallbackUrl: string,
  alt: string = 'TechPriceDrop'
) {
  const cleanBase = siteUrl.replace(/\/+$/, '');
  let resolved = imageUrl?.trim();

  if (!resolved) {
    resolved = fallbackUrl;
  }

  // Ensure absolute URL (Facebook, Twitter, WhatsApp, LinkedIn reject relative paths)
  if (!resolved.startsWith('http://') && !resolved.startsWith('https://')) {
    const cleanPath = resolved.startsWith('/') ? resolved : `/${resolved}`;
    resolved = `${cleanBase}${cleanPath}`;
  }

  return {
    images: [
      {
        url: resolved,
        secureUrl: resolved,
        width: 1200,
        height: 630,
        alt,
      },
    ],
    twitterImages: [resolved],
  };
}
