import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
        const baseClass = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
            outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700",
            ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-700",
            danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        };

        const sizes = {
            sm: "h-9 px-3 text-sm",
            md: "h-11 px-6 text-base",
            lg: "h-14 px-8 text-lg",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(baseClass, variants[variant], sizes[size], className)}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
