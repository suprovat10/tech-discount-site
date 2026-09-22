import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /supro111vat29 routes
  if (pathname.startsWith('/supro111vat29')) {
    const isLoginPage = pathname === '/supro111vat29/login';
    const authToken = request.cookies.get('admin_auth_token')?.value;

    let isAuthenticated = false;
    if (authToken) {
      const parts = authToken.split(':');
      if (parts.length === 3) {
        const [, timestampStr, signature] = parts;
        const timestamp = parseInt(timestampStr, 10);
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        // Verify valid timestamp within 7 days and 64-character hex signature
        if (
          !isNaN(timestamp) &&
          Date.now() - timestamp <= maxAge &&
          signature &&
          signature.length === 64
        ) {
          isAuthenticated = true;
        }
      }
    }

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/supro111vat29/:path*'],
};
