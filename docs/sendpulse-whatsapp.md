# Integración WhatsApp - SendPulse (Verificación)

Este documento detalla la arquitectura de validación de WhatsApp mediante templates usando SendPulse y el framework Next.js.

## Flujo de Verificación (Dynamic URL Button)

Dado que usar respuestas pasivas (texto como "Activar" o "Sí") choca con el Chatbot Principal de la plataforma, la verificación se canaliza íntegramente a través de un Botón de Enlace Web con URL dinámica.

### Envío del Template
Se usa el método \`sendWhatsAppTemplate\` del \`SendpulseService\`.
Esta función está sobrecargada para soportar hasta dos estructuras de variables (components):
1. \`body\`: Usa el Array \`variables\` para poblar las etiquetas de texto (ej \`{{1}}\` en el texto del mensaje).
2. \`button\`: Usa el parámetro \`buttonUrlParam\` para introducir un sub-componente tipo \`url\` con su propia variable independiente.

### Configuración de la Plantilla en SendPulse
- **Tipo de botón:** Llamada a la Acción (Call to Action) -> Enlace web.
- **URL Base en SendPulse:** \`https://[TU_DOMINIO_PROD]/api/auth/profile/verify-whatsapp/{{1}}\`
- **Por qué Path param:** Meta/SendPulse a veces rechaza la sintáxis de \`?query={{1}}\` para templates, dejándolo como segmento de ruta asegura 100% la compatibilidad.

### Endpoint de Verificación Exclusivo
Endpoint: \`src/app/api/auth/profile/verify-whatsapp/[id]/route.ts\`
Tipo: \`GET\`
Funcionamiento:
Este es un enlace directo que el usuario abre en el teléfono. 
1. Extrae el record ID de Airtable (\`[id]\`).
2. Actualiza en Airtable con \`subscriptionStatus = 'Active'\`.
3. Redirige al Front-End (\`/app?wa_verified=true\`) de inmediato.

## Testing Local con Vercel
Al no tener las credenciales (\`SENDPULSE_BOT_ID\`, etc.) en el entorno local, los testeos del webhook deben realizarse en Staging o bajando el entorno `.env.local` directamente de Vercel.

**Comandos Vercel:**
Para correr simulaciones locales idénticas a producción o probar scripts (ej: \`npx tsx test-wa.ts\`), primero asegúrate de linkear tu cuenta en local y pullear los secretos reales:
\`\`\`bash
npx vercel link
npx vercel env pull .env.local
\`\`\`
*(Se recomienda usar npx vercel-cli o tenerlo instalado globalmente para facilitar la inspección del proyecto).*
