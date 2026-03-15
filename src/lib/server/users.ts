import { getAirtableConfig, FIELDS, sanitizeAirtableValue } from './airtableFieldIds';

export interface AirtableUser {
    recordId: string;
    fullName: string;
    email: string;
    phone?: string;
    passwordHash?: string;
    authStatus?: string;
    stripeCustomerId?: string;
    verificationToken?: string;
    recoveryToken?: string;
    recoveryExpiresAt?: string;
}

interface AirtableRecord {
    id: string;
    fields: Record<string, unknown>;
}

interface AirtableListResponse {
    records: AirtableRecord[];
}

function buildAirtableUrl(tableId: string, path = ''): string {
    const { baseId } = getAirtableConfig();
    return `https://api.airtable.com/v0/${baseId}/${tableId}${path}`;
}

function getHeaders(): Record<string, string> {
    const { apiKey } = getAirtableConfig();
    return {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };
}

function recordToUser(record: AirtableRecord): AirtableUser {
    const f = record.fields;
    
    // Helper para buscar campo por ID o por nombres comunes si el ID falla
    const findValue = (id: string, fallbacks: string[]): string | undefined => {
        if (f[id] !== undefined) return f[id] as string;
        for (const name of fallbacks) {
            if (f[name] !== undefined) return f[name] as string;
        }
        return undefined;
    };

    return {
        recordId: record.id,
        fullName: findValue(FIELDS.FULL_NAME, ['Full Name', 'Nombre Completo', 'Nombre']) ?? '',
        email: findValue(FIELDS.EMAIL, ['Email Address', 'Email', 'Correo']) ?? '',
        phone: findValue(FIELDS.PHONE, ['Phone', 'Teléfono', 'Telefono', 'Phone Number']),
        passwordHash: findValue(FIELDS.PASSWORD_HASH, ['Password Hash', 'Contraseña']),
        authStatus: findValue(FIELDS.AUTH_STATUS, ['Auth Status', 'Estado']),
        stripeCustomerId: findValue(FIELDS.STRIPE_CUSTOMER_ID, ['Stripe Customer ID']),
        verificationToken: findValue(FIELDS.VERIFICATION_TOKEN, ['Verification Token', 'Token de Verificación']),
        recoveryToken: findValue(FIELDS.RECOVERY_TOKEN, ['Recovery Token', 'Token de Recuperación']),
        recoveryExpiresAt: findValue(FIELDS.RECOVERY_EXPIRES, ['Recovery Expires At', 'Expiración Recuperación']),
    };
}

/** Busca un usuario por email normalizado. Retorna null si no existe. */
export async function findUserByEmail(email: string): Promise<AirtableUser | null> {
    email = email.trim().toLowerCase();

    const { usersTableId } = getAirtableConfig();
    const formula = encodeURIComponent(`LOWER({${FIELDS.EMAIL}})='${sanitizeAirtableValue(email)}'`);
    const url = `${buildAirtableUrl(usersTableId)}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=1`;

    const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Airtable error buscando usuario: ${res.status} ${body}`);
    }

    const data: AirtableListResponse = await res.json();
    if (!data.records || data.records.length === 0) return null;

    return recordToUser(data.records[0]);
}

export interface CreateUserInput {
    fullName: string;
    email: string;
    phone?: string;
    passwordHash: string;
    verificationToken?: string;
}

/** Crea un nuevo usuario en Airtable. Retorna el registro creado. */
export async function createUser(input: CreateUserInput): Promise<AirtableUser> {
    const { usersTableId } = getAirtableConfig();
    const url = buildAirtableUrl(usersTableId);
    const now = new Date().toISOString();

    const fields: Record<string, string> = {
        [FIELDS.FULL_NAME]: input.fullName,
        [FIELDS.EMAIL]: input.email.trim().toLowerCase(),
        [FIELDS.PASSWORD_HASH]: input.passwordHash,
        [FIELDS.AUTH_STATUS]: 'pending',
        [FIELDS.REGISTRATION_DATE]: now.split('T')[0], // YYYY-MM-DD para campo tipo Date
        [FIELDS.UPDATED_AT]: now,
    };

    if (input.phone) {
        fields[FIELDS.PHONE] = input.phone;
    }

    if (input.verificationToken) {
        fields[FIELDS.VERIFICATION_TOKEN] = input.verificationToken;
    }

    const res = await fetch(`${url}?returnFieldsByFieldId=1`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Airtable error creando usuario: ${res.status} ${body}`);
    }

    const record: AirtableRecord = await res.json();
    return recordToUser(record);
}

export interface UpdateUserInput {
    fullName?: string;
    phone?: string;
    passwordHash?: string;
    authStatus?: string;
    lastLoginAt?: string;
    stripeCustomerId?: string;
    verificationToken?: string | null;
    recoveryToken?: string | null;
    recoveryExpiresAt?: string | null;
}

/** Actualiza campos de un usuario existente en Airtable por su recordId. */
export async function updateUser(recordId: string, input: UpdateUserInput): Promise<void> {
    const { usersTableId } = getAirtableConfig();
    const url = `${buildAirtableUrl(usersTableId)}/${recordId}`;
    const now = new Date().toISOString();

    const fields: Record<string, string> = {
        [FIELDS.UPDATED_AT]: now,
    };

    if (input.fullName !== undefined) fields[FIELDS.FULL_NAME] = input.fullName;
    if (input.phone !== undefined) fields[FIELDS.PHONE] = input.phone;
    if (input.passwordHash !== undefined) fields[FIELDS.PASSWORD_HASH] = input.passwordHash;
    if (input.authStatus !== undefined) fields[FIELDS.AUTH_STATUS] = input.authStatus;
    if (input.lastLoginAt !== undefined) fields[FIELDS.LAST_LOGIN_AT] = input.lastLoginAt;
    if (input.stripeCustomerId !== undefined) fields[FIELDS.STRIPE_CUSTOMER_ID] = input.stripeCustomerId!;
    if (input.verificationToken !== undefined) fields[FIELDS.VERIFICATION_TOKEN] = input.verificationToken!;
    if (input.recoveryToken !== undefined) fields[FIELDS.RECOVERY_TOKEN] = input.recoveryToken!;
    if (input.recoveryExpiresAt !== undefined) fields[FIELDS.RECOVERY_EXPIRES] = input.recoveryExpiresAt!;

    const res = await fetch(`${url}?returnFieldsByFieldId=1`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Airtable error actualizando usuario: ${res.status} ${body}`);
    }
}