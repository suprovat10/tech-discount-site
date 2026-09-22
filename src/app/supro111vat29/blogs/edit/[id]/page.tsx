'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import BlogForm from '@/components/admin/BlogForm';
import { BlogPost } from '@/data/blogs';
import { getBlogById, updateBlog } from '@/lib/blogStore';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cleanId = decodeURIComponent(resolvedParams.id);
    const post = getBlogById(cleanId) || getBlogById(resolvedParams.id);
    if (post) {
      setBlog(post);
      setLoading(false);
    } else {
      fetch(`/api/blogs?id=${encodeURIComponent(cleanId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            setBlog(data.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [resolvedParams.id]);

  const handleUpdateBlog = (updated: BlogPost) => {
    updateBlog(updated);
    router.push('/supro111vat29/blogs');
  };

  const handleCancel = () => {
    router.push('/supro111vat29/blogs');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Loading article data...
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-base font-bold text-foreground">Blog Article Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested article ID &ldquo;{resolvedParams.id}&rdquo; could not be located in local storage.
        </p>
        <Link
          href="/supro111vat29/blogs"
          className="border border-border bg-background hover:bg-muted text-foreground text-xs font-bold gap-1.5 h-9 px-4 inline-flex items-center justify-center transition-colors rounded-none cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Articles</span>
        </Link>
      </div>
    );
  }

  return (
    <BlogForm
      initialData={blog}
      isEdit={true}
      onSubmit={handleUpdateBlog}
      onCancel={handleCancel}
    />
  );
}
