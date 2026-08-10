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

function updateGoogleConsent(consent: CookieConsentValue | null) {
    if (!window.gtag) return;

    const state = consent === "granted" ? "granted" : "denied";
    window.gtag("consent", "update", {
        analytics_storage: state,
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
    });
}

export function Analytics() {
    const pathname = usePathname();
    const [consent, setConsent] = useState<CookieConsentValue | null>(null);
    const initialMetaPageView = useRef(true);
    const lastGooglePath = useRef<string | null>(null);
    const hasConsent = consent === "granted";

    useEffect(() => {
        const savedConsent = readCookieConsent();
        setConsent(savedConsent);
        updateGoogleConsent(savedConsent);

        const handleConsent = (event: Event) => {
            const nextConsent = (event as CustomEvent<CookieConsentValue>).detail;
            updateGoogleConsent(nextConsent);
            setConsent(nextConsent);
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
        if (!gaMeasurementId || !window.gtag || !pathname || lastGooglePath.current === pathname) return;

        window.gtag("event", "page_view", {
            page_path: pathname,
            page_location: window.location.href,
        });
        lastGooglePath.current = pathname;
    }, [pathname]);

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

        </>
    );
}
