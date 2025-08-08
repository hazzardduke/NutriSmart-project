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
  private readonly tplConfirmada  = 'd-81cccf19099247e385e6908bd814eae6';
  private readonly tplActualizada = 'd-33a9c51a1404451690492df5b1beb1a1';
  private readonly tplCancelada   = 'd-6d0602792de94d58843adc88d002cd55';
  

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
