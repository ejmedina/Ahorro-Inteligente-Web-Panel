import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { sendVerificationEmail } from '@/lib/server/email';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email requerido.' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await findUserByEmail(normalizedEmail);

        if (user && user.authStatus === 'pending') {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            
            await updateUser(user.recordId, {
                verificationToken,
            });

            await sendVerificationEmail(normalizedEmail, verificationToken, user.fullName);
        }

        // Siempre devolvemos 200 OK para no permitir enumeración de correos
        return NextResponse.json({
            success: true,
            message: 'Si tu cuenta está pendiente, acabamos de enviarte un nuevo correo electrónico de confirmación.'
        });

    } catch (err: unknown) {
        console.error('[auth/resend-verification] Error:', err);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
