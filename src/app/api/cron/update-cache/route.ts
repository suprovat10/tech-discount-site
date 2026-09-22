import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
  const isAdmin = isRequestAdminAuthenticated(request);

  if (!isCronAuthorized && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: 'Cache maintenance check passed',
    timestamp: new Date().toISOString(),
  });
}

