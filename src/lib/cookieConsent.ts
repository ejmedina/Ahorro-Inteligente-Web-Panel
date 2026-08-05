"use client";

export const COOKIE_CONSENT_NAME = "ai_cookie_consent";
export const COOKIE_CONSENT_EVENT = "ai:cookie-consent";

export type CookieConsentValue = "granted" | "denied";

function sharedCookieDomain(): string {
    if (typeof window === "undefined") return "";
    return window.location.hostname.endsWith("ahorrointeligente.com.ar")
        ? "; Domain=.ahorrointeligente.com.ar"
        : "";
}

export function readCookieConsent(): CookieConsentValue | null {
    if (typeof document === "undefined") return null;

    const value = document.cookie
        .split("; ")
        .find(cookie => cookie.startsWith(`${COOKIE_CONSENT_NAME}=`))
        ?.split("=")[1];

    return value === "granted" || value === "denied" ? value : null;
}

function deleteOptionalTrackingCookies() {
    const domain = sharedCookieDomain();
    const cookieNames = document.cookie
        .split("; ")
        .map(cookie => cookie.split("=")[0])
        .filter(name => name === "_fbp" || name === "_fbc" || name === "_ga" || name.startsWith("_ga_"));

    for (const name of cookieNames) {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
        if (domain) {
            document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domain}`;
        }
    }
}

export function saveCookieConsent(value: CookieConsentValue) {
    if (typeof window === "undefined") return;

    const previousValue = readCookieConsent();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const maxAge = 60 * 60 * 24 * 180;
    document.cookie = `${COOKIE_CONSENT_NAME}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${sharedCookieDomain()}`;

    window.dispatchEvent(new CustomEvent<CookieConsentValue>(COOKIE_CONSENT_EVENT, {
        detail: value,
    }));

    if (previousValue === "granted" && value === "denied") {
        deleteOptionalTrackingCookies();
        window.location.reload();
    }
}
