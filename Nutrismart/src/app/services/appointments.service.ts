// src/app/services/appointments.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, updateDoc, doc, deleteDoc, query, where, orderBy, Query, DocumentReference } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Appointment {
  id?: string;
  userId: string;
  datetime: string; // ISO string
  status: 'confirmed' | 'canceled';
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private firestore = inject(Firestore);
  private collRef = collection(this.firestore, 'appointments');

  /**
   * Devuelve un Observable con TODAS las citas (sin filtrar por usuario).
   * Lo usamos en el componente para bloquear horarios globalmente.
   */
  getAllAppointments(): Observable<Appointment[]> {
    return collectionData(this.collRef, { idField: 'id' }) as Observable<Appointment[]>;
  }

  /**
   * Devuelve un Observable con SOLO las citas del usuario cuyo uid es `uid`.
   * Lo usamos para mostrar "Mis Citas".
   */
  getUserAppointments(uid: string): Observable<Appointment[]> {
    const q: Query = query(this.collRef, where('userId', '==', uid));
    return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
  }

  /**
   * Crea una nueva cita. `data` NO debe incluir `id`, porque Firestore lo asigna automáticamente.
   * Devolvemos la promesa de addDoc (resuelta cuando ya se insertó en Firestore).
   */
  createAppointment(data: Omit<Appointment, 'id'>): Promise<void> {
    // addDoc devuelve un DocumentReference, pero devolvemos Promise<void> simplemente.
    return addDoc(this.collRef, data).then(() => {});
  }

  /**
   * Actualiza un campo (o varios) de la cita cuyo id es `id`.
   * Por ejemplo: { datetime: nuevoIso } o { status: 'canceled' }.
   */
  updateAppointment(id: string, changes: Partial<Appointment>): Promise<void> {
    const docRef: DocumentReference = doc(this.firestore, `appointments/${id}`);
    return updateDoc(docRef, changes);
  }

  /**
   * (Opcional) Si quieres eliminar una cita completamente:
   */
  deleteAppointment(id: string): Promise<void> {
    const docRef: DocumentReference = doc(this.firestore, `appointments/${id}`);
    return deleteDoc(docRef);
  }
}
