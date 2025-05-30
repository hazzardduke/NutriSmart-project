// src/app/services/appointments.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, updateDoc, doc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Appointment {
  id?: string;
  userId: string;
  datetime: string;
  status: 'pending' | 'confirmed' | 'canceled';
  nota?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private firestore = inject(Firestore);

  // Obtiene todas las citas de un usuario, ordenadas
  getUserAppointments(userId: string): Observable<Appointment[]> {
    const col = collection(this.firestore, 'appointments');
    const q = query(col,
      where('userId', '==', userId),
      orderBy('datetime', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
  }

  // Crea una cita nueva
  createAppointment(data: Omit<Appointment,'id'>): Promise<void> {
    const col = collection(this.firestore, 'appointments');
    return addDoc(col, data).then(() => {});
  }

  // Actualiza solo el estado o nota
  updateAppointment(id: string, changes: Partial<Appointment>): Promise<void> {
    const ref = doc(this.firestore, `appointments/${id}`);
    return updateDoc(ref, changes);
  }

  // Elimina una cita
  deleteAppointment(id: string): Promise<void> {
    const ref = doc(this.firestore, `appointments/${id}`);
    return deleteDoc(ref);
  }
}
