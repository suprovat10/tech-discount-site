export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  website: string;
  isFeatured: boolean;
  showOnHomepage: boolean;
  isActive: boolean;
  order: number;
}

export const DEFAULT_BRANDS: BrandItem[] = [
  {
    id: 'b-apple',
    name: 'Apple',
    slug: 'apple',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/apple.svg',
    website: 'https://apple.com',
    isFeatured: true,
    showOnHomepage: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'b-samsung',
    name: 'Samsung',
    slug: 'samsung',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/samsung.svg',
    website: 'https://samsung.com',
    isFeatured: true,
    showOnHomepage: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'b-sony',
    name: 'Sony',
    slug: 'sony',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/sony.svg',
    website: 'https://sony.com',
    isFeatured: true,
    showOnHomepage: true,
    isActive: true,
    order: 3,
  },
  {
    id: 'b-bose',
    name: 'Bose',
    slug: 'bose',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/bose.svg',
    website: 'https://bose.com',
    isFeatured: true,
    showOnHomepage: true,
    isActive: true,
    order: 4,
  },
  {
    id: 'b-dell',
    name: 'Dell',
    slug: 'dell',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/dell.svg',
    website: 'https://dell.com',
    isFeatured: true,
    showOnHomepage: true,
    isActive: true,
    order: 5,
  },
  {
    id: 'b-hp',
    name: 'HP',
    slug: 'hp',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/hp.svg',
    website: 'https://hp.com',
    isFeatured: false,
    showOnHomepage: true,
    isActive: true,
    order: 6,
  },
  {
    id: 'b-asus',
    name: 'Asus',
    slug: 'asus',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/asus.svg',
    website: 'https://asus.com',
    isFeatured: false,
    showOnHomepage: true,
    isActive: true,
    order: 7,
  },
  {
    id: 'b-nintendo',
    name: 'Nintendo',
    slug: 'nintendo',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/nintendo.svg',
    website: 'https://nintendo.com',
    isFeatured: true,
    showOnHomepage: true,
    isActive: true,
    order: 8,
  },
  {
    id: 'b-lg',
    name: 'LG',
    slug: 'lg',
    logoUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons/lg.svg',
    website: 'https://lg.com',
    isFeatured: true,
    showOnHomepage: true,
    isActive: true,
    order: 9,
  },
];
