import { NextRequest, NextResponse } from 'next/server';
import { getServerBlogs } from '@/lib/blogServer';
import { setSiteKV, getSiteKV } from '@/lib/db/kv';
import { DB_BLOGS_KEY } from '@/lib/blogServer';
import { BlogPost } from '@/data/blogs';
import { purgeAllCaches } from '@/lib/cachePurge';

export const dynamic = 'force-dynamic';
const DB_BLOG_TAGS_KEY = 'site_blog_tags';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const blogs = await getServerBlogs();
    const customTags = (await getSiteKV<string[]>(DB_BLOG_TAGS_KEY)) || [];

    // Count tags across all blog posts
    const tagCountMap = new Map<string, { name: string; count: number }>();

    blogs.forEach((post) => {
      (post.tags || []).forEach((t) => {
        const trimmed = t.trim();
        if (!trimmed) return;
        const slug = slugify(trimmed);
        const existing = tagCountMap.get(slug);
        if (existing) {
          existing.count += 1;
        } else {
          tagCountMap.set(slug, { name: trimmed, count: 1 });
        }
      });
    });

    // Also include custom registered tags even if post count is 0
    customTags.forEach((t) => {
      const trimmed = t.trim();
      if (!trimmed) return;
      const slug = slugify(trimmed);
      if (!tagCountMap.has(slug)) {
        tagCountMap.set(slug, { name: trimmed, count: 0 });
      }
    });

    const tagsList = Array.from(tagCountMap.entries()).map(([slug, { name, count }]) => ({
      id: `blog-tag-${slug}`,
      name,
      slug,
      postCount: count,
    }));

    tagsList.sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));

    return NextResponse.json(tagsList, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error: any) {
    console.error('Error fetching blog tags:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch blog tags' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newName = body.newName || body.newTag || body.tag || body.name;
    const oldName = body.oldName || body.oldTag;

    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const cleanNew = newName.trim();
    const blogs = await getServerBlogs();
    let customTags = (await getSiteKV<string[]>(DB_BLOG_TAGS_KEY)) || [];

    let updatedBlogs = false;
    let updatedCount = 0;

    // If renaming an existing tag across blog posts
    if (oldName && oldName.trim().toLowerCase() !== cleanNew.toLowerCase()) {
      const cleanOld = oldName.trim().toLowerCase();
      blogs.forEach((post) => {
        if (Array.isArray(post.tags)) {
          const idx = post.tags.findIndex((t) => t.trim().toLowerCase() === cleanOld);
          if (idx >= 0) {
            post.tags[idx] = cleanNew;
            updatedBlogs = true;
            updatedCount += 1;
          }
        }
      });

      customTags = customTags.filter((t) => t.trim().toLowerCase() !== cleanOld);
    }

    if (!customTags.some((t) => t.toLowerCase() === cleanNew.toLowerCase())) {
      customTags.push(cleanNew);
    }

    await setSiteKV(DB_BLOG_TAGS_KEY, customTags);
    if (updatedBlogs) {
      await setSiteKV(DB_BLOGS_KEY, blogs);
    }
    purgeAllCaches();

    return NextResponse.json({
      success: true,
      tag: cleanNew,
      updatedPostsCount: updatedCount,
    });
  } catch (error: any) {
    console.error('Error saving blog tag:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save blog tag' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag') || searchParams.get('name');

    if (!tag) {
      return NextResponse.json({ error: 'Missing tag name' }, { status: 400 });
    }

    const cleanTarget = tag.trim().toLowerCase();
    const blogs = await getServerBlogs();
    let customTags = (await getSiteKV<string[]>(DB_BLOG_TAGS_KEY)) || [];

    let updatedBlogs = false;
    let affectedCount = 0;
    blogs.forEach((post) => {
      if (Array.isArray(post.tags)) {
        const initialLen = post.tags.length;
        post.tags = post.tags.filter((t) => t.trim().toLowerCase() !== cleanTarget);
        if (post.tags.length !== initialLen) {
          updatedBlogs = true;
          affectedCount += 1;
        }
      }
    });

    customTags = customTags.filter((t) => t.trim().toLowerCase() !== cleanTarget);

    await setSiteKV(DB_BLOG_TAGS_KEY, customTags);
    if (updatedBlogs) {
      await setSiteKV(DB_BLOGS_KEY, blogs);
    }
    purgeAllCaches();

    return NextResponse.json({
      success: true,
      removed: tag,
      affectedPostsCount: affectedCount,
    });
  } catch (error: any) {
    console.error('Error deleting blog tag:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete blog tag' },
      { status: 500 }
    );
  }
}
