import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser } from '@/lib/server/users';
import { buildSetSessionCookieHeader, SessionPayload } from '@/lib/server/session';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, phone } = body as {
            name?: string;
            email?: string;
            password?: string;
            phone?: string;
        };

        // --- Validación básica ---
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json(
                { error: 'El nombre debe tener al menos 2 caracteres.' },
                { status: 400 }
            );
        }
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email requerido.' }, { status: 400 });
        }
        if (!password || typeof password !== 'string' || password.length < 8) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 8 caracteres.' },
                { status: 400 }
            );
        }

        // --- Normalizar email ---
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();
        const trimmedPhone = phone?.trim() || undefined;

        // --- Buscar usuario en Airtable ---
        const existingUser = await findUserByEmail(normalizedEmail);

        let sessionPayload: SessionPayload;

        if (!existingUser) {
            // Caso 1: Usuario nuevo → crear registro
            const passwordHash = await bcrypt.hash(password, 10);
            const created = await createUser({
                fullName: trimmedName,
                email: normalizedEmail,
                phone: trimmedPhone,
                passwordHash,
            });

            sessionPayload = {
                airtableRecordId: created.recordId,
                fullName: created.fullName,
                email: created.email,
                phone: created.phone,
            };
        } else if (!existingUser.passwordHash) {
            // Caso 2: El email ya existe pero la cuenta no tiene contraseña asignada.
            // SEGURIDAD: NO se permite activar automáticamente una cuenta existente
            // desde el formulario de registro. Esto evita que alguien tome control
            // de una cuenta ajena solo con conocer el email.
            //
            // TODO: Implementar un flujo seguro de activación por email
            //       (envío de OTP o magic link) para este caso.
            return NextResponse.json(
                {
                    error:
                        'Ya existe una cuenta con ese email, pero todavía no fue activada. ' +
                        'Por ahora no podés activarla automáticamente desde este formulario.',
                },
                { status: 409 }
            );
        } else {
            // Caso 3: El email ya existe y ya tiene contraseña → no duplicar
            return NextResponse.json(
                { error: 'Ya existe una cuenta con ese email. Iniciá sesión.' },
                { status: 409 }
            );
        }

        // --- Iniciar sesión con cookie httpOnly ---
        const cookieHeader = await buildSetSessionCookieHeader(sessionPayload);
        const response = NextResponse.json(
            {
                user: {
                    airtableRecordId: sessionPayload.airtableRecordId,
                    fullName: sessionPayload.fullName,
                    email: sessionPayload.email,
                    phone: sessionPayload.phone,
                },
            },
            { status: 201 }
        );
        response.headers.set('Set-Cookie', cookieHeader);
        return response;
    } catch (err: unknown) {
        console.error('[auth/register] Error:', err);
        const message = err instanceof Error ? err.message : 'Error interno del servidor.';
        // Si es error de configuración de env, dar mensaje claro
        if (message.includes('Variable de entorno') || message.includes('SESSION_SECRET')) {
            return NextResponse.json(
                { error: 'Configuración de servidor incompleta. Revisá las variables de entorno.' },
                { status: 500 }
            );
        }
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
