"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
    airtableRecordId: string;
    fullName: string;
    email: string;
    phone?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const refreshUser = async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user ?? null);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        }
    };

    useEffect(() => {
        refreshUser().finally(() => setIsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isLoading) {
            const isAppRoute = pathname?.startsWith("/app");
            const isAuthRoute = ["/login", "/register", "/forgot-password", "/verify-email"].includes(
                pathname || ""
            );

            if (isAppRoute && !user) {
                router.replace("/login");
            } else if (isAuthRoute && user) {
                router.replace("/app/gestiones");
            }
        }
    }, [user, isLoading, pathname, router]);

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch {
            // Ignorar errores de red en logout
        }
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
