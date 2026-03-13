"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { managementService } from "@/lib/services/managementService";
import { paymentService } from "@/lib/services/paymentService";
import { ManagementRequest } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, ChevronRight, AlertTriangle } from "lucide-react";

export default function GestionesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [gestiones, setGestiones] = useState<ManagementRequest[]>([]);
    const [hasPaymentMethods, setHasPaymentMethods] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.airtableRecordId) {
            Promise.all([
                managementService.getUserGestiones(user.airtableRecordId),
                paymentService.getPaymentMethods(user.airtableRecordId)
            ]).then(([gestionesData, methodsData]) => {
                setGestiones(gestionesData);
                setHasPaymentMethods(methodsData.length > 0);
                setLoading(false);
            });
        }
    }, [user?.airtableRecordId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <LoadingSkeleton className="h-8 w-40" />
                    <LoadingSkeleton className="h-10 w-32" />
                </div>
                <LoadingSkeleton className="h-24 w-full" />
                <LoadingSkeleton className="h-24 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mis Gestiones</h1>
                    <p className="text-sm text-gray-500 mt-1">Acá podés ver el estado de tus facturas y solicitudes.</p>
                </div>
                <Link href="/app/gestiones/nueva">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Gestión
                    </Button>
                </Link>
            </div>

            {hasPaymentMethods === false && gestiones.some(g => g.status === 'PendingPayment') && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-900">Acción Requerida</h4>
                            <p className="text-sm text-amber-800 mt-1">
                                Tus gestiones están pausadas porque no tenés un medio de pago válido. 
                                Necesitamos que cargues una tarjeta para poder avanzar con las negociaciones.
                            </p>
                            <Link href="/app/medios-de-pago">
                                <Button variant="ghost" size="sm" className="mt-3 text-amber-900 hover:bg-amber-100 p-0 h-auto font-bold border-b border-amber-900 rounded-none">
                                    Cargar medio de pago ahora
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {gestiones.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No tenés gestiones todavía"
                    description="Subí tu primera factura de servicio para que empecemos a negociar por vos."
                    action={
                        <Link href="/app/gestiones/nueva">
                            <Button className="mt-4">Crear mi primera gestión</Button>
                        </Link>
                    }
                />
            ) : (
                <div className="grid gap-4">
                    {gestiones.map((g) => (
                        <Card key={g.id} onClick={() => router.push(`/app/gestiones/${g.id}`)}>
                            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg hidden sm:block">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {g.serviceName || g.invoice?.filename || "Factura sin nombre"}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-2">
                                            {format(new Date(g.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                                        </p>
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center text-xs text-gray-500">
                                                Factura cargada:
                                                <span className={g.invoice || g.id ? "text-green-600 ml-1 font-medium" : "text-red-600 ml-1 font-medium"}>
                                                    {g.invoice || g.id ? "Sí" : "No"}
                                                </span>
                                            </div>
                                            {g.status === "Completed" && g.savingsAchieved && (
                                                <div className="flex items-center text-xs font-semibold text-green-700">
                                                    Ahorro Conseguido:
                                                    <span className="ml-1">${g.savingsAchieved.toLocaleString('es-AR')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-3 shrink-0">
                                    <StatusBadge status={g.status} />
                                    <div className="flex flex-col items-end space-y-2">
                                        {g.status === "PendingPayment" && (
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 h-8 text-xs px-3 shadow-sm"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const url = await paymentService.getSetupUrl(user!.airtableRecordId, g.id);
                                                        window.location.href = url;
                                                    } catch (err: any) {
                                                        alert(err.message || "Error al obtener URL de pago");
                                                    }
                                                }}
                                            >
                                                Cargar Tarjeta
                                            </Button>
                                        )}
                                        <span className="text-xs font-medium text-gray-400 flex items-center hover:text-blue-600 transition-colors">
                                            Ver detalle <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
