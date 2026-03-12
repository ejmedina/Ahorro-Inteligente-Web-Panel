"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const setPasswordSchema = z.object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
});

type SetPasswordForm = z.infer<typeof setPasswordSchema>;

export default function SetPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<SetPasswordForm>({
        resolver: zodResolver(setPasswordSchema)
    });

    const onSubmit = async (data: SetPasswordForm) => {
        setIsLoading(true);
        // In a real app we would call authService.setPassword(data.password)
        // Here we just pretend it succeeds and go to app
        setTimeout(() => {
            setIsLoading(false);
            router.push("/app/gestiones");
        }, 1000);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-gray-900">
                        Creá tu contraseña
                    </h2>
                    <p className="mt-3 text-center text-sm text-gray-500">
                        Establecé una contraseña para ingresar más fácilmente en el futuro
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <Input
                            label="Nueva contraseña"
                            type="password"
                            placeholder="••••••••"
                            {...register("password")}
                            error={errors.password?.message}
                        />

                        <Input
                            label="Confirmá la contraseña"
                            type="password"
                            placeholder="••••••••"
                            {...register("confirmPassword")}
                            error={errors.confirmPassword?.message}
                        />
                    </div>

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Guardar y Continuar
                    </Button>
                </form>
            </div>
        </div>
    );
}
