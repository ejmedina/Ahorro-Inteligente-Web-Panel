import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, updateUser } from '@/lib/server/users';
import { buildSetSessionCookieHeader, SessionPayload } from '@/lib/server/session';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body as { email?: string; password?: string };

        // --- Validación básica ---
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email requerido.' }, { status: 400 });
        }
        if (!password || typeof password !== 'string') {
            return NextResponse.json({ error: 'Contraseña requerida.' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // --- Buscar usuario ---
        const user = await findUserByEmail(normalizedEmail);

        if (!user) {
            // No revelar si el email existe o no (anti-enumeración)
            return NextResponse.json(
                { error: 'Credenciales inválidas.' },
                { status: 401 }
            );
        }

        if (!user.passwordHash) {
            return NextResponse.json(
                {
                    error:
                        'Tu cuenta no tiene contraseña configurada. ' +
                        'Usá el formulario de Registro para activarla.',
                },
                { status: 400 }
            );
        }

        // --- Verificar contraseña ---
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return NextResponse.json(
                { error: 'Credenciales inválidas.' },
                { status: 401 }
            );
        }

        // --- Actualizar lastLoginAt y updatedAt ---
        const now = new Date().toISOString();
        await updateUser(user.recordId, { lastLoginAt: now });

        // --- Iniciar sesión ---
        const sessionPayload: SessionPayload = {
            airtableRecordId: user.recordId,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
        };

        const cookieHeader = await buildSetSessionCookieHeader(sessionPayload);
        const response = NextResponse.json(
            {
                user: {
                    airtableRecordId: user.recordId,
                    fullName: user.fullName,
                    email: user.email,
                    phone: user.phone,
                },
            },
            { status: 200 }
        );
        response.headers.set('Set-Cookie', cookieHeader);
        return response;
    } catch (err: unknown) {
        console.error('[auth/login] Error:', err);
        const message = err instanceof Error ? err.message : '';
        if (message.includes('Variable de entorno') || message.includes('SESSION_SECRET')) {
            return NextResponse.json(
                { error: 'Configuración de servidor incompleta. Revisá las variables de entorno.' },
                { status: 500 }
            );
        }
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
