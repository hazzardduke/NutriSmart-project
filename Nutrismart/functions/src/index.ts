// functions/src/index.ts
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

admin.initializeApp();

// Lee la API key de SendGrid desde env vars
// (la tendrás que setear antes de deploy con --set-env-vars o Secrets Manager)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
sgMail.setApiKey(SENDGRID_API_KEY);

export const sendEmail = onCall(async (req) => {
  const { to, subject, text } = req.data as {
    to: string;
    subject: string;
    text: string;
  };

  if (!to || !subject || !text) {
    // arroja un error “Handshake” con el cliente Callable
    throw new Error('Faltan datos: to, subject o text');
  }

  try {
    await sgMail.send({ to, from: 'ntg.infocr@gmail.com', subject, text });
    return { success: true };
  } catch (e: any) {
    console.error('Error SendGrid:', e.response?.body || e.message);
    throw new Error('Error al enviar correo');
  }
});
