export function getSendpulseConfig() {
    const id = process.env.SENDPULSE_CLIENT_ID;
    const secret = process.env.SENDPULSE_CLIENT_SECRET;
    const botId = process.env.SENDPULSE_BOT_ID;

    return {
        id,
        secret,
        botId,
    };
}

class SendpulseService {
    private accessToken: string | null = null;
    private tokenExpiresAt: number | null = null;

    /**
     * Obtiene y almacena en caché un Bearer token para llamar a SendPulse.
     */
    private async getAccessToken(): Promise<string> {
        if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        const config = getSendpulseConfig();
        if (!config.id || !config.secret) {
            console.error('SendPulse Credentials missing');
            throw new Error('Faltan credenciales de SendPulse en el entorno.');
        }

        const res = await fetch('https://api.sendpulse.com/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: config.id,
                client_secret: config.secret,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Error obteniendo Sendpulse Token: ${res.status} ${res.statusText} - ${errorText}`);
        }

        const data = await res.json();
        this.accessToken = data.access_token;
        // Restar unos segundos como margen de error antes de expirar
        this.tokenExpiresAt = Date.now() + (data.expires_in - 30) * 1000;

        return this.accessToken!;
    }

    /**
     * Envía un template de Autenticación de WhatsApp
     * @param phone Número de teléfono (Ej: 5491112345678)
     * @param templateName Nombre de la plantilla aprobada en SendPulse
     * @param language Código de idioma (Ej: 'es', 'es_AR')
     */
    async sendWhatsAppTemplate(phone: string, templateName: string = 'activar_notificaciones', language: string = 'es', variables: string[] = [], buttonUrlParam?: string): Promise<boolean> {
        const config = getSendpulseConfig();
        if (!config.botId) {
            console.warn('SENDPULSE_BOT_ID missing. Simulando envío a ' + phone);
            return true;
        }

        try {
            const token = await this.getAccessToken();

            const components: any[] = [];
            
            if (variables.length > 0) {
                components.push({
                    type: "body",
                    parameters: variables.map(text => ({
                        type: "text",
                        text: text
                    }))
                });
            }

            if (buttonUrlParam) {
                components.push({
                    type: "button",
                    sub_type: "url",
                    index: "1",
                    parameters: [
                        {
                            type: "text",
                            text: buttonUrlParam
                        }
                    ]
                });
            }

            const body = {
                bot_id: config.botId,
                phone: phone.replace(/[^0-9]/g, ''), // Asegurar solo dígitos
                template: {
                    name: templateName,
                    language: {
                        code: language
                    },
                    ...(components.length > 0 && { components })
                }
            };
            
            console.log(`[SendpulseService] Preparando envío WA. Template: '${templateName}', Phone: ${body.phone}`);

            const res = await fetch('https://api.sendpulse.com/whatsapp/contacts/sendTemplateByPhone', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorText = await res.text();
                // Mejor visibilidad de error detallado en prod
                console.error(`[SendpulseService] Failed API Request (${res.status}): ${errorText}`);
                throw new Error(`SendPulse API error: ${res.status} ${res.statusText}`);
            }

            console.log(`[SendpulseService] Template '${templateName}' enviado correctamente a ${body.phone}`);
            return true;
        } catch (error) {
            console.error('[SendpulseService] Error enviando WhatsApp:', error);
            // Lanza el error para poder capturarlo e informar (u omitir) en el controlador superior
            throw error;
        }
    }
}

export const sendpulseService = new SendpulseService();
