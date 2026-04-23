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

        // --- Protección Antispam (5 minutos) ---
        // Validamos solo si el usuario ya tiene una fecha de actualización (ya intentó antes)
        if (dbUser.updatedAt) {
            const lastUpdate = new Date(dbUser.updatedAt).getTime();
            const now = Date.now();
            const diffMinutes = (now - lastUpdate) / (1000 * 60);

            if (diffMinutes < 5) {
                const remaining = Math.ceil(5 - diffMinutes);
                console.log(`[profile/preferences] Antispam activado para ${session.email}. Restan ${remaining} min.`);
                return NextResponse.json({ 
                    error: `Por seguridad, debés esperar ${remaining} minuto${remaining > 1 ? 's' : ''} antes de solicitar otro mensaje.` 
                }, { status: 429 });
            }
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

        // Actualizamos el usuario en Airtable (esto también refresca updatedAt)
        await updateUser(dbUser.recordId, {
            subscriptionStatus: newStatus,
            phone: trimmedPhone || undefined
        });

        // Si el usuario optó por WhatsApp y el estado cambió a Pending, le enviamos el template
        if (whatsappOptIn && trimmedPhone) {
            // Normalizar teléfono eliminando caracteres no numéricos para la API
            const apiPhone = trimmedPhone.replace(/[^0-9]/g, '');
            const firstName = (dbUser.fullName || 'Usuario').trim().split(' ')[0] || 'Usuario';
            
            console.log(`[profile/preferences] Intentando envío WA: Phone=${apiPhone}, Name=${firstName}, Template=activar_notificaciones_1`);
            
            try {
                await sendpulseService.sendWhatsAppTemplate(apiPhone, 'activar_notificaciones_1', 'es', [firstName], dbUser.recordId);
                console.log(`[profile/preferences] Envío exitoso a SendPulse para ${apiPhone}`);
            } catch (e: any) {
                // Logueamos el error detallado incluyendo la respuesta de la API si está disponible
                console.error('[profile/preferences] Error crítico en SendPulse:', e.message);
                // No devolvemos error 500 porque el registro en Airtable fue exitoso
            }
        }

        return NextResponse.json({ 
            success: true, 
            subscriptionStatus: newStatus,
            updatedAt: new Date().toISOString() // Devolvemos la nueva fecha para el timer del front
        });
    } catch (error) {
        console.error('[profile/preferences] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
