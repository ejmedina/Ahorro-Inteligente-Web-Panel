import { NextRequest, NextResponse } from 'next/server';
import { getAirtableConfig, FIELDS, sanitizeAirtableValue } from '@/lib/server/airtableFieldIds';
import { updateUser } from '@/lib/server/users';
import { buildSetSessionCookieHeader } from '@/lib/server/session';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/login?error=Token faltante', request.url));
    }

    try {
        const config = getAirtableConfig();
        const sToken = sanitizeAirtableValue(token);
        const formula = encodeURIComponent(`{${FIELDS.VERIFICATION_TOKEN}}='${sToken}'`);
        const url = `https://api.airtable.com/v0/${config.baseId}/${config.usersTableId}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=1`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error('Error buscando token');

        const data = await res.json();
        const record = data.records?.[0];

        if (!record) {
            return NextResponse.redirect(new URL('/login?error=Token inválido o expirado', request.url));
        }

        // Activar usuario y limpiar token
        await updateUser(record.id, {
            authStatus: 'active',
            verificationToken: null // Lo limpiamos
        });

        // Crear sesión para loguear automáticamente
        const sessionPayload = {
            airtableRecordId: record.id,
            fullName: (record.fields[FIELDS.FULL_NAME] as string) || '',
            email: (record.fields[FIELDS.EMAIL] as string) || '',
            phone: (record.fields[FIELDS.PHONE] as string) || undefined,
        };

        const cookieHeader = await buildSetSessionCookieHeader(sessionPayload);

        // Redirigir al panel (dashboard) con la cookie de sesión y parametro de éxito
        const response = NextResponse.redirect(new URL('/app?verified=true', request.url));
        response.headers.set('Set-Cookie', cookieHeader);
        
        return response;

    } catch (error) {
        console.error('[auth/verify] Error:', error);
        return NextResponse.redirect(new URL('/login?error=Error procesando verificación', request.url));
    }
}
