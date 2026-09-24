import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import { getServerSettings } from '@/lib/settingsServer';
import { generateWebsiteJsonLd, generateOrganizationJsonLd } from '@/lib/seo/jsonld';
import { StoreLayoutWrapper } from '@/components/common/StoreLayoutWrapper';

export async function generateMetadata(): Promise<Metadata> {
  // Use cached version — avoids extra MongoDB round-trip on every request
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const title = settings.siteTitle || `${brand} - Compare Prices & Find Deals`;
  const description =
    settings.metaDescription ||
    'Real-time price comparison and deals discovery engine. Scan authorized retailers like Amazon, Walmart, Best Buy, and Target.';
  const keywordsList = (settings.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const ogImg =
    settings.ogImageUrl && !settings.ogImageUrl.includes('photo-1519389950473-47ba0277781c')
      ? settings.ogImageUrl
      : 'https://res.cloudinary.com/koayelts/image/upload/f_auto,q_auto,w_1600,c_limit/v1790111032/techpricedrop/branding/uc66jnomvw4tnewyy2mq.jpg';

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
          url: ogImg,
          secureUrl: ogImg,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImg],
    },
    icons: {
      icon: settings.faviconUrl || '/favicon-techpricedrop.png',
      shortcut: settings.faviconUrl || '/favicon-techpricedrop.png',
      apple: settings.faviconUrl || '/favicon-techpricedrop.png',
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use cached version — avoids duplicate MongoDB round-trip
  const settings = await getServerSettings();
  const siteUrl = settings.canonicalUrl || 'https://www.techpricedrop.com';
  const brand = settings.siteBrandName || 'TechPriceDrop';
  const logoUrl = settings.logoUrl || '/logo-techpricedrop.png';
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

  return (
    <html lang="en">
      <head>
        {/* Favicon fallback */}
        <link rel="icon" href={settings.faviconUrl || '/favicon.png'} />

        {/* Preconnect to critical image CDNs for instant LCP */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Retailer image CDN preconnect — faster product images */}
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="dns-prefetch" href="https://i5.walmartimages.com" />
        <link rel="dns-prefetch" href="https://pisces.bbystatic.com" />
        <link rel="dns-prefetch" href="https://target.scene7.com" />

        {/* NOTE: Hero image preload is intentionally placed only on the homepage (page.tsx),
            NOT here in layout.tsx — placing it here would wastefully preload the hero
            on EVERY page (/blog, /product/*, /privacy, etc.) stealing LCP bandwidth */}

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
        {/* Google AdSense Script - Deferred with lazyOnload to ensure instant paint and 0 click delay */}
        {adsenseId && (
          <Script
            id="google-adsense"
            strategy="lazyOnload"
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

        {/* Google Tag Manager (Head script) - Deferred with lazyOnload */}
        {gtmId && (
          <Script
            id="gtm-script"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}

        {/* Google Analytics 4 (GA4) - Deferred to keep initial load instant and prevent any click latency */}
        {gaId && (
          <Script
            id="google-analytics"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  var loaded = false;
                  function initGA() {
                    if (loaded) return;
                    loaded = true;
                    var s = document.createElement('script');
                    s.async = true;
                    s.src = 'https://www.googletagmanager.com/gtag/js?id=${gaId}';
                    document.head.appendChild(s);
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;
                    gtag('js', new Date());
                    gtag('config', '${gaId}', { page_path: window.location.pathname });
                  }
                  if ('requestIdleCallback' in window) {
                    requestIdleCallback(function() { setTimeout(initGA, 2500); });
                  } else {
                    setTimeout(initGA, 3000);
                  }
                  ['scroll', 'touchstart'].forEach(function(e) {
                    window.addEventListener(e, function() { setTimeout(initGA, 0); }, { once: true, passive: true });
                  });
                })();
              `,
            }}
          />
        )}

        {/* Meta / Facebook Pixel - Deferred with lazyOnload */}
        {fbPixelId && (
          <Script
            id="facebook-pixel"
            strategy="lazyOnload"
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

        {/* TikTok Pixel - Deferred with lazyOnload */}
        {tiktokPixelId && (
          <Script
            id="tiktok-pixel"
            strategy="lazyOnload"
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
