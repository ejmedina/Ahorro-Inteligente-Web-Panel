import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { findUserByEmail, createUser, updateUser } from '@/lib/server/users';
import { sendVerificationEmail } from '@/lib/server/email';
import { sendpulseService } from '@/lib/server/sendpulse';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, phone, whatsappOptIn } = body as {
            name?: string;
            email?: string;
            password?: string;
            phone?: string;
            whatsappOptIn?: boolean;
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

        // --- Preferencias de WA ---
        const subscriptionStatus = whatsappOptIn ? 'Pending' : 'Inactive';

        // --- Buscar usuario en Airtable ---
        const existingUser = await findUserByEmail(normalizedEmail);

        if (!existingUser) {
            // Caso 1: Usuario nuevo → crear registro en estado 'pending'
            const passwordHash = await bcrypt.hash(password, 10);
            const verificationToken = crypto.randomBytes(32).toString('hex');
            
            const created = await createUser({
                fullName: trimmedName,
                email: normalizedEmail,
                phone: trimmedPhone,
                passwordHash,
                verificationToken,
                subscriptionStatus,
            });

            // Enviar email de verificación
            await sendVerificationEmail(normalizedEmail, verificationToken, trimmedName);

            // Enviar WA de verificación si hizo optin
            if (whatsappOptIn && trimmedPhone) {
                // No bloqueamos el response de registro
                sendpulseService.sendWhatsAppTemplate(trimmedPhone).catch(e => console.error('Error enviando WA inicial:', e));
            }

            return NextResponse.json(
                { 
                    success: true, 
                    message: 'Registro exitoso. Por favor verifica tu email para activar tu cuenta.' 
                }, 
                { status: 201 }
            );
        } else if (!existingUser.passwordHash) {
            // Caso 2: El email ya existe pero no tiene contraseña (cuenta no activada)
            // Generar nuevo token y enviar mail
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const passwordHash = await bcrypt.hash(password, 10);
            
            await updateUser(existingUser.recordId, { 
                passwordHash,
                verificationToken,
                fullName: trimmedName,
                phone: trimmedPhone,
                subscriptionStatus,
            });

            await sendVerificationEmail(normalizedEmail, verificationToken, trimmedName);

            // Enviar WA de verificación si hizo optin
            if (whatsappOptIn && trimmedPhone) {
                sendpulseService.sendWhatsAppTemplate(trimmedPhone).catch(e => console.error('Error enviando WA:', e));
            }

            return NextResponse.json(
                { 
                    success: true, 
                    message: 'Se ha enviado un correo de verificación para activar tu cuenta existente.' 
                }, 
                { status: 201 }
            );
        } else {
            // Caso 3: El email ya existe y ya tiene contraseña
            return NextResponse.json(
                { error: 'Ya existe una cuenta con ese email. Iniciá sesión.' },
                { status: 409 }
            );
        }
    } catch (err: unknown) {
        console.error('[auth/register] Error:', err);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
