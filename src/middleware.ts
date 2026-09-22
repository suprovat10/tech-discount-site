import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || 'tech-price-admin-secret-key-2026';

/**
 * Web-Crypto compliant HMAC-SHA256 signature verification for Edge runtime.
 */
async function verifyAdminTokenEdge(token?: string | null): Promise<boolean> {
  if (!token) return false;

  try {
    const parts = token.split(':');
    if (parts.length !== 3) return false;

    const [username, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (isNaN(timestamp) || Date.now() - timestamp > maxAge || !signature || signature.length !== 64) {
      return false;
    }

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const data = enc.encode(`${username}:${timestampStr}`);
    const sigBuffer = await crypto.subtle.sign('HMAC', key, data);
    const sigArray = Array.from(new Uint8Array(sigBuffer));
    const expectedSignature = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return signature === expectedSignature;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect all /supro111vat29 routes
  if (pathname.startsWith('/supro111vat29')) {
    const isLoginPage = pathname === '/supro111vat29/login';
    const authToken = request.cookies.get('admin_auth_token')?.value;

    const isAuthenticated = await verifyAdminTokenEdge(authToken);

    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL('/supro111vat29/login', request.url);
      if (pathname !== '/supro111vat29') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    if (isAuthenticated && isLoginPage) {
      return NextResponse.redirect(new URL('/supro111vat29', request.url));
    }
  }

  const response = NextResponse.next();

  // 2. Global Security Headers (prevents Clickjacking, MIME-sniffing, XSS)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/supro111vat29/:path*'],
};
