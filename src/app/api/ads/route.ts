import { NextRequest, NextResponse } from 'next/server';
import { getServerAds, saveServerAd, deleteServerAd, isAdActive } from '@/lib/adServer';
import { AdItem, AdPlacementId } from '@/types/ad';
import { purgeAllCaches } from '@/lib/cachePurge';
import { isRequestAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement') as AdPlacementId | null;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const ads = await getServerAds();

    // Cache active public ads briefly for performance, but NEVER cache admin dashboard queries
    const headers = activeOnly
      ? { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' }
      : { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };

    if (placement) {
      const filtered = ads.filter((ad) => ad.placement === placement);
      if (activeOnly) {
        const active = filtered.filter(isAdActive);
        return NextResponse.json(active[0] || null, { headers });
      }
      return NextResponse.json(filtered, { headers });
    }

    if (activeOnly) {
      return NextResponse.json(ads.filter(isAdActive), { headers });
    }

    return NextResponse.json(ads, { headers });
  } catch (error: any) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || !body.placement || !body.title) {
      return NextResponse.json(
        { error: 'Invalid ad data. Placement and title are required.' },
        { status: 400 }
      );
    }

    const adItem: AdItem = {
      id: body.id || `ad-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      placement: body.placement,
      title: body.title,
      adType: body.adType || 'image',
      format: body.format || 'banner',
      imageUrl: body.imageUrl || '',
      targetUrl: body.targetUrl || '',
      altText: body.altText || body.title,
      openInNewTab: body.openInNewTab !== false,
      htmlCode: body.htmlCode || '',
      enabled: body.enabled !== false,
      hasTimer: Boolean(body.hasTimer),
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      createdAt: body.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const updatedAds = await saveServerAd(adItem);
    purgeAllCaches();
    return NextResponse.json({ success: true, ad: adItem, allAds: updatedAds });
  } catch (error: any) {
    console.error('Error saving ad:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save ad' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ad ID' }, { status: 400 });
    }

    const updatedAds = await deleteServerAd(id);
    purgeAllCaches();
    return NextResponse.json({ success: true, allAds: updatedAds });
  } catch (error: any) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete ad' },
      { status: 500 }
    );
  }
}
