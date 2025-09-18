// functions/src/index.ts
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

admin.initializeApp();

// Lee la API key de SendGrid desde Secrets o env vars
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
    from: {
      email: 'ntg.cr@outlook.com', // ⚠️ debe estar verificado en SendGrid
      name: 'NutriSmart'
    }
  };

  if (templateId) {
    // Envío con plantilla dinámica
    msg.templateId = templateId;
    msg.dynamic_template_data = dynamic_template_data || {};
  } else {
    // Envío tradicional con subject/text
    if (!subject || !text) {
      throw new Error('Faltan datos: subject o text');
    }
    msg.subject = subject;
    msg.text = text;
  }

  try {
    const [response] = await sgMail.send(msg);
    console.log('Correo enviado ✔️', {
      status: response.statusCode,
      headers: response.headers
    });
    return { success: true, status: response.statusCode };
  } catch (err: any) {
    const sgBody = err?.response?.body;
    console.error('❌ Error SendGrid:', sgBody ?? err?.message ?? err);
    throw new Error(
      sgBody?.errors?.[0]?.message ??
      sgBody ??
      err?.message ??
      'Error al enviar correo'
    );
  }
});
