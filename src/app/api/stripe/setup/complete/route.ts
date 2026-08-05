import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { finalizeStripeSetup } from '@/lib/server/finalizeStripeSetup';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { checkoutSessionId, negotiationId } = await req.json();
        if (!checkoutSessionId || typeof checkoutSessionId !== 'string') {
            return NextResponse.json({ error: 'Falta checkoutSessionId' }, { status: 400 });
        }

        const result = await finalizeStripeSetup({
            checkoutSessionId,
            expectedUserId: session.airtableRecordId,
            expectedNegotiationId: typeof negotiationId === 'string' ? negotiationId : undefined,
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error interno';
        console.error('[api/stripe/setup/complete] Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
