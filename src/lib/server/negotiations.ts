import { getAirtableConfig, INVOICE_FIELDS, NEGOTIATION_FIELDS } from './airtableFieldIds';
import { stripeAdapter } from '../adapters/stripeAdapter';

export async function createNegotiationWithInvoice(userId: string, fileData: { name: string, type: string }, notes?: string) {
    const config = getAirtableConfig();

    // 1. Verificar si el usuario tiene métodos de pago (Usando el mock actual)
    const paymentMethods = await stripeAdapter.getPaymentMethods(userId);
    const hasPaymentMethod = paymentMethods.length > 0;
    const initialStatus = hasPaymentMethod ? 'Pending' : 'PendingPayment';

    // 2. Crear el registro en la tabla Invoices
    // NOTA: Para subir un archivo real a Airtable vía API, necesitamos una URL pública.
    // Como no tenemos storage configurado aún, guardaremos la referencia.
    // En un flujo real, aquí subiríamos a S3/Cloudinary y obtendríamos la URL.
    const invoiceResponse = await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.invoicesTableId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                [INVOICE_FIELDS.DATE]: new Date().toISOString().split('T')[0],
                [INVOICE_FIELDS.USER]: [userId],
                // [INVOICE_FIELDS.PHOTO]: [{ url: "LA_URL_DEL_ARCHIVO" }] // Requiere URL pública
            }
        })
    });

    if (!invoiceResponse.ok) {
        const err = await invoiceResponse.json();
        throw new Error(`Error creando Invoice en Airtable: ${JSON.stringify(err)}`);
    }

    const newInvoice = await invoiceResponse.json();

    // 3. Crear el registro en la tabla Negotiations
    const negotiationResponse = await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                [NEGOTIATION_FIELDS.DATE]: new Date().toISOString().split('T')[0],
                [NEGOTIATION_FIELDS.USER]: [userId],
                [NEGOTIATION_FIELDS.INVOICE]: [newInvoice.id],
                [NEGOTIATION_FIELDS.STATUS]: initialStatus,
                // Si hubiera una columna de notas, la pondríamos aquí
            }
        })
    });

    if (!negotiationResponse.ok) {
        const err = await negotiationResponse.json();
        throw new Error(`Error creando Negotiation en Airtable: ${JSON.stringify(err)}`);
    }

    const newNegotiation = await negotiationResponse.json();

    return {
        id: newNegotiation.id,
        invoiceId: newInvoice.id,
        status: initialStatus
    };
}

export async function getUserNegotiations(userId: string) {
    const config = getAirtableConfig();

    const url = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}?filterByFormula={${NEGOTIATION_FIELDS.USER}}='${userId}'`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${config.apiKey}`
        }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Error obteniendo gestiones de Airtable: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    
    return data.records.map((record: any) => ({
        id: record.id,
        createdAt: record.fields[NEGOTIATION_FIELDS.DATE] || record.createdTime,
        status: record.fields[NEGOTIATION_FIELDS.STATUS],
        userId: userId,
        // En un flujo real, aquí buscaríamos los detalles del invoice si los necesitamos
    }));
}
