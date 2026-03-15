const ZEPTOMAIL_API_KEY = process.env.ZEPTOMAIL_API_KEY;
const FROM_EMAIL = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@ahorrointeligente.com.ar';
const FROM_NAME = process.env.ZEPTOMAIL_FROM_NAME || 'Ahorro Inteligente';

async function sendEmail({ to, subject, html }: { to: { email: string, name: string }[], subject: string, html: string }) {
    if (!ZEPTOMAIL_API_KEY) {
        console.warn('ZEPTOMAIL_API_KEY no configurada. El mail no se enviará.');
        return;
    }

    const authHeader = ZEPTOMAIL_API_KEY.startsWith('Zoho-enczapikey') 
        ? ZEPTOMAIL_API_KEY 
        : `Zoho-enczapikey ${ZEPTOMAIL_API_KEY}`;

    const response = await fetch('https://api.zeptomail.com/v1.1/email', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authHeader,
        },
        body: JSON.stringify({
            from: { address: FROM_EMAIL, name: FROM_NAME },
            to: to.map(t => ({
                email_address: { address: t.email, name: t.name }
            })),
            subject: subject,
            htmlbody: html,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Error enviando email via ZeptoMail:', error);
        throw new Error('Error al enviar el email');
    }

    return response.json();
}

export async function sendVerificationEmail(email: string, token: string, name: string = 'Usuario') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">Bienvenido a Ahorro Inteligente</h2>
            <p>Gracias por registrarte. Para completar tu registro, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar mi correo</a>
            </div>
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
        </div>
    `;

    await sendEmail({
        to: [{ email, name }],
        subject: 'Verifica tu cuenta - Ahorro Inteligente',
        html,
    });
}

export async function sendRecoveryEmail(email: string, token: string, name: string = 'Usuario') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
    const recoveryUrl = `${baseUrl}/reset-password?token=${token}`;

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">Recuperar Contraseña</h2>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para elegir una nueva:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${recoveryUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
            </div>
            <p>Este enlace expirará en 1 hora.</p>
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #666;">${recoveryUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
    `;

    await sendEmail({
        to: [{ email, name }],
        subject: 'Recuperar Contraseña - Ahorro Inteligente',
        html,
    });
}

