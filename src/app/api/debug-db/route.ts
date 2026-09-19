import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const client = getSupabaseAdminClient();

  if (!client) {
    return NextResponse.json({
      status: 'error',
      message: 'Supabase client is null - environment variables missing',
      hasUrl: !!url,
      hasAnonKey: !!anonKey,
      hasServiceKey: !!serviceKey,
    });
  }

  try {
    const { data, error } = await client.from('site_kv').select('*').limit(5);

    return NextResponse.json({
      status: error ? 'db_error' : 'ok',
      hasUrl: !!url,
      urlPrefix: url ? url.substring(0, 20) + '...' : '',
      hasAnonKey: !!anonKey,
      hasServiceKey: !!serviceKey,
      error: error ? { message: error.message, details: error.details, hint: error.hint, code: error.code } : null,
      sampleRows: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'exception',
      message: err.message,
    });
  }
}
