import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { getNegotiationById } from '@/lib/server/negotiations';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const negotiation = await getNegotiationById(params.id);

        if (!negotiation) {
            return NextResponse.json({ error: 'Gestión no encontrada' }, { status: 404 });
        }

        // Verificamos que la gestión pertenezca al usuario de la sesión (Seguridad: No IDOR)
        if (negotiation.userId !== session.airtableRecordId) {
            return NextResponse.json({ error: 'No autorizado para ver esta gestión' }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            gestion: negotiation
        });
    } catch (error: any) {
        console.error(`[api/gestiones/${params.id}] GET Error:`, error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
