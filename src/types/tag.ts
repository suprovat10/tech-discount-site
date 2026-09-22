export interface TagSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
}

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  featured?: boolean;
  seo?: TagSEO;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogTagItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  seo?: TagSEO;
  createdAt?: string;
  updatedAt?: string;
}
