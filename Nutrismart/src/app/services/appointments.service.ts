
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, updateDoc, doc, deleteDoc, query, where, orderBy, Query, DocumentReference } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Appointment {
  id?: string;
  userId: string;
  datetime: string;
  status: 'confirmed' | 'canceled'| 'completed' ;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private firestore = inject(Firestore);
  private collRef = collection(this.firestore, 'appointments');


  getAllAppointments(): Observable<Appointment[]> {
    return collectionData(this.collRef, { idField: 'id' }) as Observable<Appointment[]>;
  }


  getUserAppointments(uid: string): Observable<Appointment[]> {
    const q: Query = query(this.collRef, where('userId', '==', uid));
    return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
  }


  createAppointment(data: Omit<Appointment, 'id'>): Promise<void> {

    return addDoc(this.collRef, data).then(() => {});
  }


  updateAppointment(id: string, changes: Partial<Appointment>): Promise<void> {
    const docRef: DocumentReference = doc(this.firestore, `appointments/${id}`);
    return updateDoc(docRef, changes);
  }


  deleteAppointment(id: string): Promise<void> {
    const docRef: DocumentReference = doc(this.firestore, `appointments/${id}`);
    return deleteDoc(docRef);
  }
}
