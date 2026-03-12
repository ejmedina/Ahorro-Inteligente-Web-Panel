/**
 * Airtable Field IDs para la tabla Users.
 * Leídos desde variables de entorno para evitar hardcodear IDs.
 * Todos son opcionales en el tipo para manejar el caso de entorno incompleto,
 * pero se validarán en tiempo de uso dentro de los helpers del servidor.
 */

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(
            `Variable de entorno requerida no configurada: ${key}. ` +
            `Completá .env.local con los valores correctos.`
        );
    }
    return value;
}

export function getAirtableConfig() {
    return {
        apiKey: requireEnv('AIRTABLE_API_KEY'),
        baseId: requireEnv('AIRTABLE_BASE_ID'),
        usersTableId: process.env.AIRTABLE_USERS_TABLE_ID ?? 'tblpuuhAsOfLgQuRA',
        invoicesTableId: 'tblAGJMbj64wTKM1I',
        negotiationsTableId: 'tblsAlKqXrMeLctBM',
    };
}

export const FIELDS = {
    FULL_NAME: process.env.AIRTABLE_USERS_FIELD_FULL_NAME ?? 'fldG7IovSWLshETDg',
    EMAIL: process.env.AIRTABLE_USERS_FIELD_EMAIL ?? 'fld3gSo42zCQFqtGW',
    PHONE: process.env.AIRTABLE_USERS_FIELD_PHONE ?? 'fldyPsfgKKnpcRYjI',
    REGISTRATION_DATE: process.env.AIRTABLE_USERS_FIELD_REGISTRATION_DATE ?? 'fldKIoT8c3bxEGFqH',
    PASSWORD_HASH: process.env.AIRTABLE_USERS_FIELD_PASSWORD_HASH ?? 'fldIFTcoFmMNWOZyM',
    AUTH_STATUS: process.env.AIRTABLE_USERS_FIELD_AUTH_STATUS ?? 'fldyhT2P9LwDER97E',
    LAST_LOGIN_AT: process.env.AIRTABLE_USERS_FIELD_LAST_LOGIN_AT ?? 'fld3nUiqE7n0I2wdn',
    UPDATED_AT: process.env.AIRTABLE_USERS_FIELD_UPDATED_AT ?? 'fldEof20vAryoxrQ1',
} as const;

export const INVOICE_FIELDS = {
    PHOTO: 'fldVX8QSqIC1Jur27',
    USER: 'fldlKcp1L6rLFvzPM',
    DATE: 'fldV24bvgzasnep7X',
    NEGOTIATIONS: 'fldMDX0AkATbPGSzx',
} as const;

export const NEGOTIATION_FIELDS = {
    INVOICE: 'fldCKFRUuVvQTf8RS',
    STATUS: 'fldSN7NPwlNe4JUTS',
    USER: 'fldTlH3gNFePNGJ7Y',
    DATE: 'fld01y7zYT3A745P1',
    SERVICE: 'fldfDT5diynohOFUd',
    NOTES: 'fldflZy8zgT4PJhuZ',
} as const;
