"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
    COOKIE_CONSENT_EVENT,
    CookieConsentValue,
    readCookieConsent,
} from "@/lib/cookieConsent";

const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function Analytics() {
    const pathname = usePathname();
    const [consent, setConsent] = useState<CookieConsentValue | null>(null);
    const initialMetaPageView = useRef(true);
    const lastGooglePath = useRef<string | null>(null);
    const hasConsent = consent === "granted";

    useEffect(() => {
        setConsent(readCookieConsent());

        const handleConsent = (event: Event) => {
            setConsent((event as CustomEvent<CookieConsentValue>).detail);
        };
        window.addEventListener(COOKIE_CONSENT_EVENT, handleConsent);
        return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsent);
    }, []);

    useEffect(() => {
        if (!metaPixelId || !hasConsent) return;

        if (initialMetaPageView.current) {
            initialMetaPageView.current = false;
            return;
        }

        window.fbq?.("track", "PageView");
    }, [hasConsent, pathname]);

    useEffect(() => {
        if (!gaMeasurementId || !hasConsent || !pathname || lastGooglePath.current === pathname) return;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag(...args: unknown[]) {
            window.dataLayer?.push(args);
        };

        if (lastGooglePath.current === null) {
            window.gtag("js", new Date());
            window.gtag("config", gaMeasurementId, { send_page_view: false });
        }

        window.gtag("event", "page_view", {
            page_path: pathname,
            page_location: window.location.href,
        });
        lastGooglePath.current = pathname;
    }, [hasConsent, pathname]);

    return (
        <>
            {metaPixelId && hasConsent && (
                <>
                    <Script id="meta-pixel" strategy="afterInteractive">
                        {`
                            !function(f,b,e,v,n,t,s)
                            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window,document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', ${JSON.stringify(metaPixelId)});
                            fbq('track', 'PageView');
                        `}
                    </Script>
                    <noscript>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            height="1"
                            width="1"
                            className="hidden"
                            alt=""
                            src={`https://www.facebook.com/tr?id=${encodeURIComponent(metaPixelId)}&ev=PageView&noscript=1`}
                        />
                    </noscript>
                </>
            )}

            {gaMeasurementId && hasConsent && (
                <Script
                    id="google-analytics"
                    src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`}
                    strategy="afterInteractive"
                />
            )}
        </>
    );
}
