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
  orderBy,
  where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Goal {
  id?: string;
  tipo: string;
  meta: string;
  fecha: string;
  progreso: number;
  estado?: string;
  createdAt: string;
}

export interface UserSummary {
  uid: string;
  nombre: string;
  apellidos: string;
  cedula: string;
}

export interface Recommendation {
  id?: string;
  userId: string;
  goalId: string;
  tipo: string;
  meta: string;
  fecha: string;
  comentario: string;
}

@Injectable({ providedIn: 'root' })
export class GoalsNutricionistService {
  private fs = inject(Firestore);

  listClients(): Observable<UserSummary[]> {
    const usersCol = collection(this.fs, 'users');
    const q = query(usersCol, where('role', '==', 'cliente'));
    return collectionData(q, { idField: 'uid' }).pipe(
      map((arr: any[]) =>
        arr.map(u => ({
          uid: u.uid,
          nombre: u.nombre,
          apellidos: u.apellidos,
          cedula: u.cedula
        }))
      )
    );
  }

  getGoals(uid: string): Observable<Goal[]> {
    const col = collection(this.fs, `users/${uid}/goals`);
    const q = query(col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Goal[]>;
  }

  addGoal(
    uid: string,
    goal: Omit<Goal, 'id' | 'progreso' | 'createdAt'>
  ): Promise<void> {
    const col = collection(this.fs, `users/${uid}/goals`);
    return addDoc(col, {
      ...goal,
      progreso: 0,
      estado: 'en progreso',
      createdAt: new Date().toISOString()
    }).then(() => {});
  }

  updateGoal(uid: string, id: string, data: Partial<Goal>): Promise<void> {
    const ref = doc(this.fs, `users/${uid}/goals/${id}`);
    return updateDoc(ref, data);
  }

  deleteGoal(uid: string, id: string): Promise<void> {
    const ref = doc(this.fs, `users/${uid}/goals/${id}`);
    return deleteDoc(ref);
  }

  addRecommendation(
    userId: string,
    goal: Goal,
    comentario: string
  ): Promise<void> {
    const recCol = collection(this.fs, 'recommendations');
    const rec: Omit<Recommendation, 'id'> = {
      userId,
      goalId: goal.id!,
      tipo: goal.tipo,
      meta: goal.meta,
      fecha: new Date().toISOString(),
      comentario
    };
    return addDoc(recCol, rec).then(() => {});
  }

  listRecommendations(userId: string): Observable<Recommendation[]> {
    const recCol = collection(this.fs, 'recommendations');
    const q = query(
      recCol,
      where('userId', '==', userId),
      orderBy('fecha', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Recommendation[]>;
  }
}
