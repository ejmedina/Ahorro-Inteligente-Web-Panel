import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAirtableConfig, FIELDS, sanitizeAirtableValue } from '@/lib/server/airtableFieldIds';
import { updateUser } from '@/lib/server/users';
import { buildSetSessionCookieHeader } from '@/lib/server/session';

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password || password.length < 8) {
            return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        const config = getAirtableConfig();
        const sToken = sanitizeAirtableValue(token);
        const formula = encodeURIComponent(`{${FIELDS.RECOVERY_TOKEN}}='${sToken}'`);
        const url = `https://api.airtable.com/v0/${config.baseId}/${config.usersTableId}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=1`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` },
            cache: 'no-store'
        });

        const data = await res.json();
        const record = data.records?.[0];

        if (!record) {
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
        }

        const expires = record.fields[FIELDS.RECOVERY_EXPIRES] as string;
        if (new Date(expires) < new Date()) {
            return NextResponse.json({ error: 'El token ha expirado' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await updateUser(record.id, {
            passwordHash,
            recoveryToken: null,
            recoveryExpiresAt: null,
            authStatus: 'active' // Por si no estaba activada, esto la activa
        });

        // Crear sesión para loguear automáticamente
        const sessionPayload = {
            airtableRecordId: record.id,
            fullName: (record.fields[FIELDS.FULL_NAME] as string) || '',
            email: (record.fields[FIELDS.EMAIL] as string) || '',
            phone: (record.fields[FIELDS.PHONE] as string) || undefined,
        };

        const cookieHeader = await buildSetSessionCookieHeader(sessionPayload);

        return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada con éxito.'
        }, {
            headers: { 'Set-Cookie': cookieHeader }
        });

    } catch (error) {
        console.error('[auth/reset-password] Error:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
