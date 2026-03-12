"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService } from "@/lib/services/paymentService";
import { Payment } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronRight } from "lucide-react";

export default function PagosPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [pagos, setPagos] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.airtableRecordId) {
            paymentService.getPayments(user.airtableRecordId).then(data => {
                setPagos(data);
                setLoading(false);
            });
        }
    }, [user?.airtableRecordId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <LoadingSkeleton className="h-8 w-40" />
                <LoadingSkeleton className="h-24 w-full" />
                <LoadingSkeleton className="h-24 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Historial de Pagos</h1>
                <p className="text-sm text-gray-500 mt-1">Conocé el estado de tus cuotas asociadas a planes de ahorro.</p>
            </div>

            {pagos.length === 0 ? (
                <EmptyState
                    icon={Clock}
                    title="Sin pagos registrados"
                    description="Todavía no tenés planes de ahorro activos con cuotas."
                />
            ) : (
                <div className="grid gap-4">
                    {pagos.map((p) => (
                        <Card key={p.id} onClick={() => router.push(`/app/pagos/${p.id}`)}>
                            <CardContent className="p-4 sm:p-6 flex items-center justify-between cursor-pointer group">
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-gray-50 text-gray-500 rounded-xl hidden sm:block group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Cuota {p.installmentNumber} de 6</h3>
                                        <p className="text-sm text-gray-500 mb-2">
                                            Generada el {format(new Date(p.createdAt), "dd MMM, yyyy", { locale: es })}
                                        </p>
                                        {p.paymentMethodSnapshot && (
                                            <p className="text-xs text-gray-500">
                                                Via {p.paymentMethodSnapshot.brand} {p.paymentMethodSnapshot.last4}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <span className="font-bold text-gray-900">${p.amount.toLocaleString('es-AR')} {p.currency}</span>
                                    <StatusBadge status={p.status} />
                                    <span className="text-xs font-medium text-blue-600 flex items-center pt-1 group-hover:underline">
                                        Ver detalle <ChevronRight className="w-3 h-3 ml-1" />
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
