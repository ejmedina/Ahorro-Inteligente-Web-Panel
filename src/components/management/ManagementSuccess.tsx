"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Coffee } from "lucide-react";

interface ManagementSuccessProps {
    redirectTo?: string;
    delayMs?: number;
}

export function ManagementSuccess({
    redirectTo = "/app/gestiones",
    delayMs = 5000,
}: ManagementSuccessProps) {
    const router = useRouter();

    useEffect(() => {
        const timer = window.setTimeout(() => router.push(redirectTo), delayMs);
        return () => window.clearTimeout(timer);
    }, [delayMs, redirectTo, router]);

    return (
        <div className="max-w-2xl mx-auto h-[60vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse" />
                <CheckCircle2 className="w-24 h-24 text-green-500 relative z-10" />
            </div>
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">¡Gestión iniciada con éxito!</h1>
                <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
                    <Coffee className="w-5 h-5 text-amber-600" />
                    Relajate y empezá a ahorrar en piloto automático.
                </p>
            </div>
            <div className="pt-8">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-4">Redirigiendo a tus gestiones...</p>
            </div>
        </div>
    );
}
