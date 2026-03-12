"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { managementService } from "@/lib/services/managementService";
import { ManagementRequest } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, ChevronRight } from "lucide-react";

export default function GestionesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [gestiones, setGestiones] = useState<ManagementRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.airtableRecordId) {
            managementService.getUserGestiones(user.airtableRecordId).then((data) => {
                setGestiones(data);
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
                                <div className="flex flex-col items-end space-y-3">
                                    <StatusBadge status={g.status} />
                                    <span className="text-sm font-medium text-blue-600 flex items-center">
                                        Ver detalle <ChevronRight className="w-4 h-4 ml-1" />
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
