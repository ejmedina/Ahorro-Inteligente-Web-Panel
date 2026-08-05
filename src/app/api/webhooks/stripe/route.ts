import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/server/stripe';
import { finalizeStripeSetup } from '@/lib/server/finalizeStripeSetup';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET no configurado');
        return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Firma faltante' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        const payload = await req.text();
        event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
        console.error('[webhooks/stripe] Firma inválida:', error);
        return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const checkoutSession = event.data.object as Stripe.Checkout.Session;
            if (checkoutSession.mode === 'setup' && checkoutSession.metadata?.airtableUserId) {
                await finalizeStripeSetup({ checkoutSessionId: checkoutSession.id });
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[webhooks/stripe] Error finalizando Checkout:', error);
        return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 });
    }
}
