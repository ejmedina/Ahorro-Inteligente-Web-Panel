import { getAirtableConfig, INVOICE_FIELDS, NEGOTIATION_FIELDS, sanitizeAirtableValue } from './src/lib/server/airtableFieldIds';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    try {
        const email = 'ejmedina+susu@gmail.com';
        const sEmail = sanitizeAirtableValue(email);
    
        const formula = `SEARCH('${sEmail}', {${NEGOTIATION_FIELDS.EMAIL_LOOKUP}} & "")`;
            
        console.log('FORMULA:', formula);
    
        const config = getAirtableConfig();
        const url = `https://api.airtable.com/v0/${config.baseId}/${config.negotiationsTableId}?filterByFormula=${encodeURIComponent(formula)}&returnFieldsByFieldId=1`;
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });
        
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error', err);
    }
}

check();
