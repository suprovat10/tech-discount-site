export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export const DEFAULT_BLOG_CATEGORIES: BlogCategory[] = [
  { id: 'shopping-guides', name: 'Shopping Guides', slug: 'shopping-guides', description: 'Tips, price tracking advice, and holiday sale guides' },
  { id: 'laptops-computers', name: 'Laptops & Computers', slug: 'laptops-computers', description: 'MacBooks, Windows ultrabooks, and monitor buying guides' },
  { id: 'audio-sound', name: 'Audio & Sound', slug: 'audio-sound', description: 'Headphones, earbuds, soundbars, and acoustic deals' },
  { id: 'smartphones-gadgets', name: 'Smartphones & Gadgets', slug: 'smartphones-gadgets', description: 'Flagship phones, smartwatches, and tablet comparisons' },
  { id: 'deals-savings', name: 'Deals & Price Trends', slug: 'deals-savings', description: 'Retailer discount analysis and seasonal sales' },
];

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author?: string; // Optional for backward compatibility, removed from UI
  date: string;
  readTime: string;
  imageUrl: string;
  imageAlt?: string;
  tags: string[];
  updatedAt?: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'm3-macbook-air-vs-m2-worth-the-upgrade',
    title: 'Apple M3 MacBook Air vs M2: Is It Worth The Upgrade in 2026?',
    excerpt: 'We compared benchmark performance, battery endurance, and live retail prices across Amazon, Best Buy, and Walmart to see which MacBook offers the best value.',
    content: `
      <p>The Apple MacBook Air with the M3 chip has taken the ultra-portable laptop world by storm. With enhanced hardware-accelerated ray tracing, faster unified memory bandwidth, and dual external monitor support with the lid closed, it represents a substantial leap over older Intel and M1 machines.</p>
      
      <h3>Key Benchmark Differences</h3>
      <p>In our Cinebench and Geekbench 6 multi-core tests, the M3 chip showed an average 18-21% improvement in CPU performance and up to 35% in graphics-heavy workflows compared to the base M2 chip.</p>
      
      <h3>Current Retail Price Trends</h3>
      <p>Retailers like Amazon and Best Buy have frequently discounted the 13-inch M3 MacBook Air to $899, narrowing the price gap between the M2 and M3 to less than $100 during promotional weeks. If you find the M3 on sale at or below $899, it is undeniably the superior purchase.</p>
      
      <h3>Verdict</h3>
      <p>For everyday users coming from an M1 or Intel MacBook, the M3 is a breathtaking upgrade. If you already own an M2, you can safely wait unless dual-monitor support is critical for your desktop workstation setup.</p>
    `,
    category: 'Laptops & Computers',
    date: 'Sep 15, 2026',
    readTime: '5 min read',
    imageUrl: '',
    tags: ['Apple', 'MacBook Air', 'Laptops', 'Price Trends'],
  },
  {
    id: 'post-2',
    slug: 'best-noise-canceling-headphones-sony-vs-apple-bose',
    title: 'Top Noise-Canceling Headphones of 2026: Sony XM5 vs AirPods Max vs Bose QC Ultra',
    excerpt: 'Find out which flagship wireless ANC headphones win in soundstage, active noise cancellation, comfort, and real-world discounts across major US retailers.',
    content: `
      <p>Finding the perfect pair of over-ear noise-canceling headphones is about balancing acoustic fidelity, day-long ergonomic comfort, and price discounts across stores.</p>

      <h3>Active Noise Cancellation Champion</h3>
      <p>The Sony WH-1000XM5 and Bose QuietComfort Ultra remain the kings of office and airplane cabin silence. The Sony XM5 uses dual processors and 8 microphones to dynamically adapt to your jaw position and ambient atmospheric pressure.</p>

      <h3>Pricing and Deal Seasons</h3>
      <p>While the AirPods Max rarely dip below $449, the Sony WH-1000XM5 regularly sees flash discounts down to $328 on Amazon and Walmart, making it our Editors' Choice for value per dollar.</p>
    `,
    category: 'Audio & Sound',
    date: 'Sep 12, 2026',
    readTime: '6 min read',
    imageUrl: '',
    tags: ['Audio', 'Sony', 'AirPods', 'Headphones', 'ANC'],
  },
  {
    id: 'post-3',
    slug: 'how-to-spot-fake-tech-discounts-and-price-gouging',
    title: 'How to Spot Fake Tech Discounts & Price Traps on Prime Day and Black Friday',
    excerpt: 'Major online marketplaces sometimes inflate list prices right before a holiday sale. Here is how price comparison engines protect your wallet.',
    content: `
      <p>One of the oldest marketing tricks in consumer electronics is raising an item's "original list price" a few weeks before a major sales event, only to advertise a dramatic "50% OFF" badge that is actually normal MSRP.</p>

      <h3>How TechPrice Engine Protects You</h3>
      <p>Our automated comparison engine tracks historical prices across Amazon, Walmart, Best Buy, and Target simultaneously. If one store inflates its regular price, our multi-store matrix immediately flags the anomaly and shows you what other authorized sellers are actually charging.</p>
    `,
    category: 'Shopping Guides',
    date: 'Sep 10, 2026',
    readTime: '4 min read',
    imageUrl: '',
    tags: ['Guide', 'Savings', 'Black Friday', 'Price Tracking'],
  },
];
