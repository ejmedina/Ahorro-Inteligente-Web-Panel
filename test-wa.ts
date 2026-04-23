import { sendpulseService } from './src/lib/server/sendpulse';
import { loadEnvConfig } from '@next/env';

// Simulate Next.js loading .env.local
loadEnvConfig(process.cwd());

async function testSendTemplate() {
    try {
        console.log("Cargando variables de entorno y conectando a SendPulse...");
        
        // Simular el recordId de Airtable de desarrollo para probar el enlace
        const testRecordId = "recPruebaDesb123";
        const phone = "5491159196997";

        console.log(`Enviando notificación a ${phone}...`);
        
        await sendpulseService.sendWhatsAppTemplate(
            phone,
            'activar_notificaciones_1',
            'es',
            ['Enrique'], // Reemplaza la variable del nombre (Body)
            testRecordId // Reemplaza la variable del Link Button (Button)
        );

        console.log("✅ Mensaje enviado de forma exitosa a Sendpulse API.");
    } catch (e: any) {
        console.error("❌ Falló la prueba:", e.message);
    }
}

testSendTemplate();
