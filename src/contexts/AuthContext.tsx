"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
    airtableRecordId: string;
    fullName: string;
    email: string;
    phone?: string;
    subscriptionStatus?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    setUser: (user: AuthUser | null) => void;
    refreshUser: () => Promise<AuthUser | null>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const refreshUser = async (): Promise<AuthUser | null> => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user ?? null);
                return data.user ?? null;
            } else {
                setUser(null);
                return null;
            }
        } catch {
            setUser(null);
            return null;
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

    const login = (userData: AuthUser | null) => {
        setUser(userData);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, setUser: login, refreshUser, logout }}>
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
