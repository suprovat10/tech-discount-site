import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { DEFAULT_PAGES, SitePage } from '@/data/defaultPages';
import { getSiteKV, setSiteKV } from '@/lib/db/kv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGES_KEY = 'site_pages';

async function loadPagesFromCloud(): Promise<SitePage[]> {
  try {
    const cloud = await getSiteKV<SitePage[]>(PAGES_KEY);
    if (cloud && Array.isArray(cloud) && cloud.length > 0) {
      // Ensure all system default pages are present
      const cloudIds = new Set(cloud.map((p) => p.id));
      const missing = DEFAULT_PAGES.filter((p) => !cloudIds.has(p.id));
      if (missing.length > 0) {
        const merged = [...cloud, ...missing];
        await setSiteKV(PAGES_KEY, merged);
        return merged;
      }
      return cloud;
    }
  } catch (e) {
    console.warn('Failed to load pages from site_kv:', e);
  }
  return [...DEFAULT_PAGES];
}

import { purgeAllCaches } from '@/lib/cachePurge';

function purgePageCaches(slug?: string) {
  purgeAllCaches({ pageSlug: slug });
}

export async function GET() {
  const pages = await loadPagesFromCloud();
  return NextResponse.json(
    {
      success: true,
      count: pages.length,
      data: pages,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Page title is required' },
        { status: 400 }
      );
    }

    const pages = await loadPagesFromCloud();
    const pageId = body.id || `page-${Date.now()}`;
    const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^\/+|\/+$/g, '');

    const updatedPage: SitePage = {
      id: pageId,
      slug,
      title: body.title,
      subtitle: body.subtitle || '',
      badge: body.badge || '',
      content: body.content || '<p></p>',
      metaDescription: body.metaDescription || '',
      isSystem: !!body.isSystem,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    const index = pages.findIndex((p) => p.id === pageId || p.slug === slug);
    let updatedList: SitePage[];
    if (index >= 0) {
      updatedList = [...pages];
      updatedList[index] = updatedPage;
    } else {
      updatedList = [...pages, updatedPage];
    }

    await setSiteKV(PAGES_KEY, updatedList);
    purgePageCaches(slug);

    return NextResponse.json({ success: true, page: updatedPage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save page' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (Array.isArray(body.pages)) {
      await setSiteKV(PAGES_KEY, body.pages);
      purgePageCaches();
      return NextResponse.json({
        success: true,
        count: body.pages.length,
        data: body.pages,
      });
    }
    return NextResponse.json({ success: false, error: 'Invalid pages payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Page ID is required' }, { status: 400 });
    }

    const pages = await loadPagesFromCloud();
    const target = pages.find((p) => p.id === id);
    if (target?.isSystem) {
      return NextResponse.json(
        { success: false, error: 'System pages cannot be deleted' },
        { status: 403 }
      );
    }

    const updated = pages.filter((p) => p.id !== id);
    await setSiteKV(PAGES_KEY, updated);
    purgePageCaches(target?.slug);

    return NextResponse.json({ success: true, message: `Page ${id} removed successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
