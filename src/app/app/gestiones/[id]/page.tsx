"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { managementService } from "@/lib/services/managementService";
import { paymentService } from "@/lib/services/paymentService";
import { ManagementRequest, Payment } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, FileText, Download, Ban, TrendingUp, Calendar, Clock } from "lucide-react";

export default function GestionDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user } = useAuth();
    const [gestion, setGestion] = useState<ManagementRequest | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);

    useEffect(() => {
        if (user?.airtableRecordId && id) {
            Promise.all([
                managementService.getGestion(id),
                paymentService.getPayments(user.airtableRecordId)
            ]).then(([g, p]) => {
                setGestion(g || null);
                if (g) {
                    setPayments(p.filter(pay => pay.managementId === g.id));
                }
                setLoading(false);
            });
        }
    }, [user?.airtableRecordId, id]);

    const handleCancel = async () => {
        if (!window.confirm("¿Seguro que querés cancelar esta gestión?")) return;
        setCanceling(true);
        try {
            const updated = await managementService.cancelGestion(id);
            setGestion(updated);
        } catch (err: any) {
            alert(err.message || "Error al cancelar");
        } finally {
            setCanceling(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <LoadingSkeleton className="h-10 w-64" />
                <LoadingSkeleton className="h-48 w-full" />
                <LoadingSkeleton className="h-48 w-full" />
            </div>
        );
    }

    if (!gestion) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Gestión no encontrada.</p>
                <Button variant="ghost" className="mt-4 text-blue-600" onClick={() => router.push("/app/gestiones")}>
                    Volver a mis gestiones
                </Button>
            </div>
        );
    }

    const canCancel = gestion.status === "draft" || gestion.status === "submitted";

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.push("/app/gestiones")}
                    className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            {gestion.serviceName || "Detalle de Gestión"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Creada el {format(new Date(gestion.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                        </p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                        <StatusBadge status={gestion.status} />
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Invoice details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Factura Subida</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {gestion.invoice ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="truncate">
                                        <p className="font-medium text-gray-900 truncate">{gestion.invoice.filename}</p>
                                        <p className="text-xs text-gray-500">
                                            {(gestion.invoice.size / 1024 / 1024).toFixed(2)} MB • {gestion.invoice.mime}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => window.open(gestion.invoice!.fileUrl, '_blank')}>
                                    <Download className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Ver / Descargar</span>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No se subió ninguna factura.</p>
                        )}

                        {/* Negotiation Result Summary */}
                        {(gestion.savingsAchieved || gestion.promotionStart) && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Resultado de la Negociación</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {gestion.savingsAchieved && (
                                        <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-green-700 font-medium">Ahorro Conseguido</p>
                                                <p className="text-lg font-bold text-green-900">${gestion.savingsAchieved.toLocaleString('es-AR')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {gestion.duration && (
                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center space-x-3">
                                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-blue-700 font-medium">Duración del Beneficio</p>
                                                <p className="text-lg font-bold text-blue-900">{gestion.duration} meses</p>
                                            </div>
                                        </div>
                                    )}
                                    {gestion.promotionStart && (
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center space-x-3">
                                            <div className="p-2 bg-gray-200 text-gray-700 rounded-lg">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Inicio de Promoción</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {isValid(new Date(gestion.promotionStart)) 
                                                        ? format(new Date(gestion.promotionStart), "dd/MM/yyyy")
                                                        : gestion.promotionStart}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {gestion.promotionEnd && (
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center space-x-3">
                                            <div className="p-2 bg-gray-200 text-gray-700 rounded-lg">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Fin de Promoción</p>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {isValid(new Date(gestion.promotionEnd)) 
                                                        ? format(new Date(gestion.promotionEnd), "dd/MM/yyyy")
                                                        : gestion.promotionEnd}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {gestion.notes && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Notas Adicionales</h4>
                                <div className="p-4 bg-yellow-50 text-yellow-900 rounded-xl border border-yellow-100 text-sm whitespace-pre-wrap">
                                    {gestion.notes}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payments linked */}
                {payments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Pagos Asociados (6 Cuotas)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {payments.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100">
                                        <div>
                                            <span className="font-medium text-gray-900 text-sm">Cuota {p.installmentNumber}/6</span>
                                            <p className="text-xs text-gray-500">
                                                {p.paidAt ? `Pagado el ${format(new Date(p.paidAt), "dd/MM/yyyy")}` : "Pendiente"}
                                                {p.paymentMethodSnapshot && ` con ${p.paymentMethodSnapshot.brand} *${p.paymentMethodSnapshot.last4}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">${p.amount.toLocaleString('es-AR')}</p>
                                            <StatusBadge status={p.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                {canCancel && (
                    <div className="flex justify-end pt-4">
                        <Button variant="danger" onClick={handleCancel} isLoading={canceling}>
                            <Ban className="w-4 h-4 mr-2" />
                            Cancelar Gestión
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
