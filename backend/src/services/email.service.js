// src/services/email.service.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

async function enviarCorreoVerificacion(destinatario, nombre, tokenVerificacion) {
    const urlVerificacion = `${process.env.APP_URL}/api/auth/verificar/${tokenVerificacion}`;

    await transporter.sendMail({
        from: `"GarajeOk" <${process.env.GMAIL_USER}>`,
        to: destinatario,
        subject: 'Confirma tu cuenta en GarajeOk',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #1E4432;">GarajeOk</h2>
                <p>Hola ${nombre},</p>
                <p>Gracias por registrarte. Confirma tu cuenta haciendo clic en el siguiente botón:</p>
                <p style="text-align: center; margin: 24px 0;">
                    <a href="${urlVerificacion}"
                       style="display:inline-block;padding:12px 24px;background:#1E4432;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
                       Confirmar mi cuenta
                    </a>
                </p>
                <p style="color:#666;font-size:13px;">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.</p>
            </div>
        `
    });
}

module.exports = { enviarCorreoVerificacion };