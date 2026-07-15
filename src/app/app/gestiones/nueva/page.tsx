"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { managementService } from "@/lib/services/managementService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, CheckCircle2, Coffee } from "lucide-react";

export default function NuevaGestionPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [dni, setDni] = useState("");
    const [notes, setNotes] = useState("");
    const [service, setService] = useState("");
    const [otherService, setOtherService] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                router.push("/app/gestiones");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Por favor subí la última factura de tu servicio.");
            return;
        }
        if (!service) {
            setError("Por favor seleccioná un servicio.");
            return;
        }
        if (service === "Otro" && !otherService) {
            setError("Por favor especificá el nombre del servicio.");
            return;
        }
        if (!dni) {
            setError("Por favor ingresá el DNI del titular.");
            return;
        }
        setError("");
        setIsLoading(true);

        try {
            if (!user?.airtableRecordId) throw new Error("No user found");
            
            const finalService = service === "Otro" ? otherService : service;
            const newGestion = await managementService.createGestion(user.airtableRecordId, file, notes, dni, finalService);
            
            if (newGestion.status === "PendingPayment") {
                router.push(`/app/gestiones/${newGestion.id}`);
            } else {
                setIsSuccess(true);
            }
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al crear la gestión.");
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto h-[60vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <CheckCircle2 className="w-24 h-24 text-green-500 relative z-10" />
                </div>
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">¡Gestión iniciada con éxito!</h1>
                    <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
                        <Coffee className="w-5 h-5 text-amber-600" />
                        Relajate y empezá a ahorrar en piloto automático.
                    </p>
                </div>
                <div className="pt-8">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-4">Redirigiendo a tus gestiones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nueva Gestión</h1>
                    <p className="text-sm text-gray-500 mt-1">Subí tu factura y nosotros nos encargamos del resto.</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-900">DNI del Titular (Requerido)</label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={dni}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    setDni(val);
                                }}
                                placeholder="Ingresá los números del DNI"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-900">Servicio (Requerido)</label>
                            <select
                                value={service}
                                onChange={(e) => setService(e.target.value)}
                                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="" disabled>Seleccionar...</option>
                                <option value="Personal Flow">Personal Flow</option>
                                <option value="Telecentro">Telecentro</option>
                                <option value="Movistar">Movistar</option>
                                <option value="Claro">Claro</option>
                                <option value="DirecTV">DirecTV</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        {service === "Otro" && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-900">¿Qué servicio es? (Requerido)</label>
                                <Input
                                    type="text"
                                    value={otherService}
                                    onChange={(e) => setOtherService(e.target.value)}
                                    placeholder="Ej: iPlan, Claro Hogar..."
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-900">Última factura (Requerido)</label>
                            <p className="text-xs text-gray-500 mb-2">Necesitamos la factura completa para analizar tus consumos y tarifas.</p>
                            <FileUpload
                                onFileSelect={(f) => setFile(f)}
                                error={error}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-900">Notas Adicionales (Opcional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-32 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Ej: Ya llamé y me dijeron que no me podían bajar más de X..."
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                                Enviar Factura
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
