"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService } from "@/lib/services/paymentService";
import { PaymentMethod } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard, Plus, Star, Trash2 } from "lucide-react";

export default function MediosDePagoPage() {
    const { user } = useAuth();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);

    const loadMethods = React.useCallback(() => {
        if (user?.airtableRecordId) {
            paymentService.getPaymentMethods(user.airtableRecordId).then(data => {
                setMethods(data);
                setLoading(false);
            });
        }
    }, [user?.airtableRecordId]);

    useEffect(() => {
        loadMethods();
    }, [loadMethods]);

    const handleAddMethod = async () => {
        if (!user?.airtableRecordId) return;
        setRedirecting(true);
        try {
            const url = await paymentService.getSetupUrl(user.airtableRecordId);
            // Mock redirection
            window.location.href = url;
        } catch (err) {
            alert("Error al obtener URL de validación");
            setRedirecting(false);
        }
    };

    const setAsDefault = async (id: string) => {
        if (!user?.airtableRecordId) return;
        await paymentService.setDefaultMethod(user.airtableRecordId, id);
        loadMethods();
    };

    const deleteMethod = async (id: string) => {
        if (!window.confirm("¿Estás seguro de eliminar este medio de pago?")) return;
        await paymentService.removeMethod(id);
        loadMethods();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <LoadingSkeleton className="h-8 w-48" />
                <LoadingSkeleton className="h-24 w-full max-w-md" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Medios de Pago</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestioná tus tarjetas para el pago de los ahorros conseguidos.</p>
                </div>
                <Button onClick={handleAddMethod} isLoading={redirecting}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar nuevo
                </Button>
            </div>

            {methods.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="Sin tarjetas guardadas"
                    description="Agregá un medio de pago para que podamos cobrar nuestra comisión (solo si logramos un ahorro)."
                    action={
                        <Button className="mt-4" onClick={handleAddMethod} isLoading={redirecting}>
                            Agregar mi primera tarjeta
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {methods.map((method) => (
                        <Card key={method.id} className={method.isDefault ? "border-blue-200 ring-1 ring-blue-200 bg-blue-50/50" : ""}>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-800 text-xs shadow-sm border border-gray-200">
                                            {method.brand}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{method.issuerName}</p>
                                            <p className="text-xs text-gray-500">•••• {method.last4}</p>
                                        </div>
                                    </div>
                                    {method.isDefault && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                                            Principal
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2 border-t border-gray-100 pt-4 mt-2">
                                    {!method.isDefault && (
                                        <Button variant="ghost" size="sm" className="flex-1 text-gray-600 h-8" onClick={() => setAsDefault(method.id)}>
                                            <Star className="w-3.5 h-3.5 mr-1.5" /> Hacer principal
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className={`text-red-600 hover:text-red-700 hover:bg-red-50 h-8 ${method.isDefault ? 'w-full' : 'flex-none px-3'}`} onClick={() => deleteMethod(method.id)}>
                                        <Trash2 className={`w-3.5 h-3.5 ${method.isDefault ? 'mr-1.5' : ''}`} />
                                        {method.isDefault && "Eliminar"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                <strong className="text-gray-900">Seguridad:</strong> Ahorro Inteligente no almacena los datos de tu tarjeta. Usamos Stripe, el procesador de pagos líder global, para tokenizar y guardar tu información con los máximos estándares de seguridad (PCI DSS Nivel 1).
            </div>
        </div>
    );
}
