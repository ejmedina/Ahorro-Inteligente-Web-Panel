"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

const registerSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Debe ser un email válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    phone: z.string().min(10, "El teléfono debe ser un formato válido e incluir código de país"),
    acceptTerms: z.boolean().refine(val => val === true, {
        message: "Debes aceptar los términos y condiciones para continuar"
    }),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, control, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setError("");
        setSuccessMessage("");
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    phone: data.phone,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Error al registrar.");
                return;
            }

            // Si fue exitoso, el backend nos devuelve un mensaje diciendo que revisemos el email
            if (json.message) {
                setSuccessMessage(json.message);
            } else {
                // Fallback por si acaso el backend devuelve éxito pero no mensaje
                setSuccessMessage("Registro exitoso. Te hemos enviado un correo para verificar tu cuenta.");
            }
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

                {!successMessage ? (
                    <>
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

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Teléfono móvil</label>
                                    <Controller
                                        name="phone"
                                        control={control}
                                        render={({ field }) => (
                                            <PhoneInput
                                                {...field}
                                                international
                                                defaultCountry="AR"
                                                limitMaxLength={true}
                                                className={`flex items-center h-11 w-full rounded-lg border bg-white px-3 py-1 text-sm transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
                                                    errors.phone ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                numberInputProps={{
                                                    className: "flex-1 bg-transparent border-none focus:ring-0 focus:outline-none h-full w-full px-2"
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.phone && <p className="text-sm text-red-600 font-medium">{errors.phone.message}</p>}
                                </div>

                                <div className="flex items-start pt-2">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="terms"
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                            {...register("acceptTerms")}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="terms" className="font-medium text-gray-700">
                                            He leído y acepto los <Link href="https://ahorrointeligente.com.ar/terminos-y-condiciones" target="_blank" className="text-blue-600 hover:underline">Términos y Condiciones</Link> y la <Link href="https://ahorrointeligente.com.ar/politica-de-privacidad" target="_blank" className="text-blue-600 hover:underline">Política de Privacidad</Link>.
                                        </label>
                                        {errors.acceptTerms && <p className="mt-1 text-red-600">{errors.acceptTerms.message}</p>}
                                    </div>
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
                    </>
                ) : (
                    <div className="mt-8 space-y-6 text-center">
                        <div className="rounded-full bg-blue-100 p-3 mx-auto w-fit">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">¡Ya casi estamos!</h3>
                            <p className="mt-2 text-sm text-gray-500">{successMessage}</p>
                        </div>
                        <div className="pt-4">
                            <Link href="/login">
                                <Button className="w-full" variant="outline">
                                    Ir a Iniciar Sesión
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
