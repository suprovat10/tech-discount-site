import { NextResponse } from 'next/server';
import { incrementProductView } from '@/lib/catalogDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idOrSlug = body.id || body.slug;

    if (!idOrSlug) {
      return NextResponse.json(
        { success: false, error: 'Product ID or slug is required' },
        { status: 400 }
      );
    }

    const newViews = await incrementProductView(String(idOrSlug));

    return NextResponse.json({
      success: true,
      views: newViews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record view' },
      { status: 500 }
    );
  }
}
