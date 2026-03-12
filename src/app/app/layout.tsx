"use client";

import { AppLayout } from "@/components/layout/AppLayout";

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
    return <AppLayout>{children}</AppLayout>;
}
