import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/lib/auth';
import { purgeAllCaches } from '@/lib/cachePurge';

export async function GET(request: NextRequest) {
  return handleCachePurge(request);
}

export async function POST(request: NextRequest) {
  return handleCachePurge(request);
}

async function handleCachePurge(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
  const isAdmin = isRequestAdminAuthenticated(request);

  if (!isCronAuthorized && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized cache purge request' }, { status: 401 });
  }

  purgeAllCaches();

  return NextResponse.json({
    success: true,
    message: 'All site caches and in-memory stores purged successfully',
    timestamp: new Date().toISOString(),
  });
}

