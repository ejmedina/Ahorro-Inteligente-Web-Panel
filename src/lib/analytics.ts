"use client";

type AnalyticsParameters = Record<string, string | number | boolean | undefined>;

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

function trackMeta(eventName: string, parameters?: AnalyticsParameters, eventId?: string) {
    if (typeof window === "undefined" || !window.fbq) return;

    if (eventId) {
        window.fbq("track", eventName, parameters ?? {}, { eventID: eventId });
        return;
    }

    window.fbq("track", eventName, parameters ?? {});
}

function trackGoogle(eventName: string, parameters?: AnalyticsParameters) {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", eventName, parameters ?? {});
}

export function trackRegistrationCompleted() {
    trackMeta("CompleteRegistration");
    trackGoogle("sign_up", { method: "email" });
}

export function trackManagementCreated(service: string, status: string) {
    const parameters = {
        service,
        status,
    };

    trackMeta("SubmitApplication", parameters);
    trackGoogle("generate_lead", parameters);
}

export function trackPaymentMethodAdded(checkoutSessionId: string) {
    const storageKey = `analytics:add-payment-info:${checkoutSessionId}`;

    try {
        if (window.sessionStorage.getItem(storageKey)) return;
        window.sessionStorage.setItem(storageKey, "1");
    } catch {
        // El tracking sigue funcionando aunque sessionStorage esté bloqueado.
    }

    trackMeta("AddPaymentInfo", undefined, checkoutSessionId);
    trackGoogle("add_payment_info", { payment_type: "card" });
}

export {};
