import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/server/session';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { getStripeCustomer, getPaymentMethods, getPaymentHistory, getStripe } from '@/lib/server/stripe';
import { getAirtableConfig, NEGOTIATION_FIELDS } from '@/lib/server/airtableFieldIds';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const user = await findUserByEmail(session.email);
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        let customerId = user.stripeCustomerId;
        const normalizedUserEmail = user.email?.toLowerCase();
        
        if (!normalizedUserEmail) {
            console.error('[stripe/data] User record is missing email:', user.recordId);
            return NextResponse.json({ error: 'Email de usuario no encontrado.' }, { status: 400 });
        }

        const stripeInstance = getStripe();
        
        // VALIDACIÓN DE SEGURIDAD: Verificar que el Customer ID pertenezca al email del usuario
        if (customerId) {
            try {
                const customer = await stripeInstance.customers.retrieve(customerId) as any;
                if (customer.deleted || customer.email?.toLowerCase() !== normalizedUserEmail) {
                    console.warn(`[api/stripe/data] Customer ID ${customerId} mismatch for ${normalizedUserEmail}. Finding correct one.`);
                    customerId = undefined;
                }
            } catch (e) {
                console.error(`[api/stripe/data] Error validating customer ${customerId}:`, e);
                customerId = undefined;
            }
        }

        // Si no tiene Customer ID válido, lo buscamos/creamos en Stripe y actualizamos Airtable
        if (!customerId) {
            const customer = await getStripeCustomer(normalizedUserEmail, user.fullName || 'Usuario');
            customerId = customer.id;
            await updateUser(user.recordId, { stripeCustomerId: customerId });
        }


        const [initialMethods, initialPayments] = await Promise.all([
            getPaymentMethods(customerId),
            getPaymentHistory(customerId)
        ]);

        let paymentMethods = initialMethods;
        let payments = initialPayments;

        // ---- AUTOCORRECCIÓN DE DUPLICADOS ----
        if (paymentMethods.length === 0) {
            const betterCustomer = await getStripeCustomer(user.email, user.fullName);
            if (betterCustomer.id !== customerId) {
                console.log(`[api/stripe/data] Corrigiendo customer ID de ${customerId} a ${betterCustomer.id}`);
                customerId = betterCustomer.id;
                await updateUser(user.recordId, { stripeCustomerId: customerId });
                
                const [newMethods, newPayments] = await Promise.all([
                    getPaymentMethods(customerId),
                    getPaymentHistory(customerId)
                ]);
                paymentMethods = newMethods;
                payments = newPayments;
            }
        }

        // ---- SINCRONIZACIÓN AUTOMÁTICA ----
        const hasMethods = paymentMethods.length > 0;
        const { syncNegotiationsStatus } = require('@/lib/server/syncPayloads');
        await syncNegotiationsStatus(user.recordId, hasMethods, user.email);

        // ---- MANEJO DE MEDIO POR DEFECTO ----
        const customer = await stripeInstance.customers.retrieve(customerId);

        let defaultPmId = (customer as any).invoice_settings?.default_payment_method;

        return NextResponse.json({
            success: true,
            hasMethods: hasMethods,
            methods: paymentMethods.map(pm => ({
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4,
                expMonth: pm.card?.exp_month,
                expYear: pm.card?.exp_year,
                isDefault: pm.id === defaultPmId || (paymentMethods.length === 1)
            })),
            payments: payments.map(p => ({
                id: p.id,
                amount: p.amount / 100,
                currency: p.currency,
                status: p.status,
                createdAt: new Date(p.created * 1000).toISOString(),
                description: p.description
            }))
        });

    } catch (error: any) {
        console.error('[api/stripe/data] Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
