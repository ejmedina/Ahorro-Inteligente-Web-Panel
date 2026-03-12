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

        const gestiones = await getUserNegotiations(session.airtableRecordId, session.email);

        return NextResponse.json({
            success: true,
            gestiones
        });
    } catch (error: any) {
        console.error('[api/gestiones] GET Error:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
