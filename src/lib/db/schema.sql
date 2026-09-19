-- ==============================================================================
-- US TECH PRICE COMPARISON ENGINE - SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for supported retail partners
DO $$ BEGIN
    CREATE TYPE retailer_type AS ENUM ('amazon', 'walmart', 'bestbuy', 'target');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Master Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upc VARCHAR(32) UNIQUE,
    sku VARCHAR(64),
    model_number VARCHAR(128),
    brand VARCHAR(128) NOT NULL,
    title VARCHAR(512) NOT NULL,
    slug VARCHAR(512) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(128) NOT NULL,
    main_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Retailer Product Mapping
CREATE TABLE IF NOT EXISTS retailer_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    retailer retailer_type NOT NULL,
    retailer_item_id VARCHAR(128) NOT NULL, -- ASIN, Walmart Item ID, BestBuy SKU, Target TCIN
    product_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(retailer, retailer_item_id)
);

-- 3. Live & Cached Offers
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retailer_product_id UUID REFERENCES retailer_products(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    retailer retailer_type NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    regular_price NUMERIC(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    is_in_stock BOOLEAN DEFAULT TRUE,
    availability_status VARCHAR(64) DEFAULT 'In Stock',
    shipping_info VARCHAR(256),
    affiliate_url TEXT NOT NULL,
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Verified Coupons & Promotions
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retailer retailer_type NOT NULL,
    code VARCHAR(64),
    title VARCHAR(256) NOT NULL,
    description TEXT,
    discount_type VARCHAR(32) NOT NULL, -- 'percentage', 'fixed_amount', 'free_shipping'
    discount_value NUMERIC(10, 2),
    min_purchase NUMERIC(10, 2),
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT TRUE,
    affiliate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Search Cache Table (TTL Caching for fast queries & API cost optimization)
CREATE TABLE IF NOT EXISTS search_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash VARCHAR(64) UNIQUE NOT NULL,
    query_text VARCHAR(256) NOT NULL,
    results_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 6. Affiliate Clicks Audit & Analytics Table
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retailer retailer_type NOT NULL,
    retailer_item_id VARCHAR(128) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    ip_hash VARCHAR(64) NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    destination_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for maximum query performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc);
CREATE INDEX IF NOT EXISTS idx_retailer_products_lookup ON retailer_products(retailer, retailer_item_id);
CREATE INDEX IF NOT EXISTS idx_offers_product_id ON offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON offers(expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_retailer ON affiliate_clicks(retailer, created_at);

-- Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Public read access policies
DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read retailer_products" ON retailer_products;
CREATE POLICY "Public read retailer_products" ON retailer_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read offers" ON offers;
CREATE POLICY "Public read offers" ON offers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read coupons" ON coupons;
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (true);

-- Service role only access for search cache and clicks
DROP POLICY IF EXISTS "Service write search_cache" ON search_cache;
CREATE POLICY "Service write search_cache" ON search_cache FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service write affiliate_clicks" ON affiliate_clicks;
CREATE POLICY "Service write affiliate_clicks" ON affiliate_clicks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service read affiliate_clicks" ON affiliate_clicks;
CREATE POLICY "Service read affiliate_clicks" ON affiliate_clicks FOR SELECT USING (auth.role() = 'service_role');
