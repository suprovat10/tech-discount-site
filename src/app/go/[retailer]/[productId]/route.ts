import { NextRequest, NextResponse } from 'next/server';
import { RedirectGuard } from '@/lib/affiliate/redirect-guard';
import { AffiliateLinkBuilder } from '@/lib/affiliate/link-builder';
import { trackAffiliateClick } from '@/lib/affiliate/click-tracker';
import { RetailerId } from '@/types/product';

interface RouteParams {
  params: Promise<{
    retailer: string;
    productId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { retailer, productId } = await params;
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || undefined;
  const referrer = request.headers.get('referer') || undefined;

  // Verify parameters & prevent Open Redirects
  const verification = RedirectGuard.verifyRedirect(retailer, productId);
  if (!verification.valid || !verification.retailer || !verification.itemId) {
    return NextResponse.json(
      { error: verification.error || 'Invalid or forbidden redirect target' },
      { status: 400 }
    );
  }

  // Generate trusted affiliate link
  const destinationUrl = AffiliateLinkBuilder.generateDirectUrl(
    verification.retailer,
    verification.itemId
  );

  // Track click asynchronously in database
  trackAffiliateClick({
    retailer: verification.retailer,
    retailerItemId: verification.itemId,
    destinationUrl,
    ip,
    userAgent,
    referrer,
  });

  // Perform secure 307 Temporary Redirect with strict anti-caching headers
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: destinationUrl,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
