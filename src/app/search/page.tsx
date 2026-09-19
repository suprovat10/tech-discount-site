import { redirect } from 'next/navigation';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sp.set(key, value);
    } else if (Array.isArray(value)) {
      sp.set(key, value.join(','));
    }
  }
  const queryStr = sp.toString();
  redirect(queryStr ? `/products?${queryStr}` : '/products');
}
