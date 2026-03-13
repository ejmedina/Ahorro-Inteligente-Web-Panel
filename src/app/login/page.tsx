"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
    email: z.string().email("Debe ser un email válido"),
    password: z.string().min(1, "La contraseña es requerida"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser, refreshUser } = useAuth();
    
    const [msg, setMsg] = useState(searchParams.get("message") || "");
    const [error, setError] = useState(searchParams.get("error") || "");
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError("");
        setMsg("");
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email, password: data.password }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Credenciales inválidas.");
                return;
            }

            if (json.user) {
                setUser(json.user);
            }
            
            await refreshUser();
            router.push("/app/gestiones");
        } catch {
            setError("Error de conexión. Intentá de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-blend-multiply">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
                        Bienvenido de nuevo
                    </h2>
                    <p className="mt-3 text-center text-sm text-gray-500">
                        Ingresá a tu cuenta de Ahorro Inteligente
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="tu@email.com"
                            autoComplete="email"
                            {...register("email")}
                            error={errors.email?.message}
                        />

                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...register("password")}
                            error={errors.password?.message}
                        />
                    </div>

                    {msg && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                            {msg}
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Iniciar sesión
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-gray-500">¿No tenés cuenta? </span>
                    <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                        Registrate acá
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <LoginContent />
        </Suspense>
    );
}
