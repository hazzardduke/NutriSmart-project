// functions/src/index.ts
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

admin.initializeApp();

// Lee la API key de SendGrid desde env vars (Firebase Functions Config o Secrets Manager)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY!;
sgMail.setApiKey(SENDGRID_API_KEY);

export const sendEmail = onCall(async (req) => {
  // Permite tanto subject/text como Dynamic Templates
  const {
    to,
    subject,
    text,
    templateId,
    dynamic_template_data
  } = req.data as {
    to: string;
    subject?: string;
    text?: string;
    templateId?: string;
    dynamic_template_data?: Record<string, any>;
  };

  if (!to) {
    throw new Error('Falta el destinatario "to"');
  }

  // Construye el mensaje base
  const msg: any = {
    to,
    from: 'ntg.infocr@gmail.com'
  };

  if (templateId) {
    // Envío con plantilla dinámica
    msg.templateId = templateId;
    msg.dynamic_template_data = dynamic_template_data || {};
  } else {
    // Envío tradicional subject/text
    if (!subject || !text) {
      throw new Error('Faltan datos: subject o text');
    }
    msg.subject = subject;
    msg.text = text;
  }

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (e: any) {
    console.error('Error SendGrid:', e.response?.body || e.message);
    throw new Error('Error al enviar correo');
  }
});
