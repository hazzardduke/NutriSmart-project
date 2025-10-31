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

export type GoalStatus = 'en progreso' | 'completado';

export interface Goal {
  id?: string;
  tipo: string;
  meta: string;
  fecha: string;
  progreso: number;
  estado: GoalStatus;
  createdAt: string;
}

export interface Recommendation {
  id?: string;
  comentario: string;
  fecha: string;
  goalId: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class GoalsService {
  private fs = inject(Firestore);


  getGoals(uid: string): Observable<Goal[]> {
    const col = collection(this.fs, `users/${uid}/goals`);
    const q = query(col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Goal[]>;
  }

  addGoal(uid: string, goal: Omit<Goal, 'id' | 'createdAt'>): Promise<void> {
    const col = collection(this.fs, `users/${uid}/goals`);
    return addDoc(col, {
      ...goal,
      progreso: 0,
      estado: 'en progreso' as GoalStatus,
      createdAt: new Date().toISOString()
    }).then(() => {});
  }


  updateGoal(uid: string, id: string, data: Partial<Goal>): Promise<void> {
    const ref = doc(this.fs, `users/${uid}/goals/${id}`);
    return updateDoc(ref, data);
  }




  getRecommendations(uid: string, goalId: string): Observable<Recommendation[]> {
    const recCol = collection(
      this.fs,
      `users/${uid}/goals/${goalId}/recommendations`
    );
    const q = query(recCol, orderBy('fecha', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Recommendation[]>;
  }
}
