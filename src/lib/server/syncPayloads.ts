import { getAirtableConfig, NEGOTIATION_FIELDS } from './airtableFieldIds';

/**
 * Sincroniza el estado de las gestiones según la existencia de medios de pago.
 * @param userId ID del registro de usuario en Airtable.
 * @param hasMethods true si el usuario tiene medios de pago, false si no.
 * @param email Email del usuario para una búsqueda más robusta (opcional).
 */
export async function syncNegotiationsStatus(userId: string, hasMethods: boolean, email?: string) {
    const config = getAirtableConfig();
    const targetStatus = hasMethods ? 'Pending' : 'PendingPayment';
    const sourceStatus = hasMethods ? 'PendingPayment' : 'Pending';

    try {
        // Usamos una fórmula más robusta para encontrar las gestiones del usuario
        const userFilter = email 
            ? `{${NEGOTIATION_FIELDS.EMAIL_LOOKUP}}='${email}'`
            : `FIND('${userId}', {${NEGOTIATION_FIELDS.USER}} & "")`;
        
        const formula = `AND(${userFilter}, {${NEGOTIATION_FIELDS.STATUS}}='${sourceStatus}')`;
        const url = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}?filterByFormula=${encodeURIComponent(formula)}&returnFieldsByFieldId=1`;
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });

        if (!res.ok) {
            console.error(`[syncNegotiationsStatus] Error buscando gestiones:`, await res.text());
            return;
        }

        const data = await res.json();
        const records = data.records || [];

        if (records.length === 0) return;

        console.log(`[syncNegotiationsStatus] Sincronizando ${records.length} gestiones para el usuario ${userId} (${email || ''}) a estado ${targetStatus}`);

        for (const rec of records) {
            await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}/${rec.id}?returnFieldsByFieldId=1`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: { [NEGOTIATION_FIELDS.STATUS]: targetStatus }
                })
            });
        }
    } catch (error) {
        console.error(`[syncNegotiationsStatus] Error inesperado:`, error);
    }
}
