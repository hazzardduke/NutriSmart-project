import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Goal {
  id?: string;
  tipo: string;
  meta: string;
  fecha: string;
  progreso: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private fs = inject(Firestore);

  /** Obtiene todos los objetivos ordenados por creación */
  getGoals(uid: string): Observable<Goal[]> {
    const col = collection(this.fs, `users/${uid}/goals`);
    const q = query(col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Goal[]>;
  }

  /** Crea un nuevo objetivo */
  addGoal(uid: string, goal: Omit<Goal,'id'|'createdAt'>): Promise<void> {
    const col = collection(this.fs, `users/${uid}/goals`);
    return addDoc(col, {
      ...goal,
      progreso: 0,
      createdAt: new Date().toISOString()
    }).then(() => {});
  }

  /** Actualiza el progreso o cualquier campo */
  updateGoal(uid: string, id: string, data: Partial<Goal>): Promise<void> {
    const ref = doc(this.fs, `users/${uid}/goals/${id}`);
    return updateDoc(ref, data);
  }

  /** Elimina un objetivo */
  deleteGoal(uid: string, id: string): Promise<void> {
    const ref = doc(this.fs, `users/${uid}/goals/${id}`);
    return deleteDoc(ref);
  }
}
