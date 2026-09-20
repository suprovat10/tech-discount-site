import { RetailerId } from '@/types/product';

export interface SubcategoryDefinition {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  showInTopSlider?: boolean;
  showInExploreDeals?: boolean;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  imageUrl?: string;
  description?: string;
  isFeaturedOnHome?: boolean;
  showInTopSlider?: boolean;
  showInExploreDeals?: boolean;
  subcategories: SubcategoryDefinition[];
}

export interface CatalogItem {

  id: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  badge?: string;
  imageUrl: string;
  imageAlt?: string;
  images?: string[];
  imageAlts?: string[];
  description: string;
  richDescription?: string;
  features: string[];
  specs: Record<string, string>;
  keySpecs?: Record<string, string>;
  faqs?: { question: string; answer: string }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    ogImageUrl?: string;
    ogImageAlt?: string;
    canonicalUrl?: string;
  };
  offers: {
    retailer: RetailerId;
    retailerName?: string;
    retailerItemId: string;
    productUrl: string;
    price: number;
    regularPrice?: number;
    isInStock: boolean;
    availabilityStatus: 'In Stock' | 'Out of Stock' | 'Limited Stock';
    shippingInfo: string;
    isLowestPrice?: boolean;
    condition?: string;
    currency?: string;
    lastUpdated?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
  views?: number;
}

// 1. All Categories & Subcategories (Easily customizable!)
export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'laptops-pc',
    name: 'Laptops & Computers',
    slug: 'laptops',
    icon: 'Laptop',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
    description: 'Compare verified prices on MacBooks, gaming laptops, ultrabooks, and ultra-wide 4K monitors.',
    isFeaturedOnHome: true,
    showInTopSlider: true,
    subcategories: [
      { id: 'macbooks', name: 'MacBooks & Apple', slug: 'macbooks', imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=80', showInTopSlider: true },
      { id: 'gaming-laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80', showInTopSlider: true },
      { id: 'ultrabooks', name: 'Ultrabooks & Windows', slug: 'ultrabooks', imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80' },
      { id: 'monitors', name: 'Monitors & Displays', slug: 'monitors', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80' },
    ],
  },
  {
    id: 'audio-sound',
    name: 'Audio & Headphones',
    slug: 'audio',
    icon: 'Headphones',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    description: 'Find top deals on active noise-canceling headphones, true wireless earbuds, and immersive sound systems.',
    isFeaturedOnHome: true,
    showInTopSlider: true,
    subcategories: [
      { id: 'noise-canceling', name: 'Noise-Canceling', slug: 'noise-canceling', imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80', showInTopSlider: true },
      { id: 'wireless-earbuds', name: 'Wireless Earbuds', slug: 'wireless-earbuds', imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80', showInTopSlider: true },
      { id: 'soundbars', name: 'Soundbars & Home Audio', slug: 'soundbars', imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80' },
      { id: 'bluetooth-speakers', name: 'Bluetooth Speakers', slug: 'bluetooth-speakers', imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&q=80' },
    ],
  },
  {
    id: 'smartphones-wearables',
    name: 'Mobile & Wearables',
    slug: 'mobile',
    icon: 'Smartphone',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    description: 'Unbeatable deals on latest flagship smartphones, smartwatches, and tablet powerhouses.',
    isFeaturedOnHome: true,
    showInTopSlider: true,
    subcategories: [
      { id: 'smartphones', name: 'Smartphones (iPhone & Android)', slug: 'smartphones', imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&q=80', showInTopSlider: true },
      { id: 'smartwatches', name: 'Smartwatches & Fitness', slug: 'smartwatches', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', showInTopSlider: true },
      { id: 'tablets-ipads', name: 'Tablets & iPads', slug: 'tablets', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80' },
    ],
  },
  {
    id: 'gaming-consoles',
    name: 'Gaming & Consoles',
    slug: 'gaming',
    icon: 'Gamepad2',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80',
    description: 'Next-gen PlayStation 5, Xbox Series X, Nintendo Switch OLED, controllers, and VR setups.',
    isFeaturedOnHome: true,
    showInTopSlider: true,
    subcategories: [
      { id: 'playstation', name: 'PlayStation 5', slug: 'ps5', imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80', showInTopSlider: true },
      { id: 'xbox', name: 'Xbox Series X|S', slug: 'xbox', imageUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500&q=80' },
      { id: 'nintendo', name: 'Nintendo Switch', slug: 'nintendo', imageUrl: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500&q=80' },
      { id: 'gaming-accessories', name: 'Controllers & Headsets', slug: 'gaming-gear', imageUrl: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&q=80' },
    ],
  },
  {
    id: 'tv-home-theater',
    name: 'TV & Home Theater',
    slug: 'tv',
    icon: 'Tv',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80',
    description: 'Cinematic OLED 4K displays, Mini-LEDs, surround home theater audio, and smart 4K streamers.',
    isFeaturedOnHome: false,
    showInTopSlider: true,
    subcategories: [
      { id: 'oled-tvs', name: 'OLED 4K TVs', slug: 'oled-tvs', imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80' },
      { id: 'qled-tvs', name: 'QLED & Mini-LED TVs', slug: 'qled-tvs', imageUrl: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=500&q=80' },
      { id: 'streaming-devices', name: 'Streaming Sticks & Boxes', slug: 'streaming', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80' },
    ],
  },
  {
    id: 'cameras-drones',
    name: 'Cameras & Smart Home',
    slug: 'cameras',
    icon: 'Camera',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
    description: 'High-res mirrorless creator cameras, stabilized action cams, smart video security, and IoT devices.',
    isFeaturedOnHome: false,
    showInTopSlider: true,
    subcategories: [
      { id: 'mirrorless', name: 'Mirrorless Cameras', slug: 'mirrorless', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80' },
      { id: 'action-cameras', name: 'Action & Dash Cams', slug: 'action-cams', imageUrl: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=500&q=80' },
      { id: 'smart-home', name: 'Smart Home & Security', slug: 'smart-home', imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=500&q=80' },
    ],
  },
];

// 2. High Quality Product Catalog with Real Retailer Pricing
export const PRODUCTS_CATALOG: CatalogItem[] = [
  {
    id: 'prod-airpods-pro-2',
    slug: 'apple-airpods-pro-2-usb-c',
    title: 'Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)',
    brand: 'Apple',
    category: 'Audio & Headphones',
    subcategory: 'Wireless Earbuds',
    rating: 4.8,
    reviewCount: 4280,
    badge: 'Best Seller',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    ],
    description: 'Up to 2x more Active Noise Cancellation than the previous generation. Adaptive Audio tailor-made for your environment. Transparency mode allows outside sounds in, while Conversation Awareness lowers your media volume when you start talking.',
    features: [
      'Next-level Active Noise Cancellation & Transparency Mode',
      'Personalized Spatial Audio with dynamic head tracking',
      'MagSafe Charging Case (USB-C) with speaker and lanyard loop',
      'Dust, sweat, and water resistant (IP54)',
      'Up to 6 hours of listening time with ANC enabled (30 hrs with case)',
    ],
    specs: {
      'Brand': 'Apple',
      'Model': 'MTJV3AM/A',
      'Battery Life': 'Up to 30 Hours with Case',
      'Connectivity': 'Bluetooth 5.3',
      'Noise Cancellation': 'Active Noise Cancellation (H2 Chip)',
      'Water Resistance': 'IP54',
      'Charging': 'USB-C, MagSafe, Qi Wireless, Apple Watch charger',
    },
    offers: [
      {
        retailer: 'walmart',
        retailerItemId: '1982974261',
        productUrl: 'https://www.walmart.com/ip/Apple-AirPods-Pro-2nd-Generation/1982974261',
        price: 179.99,
        regularPrice: 249.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping or Free Store Pickup',
      },
      {
        retailer: 'amazon',
        retailerItemId: 'B0CHWRXH8B',
        productUrl: 'https://www.amazon.com/dp/B0CHWRXH8B',
        price: 189.99,
        regularPrice: 249.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Prime 1-Day Delivery',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6447382',
        productUrl: 'https://www.bestbuy.com/site/apple-airpods-pro-2/6447382.p',
        price: 189.99,
        regularPrice: 249.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Next-Day Delivery or Curbside Pickup',
      },
      {
        retailer: 'target',
        retailerItemId: '89531284',
        productUrl: 'https://www.target.com/p/-/A-89531284',
        price: 189.99,
        regularPrice: 249.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping with Circle 360',
      },
    ],
  },
  {
    id: 'prod-macbook-air-m3',
    slug: 'apple-macbook-air-13-m3-chip',
    title: 'Apple 2024 MacBook Air 13-inch Laptop with M3 chip (8GB, 256GB SSD) - Space Gray',
    brand: 'Apple',
    category: 'Laptops & Computers',
    subcategory: 'MacBooks & Apple',
    rating: 4.9,
    reviewCount: 1840,
    badge: 'Editors Choice',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    ],
    description: 'Lean. Mean. M3 machine. Built for Apple Intelligence and supercharged by the next-generation M3 chip, the redesigned MacBook Air brings blazing speed and up to 18 hours of battery life to an ultra-portable aluminum body.',
    features: [
      'Apple M3 chip with 8-core CPU and 8-core GPU',
      '13.6-inch Liquid Retina display with 500 nits brightness and True Tone',
      'Up to 18 hours battery life on a single charge',
      'Fanless, completely silent design',
      '1080p FaceTime HD camera, three-mic array, four-speaker sound system',
    ],
    specs: {
      'Brand': 'Apple',
      'Processor': 'Apple M3 (8-Core CPU / 8-Core GPU)',
      'Memory': '8GB Unified RAM',
      'Storage': '256GB High-Speed SSD',
      'Display': '13.6" Liquid Retina (2560 x 1664)',
      'Weight': '2.7 lbs (1.24 kg)',
      'Battery': 'Up to 18 Hours',
    },
    offers: [
      {
        retailer: 'amazon',
        retailerItemId: 'B0CX23V258',
        productUrl: 'https://www.amazon.com/dp/B0CX23V258',
        price: 899.00,
        regularPrice: 1099.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Two-Day Shipping with Prime',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6565837',
        productUrl: 'https://www.bestbuy.com/site/apple-macbook-air-m3/6565837.p',
        price: 899.00,
        regularPrice: 1099.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Next-Day Shipping / Store Pickup',
      },
      {
        retailer: 'walmart',
        retailerItemId: '5344390977',
        productUrl: 'https://www.walmart.com/ip/Apple-MacBook-Air-13-M3/5344390977',
        price: 929.00,
        regularPrice: 1099.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Delivery',
      },
      {
        retailer: 'target',
        retailerItemId: '91238472',
        productUrl: 'https://www.target.com/p/-/A-91238472',
        price: 949.00,
        regularPrice: 1099.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping with Circle Card',
      },
    ],
  },
  {
    id: 'prod-sony-wh1000xm5',
    slug: 'sony-wh-1000xm5-noise-canceling-headphones',
    title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones - Black',
    brand: 'Sony',
    category: 'Audio & Headphones',
    subcategory: 'Noise-Canceling',
    rating: 4.7,
    reviewCount: 3120,
    badge: 'Top Rated Audio',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    description: 'Two processors and 8 microphones deliver magnificent noise cancellation and exceptional call quality. Newly developed soft fit leather and lightweight headband fit snugly around the ears with reduced pressure.',
    features: [
      'Industry-leading noise cancellation with two processors and 8 microphones',
      'Magnificent sound engineered with the new Integrated Processor V1',
      'Crystal clear hands-free calling with 4 beamforming microphones',
      'Up to 30-hour battery life with quick charging (3 min charge = 3 hours playback)',
      'Multipoint connection to quickly switch between devices',
    ],
    specs: {
      'Brand': 'Sony',
      'Model': 'WH1000XM5/B',
      'Driver Unit': '30mm Carbon Fiber',
      'Battery Life': 'Up to 30 Hours (ANC On) / 40 Hours (ANC Off)',
      'Weight': '250g',
      'Fast Charging': '3 min charge gives 3 hours playback',
      'Bluetooth': 'Version 5.2 (LDAC, AAC, SBC)',
    },
    offers: [
      {
        retailer: 'amazon',
        retailerItemId: 'B09XS7JWHH',
        productUrl: 'https://www.amazon.com/dp/B09XS7JWHH',
        price: 328.00,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 1-Day Prime Delivery',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6505727',
        productUrl: 'https://www.bestbuy.com/site/sony-wh-1000xm5/6505727.p',
        price: 329.99,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 1-Day Delivery or Store Pickup',
      },
      {
        retailer: 'walmart',
        retailerItemId: '1849182390',
        productUrl: 'https://www.walmart.com/ip/Sony-WH-1000XM5/1849182390',
        price: 348.00,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping',
      },
      {
        retailer: 'target',
        retailerItemId: '86291734',
        productUrl: 'https://www.target.com/p/-/A-86291734',
        price: 349.99,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping',
      },
    ],
  },
  {
    id: 'prod-ps5-slim',
    slug: 'sony-playstation-5-slim-digital-edition',
    title: 'Sony PlayStation 5 Console (Slim) - Digital Edition (1TB SSD)',
    brand: 'Sony',
    category: 'Gaming & Consoles',
    subcategory: 'PlayStation 5',
    rating: 4.9,
    reviewCount: 5690,
    badge: 'Popular Gaming',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80',
    description: 'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with haptic feedback, adaptive triggers and 3D Audio, and an all-new generation of incredible PlayStation games in a sleek, compact console design.',
    features: [
      'Slim Design: Over 30% reduction in volume and lighter weight',
      '1TB Built-in Ultra-High Speed NVMe SSD Storage',
      'Ray Tracing, 4K-TV Gaming, Up to 120fps with 120Hz output',
      'Tempest 3D AudioTech and DualSense Wireless Controller included',
      'Backwards compatibility with over 4,000 PS4 games',
    ],
    specs: {
      'Brand': 'Sony',
      'Console Type': 'PlayStation 5 Slim (Digital)',
      'Internal Storage': '1TB NVMe SSD',
      'Max Resolution': '4K @ 120Hz, 8K Support',
      'HDR': 'Supported (HDR10)',
      'Audio': 'Tempest 3D AudioTech',
    },
    offers: [
      {
        retailer: 'walmart',
        retailerItemId: '2987163451',
        productUrl: 'https://www.walmart.com/ip/Sony-PlayStation-5-Slim-Digital/2987163451',
        price: 449.00,
        regularPrice: 449.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Delivery or Store Pickup',
      },
      {
        retailer: 'amazon',
        retailerItemId: 'B0CL5KNB9M',
        productUrl: 'https://www.amazon.com/dp/B0CL5KNB9M',
        price: 449.99,
        regularPrice: 449.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Prime Two-Day Delivery',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6564757',
        productUrl: 'https://www.bestbuy.com/site/sony-ps5-slim-digital/6564757.p',
        price: 449.99,
        regularPrice: 449.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Standard Shipping or 1-Hour Pickup',
      },
      {
        retailer: 'target',
        retailerItemId: '89938461',
        productUrl: 'https://www.target.com/p/-/A-89938461',
        price: 449.99,
        regularPrice: 449.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Delivery',
      },
    ],
  },
  {
    id: 'prod-samsung-s90c-oled',
    slug: 'samsung-65-inch-oled-4k-s90c-smart-tv',
    title: 'Samsung 65-Inch Class OLED 4K S90C Series Quantum HDR Smart TV',
    brand: 'Samsung',
    category: 'TV & Home Theater',
    subcategory: 'OLED 4K TVs',
    rating: 4.8,
    reviewCount: 920,
    badge: 'Huge Price Drop',
    imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80',
    description: 'See the sensational contrast and pure blacks of OLED powered by Quantum Dot technology. With the Neural Quantum Processor with 4K Upscaling, every scene is enhanced in real time to breath-taking 4K picture quality.',
    features: [
      'OLED with Quantum Dot Technology: Pure blacks and billion colors',
      'Neural Quantum Processor 4K with AI upscaling',
      'Motion Xcelerator Turbo Pro (Up to 144Hz refresh rate for gaming)',
      'Dolby Atmos and Object Tracking Sound Lite built-in',
      'Ultra-slim LaserSlim design with bezel-less frame',
    ],
    specs: {
      'Brand': 'Samsung',
      'Screen Size': '65 Inch',
      'Panel Type': 'QD-OLED (Quantum Dot OLED)',
      'Resolution': '4K UHD (3840 x 2160)',
      'Refresh Rate': '144Hz Native',
      'HDR': 'Quantum HDR OLED, HDR10+, HLG',
      'HDMI Ports': '4 x HDMI 2.1 (4K@144Hz support)',
    },
    offers: [
      {
        retailer: 'amazon',
        retailerItemId: 'B0BDHWDR12',
        productUrl: 'https://www.amazon.com/dp/B0BDHWDR12',
        price: 1597.99,
        regularPrice: 2099.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Scheduled Delivery & Unpack',
      },
      {
        retailer: 'walmart',
        retailerItemId: '3819203948',
        productUrl: 'https://www.walmart.com/ip/Samsung-65-OLED-S90C/3819203948',
        price: 1597.99,
        regularPrice: 2099.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Freight Home Delivery',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6536965',
        productUrl: 'https://www.bestbuy.com/site/samsung-65-s90c/6536965.p',
        price: 1599.99,
        regularPrice: 2099.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Standard Delivery & Professional Setup Option',
      },
      {
        retailer: 'target',
        retailerItemId: '87912304',
        productUrl: 'https://www.target.com/p/-/A-87912304',
        price: 1599.99,
        regularPrice: 2099.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Scheduled Freight Delivery',
      },
    ],
  },
  {
    id: 'prod-apple-watch-9',
    slug: 'apple-watch-series-9-gps-41mm-midnight',
    title: 'Apple Watch Series 9 GPS 41mm Midnight Aluminum Case with Sport Band',
    brand: 'Apple',
    category: 'Mobile & Wearables',
    subcategory: 'Smartwatches & Fitness',
    rating: 4.8,
    reviewCount: 2450,
    badge: 'Popular Wearable',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
    description: 'Smarter, brighter, mightier. The powerful S9 SiP chip brings a magical new way to interact with your Apple Watch using the Double Tap gesture, plus an always-on display twice as bright.',
    features: [
      'Powerful S9 SiP chip with 4-core Neural Engine',
      'Magical Double Tap gesture for one-handed control',
      'Brighter Always-On Retina display up to 2000 nits',
      'Advanced health sensors: Blood Oxygen, ECG, Sleep Stages, Temperature',
      'Crash Detection, Fall Detection, and Emergency SOS',
    ],
    specs: {
      'Brand': 'Apple',
      'Case Size': '41mm',
      'Case Material': 'Aluminum (Midnight)',
      'Connectivity': 'GPS, Wi-Fi, Bluetooth 5.3',
      'Water Resistance': '50 meters (Swimproof)',
      'Battery Life': 'Up to 18 hours (36 hours in Low Power Mode)',
    },
    offers: [
      {
        retailer: 'amazon',
        retailerItemId: 'B0BDJ6LMPD',
        productUrl: 'https://www.amazon.com/dp/B0BDJ6LMPD',
        price: 329.00,
        regularPrice: 399.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free Prime Delivery',
      },
      {
        retailer: 'bestbuy',
        retailerItemId: '6340265',
        productUrl: 'https://www.bestbuy.com/site/apple-watch-9/6340265.p',
        price: 329.00,
        regularPrice: 399.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 1-Day Delivery or Store Pickup',
      },
      {
        retailer: 'walmart',
        retailerItemId: '4928172938',
        productUrl: 'https://www.walmart.com/ip/Apple-Watch-9/4928172938',
        price: 329.00,
        regularPrice: 399.00,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping',
      },
      {
        retailer: 'target',
        retailerItemId: '88294712',
        productUrl: 'https://www.target.com/p/-/A-88294712',
        price: 329.99,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: 'In Stock',
        shippingInfo: 'Free 2-Day Shipping with Circle Card',
      },
    ],
  },

  {
    id: "prod-asus-rog-zephyrus-g16",
    slug: "asus-rog-zephyrus-g16-oled-gaming-laptop",
    title: "ASUS ROG Zephyrus G16 (2024) Gaming Laptop (Intel Core Ultra 9, RTX 4070, 32GB RAM, 1TB SSD) - Eclipse Gray",
    brand: "ASUS",
    category: "Laptops & Computers",
    subcategory: "Gaming Laptops",
    rating: 4.8,
    reviewCount: 420,
    badge: "High Performance",
    imageUrl: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80"
    ],
    description: "Precision crafted CNC aluminum chassis with 2.5K 240Hz ROG Nebula OLED display. Powered by Intel Core Ultra 9 and NVIDIA GeForce RTX 4070 for elite esports gaming and creative work.",
    features: [
      "Intel Core Ultra 9 Processor 185H with dedicated AI NPU",
      "NVIDIA GeForce RTX 4070 Laptop GPU (105W Max TGP)",
      "16-inch 2.5K (2560 x 1600) 240Hz 0.2ms OLED ROG Nebula Display",
      "32GB LPDDR5X-7467 MHz RAM and 1TB PCIe 4.0 NVMe M.2 SSD",
      "Ultra-slim 0.59 inch CNC unibody aluminum profile weighing 4.08 lbs"
    ],
    specs: {
      "Brand": "ASUS",
      "Model": "GU605MI-XS96",
      "Processor": "Intel Core Ultra 9 185H (16 Cores)",
      "Graphics": "NVIDIA GeForce RTX 4070 (8GB GDDR6)",
      "Display": "16-inch 2.5K 240Hz OLED",
      "Memory": "32GB LPDDR5X",
      "Storage": "1TB NVMe SSD"
    },
    offers: [
      {
        retailer: "bestbuy",
        retailerItemId: "6570270",
        productUrl: "https://www.bestbuy.com/site/asus-rog-zephyrus-g16/6570270.p",
        price: 1799.99,
        regularPrice: 1999.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Next-Day Shipping"
      },
      {
        retailer: "amazon",
        retailerItemId: "B0CV694V1G",
        productUrl: "https://www.amazon.com/dp/B0CV694V1G",
        price: 1849.00,
        regularPrice: 1999.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime Shipping"
      },
      {
        retailer: "walmart",
        retailerItemId: "5489123049",
        productUrl: "https://www.walmart.com/ip/ASUS-ROG-Zephyrus-G16/5489123049",
        price: 1899.99,
        regularPrice: 1999.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Delivery"
      },
      {
        retailer: "target",
        retailerItemId: "91234851",
        productUrl: "https://www.target.com/p/-/A-91234851",
        price: 1899.99,
        regularPrice: 1999.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-dell-xps-15-oled",
    slug: "dell-xps-15-9530-oled-touchscreen-laptop",
    title: "Dell XPS 15 9530 Laptop (15.6 Inch 3.5K OLED Touchscreen, Intel Core i9, 32GB RAM, 1TB SSD) - Platinum Silver",
    brand: "Dell",
    category: "Laptops & Computers",
    subcategory: "Ultrabooks & Windows",
    rating: 4.7,
    reviewCount: 890,
    badge: "Creator Pick",
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80"],
    description: "Stunning 3.5K OLED InfinityEdge touchscreen with 100% DCI-P3 color gamut. Powered by 13th Gen Intel Core i9 processor and carbon-fiber palm rest.",
    features: [
      "15.6-inch 3.5K (3456 x 2160) OLED InfinityEdge Touch Display",
      "13th Gen Intel Core i9-13900H Processor (14 Cores, up to 5.4 GHz)",
      "NVIDIA GeForce RTX 4060 8GB GDDR6 Graphics",
      "32GB DDR5 4800MHz RAM and 1TB M.2 PCIe NVMe SSD",
      "Machined aluminum and carbon fiber composite construction"
    ],
    specs: {
      "Brand": "Dell",
      "Display": "15.6 Inch 3.5K OLED Touch",
      "Processor": "Intel Core i9-13900H",
      "RAM": "32GB DDR5",
      "Storage": "1TB SSD"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B0C9Y19N9B",
        productUrl: "https://www.amazon.com/dp/B0C9Y19N9B",
        price: 1849.00,
        regularPrice: 2299.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime 2-Day Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6540611",
        productUrl: "https://www.bestbuy.com/site/dell-xps-15/6540611.p",
        price: 1899.99,
        regularPrice: 2299.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Standard Delivery"
      },
      {
        retailer: "walmart",
        retailerItemId: "472891048",
        productUrl: "https://www.walmart.com/ip/Dell-XPS-15-OLED/472891048",
        price: 1949.00,
        regularPrice: 2299.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "88910243",
        productUrl: "https://www.target.com/p/-/A-88910243",
        price: 1999.00,
        regularPrice: 2299.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-lg-ultragear-4k",
    slug: "lg-27gp950-b-27-inch-ultragear-4k-gaming-monitor",
    title: "LG 27GP950-B 27” UltraGear UHD (3840 x 2160) Nano IPS 1ms 144Hz Gaming Monitor with HDMI 2.1",
    brand: "LG",
    category: "Laptops & Computers",
    subcategory: "Monitors & Displays",
    rating: 4.7,
    reviewCount: 1650,
    badge: "Top 4K Monitor",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80"],
    description: "Next-generation 4K gaming monitor with Nano IPS 1ms response time and 144Hz refresh rate (overclockable to 160Hz). Features HDMI 2.1 for 4K 120Hz on PS5 and Xbox.",
    features: [
      "27-inch UHD (3840 x 2160) Nano IPS Display with VESA DisplayHDR 600",
      "144Hz Refresh Rate (O/C 160Hz) with 1ms (GtG) response time",
      "HDMI 2.1 x2 with Support for 4K 120Hz on PlayStation 5 and Xbox Series X",
      "NVIDIA G-SYNC Compatible and AMD FreeSync Premium Pro",
      "Sphere Lighting 2.0 RGB ambient lighting with Sound & Video Sync"
    ],
    specs: {
      "Brand": "LG",
      "Screen Size": "27 Inch",
      "Resolution": "4K UHD (3840 x 2160)",
      "Refresh Rate": "144Hz / 160Hz OC",
      "Panel": "Nano IPS 1ms"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B09165N12G",
        productUrl: "https://www.amazon.com/dp/B09165N12G",
        price: 596.99,
        regularPrice: 799.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6451081",
        productUrl: "https://www.bestbuy.com/site/lg-ultragear-27/6451081.p",
        price: 599.99,
        regularPrice: 799.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Delivery or Store Pickup"
      },
      {
        retailer: "walmart",
        retailerItemId: "392019481",
        productUrl: "https://www.walmart.com/ip/LG-UltraGear-4K/392019481",
        price: 629.00,
        regularPrice: 799.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "87910245",
        productUrl: "https://www.target.com/p/-/A-87910245",
        price: 649.99,
        regularPrice: 799.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-sonos-beam-gen-2",
    slug: "sonos-beam-gen-2-compact-smart-soundbar",
    title: "Sonos Beam (Gen 2) Compact Smart Soundbar with Dolby Atmos and Voice Control - Black",
    brand: "Sonos",
    category: "Audio & Headphones",
    subcategory: "Soundbars & Home Audio",
    rating: 4.8,
    reviewCount: 1980,
    badge: "Dolby Atmos",
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80"],
    description: "Fill your room with panoramic sound and crystal-clear dialogue for TV, movies, music, and gaming. Supercharged by Dolby Atmos 3D audio.",
    features: [
      "Dolby Atmos panoramic sound with 3D audio mapping",
      "Enhanced speech clarity for crystal clear movie dialogue",
      "Simple setup with only two cables (power and HDMI eARC)",
      "Stream music via Wi-Fi, Apple AirPlay 2, and Spotify Connect",
      "Hands-free Amazon Alexa and Google Assistant built-in"
    ],
    specs: {
      "Brand": "Sonos",
      "Audio Technology": "Dolby Atmos, Dolby Digital Plus",
      "Connectivity": "HDMI eARC, Wi-Fi, Ethernet, AirPlay 2",
      "Dimensions": "25.6 x 3.9 x 2.7 inches"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B09G741872",
        productUrl: "https://www.amazon.com/dp/B09G741872",
        price: 399.00,
        regularPrice: 499.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 1-Day Prime Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6475988",
        productUrl: "https://www.bestbuy.com/site/sonos-beam-gen-2/6475988.p",
        price: 399.99,
        regularPrice: 499.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Next-Day Delivery or Pickup"
      },
      {
        retailer: "walmart",
        retailerItemId: "281903841",
        productUrl: "https://www.walmart.com/ip/Sonos-Beam-2/281903841",
        price: 419.00,
        regularPrice: 499.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Delivery"
      },
      {
        retailer: "target",
        retailerItemId: "84920194",
        productUrl: "https://www.target.com/p/-/A-84920194",
        price: 449.00,
        regularPrice: 499.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      }
    ]
  },
  {
    id: "prod-jbl-charge-5",
    slug: "jbl-charge-5-portable-waterproof-bluetooth-speaker",
    title: "JBL Charge 5 Portable Waterproof Bluetooth Speaker with Built-in Powerbank - Black",
    brand: "JBL",
    category: "Audio & Headphones",
    subcategory: "Bluetooth Speakers",
    rating: 4.9,
    reviewCount: 7820,
    badge: "Waterproof IP67",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80"],
    description: "Bold JBL Original Pro Sound with long excursion driver, separate tweeter and dual pumping JBL bass radiators. Up to 20 hours playtime and powerbank feature.",
    features: [
      "JBL Original Pro Sound with separate tweeter and dual bass radiators",
      "IP67 Waterproof and Dustproof for pool and beach use",
      "Up to 20 hours of playtime on a single charge",
      "Built-in powerbank allows charging your smartphone on the go",
      "PartyBoost allows pairing multiple JBL compatible speakers"
    ],
    specs: {
      "Brand": "JBL",
      "Battery Life": "Up to 20 Hours",
      "Waterproof Rating": "IP67",
      "Bluetooth": "Version 5.1"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B08X4W4G5T",
        productUrl: "https://www.amazon.com/dp/B08X4W4G5T",
        price: 139.95,
        regularPrice: 179.95,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime Shipping"
      },
      {
        retailer: "walmart",
        retailerItemId: "39201934",
        productUrl: "https://www.walmart.com/ip/JBL-Charge-5/39201934",
        price: 139.95,
        regularPrice: 179.95,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6450628",
        productUrl: "https://www.bestbuy.com/site/jbl-charge-5/6450628.p",
        price: 149.99,
        regularPrice: 179.95,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 1-Day Delivery"
      },
      {
        retailer: "target",
        retailerItemId: "82910394",
        productUrl: "https://www.target.com/p/-/A-82910394",
        price: 149.99,
        regularPrice: 179.95,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-iphone-15-pro-max",
    slug: "apple-iphone-15-pro-max-256gb-natural-titanium",
    title: "Apple iPhone 15 Pro Max (256GB, Natural Titanium) - Unlocked",
    brand: "Apple",
    category: "Mobile & Wearables",
    subcategory: "Smartphones (iPhone & Android)",
    rating: 4.9,
    reviewCount: 6500,
    badge: "Flagship Phone",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80"],
    description: "Forged in aerospace-grade titanium with the groundbreaking A17 Pro chip, customizable Action button, and the most versatile 5x optical telephoto camera system.",
    features: [
      "Aerospace-grade titanium design with textured matte-glass back",
      "6.7-inch Super Retina XDR display with ProMotion 120Hz and Always-On",
      "A17 Pro chip with 6-core GPU delivers next-level mobile gaming",
      "48MP Main camera with 5x optical zoom telephoto lens",
      "USB-C connector with USB 3 speeds up to 10Gb/s"
    ],
    specs: {
      "Brand": "Apple",
      "Display": "6.7 Inch Super Retina XDR (120Hz)",
      "Processor": "Apple A17 Pro",
      "Storage": "256GB",
      "Camera": "48MP + 12MP Ultra-wide + 12MP 5x Telephoto"
    },
    offers: [
      {
        retailer: "walmart",
        retailerItemId: "39201948",
        productUrl: "https://www.walmart.com/ip/Apple-iPhone-15-Pro-Max/39201948",
        price: 1099.00,
        regularPrice: 1199.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6551234",
        productUrl: "https://www.bestbuy.com/site/apple-iphone-15-pro-max/6551234.p",
        price: 1149.99,
        regularPrice: 1199.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Delivery or Store Pickup"
      },
      {
        retailer: "amazon",
        retailerItemId: "B0CHWZ8G8K",
        productUrl: "https://www.amazon.com/dp/B0CHWZ8G8K",
        price: 1149.99,
        regularPrice: 1199.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime Delivery"
      },
      {
        retailer: "target",
        retailerItemId: "89912049",
        productUrl: "https://www.target.com/p/-/A-89912049",
        price: 1199.00,
        regularPrice: 1199.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Delivery"
      }
    ]
  },
  {
    id: "prod-samsung-s24-ultra",
    slug: "samsung-galaxy-s24-ultra-512gb-titanium-gray",
    title: "Samsung Galaxy S24 Ultra AI Smartphone (512GB, Titanium Gray, S Pen Included)",
    brand: "Samsung",
    category: "Mobile & Wearables",
    subcategory: "Smartphones (iPhone & Android)",
    rating: 4.8,
    reviewCount: 3100,
    badge: "Galaxy AI",
    imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80"],
    description: "Welcome to the era of mobile AI. With Galaxy S24 Ultra, unleash whole new levels of creativity and productivity with Circle to Search, Live Translate, and 200MP camera.",
    features: [
      "Titanium frame with 6.8-inch Dynamic AMOLED 2X 120Hz Display",
      "Galaxy AI: Circle to Search with Google, Live Translate, and Note Assist",
      "200MP Main Camera with 5x Quad Telephoto system and AI Zoom",
      "Snapdragon 8 Gen 3 for Galaxy with ray-tracing mobile gaming",
      "Built-in S Pen for ultra-precise drawing, editing, and note-taking"
    ],
    specs: {
      "Brand": "Samsung",
      "Screen Size": "6.8 Inch QHD+ AMOLED 120Hz",
      "Processor": "Snapdragon 8 Gen 3 for Galaxy",
      "Storage": "512GB",
      "Main Camera": "200MP Quad Tele System"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B0CQ8R794R",
        productUrl: "https://www.amazon.com/dp/B0CQ8R794R",
        price: 1199.99,
        regularPrice: 1419.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Two-Day Shipping"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6569123",
        productUrl: "https://www.bestbuy.com/site/samsung-galaxy-s24-ultra/6569123.p",
        price: 1199.99,
        regularPrice: 1419.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 1-Day Delivery"
      },
      {
        retailer: "walmart",
        retailerItemId: "492019481",
        productUrl: "https://www.walmart.com/ip/Samsung-Galaxy-S24-Ultra/492019481",
        price: 1249.00,
        regularPrice: 1419.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "89912401",
        productUrl: "https://www.target.com/p/-/A-89912401",
        price: 1299.99,
        regularPrice: 1419.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping with Circle Card"
      }
    ]
  },
  {
    id: "prod-ipad-pro-m4",
    slug: "apple-ipad-pro-11-inch-m4-chip-256gb-space-black",
    title: "Apple iPad Pro 11-inch (M4 Chip, 256GB, Ultra Retina XDR, Wi-Fi, Space Black)",
    brand: "Apple",
    category: "Mobile & Wearables",
    subcategory: "Tablets & iPads",
    rating: 4.9,
    reviewCount: 1420,
    badge: "M4 OLED Display",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80"],
    description: "The thinnest Apple product ever. Powered by the breakthrough Apple M4 chip with tandem OLED Ultra Retina XDR display for extreme contrast and peak brightness.",
    features: [
      "Ultra Retina XDR display featuring state-of-the-art Tandem OLED technology",
      "Apple M4 chip with 9-core CPU and 10-core GPU with hardware ray tracing",
      "Impossibly thin 5.3mm design crafted with 100% recycled aluminum",
      "Supports Apple Pencil Pro with barrel roll and squeeze gestures",
      "Thunderbolt / USB 4 port for connecting high-resolution external displays"
    ],
    specs: {
      "Brand": "Apple",
      "Processor": "Apple M4 Chip",
      "Screen": "11-inch Tandem OLED Ultra Retina XDR",
      "Storage": "256GB",
      "Weight": "0.98 lb"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B0D3J75B22",
        productUrl: "https://www.amazon.com/dp/B0D3J75B22",
        price: 899.00,
        regularPrice: 999.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime 1-Day Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6571239",
        productUrl: "https://www.bestbuy.com/site/apple-ipad-pro-11-m4/6571239.p",
        price: 899.00,
        regularPrice: 999.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Delivery or Store Pickup"
      },
      {
        retailer: "walmart",
        retailerItemId: "492019482",
        productUrl: "https://www.walmart.com/ip/Apple-iPad-Pro-11-M4/492019482",
        price: 949.00,
        regularPrice: 999.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "91238475",
        productUrl: "https://www.target.com/p/-/A-91238475",
        price: 949.00,
        regularPrice: 999.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-xbox-series-x",
    slug: "microsoft-xbox-series-x-1tb-console",
    title: "Microsoft Xbox Series X 1TB Video Game Console - Black",
    brand: "Microsoft",
    category: "Gaming & Consoles",
    subcategory: "Xbox Series X|S",
    rating: 4.8,
    reviewCount: 4500,
    badge: "True 4K Gaming",
    imageUrl: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80"],
    description: "The fastest, most powerful Xbox ever. Play thousands of titles from four generations of consoles with Quick Resume, lightning-fast load times, and up to 120 FPS.",
    features: [
      "12 Teraflops of raw graphic processing power with AMD Zen 2 and RDNA 2",
      "True 4K Gaming at up to 120 FPS with DirectX ray tracing",
      "Quick Resume to seamlessly switch between multiple games in seconds",
      "1TB Custom NVMe SSD for fast load times and expanded performance",
      "Backward compatibility with 4 generations of thousands of Xbox games"
    ],
    specs: {
      "Brand": "Microsoft",
      "Compute Power": "12 Teraflops",
      "Internal Storage": "1TB Custom NVMe SSD",
      "Max Resolution": "True 4K @ 120Hz, 8K HDR Ready",
      "Drive": "4K UHD Blu-ray Drive"
    },
    offers: [
      {
        retailer: "walmart",
        retailerItemId: "443400678",
        productUrl: "https://www.walmart.com/ip/Xbox-Series-X/443400678",
        price: 449.99,
        regularPrice: 499.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Delivery"
      },
      {
        retailer: "amazon",
        retailerItemId: "B08H75RTPV",
        productUrl: "https://www.amazon.com/dp/B08H75RTPV",
        price: 449.99,
        regularPrice: 499.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime 2-Day Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6428324",
        productUrl: "https://www.bestbuy.com/site/microsoft-xbox-series-x/6428324.p",
        price: 449.99,
        regularPrice: 499.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Standard Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "80790841",
        productUrl: "https://www.target.com/p/-/A-80790841",
        price: 449.99,
        regularPrice: 499.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-nintendo-switch-oled",
    slug: "nintendo-switch-oled-model-white-joy-con",
    title: "Nintendo Switch – OLED Model with White Joy-Con (64GB Internal Storage)",
    brand: "Nintendo",
    category: "Gaming & Consoles",
    subcategory: "Nintendo Switch",
    rating: 4.9,
    reviewCount: 8900,
    badge: "Handheld OLED",
    imageUrl: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80"],
    description: "Vivid 7-inch OLED screen with wide adjustable stand, wired LAN dock, 64GB of internal storage, and enhanced audio in handheld and tabletop modes.",
    features: [
      "Vibrant 7-inch OLED screen with vivid colors and crisp contrast",
      "Wide, adjustable stand for comfortable tabletop gaming angles",
      "Wired LAN port built into the TV dock for reliable online gaming",
      "64GB internal storage for game saves and digital downloads",
      "Enhanced audio from system onboard speakers in handheld mode"
    ],
    specs: {
      "Brand": "Nintendo",
      "Screen": "7-inch OLED (1280 x 720)",
      "Storage": "64GB Internal (MicroSD expandable)",
      "Battery Life": "4.5 to 9 Hours"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B098RKWHHZ",
        productUrl: "https://www.amazon.com/dp/B098RKWHHZ",
        price: 319.99,
        regularPrice: 349.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime Delivery"
      },
      {
        retailer: "walmart",
        retailerItemId: "91203841",
        productUrl: "https://www.walmart.com/ip/Nintendo-Switch-OLED/91203841",
        price: 319.99,
        regularPrice: 349.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6470924",
        productUrl: "https://www.bestbuy.com/site/nintendo-switch-oled/6470924.p",
        price: 339.99,
        regularPrice: 349.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 1-Day Delivery"
      },
      {
        retailer: "target",
        retailerItemId: "83887641",
        productUrl: "https://www.target.com/p/-/A-83887641",
        price: 349.99,
        regularPrice: 349.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-dualsense-edge",
    slug: "sony-dualsense-edge-wireless-controller-ps5",
    title: "Sony DualSense Edge Wireless Controller for PlayStation 5",
    brand: "Sony",
    category: "Gaming & Consoles",
    subcategory: "Controllers & Headsets",
    rating: 4.7,
    reviewCount: 1200,
    badge: "Pro Gaming",
    imageUrl: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80"],
    description: "Get an edge in gameplay by creating your own custom controls to fit your playstyle. Built with high performance and personalization in mind.",
    features: [
      "Ultra-customizable controls: remappable buttons and adjustable trigger travel",
      "Swappable stick modules and changeable stick caps (standard, high dome, low dome)",
      "Dual back buttons mappable to any button input for quick reaction times",
      "Haptic feedback, adaptive triggers, built-in microphone, and motion controls",
      "Carrying case and braided USB cable with lockable connector housing"
    ],
    specs: {
      "Brand": "Sony",
      "Compatibility": "PlayStation 5, PC, Mac, iOS, Android",
      "Connectivity": "Bluetooth 5.1 & USB-C wired",
      "Weight": "325g"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B0B8KNT31H",
        productUrl: "https://www.amazon.com/dp/B0B8KNT31H",
        price: 189.99,
        regularPrice: 199.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6516348",
        productUrl: "https://www.bestbuy.com/site/sony-dualsense-edge/6516348.p",
        price: 194.99,
        regularPrice: 199.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Standard Delivery"
      },
      {
        retailer: "walmart",
        retailerItemId: "29103847",
        productUrl: "https://www.walmart.com/ip/DualSense-Edge-PS5/29103847",
        price: 199.99,
        regularPrice: 199.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Delivery"
      },
      {
        retailer: "target",
        retailerItemId: "87820194",
        productUrl: "https://www.target.com/p/-/A-87820194",
        price: 199.99,
        regularPrice: 199.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-lg-c3-oled-65",
    slug: "lg-c3-series-65-inch-oled-evo-4k-smart-tv",
    title: "LG C3 Series 65-Inch Class OLED evo 4K Smart TV with Dolby Vision and Atmos (OLED65C3PUA)",
    brand: "LG",
    category: "TV & Home Theater",
    subcategory: "OLED 4K TVs",
    rating: 4.9,
    reviewCount: 2300,
    badge: "Best OLED for Movies",
    imageUrl: "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=80"],
    description: "Self-lit OLED evo pixels produce infinite contrast, deep blacks, and over a billion colors. Powered by the next-gen α9 AI Processor Gen6 with Brightness Booster.",
    features: [
      "OLED evo panel powered by α9 AI Processor Gen6 with Brightness Booster",
      "Dolby Vision, Dolby Atmos, and Filmmaker Mode for cinema home theater",
      "Ultimate gaming with 0.1ms response time, 120Hz native, NVIDIA G-Sync and FreeSync",
      "4 HDMI 2.1 inputs supporting full 4K 120Hz on all ports",
      "Ultra-slim bezel-less design with modern gallery aesthetic"
    ],
    specs: {
      "Brand": "LG",
      "Screen Size": "65 Inch",
      "Panel Type": "OLED evo 4K UHD",
      "Refresh Rate": "120Hz Native (VRR / ALLM)",
      "HDMI Ports": "4 x HDMI 2.1"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B0BVXDPZ23",
        productUrl: "https://www.amazon.com/dp/B0BVXDPZ23",
        price: 1496.99,
        regularPrice: 1899.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Scheduled Freight Delivery"
      },
      {
        retailer: "walmart",
        retailerItemId: "3920194821",
        productUrl: "https://www.walmart.com/ip/LG-C3-65-OLED/3920194821",
        price: 1496.99,
        regularPrice: 1899.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6535929",
        productUrl: "https://www.bestbuy.com/site/lg-c3-65-oled/6535929.p",
        price: 1549.99,
        regularPrice: 1899.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Professional Delivery"
      },
      {
        retailer: "target",
        retailerItemId: "88910245",
        productUrl: "https://www.target.com/p/-/A-88910245",
        price: 1599.99,
        regularPrice: 1899.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Scheduled Delivery"
      }
    ]
  },
  {
    id: "prod-apple-tv-4k",
    slug: "apple-tv-4k-128gb-wi-fi-ethernet-3rd-gen",
    title: "Apple TV 4K 128GB Wi-Fi + Ethernet (3rd Generation) with Siri Remote",
    brand: "Apple",
    category: "TV & Home Theater",
    subcategory: "Streaming Sticks & Boxes",
    rating: 4.9,
    reviewCount: 3800,
    badge: "HDR10+ & Dolby Atmos",
    imageUrl: "https://images.unsplash.com/photo-1528928441742-b4ccac1bb04c?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1528928441742-b4ccac1bb04c?w=800&q=80"],
    description: "Brings Apple TV+, Apple Music, Apple Arcade, and thousands of apps together with our best-ever picture and audio quality. Driven by the blazing-fast A15 Bionic chip.",
    features: [
      "4K Dolby Vision and HDR10+ for stunning cinematic picture quality",
      "Dolby Atmos for three-dimensional, theater-like surround audio",
      "A15 Bionic chip delivers incredible speed and smooth gaming performance",
      "Siri Remote (3rd gen) with USB-C and touch-enabled clickpad",
      "128GB storage with Gigabit Ethernet and Thread smart home hub support"
    ],
    specs: {
      "Brand": "Apple",
      "Processor": "Apple A15 Bionic",
      "Storage": "128GB",
      "Networking": "Gigabit Ethernet, Wi-Fi 6, Bluetooth 5.0, Thread",
      "Resolution": "4K UHD @ 60fps"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B0BJLGC17L",
        productUrl: "https://www.amazon.com/dp/B0BJLGC17L",
        price: 134.99,
        regularPrice: 149.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime 1-Day Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6472499",
        productUrl: "https://www.bestbuy.com/site/apple-tv-4k-128gb/6472499.p",
        price: 139.99,
        regularPrice: 149.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Next-Day Delivery or Pickup"
      },
      {
        retailer: "walmart",
        retailerItemId: "189201948",
        productUrl: "https://www.walmart.com/ip/Apple-TV-4K-128GB/189201948",
        price: 144.00,
        regularPrice: 149.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "87289104",
        productUrl: "https://www.target.com/p/-/A-87289104",
        price: 144.99,
        regularPrice: 149.00,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-sony-a7-iv",
    slug: "sony-alpha-7-iv-full-frame-mirrorless-camera",
    title: "Sony Alpha 7 IV Full-frame Mirrorless Interchangeable Lens Camera (Body Only)",
    brand: "Sony",
    category: "Cameras & Smart Home",
    subcategory: "Mirrorless Cameras",
    rating: 4.8,
    reviewCount: 940,
    badge: "Pro Mirrorless",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"],
    description: "The hybrid powerhouse. 33MP full-frame Exmor R back-illuminated sensor, 4K 60p 10-bit 4:2:2 video recording, and real-time AI Eye AF for humans, animals, and birds.",
    features: [
      "33MP Full-Frame Exmor R CMOS Sensor with BIONZ XR Image Processor",
      "4K 60p 10-Bit 4:2:2 Recording with S-Cinetone and S-Log3",
      "759-point Phase-Detection AF with Real-time Eye AF for photo and video",
      "5.5-step 5-axis Optical In-Body Image Stabilization (IBIS)",
      "Vari-angle 3.0-inch LCD touch screen and 3.68M-dot OLED viewfinder"
    ],
    specs: {
      "Brand": "Sony",
      "Sensor": "33MP Full-Frame Exmor R CMOS",
      "Lens Mount": "Sony E-Mount",
      "Video": "4K 60p 10-bit 4:2:2",
      "ISO": "100-51200 (Expands to 50-204800)"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B09JZT6YK5",
        productUrl: "https://www.amazon.com/dp/B09JZT6YK5",
        price: 2298.00,
        regularPrice: 2499.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Scheduled Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6486185",
        productUrl: "https://www.bestbuy.com/site/sony-alpha-7-iv/6486185.p",
        price: 2299.99,
        regularPrice: 2499.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 1-Day Delivery or Store Pickup"
      },
      {
        retailer: "walmart",
        retailerItemId: "281902847",
        productUrl: "https://www.walmart.com/ip/Sony-Alpha-7-IV/281902847",
        price: 2398.00,
        regularPrice: 2499.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "88291048",
        productUrl: "https://www.target.com/p/-/A-88291048",
        price: 2499.99,
        regularPrice: 2499.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Freight Shipping"
      }
    ]
  },
  {
    id: "prod-gopro-hero-12",
    slug: "gopro-hero-12-black-waterproof-action-camera",
    title: "GoPro HERO12 Black Waterproof Action Camera with 5.3K60 Video and HDR",
    brand: "GoPro",
    category: "Cameras & Smart Home",
    subcategory: "Action & Dash Cams",
    rating: 4.7,
    reviewCount: 2150,
    badge: "5.3K HDR",
    imageUrl: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80"],
    description: "Incredible image quality with High Dynamic Range (HDR) 5.3K and 4K video, upgraded HyperSmooth 6.0 video stabilization, and Bluetooth audio support for AirPods.",
    features: [
      "HDR (High Dynamic Range) Video + Photo in 5.3K and 4K60",
      "Emmy Award-winning HyperSmooth 6.0 stabilization with 360 Horizon Lock",
      "Rugged and Waterproof to 33ft (10m) right out of the box",
      "Bluetooth audio support for wireless microphones and Apple AirPods",
      "Up to 2x longer continuous recording runtime with Enduro battery"
    ],
    specs: {
      "Brand": "GoPro",
      "Video Resolution": "5.3K @ 60fps, 4K @ 120fps, 2.7K @ 240fps",
      "Photo": "27MP Photos",
      "Waterproof": "33ft (10m) without housing",
      "Battery": "1720mAh Enduro Battery"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B0CCMZ8V61",
        productUrl: "https://www.amazon.com/dp/B0CCMZ8V61",
        price: 299.00,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime Two-Day Shipping"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6553805",
        productUrl: "https://www.bestbuy.com/site/gopro-hero12-black/6553805.p",
        price: 299.99,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Delivery or Store Pickup"
      },
      {
        retailer: "walmart",
        retailerItemId: "192837461",
        productUrl: "https://www.walmart.com/ip/GoPro-HERO12-Black/192837461",
        price: 319.00,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "89201948",
        productUrl: "https://www.target.com/p/-/A-89201948",
        price: 349.99,
        regularPrice: 399.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Shipping"
      }
    ]
  },
  {
    id: "prod-ring-video-doorbell-pro-2",
    slug: "ring-video-doorbell-pro-2-hardwired",
    title: "Ring Video Doorbell Pro 2 (Hardwired) with Head-to-Toe 1536p HD Video and 3D Motion Detection",
    brand: "Ring",
    category: "Cameras & Smart Home",
    subcategory: "Smart Home & Security",
    rating: 4.7,
    reviewCount: 5400,
    badge: "Smart Home Security",
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80"],
    description: "Premium wired video doorbell with Head-to-Toe HD+ Video, Two-Way Talk with Audio+, 3D Motion Detection with Bird's Eye View, and built-in Alexa Greetings.",
    features: [
      "1536p HD+ Head-to-Toe Video allows seeing packages at your doorstep",
      "3D Motion Detection with radar-powered Bird's Eye View tracking",
      "Two-Way Talk with Audio+ noise cancellation for clear conversation",
      "Color Night Vision and customizable motion privacy zones",
      "Hardwired installation using existing doorbell wiring for 24/7 power"
    ],
    specs: {
      "Brand": "Ring",
      "Video Resolution": "1536p HD+ (1:1 Aspect Ratio)",
      "Field of View": "150° Horizontal, 150° Vertical",
      "Connectivity": "Dual-Band 2.4GHz & 5GHz Wi-Fi",
      "Power": "Hardwired (16-24 VAC)"
    },
    offers: [
      {
        retailer: "amazon",
        retailerItemId: "B086Q54K53",
        productUrl: "https://www.amazon.com/dp/B086Q54K53",
        price: 199.99,
        regularPrice: 249.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Prime 1-Day Delivery"
      },
      {
        retailer: "bestbuy",
        retailerItemId: "6452945",
        productUrl: "https://www.bestbuy.com/site/ring-video-doorbell-pro-2/6452945.p",
        price: 199.99,
        regularPrice: 249.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free Delivery or Store Pickup"
      },
      {
        retailer: "walmart",
        retailerItemId: "392019482",
        productUrl: "https://www.walmart.com/ip/Ring-Doorbell-Pro-2/392019482",
        price: 219.00,
        regularPrice: 249.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      },
      {
        retailer: "target",
        retailerItemId: "82019481",
        productUrl: "https://www.target.com/p/-/A-82019481",
        price: 249.99,
        regularPrice: 249.99,
        isInStock: true,
        availabilityStatus: "In Stock",
        shippingInfo: "Free 2-Day Shipping"
      }
    ]
  },
];

export function upsertInMemoryCatalogProduct(item: CatalogItem): void {
  const index = PRODUCTS_CATALOG.findIndex((p) => p.id === item.id || p.slug === item.slug);
  if (index >= 0) {
    PRODUCTS_CATALOG[index] = item;
  } else {
    PRODUCTS_CATALOG.unshift(item);
  }
}

export function deleteInMemoryCatalogProduct(id: string): void {
  const index = PRODUCTS_CATALOG.findIndex((p) => p.id === id || p.slug === id);
  if (index >= 0) {
    PRODUCTS_CATALOG.splice(index, 1);
  }
}

