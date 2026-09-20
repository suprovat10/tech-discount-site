import crypto from 'crypto';

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Automatically parses Cloudinary credentials from either:
 * 1. CLOUDINARY_URL (e.g. cloudinary://123456789:abcdefgh@mycloud)
 * 2. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  // 1. Check CLOUDINARY_URL format
  let cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  if (cloudinaryUrl) {
    // In case the user pasted the entire "CLOUDINARY_URL=cloudinary://..." line
    if (cloudinaryUrl.startsWith('CLOUDINARY_URL=')) {
      cloudinaryUrl = cloudinaryUrl.replace(/^CLOUDINARY_URL=/, '').trim();
    }
    // Remove surrounding quotes if any
    cloudinaryUrl = cloudinaryUrl.replace(/^["']|["']$/g, '').trim();

    if (cloudinaryUrl.startsWith('cloudinary://')) {
      try {
        const parsed = new URL(cloudinaryUrl);
        const apiKey = parsed.username;
        const apiSecret = parsed.password;
        const cloudName = parsed.hostname;
        if (apiKey && apiSecret && cloudName) {
          return { cloudName, apiKey, apiSecret };
        }
      } catch (e) {
        console.warn('Error parsing CLOUDINARY_URL:', e);
      }
    }
  }

  // 2. Check individual environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }

  return null;
}

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

/**
 * Uploads a buffer directly to Cloudinary using their REST API.
 * Returns an auto-optimized URL with WebP/AVIF compression (f_auto,q_auto).
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    filename?: string;
    mimeType?: string;
  } = {}
): Promise<{ success: boolean; url?: string; error?: string }> {
  const config = getCloudinaryConfig();
  if (!config) {
    return { success: false, error: 'Cloudinary credentials not configured' };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = options.folder || 'techpricedrop';

    // Cloudinary signature parameters must be sorted alphabetically
    const paramsToSign: Record<string, string> = {
      folder,
      timestamp: String(timestamp),
    };

    const signatureString =
      Object.keys(paramsToSign)
        .sort()
        .map((k) => `${k}=${paramsToSign[k]}`)
        .join('&') + config.apiSecret;

    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    const formData = new FormData();
    const base64Data = `data:${options.mimeType || 'image/png'};base64,${buffer.toString('base64')}`;
    formData.append('file', base64Data);
    formData.append('api_key', config.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.secure_url) {
      // Auto-inject modern WebP/AVIF format and auto quality optimization
      const secureUrl = data.secure_url as string;
      const optimizedUrl = secureUrl.includes('/upload/')
        ? secureUrl.replace('/upload/', '/upload/f_auto,q_auto/')
        : secureUrl;

      return {
        success: true,
        url: optimizedUrl,
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Failed to upload image to Cloudinary',
      };
    }
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return {
      success: false,
      error: err.message || 'Error connecting to Cloudinary',
    };
  }
}
