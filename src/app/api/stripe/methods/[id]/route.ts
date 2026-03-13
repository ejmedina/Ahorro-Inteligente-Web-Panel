import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { deletePaymentMethod, getPaymentMethods } from '@/lib/server/stripe';
import { syncNegotiationsStatus } from '@/lib/server/syncPayloads';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover' as any,
});

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const user = await findUserByEmail(session.email);
        if (!user || !user.stripeCustomerId) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const methodId = params.id;

        // 1. Verificar propiedad del medio de pago (Seguridad: No IDOR)
        const pMethods = await getPaymentMethods(user.stripeCustomerId);
        const exists = pMethods.find(m => m.id === methodId);
        if (!exists) {
            return NextResponse.json({ error: 'Medio de pago no encontrado o no pertenece al usuario' }, { status: 403 });
        }

        // 2. Eliminar en Stripe
        await deletePaymentMethod(methodId);

        // 2. Verificar si quedan métodos para sincronizar estados si es necesario
        const remainingMethods = await getPaymentMethods(user.stripeCustomerId);
        if (remainingMethods.length === 0) {
            await syncNegotiationsStatus(user.recordId, false);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[api/stripe/methods/delete] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const user = await findUserByEmail(session.email);
        if (!user || !user.stripeCustomerId) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const methodId = params.id;

        // 1. Verificar propiedad del medio de pago (Seguridad: No IDOR)
        const pMethods = await getPaymentMethods(user.stripeCustomerId);
        const exists = pMethods.find(m => m.id === methodId);
        if (!exists) {
            return NextResponse.json({ error: 'Medio de pago no encontrado o no pertenece al usuario' }, { status: 403 });
        }

        // 2. Establecer como default en Stripe
        await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: {
                default_payment_method: methodId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[api/stripe/methods/patch] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
