"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({
    email: z.string().email("Debe ser un email válido"),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showResend, setShowResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const { register, handleSubmit, getValues, formState: { errors } } = useForm<Form>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: Form) => {
        setIsLoading(true);
        setError("");
        setMsg("");
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });

            const json = await res.json();
            if (res.ok) {
                setMsg(json.message);
                setShowResend(false);
            } else {
                setError(json.error || "Algo salió mal.");
                if (res.status === 403 && json.error?.includes("no está verificada")) {
                    setShowResend(true);
                } else {
                    setShowResend(false);
                }
            }
        } catch {
            setError("Error de conexión.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setError("");
        setMsg("");
        try {
            const email = getValues("email");
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const json = await res.json();
            if (res.ok) {
                setMsg(json.message);
                setShowResend(false);
            } else {
                setError(json.error || "Error al reenviar el correo.");
            }
        } catch {
            setError("Error de conexión al reenviar el correo.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-blend-multiply">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
                        Recuperar acceso
                    </h2>
                    <p className="mt-3 text-center text-sm text-gray-500">
                        Ingresá tu email y te enviaremos instrucciones.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        label="Email"
                        type="email"
                        placeholder="tu@email.com"
                        {...register("email")}
                        error={errors.email?.message}
                    />

                    {msg && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                            {msg}
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex flex-col gap-2">
                            <span>{error}</span>
                            {showResend && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleResend}
                                    isLoading={isResending}
                                    className="w-full mt-1 border-red-200 text-red-700 hover:bg-red-100"
                                >
                                    Reenviar correo de validación
                                </Button>
                            )}
                        </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Enviar instrucciones
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
