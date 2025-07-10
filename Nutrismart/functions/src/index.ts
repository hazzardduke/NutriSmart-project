import { onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import sgMail from '@sendgrid/mail'; // ✅ Importación correcta

// 🚨 Tu API key aquí
const SENDGRID_API_KEY = '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';

sgMail.setApiKey(SENDGRID_API_KEY); // ✅ Esto ya no lanzará error

export const sendEmail = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { to, subject, text } = request.data;

    if (!to || !subject || !text) {
      throw new Error('Faltan datos: to, subject o text');
    }

    const msg = {
      to,
      from: 'ntg.infocr@gmail.com',
      subject,
      text
    };

    try {
      await sgMail.send(msg);
      logger.info('Correo enviado');
      return { success: true };
    } catch (error: any) {
      logger.error('Error al enviar correo:', error.response?.body || error.message);
      throw new Error('Error al enviar correo');
    }
  }
);
