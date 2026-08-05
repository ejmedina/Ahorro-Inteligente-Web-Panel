import Stripe from 'stripe';
import { getStripe } from './stripe';
import { findUserById } from './users';
import { getAirtableConfig, NEGOTIATION_FIELDS } from './airtableFieldIds';
import { syncNegotiationsStatus } from './syncPayloads';

interface FinalizeStripeSetupOptions {
    checkoutSessionId: string;
    expectedUserId?: string;
    expectedNegotiationId?: string;
}

export interface FinalizeStripeSetupResult {
    negotiationId?: string;
    paymentMethodId: string;
    status: 'Pending';
}

function stripeId(value: string | { id: string } | null): string | null {
    if (!value) return null;
    return typeof value === 'string' ? value : value.id;
}

export async function finalizeStripeSetup({
    checkoutSessionId,
    expectedUserId,
    expectedNegotiationId,
}: FinalizeStripeSetupOptions): Promise<FinalizeStripeSetupResult> {
    if (!checkoutSessionId.startsWith('cs_')) {
        throw new Error('Checkout Session inválida');
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
        expand: ['setup_intent'],
    });

    if (checkoutSession.mode !== 'setup' || checkoutSession.status !== 'complete') {
        throw new Error('La configuración del medio de pago no está completa');
    }

    const userId = checkoutSession.metadata?.airtableUserId;
    if (!userId || (expectedUserId && userId !== expectedUserId)) {
        throw new Error('La sesión de Stripe no pertenece al usuario autenticado');
    }

    const user = await findUserById(userId);
    if (!user?.stripeCustomerId) {
        throw new Error('No se encontró el cliente de Stripe asociado');
    }

    const checkoutCustomerId = stripeId(checkoutSession.customer as string | Stripe.Customer | Stripe.DeletedCustomer | null);
    if (checkoutCustomerId !== user.stripeCustomerId) {
        throw new Error('El cliente de Stripe no coincide con el usuario');
    }

    let setupIntent = checkoutSession.setup_intent;
    if (!setupIntent) {
        throw new Error('Stripe no devolvió el SetupIntent');
    }
    if (typeof setupIntent === 'string') {
        setupIntent = await stripe.setupIntents.retrieve(setupIntent);
    }
    if (setupIntent.status !== 'succeeded') {
        throw new Error('El medio de pago todavía no fue confirmado');
    }

    const paymentMethodId = stripeId(setupIntent.payment_method as string | Stripe.PaymentMethod | null);
    if (!paymentMethodId) {
        throw new Error('Stripe no devolvió el medio de pago confirmado');
    }

    const negotiationId = checkoutSession.metadata?.airtableNegotiationId || undefined;
    if (expectedNegotiationId && negotiationId !== expectedNegotiationId) {
        throw new Error('La sesión de Stripe no pertenece a esta gestión');
    }

    let negotiationUrl: string | undefined;
    let negotiationStatus: string | undefined;
    if (negotiationId) {
        const config = getAirtableConfig();
        negotiationUrl = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}/${encodeURIComponent(negotiationId)}?returnFieldsByFieldId=1`;
        const negotiationResponse = await fetch(negotiationUrl, {
            headers: { Authorization: `Bearer ${config.apiKey}` },
            cache: 'no-store',
        });

        if (!negotiationResponse.ok) {
            throw new Error('No se encontró la gestión asociada al medio de pago');
        }

        const negotiation = await negotiationResponse.json();
        const negotiationUserId = negotiation.fields?.[NEGOTIATION_FIELDS.USER]?.[0];
        if (negotiationUserId !== userId) {
            throw new Error('La gestión no pertenece al usuario');
        }

        negotiationStatus = negotiation.fields?.[NEGOTIATION_FIELDS.STATUS];
    }

    await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
    });

    if (negotiationUrl && negotiationStatus === 'PendingPayment') {
        const config = getAirtableConfig();
        const updateResponse = await fetch(negotiationUrl, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: { [NEGOTIATION_FIELDS.STATUS]: 'Pending' },
            }),
        });

        if (!updateResponse.ok) {
            throw new Error('No se pudo actualizar el estado de la gestión');
        }
    }

    // Un medio válido habilita también cualquier otra gestión pendiente del usuario.
    await syncNegotiationsStatus(userId, true, user.email);

    return {
        negotiationId,
        paymentMethodId,
        status: 'Pending',
    };
}
