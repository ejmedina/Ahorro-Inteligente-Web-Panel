"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const forgotSchema = z.object({
    email: z.string().email("Debe ser un email válido"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
        resolver: zodResolver(forgotSchema)
    });

    const onSubmit = async (_data: ForgotForm) => {
        setIsLoading(true);
        try {
            // TODO: implementar endpoint /api/auth/forgot-password con envío real de email
            // Por ahora siempre muestra el mensaje de éxito (anti-enumeración)
            await new Promise(r => setTimeout(r, 600));
            setSuccess(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl text-center space-y-4 border border-gray-100">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Revisá tu email</h2>
                    <p className="text-gray-500">
                        Si existe una cuenta asociada a ese correo, te enviaremos un link para restablecer tu contraseña.
                    </p>
                    <div className="pt-4">
                        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Volver al login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-blend-multiply">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
                        Recuperar contraseña
                    </h2>
                    <p className="mt-3 text-center text-sm text-gray-500">
                        Ingresá tu email y te enviaremos las instrucciones
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
