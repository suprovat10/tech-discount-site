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
      const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):(.+)@([^@/]+)\/?.*$/);
      if (match) {
        return {
          apiKey: match[1].trim(),
          apiSecret: match[2].trim(),
          cloudName: match[3].trim(),
        };
      }
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
    const folder = (options.folder || 'techpricedrop').replace(/^\/+|\/+$/g, '');

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
    const blob = new Blob([new Uint8Array(buffer)], { type: options.mimeType || 'image/png' });
    formData.append('file', blob, options.filename || 'image.png');
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

/**
 * Deletes an image from Cloudinary using their REST API image/destroy.
 * Accepts either a public_id or a full Cloudinary URL.
 */
export async function deleteFromCloudinary(publicIdOrUrl: string): Promise<{ success: boolean; error?: string }> {
  const config = getCloudinaryConfig();
  if (!config) {
    return { success: false, error: 'Cloudinary credentials not configured' };
  }

  let publicId = publicIdOrUrl;
  // If a full Cloudinary URL was passed, extract public_id
  if (publicIdOrUrl.includes('cloudinary.com')) {
    try {
      const uploadIdx = publicIdOrUrl.indexOf('/upload/');
      if (uploadIdx !== -1) {
        const afterUpload = publicIdOrUrl.substring(uploadIdx + '/upload/'.length);
        const parts = afterUpload.split('/');
        const cleanParts: string[] = [];
        for (const part of parts) {
          if (part.startsWith('v') && /^\d+$/.test(part.substring(1))) {
            continue; // skip version like v1789898690
          }
          if (part.includes(',') || part.startsWith('f_') || part.startsWith('q_') || part.startsWith('w_')) {
            continue; // skip transformation like f_auto,q_auto
          }
          cleanParts.push(part);
        }
        if (cleanParts.length > 0) {
          cleanParts[cleanParts.length - 1] = cleanParts[cleanParts.length - 1].replace(/\.[^/.]+$/, '');
          publicId = cleanParts.join('/');
        }
      }
    } catch {
      // fallback
    }
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string> = {
      public_id: publicId,
      timestamp: String(timestamp),
    };

    const signatureString =
      Object.keys(paramsToSign)
        .sort()
        .map((k) => `${k}=${paramsToSign[k]}`)
        .join('&') + config.apiSecret;

    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', config.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const destroyUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`;
    const res = await fetch(destroyUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok && (data.result === 'ok' || data.result === 'not found')) {
      return { success: true };
    }
    return { success: false, error: data.error?.message || data.result };
  } catch (err: any) {
    console.warn('[Cloudinary] Delete warning:', err.message);
    return { success: false, error: err.message };
  }
}
