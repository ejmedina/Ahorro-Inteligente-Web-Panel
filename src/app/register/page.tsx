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
    whatsappOptIn: z.boolean(),
    phone: z.string().optional(),
}).refine((data) => !data.whatsappOptIn || (data.phone && data.phone.length > 5), {
    message: "El teléfono es obligatorio si querés notificaciones por WhatsApp",
    path: ["phone"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { setUser, refreshUser } = useAuth();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            whatsappOptIn: false,
        }
    });

    const isWhatsAppSelected = watch("whatsappOptIn");

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
                    whatsappOptIn: data.whatsappOptIn,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Error al registrar.");
                return;
            }

            // Actualizar estado local inmediatamente con los datos recibidos
            if (json.user) {
                setUser(json.user);
            }
            
            // Refrescar desde el servidor para estar 100% sincronizados con la sesión
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

                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                            Preferencias de notificación
                        </p>
                        <div className="space-y-3">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <div className="flex h-5 items-center">
                                    <input
                                        type="radio"
                                        checked={isWhatsAppSelected === false}
                                        onChange={() => setValue("whatsappOptIn", false, { shouldValidate: true })}
                                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                    />
                                </div>
                                <div className="text-sm border-l-2 pl-2 border-transparent">
                                    <span className="font-medium text-gray-900 block">Solo Email</span>
                                    <span className="text-gray-500 text-xs">Avisos importantes a tu correo</span>
                                </div>
                            </label>

                            <label className="flex items-start space-x-3 cursor-pointer">
                                <div className="flex h-5 items-center">
                                    <input
                                        type="radio"
                                        checked={isWhatsAppSelected === true}
                                        onChange={() => setValue("whatsappOptIn", true, { shouldValidate: true })}
                                        className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-600 cursor-pointer"
                                    />
                                </div>
                                <div className="text-sm border-l-2 pl-2 border-green-500">
                                    <span className="font-medium text-gray-900 block">WhatsApp</span>
                                    <span className="text-gray-500 text-xs">Recibí updates más rápidos en tu celular</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {isWhatsAppSelected && (
                        <div className="space-y-2 translate-y-0 opacity-100 transition-all duration-300 ease-in-out">
                            <Input
                                label="Teléfono"
                                type="tel"
                                placeholder="+54 11 1234 5678"
                                {...register("phone")}
                                error={errors.phone?.message}
                            />
                            <p className="text-xs text-gray-500">
                                Te enviaremos un mensaje de validación para activar el servicio.
                            </p>
                        </div>
                    )}
                    
                    {!isWhatsAppSelected && (
                        <div className="hidden">
                            <Input
                                label="Teléfono (Opcional)"
                                type="tel"
                                {...register("phone")}
                            />
                        </div>
                    )}

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
