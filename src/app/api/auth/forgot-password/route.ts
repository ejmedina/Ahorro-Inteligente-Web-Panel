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
            if (user.authStatus === 'pending') {
                return NextResponse.json(
                    { error: 'Tu cuenta no está verificada. Por favor revisá tu correo de activación original, o ingresá al inicio de sesión para reenviarlo.' },
                    { status: 403 }
                );
            }

            const recoveryToken = crypto.randomBytes(32).toString('hex');
            const expires = new Date();
            expires.setHours(expires.getHours() + 1); // 1 hora de validez

            await updateUser(user.recordId, {
                recoveryToken,
                recoveryExpiresAt: expires.toISOString()
            });

            await sendRecoveryEmail(user.email, recoveryToken, user.fullName);
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
