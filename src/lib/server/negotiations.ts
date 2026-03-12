import { getAirtableConfig, INVOICE_FIELDS, NEGOTIATION_FIELDS } from './airtableFieldIds';
import { stripeAdapter } from '../adapters/stripeAdapter';
import { put } from '@vercel/blob';

export async function createNegotiationWithInvoice(userId: string, file: File, notes?: string) {
    const config = getAirtableConfig();

    // 1. Verificar si el usuario tiene métodos de pago (Usando el mock actual)
    const paymentMethods = await stripeAdapter.getPaymentMethods(userId);
    const hasPaymentMethod = paymentMethods.length > 0;
    const initialStatus = hasPaymentMethod ? 'Pending' : 'PendingPayment';

    // 2. Subir archivo a Vercel Blob
    // Generamos un nombre único para evitar colisiones
    const filename = `${userId}-${Date.now()}-${file.name}`;
    let blobUrl = '';
    
    try {
        const blob = await put(filename, file, {
            access: 'public',
            // El token BLOB_READ_WRITE_TOKEN se toma automáticamente de process.env si está en Vercel
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

export async function getUserNegotiations(userId: string) {
    const config = getAirtableConfig();

    const formula = `{${NEGOTIATION_FIELDS.USER}}='${userId}'`;
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
        // En un flujo real, aquí buscaríamos los detalles del invoice si los necesitamos
    }));
}
