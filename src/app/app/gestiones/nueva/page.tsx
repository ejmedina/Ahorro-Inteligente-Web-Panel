"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { managementService } from "@/lib/services/managementService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default function NuevaGestionPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [dni, setDni] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Por favor subí la última factura de tu servicio.");
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
            const newGestion = await managementService.createGestion(user.airtableRecordId, file, notes, dni);
            router.push(`/app/gestiones/${newGestion.id}`);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al crear la gestión.");
            setIsLoading(false);
        }
    };

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
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                placeholder="Ingresá el DNI del dueño del servicio"
                                required
                            />
                        </div>

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
