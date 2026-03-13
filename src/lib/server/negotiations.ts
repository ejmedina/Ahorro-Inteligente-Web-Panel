import { getAirtableConfig, INVOICE_FIELDS, NEGOTIATION_FIELDS, FIELDS } from './airtableFieldIds';
import { getPaymentMethods } from './stripe';
import { put } from '@vercel/blob';

export async function createNegotiationWithInvoice(userId: string, file: File, notes?: string) {
    const config = getAirtableConfig();

    // 1. Verificar si el usuario tiene métodos de pago reales
    // Obtenemos el registro del usuario para ver su stripeCustomerId
    const userRes = await fetch(`https://api.airtable.com/v0/${config.baseId}/${config.usersTableId}/${userId}`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
    const userData = await userRes.json();
    const customerId = userData.fields[FIELDS.STRIPE_CUSTOMER_ID];
    
    let hasPaymentMethod = false;
    if (customerId) {
        const methods = await getPaymentMethods(customerId);
        hasPaymentMethod = methods.length > 0;
    }
    
    const initialStatus = hasPaymentMethod ? 'Pending' : 'PendingPayment';

    // 2. Subir archivo a Vercel Blob
    // Generamos un nombre único para evitar colisiones
    const filename = `${userId}-${Date.now()}-${file.name}`;
    let blobUrl = '';
    
    try {
        const blob = await put(filename, file, {
            access: 'private',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        blobUrl = blob.url;
    } catch (error) {
        console.error('Error uploading to Vercel Blob:', error);
        throw new Error('Error al subir la factura al almacenamiento.');
    }

    // 3. Crear el registro en la tabla Invoices
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
                [INVOICE_FIELDS.PHOTO]: [{ url: blobUrl }] // Airtable descargará el archivo desde esta URL
            }
        })
    });

    if (!invoiceResponse.ok) {
        const err = await invoiceResponse.json();
        throw new Error(`Error creando Invoice en Airtable: ${JSON.stringify(err)}`);
    }

    const newInvoice = await invoiceResponse.json();

    // 4. Crear el registro en la tabla Negotiations
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
                [NEGOTIATION_FIELDS.NOTES]: notes || '',
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
        status: initialStatus,
        fileUrl: blobUrl
    };
}

export async function getUserNegotiations(userId: string, email?: string) {
    const config = getAirtableConfig();

    // Priorizar búsqueda por email si está disponible, es más robusta en este esquema
    const formula = email 
        ? `{${NEGOTIATION_FIELDS.EMAIL_LOOKUP}}='${email}'`
        : `SEARCH('${userId}', ARRAYJOIN({${NEGOTIATION_FIELDS.USER}}))`;

    const url = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}?filterByFormula=${encodeURIComponent(formula)}&returnFieldsByFieldId=1`;
    
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
        serviceName: record.fields[NEGOTIATION_FIELDS.SERVICE] || 'Factura cargada',
        userId: userId,
        savingsAchieved: record.fields[NEGOTIATION_FIELDS.SAVINGS_ACHIEVED],
    }));
}

export async function getNegotiationById(id: string) {
    const config = getAirtableConfig();
    const url = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}/${id}?returnFieldsByFieldId=1`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${config.apiKey}`
        }
    });

    if (!response.ok) {
        if (response.status === 404) return null;
        const err = await response.json();
        throw new Error(`Error obteniendo gestión de Airtable: ${JSON.stringify(err)}`);
    }

    const record = await response.json();
    const fields = record.fields;

    const negotiation = {
        id: record.id,
        createdAt: fields[NEGOTIATION_FIELDS.DATE] || record.createdTime,
        status: fields[NEGOTIATION_FIELDS.STATUS],
        serviceName: fields[NEGOTIATION_FIELDS.SERVICE] || 'Factura cargada',
        notes: fields[NEGOTIATION_FIELDS.NOTES],
        userId: fields[NEGOTIATION_FIELDS.USER]?.[0],
        updatedAt: record.createdTime,
        savingsAchieved: fields[NEGOTIATION_FIELDS.SAVINGS_ACHIEVED],
        promotionStart: fields[NEGOTIATION_FIELDS.PROMOTION_START],
        promotionEnd: fields[NEGOTIATION_FIELDS.PROMOTION_END],
        duration: fields[NEGOTIATION_FIELDS.DURATION],
        invoice: null as any
    };

    // Si tiene un invoice vinculado, buscamos sus detalles
    const invoiceId = fields[NEGOTIATION_FIELDS.INVOICE]?.[0];
    if (invoiceId) {
        const invUrl = `https://api.airtable.com/v0/${config.baseId}/${config.invoicesTableId}/${invoiceId}?returnFieldsByFieldId=1`;
        const invRes = await fetch(invUrl, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });
        if (invRes.ok) {
            const invRecord = await invRes.json();
            const invFields = invRecord.fields;
            const photo = invFields[INVOICE_FIELDS.PHOTO]?.[0];
            
            negotiation.invoice = {
                id: invRecord.id,
                filename: photo?.filename || 'Factura',
                size: photo?.size || 0,
                mime: photo?.type || 'application/pdf',
                fileUrl: photo?.url || '',
                uploadedAt: invFields[INVOICE_FIELDS.DATE] || invRecord.createdTime
            };
        }
    }

    return negotiation;
}
