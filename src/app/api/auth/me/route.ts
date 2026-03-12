import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                airtableRecordId: session.airtableRecordId,
                fullName: session.fullName,
                email: session.email,
                phone: session.phone,
            },
        });
    } catch (err: unknown) {
        console.error('[auth/me] Error:', err);
        return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }
}
