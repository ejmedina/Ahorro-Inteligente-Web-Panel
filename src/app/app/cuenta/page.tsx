"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User as UserIcon } from "lucide-react";

const profileSchema = z.object({
    name: z.string().min(2, "El nombre es muy corto"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional()
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function CuentaPage() {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema)
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.fullName,
                email: user.email,
                phone: user.phone || ""
            });
        }
    }, [user, reset]);

    const onSubmit = async (_data: ProfileForm) => {
        // TODO: Implementar endpoint /api/auth/update-profile para actualizar datos en Airtable
        setSuccessMsg("Función disponible próximamente.");
        setIsEditing(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mi Cuenta</h1>
                <p className="text-sm text-gray-500 mt-1">Gestioná tus datos personales y configuración.</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row justify-between items-center bg-gray-50/50">
                    <CardTitle className="flex items-center text-lg">
                        <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
                        Datos Personales
                    </CardTitle>
                    {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => { setSuccessMsg(""); setIsEditing(true); }}>
                            Editar
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-6">
                    {successMsg && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Nombre Completo"
                            {...register("name")}
                            disabled={!isEditing}
                            error={errors.name?.message}
                        />
                        <Input
                            label="Email"
                            type="email"
                            {...register("email")}
                            disabled={!isEditing}
                            error={errors.email?.message}
                        />
                        <Input
                            label="Teléfono"
                            type="tel"
                            {...register("phone")}
                            disabled={!isEditing}
                            error={errors.phone?.message}
                        />

                        {isEditing && (
                            <div className="flex justify-end space-x-3 pt-4">
                                <Button variant="ghost" type="button" onClick={() => {
                                    setIsEditing(false);
                                    reset();
                                }}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    Guardar Cambios
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 flex justify-between items-center sm:flex-row flex-col sm:space-y-0 space-y-4">
                    <div>
                        <h3 className="font-semibold text-gray-900">Cerrar Sesión</h3>
                        <p className="text-sm text-gray-500 mt-1">Cierra tu sesión actual en este dispositivo.</p>
                    </div>
                    <Button variant="danger" onClick={logout} className="w-full sm:w-auto">
                        Cerrar sesión
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
