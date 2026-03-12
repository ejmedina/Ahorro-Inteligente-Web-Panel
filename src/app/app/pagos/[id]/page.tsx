"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService } from "@/lib/services/paymentService";
import { managementService } from "@/lib/services/managementService";
import { Payment, ManagementRequest } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function PagoDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user } = useAuth();
    const [pago, setPago] = useState<Payment | null>(null);
    const [gestion, setGestion] = useState<ManagementRequest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.airtableRecordId && id) {
            paymentService.getPayments(user.airtableRecordId).then(async (payments) => {
                const found = payments.find(p => p.id === id);
                setPago(found || null);
                if (found) {
                    const gest = await managementService.getGestion(found.managementId);
                    setGestion(gest || null);
                }
                setLoading(false);
            });
        }
    }, [user?.airtableRecordId, id]);

    if (loading) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <LoadingSkeleton className="h-10 w-64" />
                <LoadingSkeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!pago) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Pago no encontrado.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.push("/app/pagos")}
                    className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Detalle de Pago
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Cuota {pago.installmentNumber} de 6
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="p-0 sm:p-0 overflow-hidden divide-y divide-gray-100">
                    <div className="p-6 bg-gray-50/50 flex flex-col items-center justify-center text-center">
                        {pago.status === "paid" ? (
                            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                        ) : pago.status === "pending" ? (
                            <Clock className="w-16 h-16 text-yellow-500 mb-4" />
                        ) : (
                            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                        )}
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
                            ${pago.amount.toLocaleString('es-AR')} <span className="text-xl text-gray-500 font-medium">{pago.currency}</span>
                        </h2>
                        <StatusBadge status={pago.status} />
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Fecha de pago</span>
                            <span className="font-medium text-gray-900">
                                {pago.paidAt ? format(new Date(pago.paidAt), "dd 'de' MMMM, yyyy", { locale: es }) : "Pendiente"}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Medio utilizado</span>
                            <span className="font-medium text-gray-900">
                                {pago.paymentMethodSnapshot
                                    ? `${pago.paymentMethodSnapshot.brand} terminada en ${pago.paymentMethodSnapshot.last4}`
                                    : "Por definir"}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">ID de Transacción</span>
                            <span className="font-medium text-gray-500 font-mono text-xs">{pago.id}</span>
                        </div>
                    </div>

                    {gestion && (
                        <div className="p-6 bg-blue-50/30">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                Gestión Asociada
                            </h3>
                            <div className="bg-white p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">{gestion.serviceName || "Solicitud de ahorro"}</p>
                                    <p className="text-xs text-gray-500">Estado: {gestion.status}</p>
                                </div>
                                <Link href={`/app/gestiones/${gestion.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                    Ver gestión
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
