import { NextResponse } from 'next/server';
import { ADMIN_AUTH_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.delete(ADMIN_AUTH_COOKIE);

  return response;
}
