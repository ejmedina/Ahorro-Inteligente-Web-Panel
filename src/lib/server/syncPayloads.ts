import { getAirtableConfig, NEGOTIATION_FIELDS } from './airtableFieldIds';

/**
 * Sincroniza el estado de las gestiones según la existencia de medios de pago.
 * @param userId ID del registro de usuario en Airtable.
 * @param hasMethods true si el usuario tiene medios de pago, false si no.
 */
export async function syncNegotiationsStatus(userId: string, hasMethods: boolean) {
    const config = getAirtableConfig();
    const targetStatus = hasMethods ? 'Pending' : 'PendingPayment';
    const sourceStatus = hasMethods ? 'PendingPayment' : 'Pending';

    try {
        const formula = `AND({${NEGOTIATION_FIELDS.USER}}='${userId}', {${NEGOTIATION_FIELDS.STATUS}}='${sourceStatus}')`;
        const url = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}?filterByFormula=${encodeURIComponent(formula)}`;
        
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

        console.log(`[syncNegotiationsStatus] Sincronizando ${records.length} gestiones para el usuario ${userId} a estado ${targetStatus}`);

        for (const rec of records) {
            await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}/${rec.id}`, {
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
