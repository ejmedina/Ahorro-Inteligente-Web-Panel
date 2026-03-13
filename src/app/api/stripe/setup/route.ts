import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { getStripeCustomer } from '@/lib/server/stripe';
import { getAirtableConfig } from '@/lib/server/airtableFieldIds';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const body = await req.json();
        const { negotiationId } = body;

        if (!negotiationId) return NextResponse.json({ error: 'Negotiation ID requerido' }, { status: 400 });

        const user = await findUserByEmail(session.email);
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await getStripeCustomer(user.email, user.fullName);
            customerId = customer.id;
            await updateUser(user.recordId, { stripeCustomerId: customerId });
        }

        const config = getAirtableConfig();

        // 1. Crear la Suscripción en Airtable como requisito
        const subRes = await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.subscriptionsTableId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    "Subscription Plan": "Fee",
                    "Status": "Unpaid",
                    "Payment Method": "Stripe",
                    "Negotiations": [negotiationId],
                    "Users": [user.recordId]
                }
            })
        });

        if (!subRes.ok) {
            const err = await subRes.json();
            throw new Error(`Error creando suscripción: ${JSON.stringify(err)}`);
        }

        const newSub = await subRes.json();
        const subscriptionId = newSub.id;

        // 2. Pegarle a la API de Ahorro Inteligente para obtener la URL de Setup
        const setupRes = await fetch('https://ahorrointeligente.com.ar/api/v1/stripe/setups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscriptionId: subscriptionId,
                userId: user.recordId
            })
        });

        if (!setupRes.ok) {
            const err = await setupRes.text();
            throw new Error(`Error en API de setups: ${err}`);
        }

        const setupData = await setupRes.json();
        const url = setupData.shortUrl || setupData.url;

        return NextResponse.json({ success: true, url });

    } catch (error: any) {
        console.error('[api/stripe/setup] Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
