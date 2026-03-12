import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'ahorro_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 días

export interface SessionPayload {
    airtableRecordId: string;
    fullName: string;
    email: string;
    phone?: string;
}

function getSecret(): Uint8Array {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            'SESSION_SECRET no configurado o demasiado corto. ' +
            'Debe tener al menos 32 caracteres. Configurá .env.local'
        );
    }
    return new TextEncoder().encode(secret);
}

export async function createSessionCookie(payload: SessionPayload): Promise<string> {
    const secret = getSecret();
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
        .sign(secret);

    return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const secret = getSecret();
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

/** Lee la sesión desde la cookie httpOnly de la request actual */
export async function getSession(): Promise<SessionPayload | null> {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;
        return await verifySessionToken(token);
    } catch {
        return null;
    }
}

/** Retorna los Set-Cookie headers para iniciar sesión */
export async function buildSetSessionCookieHeader(payload: SessionPayload): Promise<string> {
    const token = await createSessionCookie(payload);
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? '; Secure' : '';
    return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_SECONDS}${secureFlag}`;
}

/** Retorna el Set-Cookie header para cerrar sesión (expiración en el pasado) */
export function buildClearSessionCookieHeader(): string {
    return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
