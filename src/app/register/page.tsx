"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

const registerSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Debe ser un email válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    phone: data.phone || undefined,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Error al registrar.");
                return;
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
                        Creá tu cuenta
                    </h2>
                    <p className="mt-3 text-center text-sm text-gray-500">
                        Empezá a gestionar tus ahorros hoy mismo
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <Input
                            label="Nombre completo"
                            placeholder="Juan Pérez"
                            {...register("name")}
                            error={errors.name?.message}
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="tu@email.com"
                            {...register("email")}
                            error={errors.email?.message}
                        />

                        <Input
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...register("password")}
                            error={errors.password?.message}
                        />

                        <Input
                            label="Teléfono (Opcional)"
                            type="tel"
                            placeholder="+54 11 1234 5678"
                            {...register("phone")}
                            error={errors.phone?.message}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Registrarme
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-gray-500">¿Ya tenés cuenta? </span>
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Iniciá sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
