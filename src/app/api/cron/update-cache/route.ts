import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ message: 'Supabase client not configured, skipped DB cleanup' });
  }

  try {
    // Delete expired search cache rows
    const { error: cacheErr, count: cacheDeleted } = await supabase
      .from('search_cache')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString());

    if (cacheErr) {
      console.error('Error pruning search cache:', cacheErr);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cacheDeleted: cacheDeleted || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
