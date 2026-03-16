import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/server/session';
import { findUserByEmail } from '@/lib/server/users';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
        }

        const dbUser = await findUserByEmail(session.email);

        if (!dbUser) {
            return NextResponse.json({ error: 'Usuario no encontrado en bd.' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                airtableRecordId: session.airtableRecordId,
                fullName: dbUser.fullName,
                email: dbUser.email,
                phone: dbUser.phone,
                subscriptionStatus: dbUser.subscriptionStatus,
            },
        });
    } catch (err: unknown) {
        console.error('[auth/me] Error:', err);
        return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }
}
