// src/app/services/appointments.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, updateDoc, doc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
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
  private coll = collection(this.firestore, 'appointments');

/** Devuelve un Observable<Appointment[]> con todas las citas de Firestore */
getAllAppointments(): Observable<Appointment[]> {
  // map each document snapshot to { id, ...data() }
  return collectionData(this.coll, { idField: 'id' }) as Observable<Appointment[]>;
}

/** Devuelve solo las citas del usuario 'uid' */
getUserAppointments(uid: string): Observable<Appointment[]> {
  const q = query(this.coll, where('userId', '==', uid));
  return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
}

/** Crea una nueva cita en Firestore */
createAppointment(data: Omit<Appointment, 'id'>): Promise<void> {
  // (Firestore no obliga a poner el ID, así que usamos addDoc).
  // Sin embargo, resolvemos la promesa a void para integrarlo con "then/catch"
  return addDoc(this.coll, data)
    .then(() => {})
    .catch(err => {
      throw err;
    });
}

/** Actualiza (por ejemplo, cambia datetime o status) de una cita con 'id' */
updateAppointment(id: string, datos: Partial<Appointment>): Promise<void> {
  const refDoc = doc(this.firestore, `appointments/${id}`);
  return updateDoc(refDoc, datos)
    .then(() => {})
    .catch(err => {
      throw err;
    });
}

/** (Opcional) Elimina por completo una cita */
deleteAppointment(id: string): Promise<void> {
  const refDoc = doc(this.firestore, `appointments/${id}`);
  return deleteDoc(refDoc);
}
}
