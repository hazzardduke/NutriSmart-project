import { Injectable } from '@angular/core';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FirebaseApp } from '@angular/fire/app';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmailService {
  private sendEmailFn: ReturnType<typeof httpsCallable>;

  constructor(app: FirebaseApp) {
    const functions = getFunctions(app, 'us-central1');        // región donde desplegaste la función
    this.sendEmailFn = httpsCallable(functions, 'sendEmail');  // nombre exacto de la Cloud Function
  }

  /**
   * Dispara el correo vía Cloud Function.
   * @param to     correo del destinatario
   * @param subject asunto del correo
   * @param text    cuerpo en texto plano (se puede personalizar con HTML en la función)
   */
  send(to: string, subject: string, text: string): Observable<any> {
    return from(this.sendEmailFn({ to, subject, text }));
  }
}
