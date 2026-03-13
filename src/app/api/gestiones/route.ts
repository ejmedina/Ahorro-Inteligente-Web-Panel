import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { createNegotiationWithInvoice, getUserNegotiations } from '@/lib/server/negotiations';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const notes = formData.get('notes') as string;

        if (!file) {
            return NextResponse.json({ error: 'Archivo de factura requerido' }, { status: 400 });
        }

        // Llamar a la lógica de Airtable
        const result = await createNegotiationWithInvoice(
            session.airtableRecordId,
            file,
            notes
        );

        return NextResponse.json({
            success: true,
            gestion: result
        });
    } catch (error: any) {
        console.error('[api/gestiones] POST Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const userId = session.airtableRecordId;
        
        // 1. Obtener el customerId de Airtable para validar en Stripe
        const config = require('@/lib/server/airtableFieldIds').getAirtableConfig();
        const FIELDS = require('@/lib/server/airtableFieldIds').FIELDS;
        const userRes = await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.usersTableId}/${userId}`, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });
        
        if (userRes.ok) {
            const userData = await userRes.json();
            const customerId = userData.fields[FIELDS.STRIPE_CUSTOMER_ID];
            
            if (customerId) {
                const { getPaymentMethods } = require('@/lib/server/stripe');
                const { syncNegotiationsStatus } = require('@/lib/server/syncPayloads');
                const methods = await getPaymentMethods(customerId);
                await syncNegotiationsStatus(userId, methods.length > 0);
            }
        }

        const gestiones = await getUserNegotiations(userId, session.email);

        return NextResponse.json({
            success: true,
            gestiones
        });
    } catch (error: any) {
        console.error('[api/gestiones] GET Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
