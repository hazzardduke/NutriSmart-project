
import { onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');

admin.initializeApp();

export const sendEmail = onCall(
  { secrets: [SENDGRID_API_KEY] },
  async (req) => {
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

    const apiKey = SENDGRID_API_KEY.value();
    if (!apiKey.startsWith('SG.')) {
      console.error('API key inválida o vacía:', apiKey);
      throw new Error('API key inválida o no configurada en Firebase');
    }

    sgMail.setApiKey(apiKey);

    const msg: any = {
      to,
      from: {
        email: 'nutrismartcr@outlook.com',
        name: 'NutriSmart'
      }
    };

    if (templateId) {
      msg.templateId = templateId;
      msg.dynamic_template_data = dynamic_template_data || {};
    } else {
      if (!subject || !text) {
        throw new Error('Faltan datos: subject o text');
      }
      msg.subject = subject;
      msg.text = text;
    }

    try {
      const [response] = await sgMail.send(msg);
      console.log('Correo enviado', {
        status: response.statusCode,
        headers: response.headers
      });
      return { success: true, status: response.statusCode };
    } catch (err: any) {
      const sgBody = err?.response?.body;
      console.error('Error SendGrid:', sgBody ?? err?.message ?? err);
      throw new Error(
        sgBody?.errors?.[0]?.message ??
        sgBody ??
        err?.message ??
        'Error al enviar correo'
      );
    }
  }
);
