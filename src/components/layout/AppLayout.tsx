"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <LoadingSkeleton className="h-32 w-32 rounded-full" />
            </div>
        );
    }

    // Not strictly necessary since AuthContext handles redirection, but safe-guard
    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar />
            <div className="flex flex-1 flex-col pb-16 md:pb-0">
                <TopNav />
                <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
            <BottomNav />
        </div>
    );
}
