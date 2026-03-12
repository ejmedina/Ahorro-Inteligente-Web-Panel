"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, CreditCard, Clock, User as UserIcon } from "lucide-react";

export const APP_ROUTES = [
    { name: "Gestiones", href: "/app/gestiones", icon: FileText },
    { name: "Historial de Pagos", href: "/app/pagos", icon: Clock },
    { name: "Medios de Pago", href: "/app/medios-de-pago", icon: CreditCard },
    { name: "Mi Cuenta", href: "/app/cuenta", icon: UserIcon },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="flex h-16 items-center px-6 border-b border-gray-200">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Ahorro Inteligente
                </span>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
                {APP_ROUTES.map((item) => {
                    const isActive = pathname?.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-700" : "text-gray-400")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
