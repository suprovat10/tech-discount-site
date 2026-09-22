import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import { getServerSettings } from '@/lib/settingsServer';
import { generateWebsiteJsonLd, generateOrganizationJsonLd } from '@/lib/seo/jsonld';
import { StoreLayoutWrapper } from '@/components/common/StoreLayoutWrapper';

import { optimizeImageUrl, getHeroSrcSet, getHeroSizes } from '@/lib/imageOptimization';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';
  const brand = settings.siteBrandName || 'suprodesign';
  const title = settings.siteTitle || `${brand} - Compare Prices & Find Deals`;
  const description =
    settings.metaDescription ||
    'Real-time price comparison and deals discovery engine. Scan authorized retailers like Amazon, Walmart, Best Buy, and Target.';
  const keywordsList = (settings.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const verification: Record<string, any> = {};
  if (settings.googleSiteVerification) {
    verification.google = settings.googleSiteVerification;
  }
  if (settings.bingSiteVerification) {
    verification.other = { 'msvalidate.01': settings.bingSiteVerification };
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${brand}`,
    },
    description,
    keywords: keywordsList.length > 0 ? keywordsList : ['price comparison', 'deals', 'tech discounts'],
    alternates: {
      canonical: siteUrl,
    },
    robots:
      settings.indexingEnabled !== false
        ? {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              'max-video-preview': -1,
              'max-image-preview': 'large',
              'max-snippet': -1,
            },
          }
        : {
            index: false,
            follow: false,
          },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: brand,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: settings.ogImageUrl || '/logo.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [settings.ogImageUrl || '/logo.png'],
    },
    icons: {
      icon: settings.faviconUrl || '/favicon.png',
      shortcut: settings.faviconUrl || '/favicon.png',
      apple: settings.faviconUrl || '/apple-touch-icon.png',
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://suprodesign.com';
  const brand = settings.siteBrandName || 'suprodesign';
  const logoUrl = settings.logoUrl || '/logo.png';
  const socials = [
    settings.socialFacebook,
    settings.socialInstagram,
    settings.socialYoutube,
    settings.socialTwitter,
  ].filter(Boolean);

  const websiteJsonLd = generateWebsiteJsonLd(siteUrl, brand);
  const orgJsonLd = generateOrganizationJsonLd(siteUrl, brand, logoUrl, socials);

  const gtmId = settings.googleTagManagerId?.trim();
  const gaId = settings.googleAnalyticsId?.trim();
  const fbPixelId = settings.facebookPixelId?.trim();
  const tiktokPixelId = settings.tiktokPixelId?.trim();
  const adsenseId = settings.googleAdSenseId?.trim();
  const globalAdHeaderCode = settings.globalAdHeaderCode?.trim();

  const heroImageUrl =
    settings.heroImageUrl ||
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&q=80';
  const heroPreloadSrc = optimizeImageUrl(heroImageUrl, 640);
  const heroSrcSet = getHeroSrcSet(heroImageUrl);
  const heroSizes = getHeroSizes();

  return (
    <html lang="en">
      <head>
        {/* Favicon fallback */}
        <link rel="icon" href={settings.faviconUrl || '/favicon.png'} />

        {/* Preconnect to critical image CDNs for instant LCP */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* High-priority Preload for Hero Image (LCP) */}
        <link
          rel="preload"
          as="image"
          href={heroPreloadSrc}
          imageSrcSet={heroSrcSet}
          imageSizes={heroSizes}
          fetchPriority="high"
        />
        
        {/* Schema.org WebSite JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* Schema.org Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

      </head>
      <body className="min-h-screen bg-background text-foreground font-sans">
        {/* Google AdSense Script */}
        {adsenseId && (
          <Script
            id="google-adsense"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          />
        )}

        {/* Global Ad Network Header Code */}
        {globalAdHeaderCode && (
          <div
            id="global-ad-header-code"
            style={{ display: 'none' }}
            dangerouslySetInnerHTML={{ __html: globalAdHeaderCode }}
          />
        )}

        {/* Google Tag Manager (Head script) */}
        {gtmId && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}

        {/* Google Analytics 4 (GA4) */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* Meta / Facebook Pixel */}
        {fbPixelId && (
          <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}

        {/* TikTok Pixel */}
        {tiktokPixelId && (
          <Script
            id="tiktok-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function (w, d, t) {
                  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                  ttq.load('${tiktokPixelId}');
                  ttq.page();
                }(window, document, 'ttq');
              `,
            }}
          />
        )}

        {/* Google Tag Manager (Noscript) */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
      </body>
    </html>
  );
}
