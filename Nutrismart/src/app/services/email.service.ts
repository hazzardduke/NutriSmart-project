// src/app/services/email.service.ts
import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface CitaMailData {
  nombre: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  urlCita?: string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly fnName = 'sendEmail';

  // Tus tres Dynamic Templates en SendGrid:
  private readonly tplConfirmada  = 'd-90f1443c279a46f296072ebe02991a6f';
  private readonly tplActualizada = 'd-9e866ddfab5c4885be19bbf850049e48';
  private readonly tplCancelada   = 'd-13d5552e64f048e7bc65ffc5d3a46e3f';
  

  constructor(private functions: Functions) {}

  private callSendEmail(payload: {
    to: string;
    templateId: string;
    dynamic_template_data: Record<string, any>;
  }) {
    const fn = httpsCallable(this.functions, this.fnName);
    return fn(payload);
  }

  sendCitaConfirmada(dest: string, data: CitaMailData) {
    return this.callSendEmail({
      to: dest,
      templateId: this.tplConfirmada,
      dynamic_template_data: data
    });
  }

  sendCitaActualizada(dest: string, data: CitaMailData) {
    return this.callSendEmail({
      to: dest,
      templateId: this.tplActualizada,
      dynamic_template_data: data
    });
  }

  sendCitaCancelada(dest: string, data: CitaMailData) {
    return this.callSendEmail({
      to: dest,
      templateId: this.tplCancelada,
      dynamic_template_data: data
    });
  }
}
