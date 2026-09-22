import { NextRequest, NextResponse } from 'next/server';
import { isAllowedAdminEmail, generateAdminToken, ADMIN_AUTH_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/supro111vat29/login', req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/supro111vat29/login?error=google_not_configured', req.url)
    );
  }

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    // 1. Exchange code for access token with Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(new URL('/supro111vat29/login?error=google_auth_failed', req.url));
    }

    // 2. Fetch user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    const email = userData?.email;

    // 3. Verify that the email matches the authorized admin
    if (!email || !isAllowedAdminEmail(email)) {
      console.warn(`Unauthorized Google Login attempt from: ${email}`);
      return NextResponse.redirect(
        new URL(
          `/supro111vat29/login?error=unauthorized_email&email=${encodeURIComponent(email || '')}`,
          req.url
        )
      );
    }

    // 4. Success! Generate session token and set secure cookie
    const token = generateAdminToken(email);
    const response = NextResponse.redirect(new URL('/supro111vat29', req.url));

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';

    response.cookies.set({
      name: ADMIN_AUTH_COOKIE,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Google OAuth callback exception:', err);
    return NextResponse.redirect(new URL('/supro111vat29/login?error=google_auth_failed', req.url));
  }
}
