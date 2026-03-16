import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { sendpulseService } from '@/lib/server/sendpulse';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
        }

        const body = await req.json();
        const { whatsappOptIn, phone } = body as {
            whatsappOptIn?: boolean;
            phone?: string;
        };

        const dbUser = await findUserByEmail(session.email);
        if (!dbUser) {
            return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
        }

        let newStatus = 'Inactive';
        let trimmedPhone = phone?.trim();

        if (whatsappOptIn) {
            if (!trimmedPhone || trimmedPhone.length < 5) {
                return NextResponse.json({ error: 'Teléfono requerido para WhatsApp.' }, { status: 400 });
            }
            // Si elige WA, pasamos a Pending para que valide respondiendo
            newStatus = 'Pending';
        }

        await updateUser(dbUser.recordId, {
            subscriptionStatus: newStatus,
            phone: trimmedPhone || undefined
        });

        // Si el usuario optó por WhatsApp y el estado cambió a Pending, le enviamos el template
        if (whatsappOptIn && trimmedPhone) {
            // Solo logueamos el error si falla el envío para no romper la experiencia
            sendpulseService.sendWhatsAppTemplate(trimmedPhone).catch(e => {
                console.error('[profile/preferences] Error enviando template de WA:', e);
            });
        }

        return NextResponse.json({ success: true, subscriptionStatus: newStatus });
    } catch (error) {
        console.error('[profile/preferences] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
