import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { getStripeCustomer } from '@/lib/server/stripe';
import { getAirtableConfig, NEGOTIATION_FIELDS } from '@/lib/server/airtableFieldIds';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const body = await req.json();
        let { negotiationId } = body;

        const user = await findUserByEmail(session.email);
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const config = getAirtableConfig();

        // Si no viene negotiationId, intentamos buscar una que esté Pendiente de Pago
        if (!negotiationId) {
            console.log(`[stripe/setup] No negotiationId provided for user ${user.recordId}. Searching for PendingPayment gestiones...`);
            const url = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}?filterByFormula=${encodeURIComponent(`AND({${NEGOTIATION_FIELDS.USER}}='${user.recordId}', {${NEGOTIATION_FIELDS.STATUS}}='PendingPayment')`)}&maxRecords=1`;
            const searchRes = await fetch(url, {
                headers: { 'Authorization': `Bearer ${config.apiKey}` }
            });
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.records && searchData.records.length > 0) {
                    negotiationId = searchData.records[0].id;
                    console.log(`[stripe/setup] Found pending negotiation: ${negotiationId}`);
                }
            }
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await getStripeCustomer(user.email, user.fullName);
            customerId = customer.id;
            await updateUser(user.recordId, { stripeCustomerId: customerId });
        }

        // 1. Crear la Suscripción en Airtable como requisito
        const subFields: any = {
            "Subscription Plan": "Fee",
            "Status": "Unpaid",
            "Payment Method": "Stripe",
            "Users": [user.recordId]
        };

        if (negotiationId) {
            subFields["Negotiations"] = [negotiationId];
        }

        console.log('[stripe/setup] Creating subscription record in Airtable...');
        const subRes = await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.subscriptionsTableId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: subFields })
        });

        if (!subRes.ok) {
            const err = await subRes.json();
            console.error('[stripe/setup] Airtable Subscription Error:', err);
            throw new Error(`Error creando suscripción: ${JSON.stringify(err)}`);
        }

        const newSub = await subRes.json();
        const subscriptionId = newSub.id;

        // 2. Pegarle a la API de Ahorro Inteligente para obtener la URL de Setup
        console.log(`[stripe/setup] Fetching setup URL for subscription ${subscriptionId}...`);
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
            console.error('[stripe/setup] External API Setup Error:', err);
            throw new Error(`Error en API de setups: ${err}`);
        }

        const setupData = await setupRes.json();
        const url = setupData.shortUrl || setupData.url;

        if (!url) {
            console.error('[stripe/setup] No URL returned from setup API', setupData);
            throw new Error('No se recibió una URL válida de la API de pagos.');
        }

        return NextResponse.json({ success: true, url });

    } catch (error: any) {
        console.error('[api/stripe/setup] Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
