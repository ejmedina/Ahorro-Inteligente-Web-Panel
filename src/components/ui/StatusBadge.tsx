import React from "react";
import { cn } from "@/lib/utils";
import { ManagementStatus, PaymentStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ManagementStatus | PaymentStatus }) {
    const badgeMap: Record<string, { label: string; className: string }> = {
        draft: { label: "Borrador", className: "bg-gray-100 text-gray-700" },
        submitted: { label: "Enviado", className: "bg-blue-100 text-blue-700" },
        in_review: { label: "En Revisión", className: "bg-yellow-100 text-yellow-800" },
        negotiating: { label: "En Gestión", className: "bg-orange-100 text-orange-800" },
        resolved: { label: "Resuelto", className: "bg-green-100 text-green-800" },
        canceled: { label: "Cancelado", className: "bg-red-100 text-red-800" },
        Pending: { label: "Pendiente", className: "bg-blue-100 text-blue-700" },
        PendingPayment: { label: "Falta Medio de Pago", className: "bg-purple-100 text-purple-700" },
        Completed: { label: "Completado", className: "bg-green-100 text-green-800" },
        "In Progress": { label: "En Progreso", className: "bg-blue-100 text-blue-700" },
        Failed: { label: "Fallido", className: "bg-red-100 text-red-800" },
        "Missing Information": { label: "Falta Información", className: "bg-yellow-100 text-yellow-800" },
        verifyPayment: { label: "Verificando Pago", className: "bg-orange-100 text-orange-800" },
        InProgressBilling: { label: "Facturacion en Progreso", className: "bg-blue-100 text-blue-700" },

        // Payments
        paid: { label: "Pagado", className: "bg-green-100 text-green-800" },
        pending: { label: "Pendiente", className: "bg-gray-100 text-gray-700" },
        failed: { label: "Fallido", className: "bg-red-100 text-red-800" },
    };

    const config = badgeMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };

    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", config.className)}>
            {config.label}
        </span>
    );
}
