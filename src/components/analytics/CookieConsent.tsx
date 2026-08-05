"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    CookieConsentValue,
    readCookieConsent,
    saveCookieConsent,
} from "@/lib/cookieConsent";

export function CookieConsent() {
    const [consent, setConsent] = useState<CookieConsentValue | null>(null);
    const [ready, setReady] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const savedConsent = readCookieConsent();
        setConsent(savedConsent);
        setIsOpen(savedConsent === null);
        setReady(true);
    }, []);

    const choose = (value: CookieConsentValue) => {
        saveCookieConsent(value);
        setConsent(value);
        setIsOpen(false);
    };

    if (!ready) return null;

    if (!isOpen && consent) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-2 left-2 z-40 rounded-md bg-white/90 px-2 py-1 text-[11px] text-gray-500 shadow-sm ring-1 ring-gray-200 backdrop-blur hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Cookies
            </button>
        );
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4" role="dialog" aria-label="Preferencias de cookies">
            <div className="mx-auto max-w-5xl rounded-xl border border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur sm:flex sm:items-center sm:gap-5">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">Tu privacidad</p>
                    <p className="mt-1 text-xs leading-5 text-gray-600 sm:text-sm">
                        Usamos cookies opcionales para medir campañas y mejorar el servicio. Podés aceptar o continuar sólo con las necesarias.{' '}
                        <Link
                            href="https://ahorrointeligente.com.ar/politica-de-privacidad"
                            target="_blank"
                            className="whitespace-nowrap text-blue-600 hover:underline"
                        >
                            Más información
                        </Link>
                    </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:shrink-0">
                    <button
                        type="button"
                        onClick={() => choose("denied")}
                        className="min-h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    >
                        Sólo necesarias
                    </button>
                    <button
                        type="button"
                        onClick={() => choose("granted")}
                        className="min-h-10 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
}
