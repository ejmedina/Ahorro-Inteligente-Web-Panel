"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
});

type Form = z.infer<typeof schema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<Form>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: Form) => {
        if (!token) {
            setError("Token faltante.");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: data.password }),
            });

            const json = await res.json();
            if (res.ok) {
                setMsg(json.message + " Redirigiendo...");
                setTimeout(() => router.push("/app"), 2000);
            } else {
                setError(json.error || "Error al restablecer contraseña.");
            }
        } catch {
            setError("Error de conexión.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-red-500">Enlace de recuperación inválido.</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-blend-multiply">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
                        Nueva contraseña
                    </h2>
                    <p className="mt-3 text-center text-sm text-gray-500">
                        Ingresá tu nueva clave para recuperar el acceso.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            {...register("password")}
                            error={errors.password?.message}
                        />
                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            {...register("confirmPassword")}
                            error={errors.confirmPassword?.message}
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

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Cambiar contraseña
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
