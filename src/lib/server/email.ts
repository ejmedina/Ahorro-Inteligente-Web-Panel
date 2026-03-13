import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendVerificationEmail(email: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

    await transporter.sendMail({
        from: `"Ahorro Inteligente" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verifica tu cuenta - Ahorro Inteligente',
        html,
    });
}

export async function sendRecoveryEmail(email: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

    await transporter.sendMail({
        from: `"Ahorro Inteligente" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperar Contraseña - Ahorro Inteligente',
        html,
    });
}
