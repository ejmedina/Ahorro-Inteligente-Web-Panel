import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { getStripeCustomer, getPaymentMethods, getPaymentHistory } from '@/lib/server/stripe';
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

        // Si no tiene Customer ID, lo buscamos/creamos en Stripe y actualizamos Airtable
        if (!customerId) {
            const customer = await getStripeCustomer(user.email, user.fullName);
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
        // Si no encontramos métodos en el customer actual, buscamos si hay otro con el mismo email
        // que sí los tenga (común si se crearon varios clientes por error).
        if (paymentMethods.length === 0) {
            const betterCustomer = await getStripeCustomer(user.email, user.fullName);
            if (betterCustomer.id !== customerId) {
                console.log(`[api/stripe/data] Corrigiendo customer ID de ${customerId} a ${betterCustomer.id} para ${user.email}`);
                customerId = betterCustomer.id;
                await updateUser(user.recordId, { stripeCustomerId: customerId });
                
                // Recargamos datos con el customer correcto
                const [newMethods, newPayments] = await Promise.all([
                    getPaymentMethods(customerId),
                    getPaymentHistory(customerId)
                ]);
                paymentMethods = newMethods;
                payments = newPayments;
            }
        }

        const config = getAirtableConfig();

        // ---- SINCRONIZACIÓN AUTOMÁTICA ----
        // Sincronizamos estados según si tiene o no tarjetas (Upgrade o Downgrade)
        const hasMethods = paymentMethods.length > 0;
        const { syncNegotiationsStatus } = require('@/lib/server/syncPayloads');
        await syncNegotiationsStatus(user.recordId, hasMethods);

        // Obtenemos el medio de pago default si existe para marcarlo
        const defaultPmId = await (async () => {
            const Stripe = require('stripe');
            const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string);
            const customer = await stripeInstance.customers.retrieve(customerId);
            return (customer as any).invoice_settings?.default_payment_method;
        })();

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
