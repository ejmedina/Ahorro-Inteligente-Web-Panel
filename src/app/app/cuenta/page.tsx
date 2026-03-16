"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User as UserIcon, Bell as BellIcon } from "lucide-react";



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
    const [isLoading, setIsLoading] = useState(false);
    
    // Preferences Form State
    const [prefLoading, setPrefLoading] = useState(false);
    const [prefSuccess, setPrefSuccess] = useState("");
    const [prefError, setPrefError] = useState("");
    // isWhatsAppActive será true si el usuario tiene Whatsapp como modo (Active o Pending)
    const [isWhatsAppActive, setIsWhatsAppActive] = useState(false);

    const currentSubStatus = user?.subscriptionStatus || 'Inactive';

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.fullName ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.fullName,
                email: user.email,
                phone: user.phone || ""
            });
            setIsWhatsAppActive(user.subscriptionStatus === 'Active' || user.subscriptionStatus === 'Pending');
        }
    }, [user, reset]);

    const onSubmit = async (_data: ProfileForm) => {
        setIsLoading(true);
        // TODO: Implementar endpoint /api/auth/update-profile para actualizar datos en Airtable
        setTimeout(() => {
            setSuccessMsg("Función disponible próximamente.");
            setIsLoading(false);
            setIsEditing(false);
        }, 1000);
    };

    const handleSavePreferences = async () => {
        setPrefLoading(true);
        setPrefSuccess("");
        setPrefError("");

        try {
            if (isWhatsAppActive && !user?.phone) {
                setPrefError("Para activar WhatsApp necesitas tener un teléfono registrado en tus Datos Personales arriba.");
                setPrefLoading(false);
                return;
            }

            const res = await fetch("/api/auth/profile/preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    whatsappOptIn: isWhatsAppActive,
                    phone: user?.phone || undefined
                })
            });

            const json = await res.json();
            if (!res.ok) {
                setPrefError(json.error || "Error al actualizar preferencias.");
            } else {
                setPrefSuccess(
                    isWhatsAppActive 
                        ? "Te enviamos un mensaje por WhatsApp para validar el cambio."
                        : "Tus notificaciones ahora llegarán solo por Email."
                );
                // Si teníamos AuthContext.refreshUser, podríamos llamarlo aquí para actualizar:
                // await refreshUser();
            }
        } catch (err) {
            setPrefError("Error de conexión al actualizar preferencias.");
        } finally {
            setPrefLoading(false);
        }
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
                                <Button type="submit" isLoading={isLoading}>
                                    Guardar Cambios
                                </Button>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Nueva Card para Preferencias */}
            <Card>
                <CardHeader className="flex flex-row justify-between items-center bg-gray-50/50">
                    <CardTitle className="flex items-center text-lg">
                        <BellIcon className="w-5 h-5 mr-2 text-gray-500" />
                        Preferencias de Notificación
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {prefSuccess && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                            {prefSuccess}
                        </div>
                    )}
                    {prefError && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                            {prefError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">Notificaciones por WhatsApp</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                    Recibí avisos rápidos de tus gestiones directamente en tu celular. <br/>
                                    <strong>Nota:</strong> Si desmarcás esta opción, las notificaciones te llegarán únicamente por correo electrónico.
                                </p>
                                {isWhatsAppActive && currentSubStatus === 'Pending' && (
                                    <div className="mt-2 text-xs font-semibold text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded-md">
                                        Pendiente de validación. Respondé al mensaje que te enviamos para activar.
                                    </div>
                                )}
                            </div>
                            <div className="ml-4 flex items-center h-full pt-1">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={isWhatsAppActive}
                                    onChange={(e) => setIsWhatsAppActive(e.target.checked)}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button 
                                onClick={handleSavePreferences} 
                                isLoading={prefLoading}
                                disabled={isWhatsAppActive === (currentSubStatus === 'Active' || currentSubStatus === 'Pending')}
                            >
                                Guardar Preferencias
                            </Button>
                        </div>
                    </div>
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
