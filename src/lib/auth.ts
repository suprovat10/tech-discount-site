import crypto from 'crypto';

const AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || 'tech-price-admin-secret-key-2026';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'suprovat29roy@gmail.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Supro111*29*vat';

export const ADMIN_AUTH_COOKIE = 'admin_auth_token';

/**
 * Creates a signed auth token
 */
export function generateAdminToken(username: string): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${username}:${timestamp}`)
    .digest('hex');

  return `${username}:${timestamp}:${signature}`;
}

/**
 * Verifies if the auth token is valid and not expired (valid for 7 days)
 */
export function verifyAdminToken(token?: string | null): boolean {
  if (!token) return false;

  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [username, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) return false;

  // Expire after 7 days (7 * 24 * 60 * 60 * 1000 ms)
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAge) return false;

  const expectedSignature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${username}:${timestampStr}`)
    .digest('hex');

  return signature === expectedSignature;
}
