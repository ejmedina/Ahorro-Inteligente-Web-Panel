/* eslint-disable @next/next/no-before-interactive-script-outside-document -- Rendered only from the App Router root layout, where Next supports beforeInteractive. */
import Script from "next/script";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleTags() {
    if (!gtmId && !gaMeasurementId) return null;

    return (
        <>
            <Script id="google-consent-mode" strategy="beforeInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = window.gtag || gtag;

                    var consentMatch = document.cookie.match(/(?:^|; )ai_cookie_consent=([^;]*)/);
                    var consentState = consentMatch && decodeURIComponent(consentMatch[1]) === 'granted'
                        ? 'granted'
                        : 'denied';

                    window.gtag('consent', 'default', {
                        analytics_storage: consentState,
                        ad_storage: consentState,
                        ad_user_data: consentState,
                        ad_personalization: consentState,
                        wait_for_update: 500
                    });
                `}
            </Script>

            {gaMeasurementId && (
                <>
                    <Script
                        id="google-analytics"
                        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}`}
                        strategy="beforeInteractive"
                    />
                    <Script id="google-analytics-config" strategy="beforeInteractive">
                        {`
                            window.gtag('js', new Date());
                            window.gtag('config', ${JSON.stringify(gaMeasurementId)}, { send_page_view: false });
                        `}
                    </Script>
                </>
            )}

            {gtmId && (
                <>
                    <Script id="google-tag-manager" strategy="beforeInteractive">
                        {`
                            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                            })(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
                        `}
                    </Script>
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
                            height="0"
                            width="0"
                            className="hidden invisible"
                            title="Google Tag Manager"
                        />
                    </noscript>
                </>
            )}
        </>
    );
}
