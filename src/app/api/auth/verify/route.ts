import { NextRequest, NextResponse } from 'next/server';
import { getAirtableConfig, FIELDS, sanitizeAirtableValue } from '@/lib/server/airtableFieldIds';
import { updateUser } from '@/lib/server/users';

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

        return NextResponse.redirect(new URL('/login?message=Cuenta activada con éxito. Ya podés iniciar sesión.', request.url));

    } catch (error) {
        console.error('[auth/verify] Error:', error);
        return NextResponse.redirect(new URL('/login?error=Error procesando verificación', request.url));
    }
}
