import { NextRequest, NextResponse } from 'next/server';
import { updateUser } from '@/lib/server/users';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Falta parámetro id en la URL.' }, { status: 400 });
    }

    try {
        await updateUser(id, { subscriptionStatus: 'Active' });
        console.log(`[profile/verify-whatsapp] Whatsapp activado para recordId: ${id}`);
        // Redirige a la aplicación principal indicando éxito
        return NextResponse.redirect(new URL('/app?wa_verified=true', req.url));
    } catch (error: any) {
        console.error('[profile/verify-whatsapp] Error al validar WhatsApp vía URL:', error.message);
        return NextResponse.redirect(new URL('/app?wa_error=true', req.url));
    }
}
