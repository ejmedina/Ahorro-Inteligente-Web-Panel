import { NextResponse } from 'next/server';
import { buildClearSessionCookieHeader } from '@/lib/server/session';

export async function POST() {
    const cookieHeader = buildClearSessionCookieHeader();
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.headers.set('Set-Cookie', cookieHeader);
    return response;
}
