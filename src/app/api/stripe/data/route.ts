import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { getStripeCustomer, getPaymentMethods, getPaymentHistory } from '@/lib/server/stripe';

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

        const [paymentMethods, payments] = await Promise.all([
            getPaymentMethods(customerId),
            getPaymentHistory(customerId)
        ]);

        return NextResponse.json({
            success: true,
            methods: paymentMethods.map(pm => ({
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4,
                expMonth: pm.card?.exp_month,
                expYear: pm.card?.exp_year,
                isDefault: pm.id === (user as any).defaultPaymentMethodId // Opcional si lo manejamos luego
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
