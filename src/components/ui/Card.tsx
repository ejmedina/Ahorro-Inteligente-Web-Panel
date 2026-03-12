import React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden",
                onClick && "cursor-pointer hover:shadow-md transition-shadow",
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("px-6 py-5 border-b border-gray-100", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
    return <h3 className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("px-6 py-4 bg-gray-50/50 items-center flex", className)}>{children}</div>;
}
