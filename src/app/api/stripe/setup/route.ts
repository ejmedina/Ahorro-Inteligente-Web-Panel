import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { getStripeCustomer, getStripe } from '@/lib/server/stripe';
import { getAirtableConfig, NEGOTIATION_FIELDS, sanitizeAirtableValue } from '@/lib/server/airtableFieldIds';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const body = await req.json();
        let { negotiationId } = body;

        const user = await findUserByEmail(session.email);
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        const config = getAirtableConfig();

        // Validar si el negotiationId proporcionado pertenece al usuario (Seguridad: No IDOR)
        if (negotiationId) {
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
        } else {
            // Si no viene negotiationId, intentamos buscar una que esté Pendiente de Pago
            console.log(`[stripe/setup] No negotiationId provided for user ${user.recordId}. Searching...`);
            const sUserId = sanitizeAirtableValue(user.recordId);
            const url = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}?filterByFormula=${encodeURIComponent(`AND(FIND('${sUserId}', {${NEGOTIATION_FIELDS.USER}} & ""), {${NEGOTIATION_FIELDS.STATUS}}='PendingPayment')`)}&maxRecords=1&returnFieldsByFieldId=1`;
            const searchRes = await fetch(url, {
                headers: { 'Authorization': `Bearer ${config.apiKey}` }
            });
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.records && searchData.records.length > 0) {
                    negotiationId = searchData.records[0].id;
                }
            }
        }

        let customerId = user.stripeCustomerId;
        const userEmail = user.email?.toLowerCase();
        
        if (!userEmail) {
            console.error('[stripe/setup] User record is missing email:', user.recordId);
            return NextResponse.json({ error: 'Tu perfil de usuario está incompleto (falta email). Contactá a soporte.' }, { status: 400 });
        }
        
        // Verificación de integridad: Si tiene customerId, validamos en Stripe que el email coincida para evitar fugas.
        if (customerId) {
            try {
                const stripe = getStripe();
                const customer = await stripe.customers.retrieve(customerId) as any;
                if (!customer || customer.deleted || customer.email?.toLowerCase() !== userEmail) {
                    console.warn(`[stripe/setup] Customer ID mismatch or deleted for user ${user.recordId}. Expected ${userEmail}, found ${customer?.email}. Resetting...`);
                    customerId = undefined; // Forzar regeneración
                }
            } catch (e) {
                console.error(`[stripe/setup] Error retrieving customer ${customerId} for ${userEmail}:`, e);
                customerId = undefined;
            }
        }

        if (!customerId) {
            console.log(`[stripe/setup] Creating/Finding Stripe customer for user ${userEmail}...`);
            const customer = await getStripeCustomer(userEmail, user.fullName || 'Usuario');
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

        // 2. Crear Checkout Session de Stripe directamente
        console.log(`[stripe/setup] Creating Stripe setup session for subscription ${subscriptionId}...`);
        
        const stripe = getStripe();
        
        let successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app/medios-de-pago?success=true&session_id={CHECKOUT_SESSION_ID}`;
        let cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app/medios-de-pago?canceled=true`;
        
        const { returnUrl } = body;
        if (returnUrl) {
            const separator = returnUrl.includes('?') ? '&' : '?';
            successUrl = `${returnUrl}${separator}success=true&session_id={CHECKOUT_SESSION_ID}`;
            cancelUrl = `${returnUrl}${separator}canceled=true`;
        }

        // TODO: Evaluar si a futuro es conveniente prevenir que el usuario cargue duplicados.
        // Actualmente Stripe 'setup' mode permite cargar la misma tarjeta varias veces 
        // y genera nuevos PaymentMethod IDs para cada una.
        const sessionStripe = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'setup',
            success_url: successUrl,
            cancel_url: cancelUrl,
            locale: 'es',
            customer: customerId,
            client_reference_id: subscriptionId,
            metadata: {
                airtableSubscriptionId: subscriptionId,
                airtableUserId: user.recordId
            }
        });

        if (!sessionStripe.url) {
            throw new Error('Stripe no devolvió una URL válida para el Checkout.');
        }

        return NextResponse.json({ success: true, url: sessionStripe.url });

    } catch (error: any) {
        console.error('[api/stripe/setup] Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
