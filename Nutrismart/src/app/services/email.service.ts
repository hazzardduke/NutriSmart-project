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

  private readonly tplCitaConfirmada  = 'd-c7518e7021dc4d2f9b880a91ffcd5989';
  private readonly tplCitaActualizada = 'd-1019be5753f7415dbb5dee730f2d895c';
  private readonly tplCitaCancelada   = 'd-f854756ceab94a86a70dcf1d6c688de6';
  private readonly tplCitaGratis      = 'd-41aa334c905c4ae98bab635da846ab45';

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
