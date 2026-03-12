import fs from 'fs';
import path from 'path';

async function exportSchema() {
    // Basic .env.local loader since we want to avoid extra dependencies if possible
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^#\s][^=]*)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value;
            }
        });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
        console.error('Error: AIRTABLE_API_KEY or AIRTABLE_BASE_ID not found in environment.');
        process.exit(1);
    }

    console.log(`Fetching schema for base: ${baseId}...`);

    try {
        const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Airtable API error: ${response.status} ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const schema: any = {};

        data.tables.forEach((table: any) => {
            const fields: any = {};
            table.fields.forEach((field: any) => {
                fields[field.name] = {
                    id: field.id,
                    type: field.type
                };
            });

            schema[table.name] = {
                id: table.id,
                fields: fields
            };
        });

        const outputPath = path.resolve(process.cwd(), 'docs/airtable-schema.json');
        fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2), 'utf8');

        console.log(`Schema successfully exported to: ${outputPath}`);
    } catch (error) {
        console.error('Error exporting schema:', error);
        process.exit(1);
    }
}

exportSchema();
