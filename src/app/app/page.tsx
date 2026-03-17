"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { managementService } from "@/lib/services/managementService";
import { paymentService } from "@/lib/services/paymentService";
import { ManagementRequest, Payment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Clock, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [gestiones, setGestiones] = useState<ManagementRequest[]>([]);
    const [pagos, setPagos] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [justVerified, setJustVerified] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("verified") === "true") {
                setJustVerified(true);
                // Limpiar la URL para que no siga apareciendo al refrescar
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !user?.airtableRecordId) {
            setLoading(false);
            return;
        }

        if (user?.airtableRecordId) {
            Promise.all([
                managementService.getUserGestiones(user.airtableRecordId),
                paymentService.getPayments(user.airtableRecordId)
            ]).then(([g, p]) => {
                setGestiones(g);
                setPagos(p);
            }).catch((err) => {
                console.error("Error al cargar datos del dashboard:", err);
                setGestiones([]);
                setPagos([]);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [user?.airtableRecordId, authLoading]);

    if (loading) {
        return (
            <div className="space-y-6">
                <LoadingSkeleton className="h-10 w-48" />
                <div className="grid gap-6 md:grid-cols-2">
                    <LoadingSkeleton className="h-64" />
                    <LoadingSkeleton className="h-64" />
                </div>
            </div>
        );
    }

    const activeGestiones = gestiones.filter(g => g.status !== "canceled" && g.status !== "resolved").slice(0, 3);
    const pendingPagos = pagos.filter(p => p.status === "pending").slice(0, 3);

    return (
        <div className="space-y-6">
            {justVerified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start sm:items-center space-x-3 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 sm:mt-0 shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-green-800">¡Tu email fue verificado correctamente!</h3>
                        <p className="text-sm text-green-700 mt-1">Ya podés empezar a usar tu panel de Ahorro Inteligente.</p>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hola, {user?.fullName?.split(' ')[0]} 👋</h1>
                <p className="text-gray-500">Acá tenés un resumen de tu actividad.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Gestiones Recientes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center text-gray-800">
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                            Gestiones Activas
                        </CardTitle>
                        <Link href="/app/gestiones/nueva">
                            <Button variant="ghost" size="sm" className="hidden sm:flex text-blue-600">
                                <Plus className="w-4 h-4 mr-1" />
                                Nueva
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeGestiones.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">No hay gestiones activas.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {activeGestiones.map((g) => (
                                    <li key={g.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {g.serviceName || g.invoice?.filename || "Gestión"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(g.createdAt), "dd MMM yyyy", { locale: es })}
                                            </p>
                                        </div>
                                        <StatusBadge status={g.status} />
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Link href="/app/gestiones" className="flex items-center justify-center text-sm font-medium text-blue-600 pt-2 hover:text-blue-700">
                            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Próximos Pagos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-800">
                            <Clock className="w-5 h-5 mr-2 text-blue-600" />
                            Próximos Pagos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingPagos.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">No tenés pagos pendientes.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {pendingPagos.map((p) => (
                                    <li key={p.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                Cuota {p.installmentNumber}/6
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(p.createdAt), "dd MMM yyyy", { locale: es })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">${p.amount.toLocaleString('es-AR')}</p>
                                            <StatusBadge status={p.status} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Link href="/app/pagos" className="flex items-center justify-center text-sm font-medium text-blue-600 pt-2 hover:text-blue-700">
                            Ver historial <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
