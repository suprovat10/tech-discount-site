export interface SitePage {
  id: string;
  slug: string;
  title: string;
  badge?: string;
  subtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string;
  lastUpdated: string;
  isSystem?: boolean;
  showInExploreDeals?: boolean;
}

export const DEFAULT_PAGES: SitePage[] = [
  {
    id: 'page-about',
    slug: 'about',
    title: 'About Us & Our Mission',
    badge: 'Our Mission',
    subtitle: 'Empowering smart shoppers with transparent, unbiased real-time tech price comparisons.',
    metaTitle: 'About Us | TechPrice US',
    metaDescription: 'Learn about TechPrice US, our mission, independence, and real-time tech price comparison architecture.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>1. Who We Are</h2>
<p>We built TechPrice with a simple goal: create a lightning-fast, ad-uncluttered price comparison engine that connects directly to the largest authorized US retailers. We believe technology shoppers deserve honest, mathematical clarity when spending their hard-earned money.</p>

<h2>2. 100% Real API Data</h2>
<p>We never fabricate discounts or artificially inflate manufacturer list prices (MSRP). What you see on our platform is the verified, active price retrieved directly from the official retailer APIs of Amazon, Walmart, Best Buy, and Target.</p>

<h2>3. Unbiased Price Ranking</h2>
<p>Retailers cannot pay us for preferential placement or higher rankings. The lowest verified in-stock price is always positioned at the very top of every comparison table. Math and savings decide our recommendations, not advertising budgets.</p>

<h2>4. Privacy-First Commitment</h2>
<p>No forced account registrations, intrusive cross-site tracking cookies, or spam newsletters. Your watchlist and price bookmarks are saved directly in your private browser storage.</p>
    `.trim(),
  },
  {
    id: 'page-affiliate-disclosure',
    slug: 'affiliate-disclosure',
    title: 'FTC Affiliate Disclosure & Monetization Policy',
    badge: 'FTC Compliance',
    subtitle: 'Full Federal Trade Commission (FTC) compliance statement and merchant advertising terms.',
    metaTitle: 'FTC Affiliate Disclosure | TechPrice US',
    metaDescription: 'Full Federal Trade Commission (FTC) affiliate disclosure and monetization policy for TechPrice US.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>1. Federal Trade Commission (FTC) Statement</h2>
<p>In compliance with the FTC guidelines concerning the use of endorsements and testimonials in advertising (16 CFR Part 255), please be aware that our platform participates in various affiliate marketing programs. This means that when you click on links to retailer websites and make a qualifying purchase, we may receive a small affiliate commission.</p>
<p><strong>This commission comes at zero additional cost to you.</strong> You pay the exact same price as you would by visiting the retailer directly.</p>

<h2>2. Specific Retailer Disclosures</h2>
<ul>
  <li><strong>Amazon Services LLC Associates Program:</strong> We are a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.</li>
  <li><strong>Walmart Affiliate Program:</strong> We participate in the Walmart Affiliate Program via Impact Radius, earning referral commissions on qualifying purchases made on Walmart.com.</li>
  <li><strong>Best Buy Affiliate Network:</strong> We participate in the Best Buy Affiliate Network via CJ Affiliate / Impact, earning commissions on qualifying electronics purchases on BestBuy.com.</li>
  <li><strong>Target Partners Program:</strong> We participate in the Target Partner Program via Impact / CJ Affiliate, earning referral fees on eligible purchases on Target.com.</li>
</ul>

<h2 id="integrity" class="scroll-mt-24">3. Editorial Independence & Integrity</h2>
<p>Our price ranking and comparisons are completely programmatic and objective. Our software displays the lowest price first based entirely on math and verified stock data. Retailers cannot pay us for top placement or preferential rankings.</p>
    `.trim(),
  },
  {
    id: 'page-contact',
    slug: 'contact',
    title: 'Contact Us & Support',
    badge: 'Direct Support',
    subtitle: 'Have questions regarding price accuracy, merchant integrations, or affiliate partnerships? We are here to help.',
    metaTitle: 'Contact Us | TechPrice US',
    metaDescription: 'Get in touch with the TechPrice US engineering, editorial, and partnership team.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>Customer & Shopper Inquiries</h2>
<p>If you encounter a price discrepancy, broken retailer link, or out-of-stock product that did not update promptly, our automated crawler team responds within 24 business hours.</p>
<p><strong>Direct Support Email:</strong> support@techpriceengine.com</p>

<h2>Merchant & Affiliate Partnerships</h2>
<p>Are you an authorized technology retailer or hardware brand looking to list your inventory in our price comparison matrix? Contact our commercial team at partnerships@techpriceengine.com.</p>

<h2>Office Hours</h2>
<p>Monday – Friday: 9:00 AM – 6:00 PM EST<br />Saturday – Sunday: Monitored automated systems only.</p>
    `.trim(),
  },
  {
    id: 'page-how-it-works',
    slug: 'how-it-works',
    title: 'How Price Tracking Works',
    badge: 'System Architecture',
    subtitle: 'From real-time API polling to coupon matching, discover how our automated price engine operates.',
    metaTitle: 'How It Works | TechPrice US',
    metaDescription: 'Discover how our real-time price comparison engine fetches, validates, and compares tech deals.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>1. Live API Data Collection</h2>
<p>Our distributed crawlers query authorized merchant developer APIs (Amazon Product Advertising API 5.0, Walmart Developer API v2, Best Buy Products API, and Target Partner Feeds) continuously. This ensures prices reflect real-time Buy Box numbers, not cached stale figures.</p>

<h2>2. Algorithmic Price Normalization</h2>
<p>Every product listing across different merchants has unique identifiers (ASIN, TCIN, SKU). Our normalization engine maps these items into unified product models, comparing identical technical specs, memory, storage, and models.</p>

<h2>3. Mathematical Savings Benchmark</h2>
<p>We calculate true savings by comparing the current lowest in-stock offer against legitimate retailer regular prices. Fake markup discounts are automatically filtered out.</p>

<h2>4. Direct Affiliate Go Routing</h2>
<p>When you choose a retailer, our secure routing system sends you directly to the merchant's checkout page with applicable coupons and verified availability.</p>
    `.trim(),
  },
  {
    id: 'page-price-methodology',
    slug: 'price-methodology',
    title: 'Price Accuracy & Quality Methodology',
    badge: 'Quality Assurance',
    subtitle: 'Our rigorous mathematical framework for verifying list prices, active discounts, and stock reliability.',
    metaTitle: 'Price Accuracy Methodology | TechPrice US',
    metaDescription: 'Our methodology for real-time pricing verification, savings calculations, and merchant stock data.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>1. Real-Time Price Polling</h2>
<p>Prices fluctuate dynamically based on retailer inventory algorithms. We poll high-demand items frequently to capture flash deals, lightning sales, and price drops instantly.</p>

<h2>2. Anti-Deceptive Pricing Filters</h2>
<p>Many online marketplaces display inflated MSRPs to create the illusion of massive discounts. Our system tracks historical pricing data and only validates discounts against realistic retail baselines.</p>

<h2>3. In-Stock Verification</h2>
<p>An incredible deal is worthless if the item is out of stock. We strictly prioritize items that are ready to ship or available for store pickup, ensuring shoppers don't waste time on ghost inventory.</p>
    `.trim(),
  },
  {
    id: 'page-retailers',
    slug: 'retailers',
    title: 'Supported Retailer Partners & API Status',
    badge: 'Partner Ecosystem',
    subtitle: 'Overview of connected retail stores, affiliate networks, and active integration status.',
    metaTitle: 'Supported Retailers | TechPrice US',
    metaDescription: 'Overview of supported stores: Amazon, Walmart, Best Buy, and Target with API and affiliate status.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>1. Amazon.com</h2>
<p><strong>Network:</strong> Amazon Associates Program<br /><strong>Features:</strong> Prime 1-Day/2-Day shipping badges, ASIN direct resolution, Buy Box real-time price tracking.<br /><strong>Status:</strong> Operational</p>

<h2>2. Walmart US</h2>
<p><strong>Network:</strong> Walmart Affiliate Program via Impact Radius<br /><strong>Features:</strong> Rollback and clearance price detection, free 2-day delivery on $35+, store pickup availability.<br /><strong>Status:</strong> Operational</p>

<h2>3. Best Buy</h2>
<p><strong>Network:</strong> Best Buy Affiliate Network via CJ Affiliate<br /><strong>Features:</strong> In-store curbside pickup alerts, verified open-box and new deals, detailed tech spec sheets.<br /><strong>Status:</strong> Operational</p>

<h2>4. Target</h2>
<p><strong>Network:</strong> Target Partners Program via Impact<br /><strong>Features:</strong> Target Circle 5% extra savings reminders, TCIN product mapping, Drive Up pickup options.<br /><strong>Status:</strong> Operational</p>
    `.trim(),
  },
  {
    id: 'page-privacy-policy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    badge: 'Privacy First',
    subtitle: 'How we protect your privacy, respect browser storage, and ensure zero personal data selling.',
    metaTitle: 'Privacy Policy | TechPrice US',
    metaDescription: 'Learn how TechPrice US protects user privacy and why we do not require account registration.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>1. No User Registration or Account Required</h2>
<p>Our website is designed to be completely usable without creating an account, providing an email address, or submitting personal data. Your saved watchlist is stored locally on your device using browser localStorage and is never transmitted to marketing databases.</p>

<h2>2. Information We Collect Automatically</h2>
<p>When you visit our site or perform a search, our server logs standard technical data (such as anonymized IP address hashes, user agent, browser type, and referrer). We use this information solely for server security, DDoS defense, and aggregate affiliate click counting.</p>

<h2>3. Third-Party Retailers</h2>
<p>When you click outbound affiliate links to Amazon, Walmart, Best Buy, or Target, you are redirected to the respective retailer's site. Any data collected on their platforms is governed by their respective privacy policies.</p>

<h2>4. Contact Regarding Privacy</h2>
<p>For questions about our privacy practices, please contact us at privacy@techpriceengine.com.</p>
    `.trim(),
  },
  {
    id: 'page-terms',
    slug: 'terms',
    title: 'Terms of Service',
    badge: 'User Agreement',
    subtitle: 'Terms and conditions governing the use of our price comparison engine and affiliated services.',
    metaTitle: 'Terms of Service | TechPrice US',
    metaDescription: 'Terms and conditions governing the use of TechPrice US price comparison engine.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>1. Acceptance of Terms</h2>
<p>By accessing or using our price comparison service, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our service.</p>

<h2>2. Informational Purpose & Pricing Accuracy</h2>
<p>Our platform provides product price comparisons for general informational purposes only. While we connect directly to official retailer APIs to ensure timely data, prices and product availability fluctuate rapidly. We make no warranty that prices displayed will match checkout totals if inventory or promotions change on the merchant platform.</p>

<h2>3. Purchases Made on Merchant Sites</h2>
<p>We are not a seller, distributor, or merchant of any products listed. When you purchase an item, your transaction, billing, shipping, customer support, and return requests are handled exclusively by the corresponding merchant (Amazon, Walmart, Best Buy, or Target).</p>

<h2>4. Limitation of Liability</h2>
<p>To the maximum extent permitted by applicable law, our service shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service or purchases made through third-party links.</p>
    `.trim(),
  },
  {
    id: 'page-cookie-policy',
    slug: 'cookie-policy',
    title: 'Cookie & Local Storage Policy',
    badge: 'Transparency',
    subtitle: 'Information about how cookies and browser storage are used on our platform.',
    metaTitle: 'Cookie Policy | TechPrice US',
    metaDescription: 'How TechPrice US handles cookies and local browser storage.',
    isSystem: true,
    lastUpdated: '2026-09-18',
    content: `
<h2>1. What are Cookies?</h2>
<p>Cookies and browser local storage are small data stores placed on your device to ensure websites function reliably and retain user preferences.</p>

<h2>2. How We Use Cookies and Local Storage</h2>
<p>We do not use invasive third-party cross-site advertising cookies. We use modern browser <code>localStorage</code> to store your saved watchlist items and sort preferences on your own device.</p>

<h2>3. Retailer Affiliate Cookies</h2>
<p>When you click an outbound link to Amazon, Walmart, Best Buy, or Target, the destination merchant or affiliate network may set a tracking cookie on your browser to attribute the referral and ensure we receive credit for qualifying purchases.</p>
    `.trim(),
  },
];
