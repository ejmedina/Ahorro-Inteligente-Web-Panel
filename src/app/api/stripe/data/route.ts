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

        const [paymentMethods, payments] = await Promise.all([
            getPaymentMethods(customerId),
            getPaymentHistory(customerId)
        ]);

        const config = getAirtableConfig();

        // ---- SINCRONIZACIÓN LAZY ----
        // Si el usuario ya tiene medios de pago, todas sus gestiones "PendingPayment"
        // deben pasar a "Pending" para indicar que ya podemos procesarlas.
        if (paymentMethods.length > 0) {
            try {
                const searchUrl = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}?filterByFormula=${encodeURIComponent(`AND({${NEGOTIATION_FIELDS.USER}}='${user.recordId}', {${NEGOTIATION_FIELDS.STATUS}}='PendingPayment')`)}`;
                const searchRes = await fetch(searchUrl, {
                    headers: { 'Authorization': `Bearer ${config.apiKey}` }
                });
                
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    const pendingRecords = searchData.records || [];
                    
                    if (pendingRecords.length > 0) {
                        console.log(`[api/stripe/data] Sincronizando ${pendingRecords.length} gestiones de PendingPayment a Pending para el usuario ${user.recordId}`);
                        
                        // Actualizamos en lote (Airtable permite hasta 10 por cada PATCH)
                        // Para simplificar ahora lo hacemos una por una o un pequeño loop
                        for (const rec of pendingRecords) {
                            await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}/${rec.id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${config.apiKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    fields: { [NEGOTIATION_FIELDS.STATUS]: 'Pending' }
                                })
                            });
                        }
                    }
                }
            } catch (syncErr) {
                console.error('[api/stripe/data] Error en la sincronización de estados:', syncErr);
                // No bloqueamos la respuesta principal si falla la sincronización
            }
        }

        return NextResponse.json({
            success: true,
            hasMethods: paymentMethods.length > 0,
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
