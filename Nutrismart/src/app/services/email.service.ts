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

  private readonly tplCitaConfirmada  = 'd-90f1443c279a46f296072ebe02991a6f';
  private readonly tplCitaActualizada = 'd-9e866ddfab5c4885be19bbf850049e48';
  private readonly tplCitaCancelada   = 'd-13d5552e64f048e7bc65ffc5d3a46e3f';
  private readonly tplCitaGratis      = 'd-19531c2b76aa4fb6b9fcf99f0f1652ae';

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
      templateId: this.tplCitaConfirmada,
      dynamic_template_data: data
    });
  }

  sendCitaActualizada(dest: string, data: CitaMailData) {
    return this.callSendEmail({
      to: dest,
      templateId: this.tplCitaActualizada,
      dynamic_template_data: data
    });
  }

  sendCitaCancelada(dest: string, data: CitaMailData) {
    return this.callSendEmail({
      to: dest,
      templateId: this.tplCitaCancelada,
      dynamic_template_data: data
    });
  }

  sendCitaGratis(dest: string, data: { nombre: string }) {
    return this.callSendEmail({
      to: dest,
      templateId: this.tplCitaGratis,
      dynamic_template_data: data
    });
  }
}
