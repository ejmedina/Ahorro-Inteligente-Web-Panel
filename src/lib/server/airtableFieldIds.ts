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
        subscriptionsTableId: 'tblS7BU1CzKgRtxEC',
        paymentsTableId: 'tblkWaCoR8F3YJfc8',
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
    STRIPE_CUSTOMER_ID: 'fldJbIHc9oAWL8mLU',
    VERIFICATION_TOKEN: 'fldBQIIi2ZNLVjTuS',
    RECOVERY_TOKEN: 'fldMxJcu2zz22jYs9',
    RECOVERY_EXPIRES: 'fldLtAeOBlgnl0Vcr',
    SUBSCRIPTION_STATUS: process.env.AIRTABLE_USERS_FIELD_SUBSCRIPTION_STATUS ?? 'fldMjTJucYIRQmExW',
} as const;

export const INVOICE_FIELDS = {
    PHOTO: 'fldVX8QSqIC1Jur27',
    USER: 'fldlKcp1L6rLFvzPM',
    DATE: 'fldV24bvgzasnep7X',
    NEGOTIATIONS: 'fldMDX0AkATbPGSzx',
    DNI: 'fldtxUUO5YUzYaenl',
} as const;

export const NEGOTIATION_FIELDS = {
    INVOICE: 'fldCKFRUuVvQTf8RS',
    STATUS: 'fldSN7NPwlNe4JUTS',
    USER: 'fldTlH3gNFePNGJ7Y',
    DATE: 'fld01y7zYT3A745P1',
    SERVICE: 'fldfDT5diynohOFUd',
    NOTES: 'fldflZy8zgT4PJhuZ',
    EMAIL_LOOKUP: 'fldKBrXG02UNrQppj',
    SAVINGS_ACHIEVED: 'fldCQDNjXSCdDrJln',
    PROMOTION_START: 'fld7woT1fDKM8wtqu',
    PROMOTION_END: 'fld5GJOQ9atkZMdoa',
    DURATION: 'fldU6Q2c9BWpkWdpI',
} as const;

/**
 * Sanitiza un valor para ser usado dentro de una fórmula de Airtable (filterByFormula).
 * Escapa las comillas simples para prevenir inyección de lógica en las fórmulas.
 */
export function sanitizeAirtableValue(val: string): string {
    if (!val) return '';
    // En las fórmulas de Airtable, las comillas simples se escapan con backslash \'
    return val.replace(/'/g, "\\'");
}
