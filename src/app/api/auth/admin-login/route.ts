import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_AUTH_COOKIE, generateAdminToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/ratelimit/limiter';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // Protect against brute-force attacks: max 5 login attempts per 15 minutes (900s)
    const rateCheck = checkRateLimit(`login:${ip}`, 5, 900);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many failed login attempts. For security reasons, please wait 15 minutes before trying again.',
        },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser) {
      return NextResponse.json({ success: false, error: 'Username / Email is required' }, { status: 400 });
    }

    if (!cleanPass) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const allowedUsernames = [
      ADMIN_USERNAME.toLowerCase(),
      'suprovat29roy@gmail.com',
      'suprovat29roy',
      'suprovat10@gmail.com',
      'suprovat10',
      'admin',
    ];

    const isValidUsername = allowedUsernames.includes(cleanUser.toLowerCase());
    const isValidPassword =
      cleanPass === ADMIN_PASSWORD ||
      cleanPass === 'Supro111*29*vat' ||
      cleanPass.toLowerCase() === 'supro111*29*vat';

    if (!isValidUsername || !isValidPassword) {
      return NextResponse.json({ success: false, error: 'Invalid admin username or password' }, { status: 401 });
    }

    const token = generateAdminToken(ADMIN_USERNAME);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
    });

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';

    // 7 days cookie
    response.cookies.set({
      name: ADMIN_AUTH_COOKIE,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error during login' }, { status: 500 });
  }
}
