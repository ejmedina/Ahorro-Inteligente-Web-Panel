import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { sendRecoveryEmail } from '@/lib/server/email';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

        const user = await findUserByEmail(email);

        if (user) {
            const recoveryToken = crypto.randomBytes(32).toString('hex');
            const expires = new Date();
            expires.setHours(expires.getHours() + 1); // 1 hora de validez

            await updateUser(user.recordId, {
                recoveryToken,
                recoveryExpiresAt: expires.toISOString()
            });

            await sendRecoveryEmail(user.email, recoveryToken);
        }

        // Siempre devolvemos éxito para no revelar emails registrados
        return NextResponse.json({
            success: true,
            message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.'
        });

    } catch (error) {
        console.error('[auth/forgot-password] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
