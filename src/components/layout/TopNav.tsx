"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut } from "lucide-react";
import { Button } from "../ui/Button";

export function TopNav() {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="md:hidden">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Ahorro Inteligente
                    </span>
                </div>
                <div className="hidden md:flex flex-1" />

                <div className="flex items-center space-x-4">
                    <div className="text-sm">
                        <p className="font-medium text-gray-900">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">{user?.email}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                        <User className="h-4 w-4" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout} className="ml-2 px-3 hidden sm:flex">
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                    </Button>
                </div>
            </div>
        </header>
    );
}
