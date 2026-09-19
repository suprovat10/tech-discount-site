import { getSupabaseAdminClient, getSupabaseBrowserClient } from './client';
import { UnifiedProduct, RetailerCoupon, ProductOffer } from '@/types/product';
import { AffiliateClickLog } from '@/types/affiliate';

export async function getCachedSearchResults(queryHash: string): Promise<UnifiedProduct[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('search_cache')
      .select('results_json, expires_at')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data.results_json as UnifiedProduct[];
  } catch (err) {
    console.error('Error fetching search cache from Supabase:', err);
    return null;
  }
}

export async function setCachedSearchResults(
  queryHash: string,
  queryText: string,
  results: UnifiedProduct[],
  ttlMinutes = 30
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    await supabase.from('search_cache').upsert(
      {
        query_hash: queryHash,
        query_text: queryText,
        results_json: results,
        expires_at: expiresAt,
      },
      { onConflict: 'query_hash' }
    );
  } catch (err) {
    console.error('Error saving search cache to Supabase:', err);
  }
}

export async function logAffiliateClick(log: AffiliateClickLog): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  try {
    await supabase.from('affiliate_clicks').insert({
      retailer: log.retailer,
      retailer_item_id: log.retailerItemId,
      product_id: log.productId || null,
      ip_hash: log.ipHash,
      user_agent: log.userAgent || null,
      referrer: log.referrer || null,
      destination_url: log.destinationUrl,
    });
  } catch (err) {
    console.error('Error logging affiliate click to Supabase:', err);
  }
}

export async function getActiveCoupons(retailer?: string): Promise<RetailerCoupon[]> {
  const supabase = getSupabaseBrowserClient() || getSupabaseAdminClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('coupons')
      .select('*')
      .eq('is_verified', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (retailer) {
      query = query.eq('retailer', retailer);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((c) => ({
      id: c.id,
      retailer: c.retailer,
      code: c.code || undefined,
      title: c.title,
      description: c.description || '',
      discountType: c.discount_type,
      discountValue: c.discount_value || undefined,
      minPurchase: c.min_purchase || undefined,
      expiresAt: c.expires_at || undefined,
      isVerified: c.is_verified,
      affiliateUrl: c.affiliate_url || undefined,
    }));
  } catch (err) {
    console.error('Error fetching active coupons:', err);
    return [];
  }
}
