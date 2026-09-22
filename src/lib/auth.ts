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

/**
 * Validates whether an incoming HTTP Request (API route or Middleware)
 * originates from an authenticated admin session.
 */
export function isRequestAdminAuthenticated(req: Request | { headers: Headers; cookies?: any }): boolean {
  try {
    let token: string | undefined;

    // 1. Check cookies if available via NextRequest
    if ('cookies' in req && req.cookies && typeof req.cookies.get === 'function') {
      token = req.cookies.get(ADMIN_AUTH_COOKIE)?.value;
    }

    // 2. Fallback to Cookie header
    if (!token && req.headers && typeof req.headers.get === 'function') {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_AUTH_COOKIE}=([^;]+)`));
      if (match && match[1]) {
        token = decodeURIComponent(match[1]);
      }
    }

    // 3. Fallback to Authorization: Bearer <token>
    if (!token && req.headers && typeof req.headers.get === 'function') {
      const authHeader = req.headers.get('authorization') || '';
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    return verifyAdminToken(token);
  } catch {
    return false;
  }
}
