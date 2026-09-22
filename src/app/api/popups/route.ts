import { NextRequest, NextResponse } from 'next/server';
import { getServerPopups, saveServerPopup, deleteServerPopup, isPopupMatchingPath } from '@/lib/popupServer';
import { PopupItem } from '@/types/popup';
import { purgeAllCaches } from '@/lib/cachePurge';
import { isRequestAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const path = searchParams.get('path');

    const popups = await getServerPopups();

    if (activeOnly) {
      const active = popups.filter((p) => {
        if (!p.enabled) return false;
        if (path) return isPopupMatchingPath(p, path);
        return true;
      });

      return NextResponse.json(active, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      });
    }

    return NextResponse.json(popups, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching popups:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch popups' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    if (!body || !body.title) {
      return NextResponse.json(
        { error: 'Invalid popup data. Title is required.' },
        { status: 400 }
      );
    }

    const popupItem: PopupItem = {
      id: body.id || `popup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: body.name || body.title,
      enabled: body.enabled !== false,
      targetPage: body.targetPage || 'all',
      customPagePath: body.customPagePath || '',
      delaySeconds: Number(body.delaySeconds) >= 0 ? Number(body.delaySeconds) : 3,
      frequency: body.frequency || 'once_per_session',
      maxViews: Number(body.maxViews) || 1,
      hideDays: Number(body.hideDays) || 7,
      imageUrl: body.imageUrl || '',
      imageAlt: body.imageAlt || body.title,
      badgeText: body.badgeText || '',
      title: body.title,
      description: body.description || '',
      actionType: body.actionType || 'coupon',
      couponCode: body.couponCode || '',
      couponBtnText: body.couponBtnText || 'COPY CODE',
      buttonText: body.buttonText || '',
      buttonUrl: body.buttonUrl || '',
      openInNewTab: Boolean(body.openInNewTab),
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allPopups = await saveServerPopup(popupItem);
    purgeAllCaches();
    return NextResponse.json({ success: true, popup: popupItem, allPopups });
  } catch (error: any) {
    console.error('Error saving popup:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save popup' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing popup ID' }, { status: 400 });
    }

    const allPopups = await deleteServerPopup(id);
    purgeAllCaches();
    return NextResponse.json({ success: true, allPopups });
  } catch (error: any) {
    console.error('Error deleting popup:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete popup' },
      { status: 500 }
    );
  }
}
