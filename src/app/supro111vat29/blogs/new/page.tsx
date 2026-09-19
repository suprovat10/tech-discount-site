'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import BlogForm from '@/components/admin/BlogForm';
import { BlogPost } from '@/data/blogs';
import { addBlog } from '@/lib/blogStore';

export default function CreateBlogPage() {
  const router = useRouter();

  const handleCreateBlog = (post: BlogPost) => {
    addBlog(post);
    router.push('/supro111vat29/blogs');
  };

  const handleCancel = () => {
    router.push('/supro111vat29/blogs');
  };

  return (
    <BlogForm
      isEdit={false}
      onSubmit={handleCreateBlog}
      onCancel={handleCancel}
    />
  );
}
