import { NextRequest, NextResponse } from 'next/server';
import { findUserByPhone, updateUser } from '@/lib/server/users';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Log para depuración cuando se conecten por primera vez
        console.log('[Webhook SendPulse]', JSON.stringify(body, null, 2));

        // SendPulse suele enviar un array de eventos o un solo evento
        const events = Array.isArray(body) ? body : [body];

        for (const event of events) {
            // Evaluamos si es un mensaje entrante (puede depender del tipo exacto de webhook que configuren en SP)
            const isMessage = event?.type === 'message' || event?.message;
            const phone = event?.contact?.phone || event?.phone;
            const text = event?.message?.text || event?.text || '';

            if (isMessage && phone) {
                const normalizedText = text.trim().toLowerCase();
                
                // Si el mensaje tiene intención de activar ("si", "sí", "activar", etc.)
                if (['si', 'sí', 'activar', 'aceptar', 'ok', 'yes'].includes(normalizedText)) {
                    const user = await findUserByPhone(phone);
                    
                    if (user && user.subscriptionStatus === 'Pending') {
                        // Cambiamos el estado de pending a active
                        await updateUser(user.recordId, {
                            subscriptionStatus: 'Active'
                        });
                        console.log(`[Webhook SendPulse] Usuario ${user.email} (Tel: ${phone}) validó su WA. Estado cambiado a Active.`);
                    } else if (user && user.subscriptionStatus === 'Active') {
                        console.log(`[Webhook SendPulse] Usuario ${user.email} ya estaba Active.`);
                    } else if (user) {
                        console.log(`[Webhook SendPulse] WA activado para ${user.email} que estaba en ${user.subscriptionStatus}.`);
                        await updateUser(user.recordId, { subscriptionStatus: 'Active' });
                    } else {
                        console.log(`[Webhook SendPulse] Teléfono ${phone} no encontrado en Airtable.`);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, received: true });
    } catch (error) {
        console.error('[Webhook SendPulse] Error procesando evento', error);
        return NextResponse.json({ error: 'Error procesando webhook' }, { status: 500 });
    }
}
