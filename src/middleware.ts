import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /supro111vat29 routes
  if (pathname.startsWith('/supro111vat29')) {
    const isLoginPage = pathname === '/supro111vat29/login';
    const authToken = request.cookies.get('admin_auth_token')?.value;

    const isAuthenticated = Boolean(authToken && authToken.split(':').length === 3);

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
