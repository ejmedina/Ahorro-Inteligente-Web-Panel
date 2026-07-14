import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { findUserByEmail } from '@/lib/server/users';
import { getStripe, getPaymentMethods } from '@/lib/server/stripe';
import { getAirtableConfig, NEGOTIATION_FIELDS, sanitizeAirtableValue } from '@/lib/server/airtableFieldIds';
import { syncNegotiationsStatus } from '@/lib/server/syncPayloads';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const body = await req.json();
        const { negotiationId } = body;

        if (!negotiationId) {
            return NextResponse.json({ error: 'Falta negotiationId' }, { status: 400 });
        }

        const user = await findUserByEmail(session.email);
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const config = getAirtableConfig();

        // Validar si el negotiationId pertenece al usuario
        const checkUrl = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}/${negotiationId}?returnFieldsByFieldId=1`;
        const checkRes = await fetch(checkUrl, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });
        if (checkRes.ok) {
            const checkData = await checkRes.json();
            const recordUser = checkData.fields[NEGOTIATION_FIELDS.USER]?.[0];
            if (recordUser !== user.recordId) {
                return NextResponse.json({ error: 'La gestión no pertenece al usuario' }, { status: 403 });
            }
        } else {
            return NextResponse.json({ error: 'Gestión no encontrada' }, { status: 404 });
        }

        const customerId = user.stripeCustomerId;
        if (!customerId) {
            return NextResponse.json({ error: 'Usuario no tiene customer de Stripe' }, { status: 400 });
        }

        // Verificar que realmente tenga métodos de pago
        const methods = await getPaymentMethods(customerId);
        if (methods.length === 0) {
            return NextResponse.json({ error: 'Usuario no tiene métodos de pago guardados' }, { status: 400 });
        }

        // Buscar si ya existe una Suscripción Unpaid para esta gestión
        let subscriptionId;
        const sNegotiationId = sanitizeAirtableValue(negotiationId);
        const searchSubUrl = `https://api.airtable.com/v0/${config.baseId}/${config.subscriptionsTableId}?filterByFormula=${encodeURIComponent(`AND(FIND('${sNegotiationId}', {Negotiations} & ""), {Status}='Unpaid')`)}&maxRecords=1`;
        const searchSubRes = await fetch(searchSubUrl, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });
        
        if (searchSubRes.ok) {
            const searchSubData = await searchSubRes.json();
            if (searchSubData.records && searchSubData.records.length > 0) {
                subscriptionId = searchSubData.records[0].id;
            }
        }

        if (!subscriptionId) {
            // Crear la Suscripción en Airtable
            const subFields: any = {
                "Subscription Plan": "Fee",
                "Status": "Unpaid",
                "Payment Method": "Stripe",
                "Users": [user.recordId],
                "Negotiations": [negotiationId]
            };

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
                console.error('[stripe/link-existing] Airtable Subscription Error:', err);
                throw new Error('Error creando suscripción');
            }
        }

        // Sincronizar estado a Pending
        await syncNegotiationsStatus(user.recordId, true, user.email);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[api/stripe/link-existing] Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
