export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogTagItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
