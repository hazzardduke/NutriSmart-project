import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  limit
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, of, combineLatest } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

export interface UserProfile {
  uid: string;
  porcentajeAgua: number;
  porcentajeGrasa: number;
  porcentajeMusculo: number;
}

export interface Appointment {
  id?: string;
  userId: string;
  datetime: string;
  status: 'confirmed' | 'canceled';
}

export interface Recommendation {
  id?: string;
  shortText?: string;
  detail?: string;
  createdAt?: string;
  tipo?: string;         // tipo de objetivo, ej. "Pérdida de peso", "Ganancia muscular"
  comentario?: string;   // texto o mensaje de la recomendación
  fecha?: string;        // fecha de creación (campo "fecha" de tus docs)
  meta?: string;         // meta asociada si existe
  goalId?: string;       // id del goal padre (útil para referencia)
  userId?: string;       // id del usuario (si está guardado)
}

export interface Goal {
  id?: string;
  tipo: string;
  progreso: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardClientService {
  private fs = inject(Firestore);
  private auth = inject(AuthService);

  getUserProfile(): Observable<UserProfile | null> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of(null);
        const ref = doc(this.fs, `users/${u.uid}`);
        return docData(ref, { idField: 'uid' }) as Observable<UserProfile>;
      })
    );
  }

  getUpcomingAppointments(): Observable<Appointment[]> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of([]);
        const now = new Date().toISOString();
        const in7 = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        const col = collection(this.fs, 'appointments');
        const q = query(
          col,
          where('userId', '==', u.uid),
          where('datetime', '>=', now),
          where('datetime', '<=', in7),
          orderBy('datetime', 'asc')
        );
        return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
      })
    );
  }

  getRecentRecommendations(limitCount = 3): Observable<Recommendation[]> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of([]);

        const goalsCol = collection(this.fs, `users/${u.uid}/goals`);
        return collectionData(goalsCol, { idField: 'id' }).pipe(
          switchMap((goals: any[]) => {
            if (goals.length === 0) return of([]);

            const recStreams = goals.map(goal => {
              const recCol = collection(this.fs, `users/${u.uid}/goals/${goal.id}/recommendations`);
              return collectionData(recCol, { idField: 'id' }) as Observable<Recommendation[]>;
            });

            return combineLatest(recStreams).pipe(
              map(allRecs => {
                const flat = allRecs.flat();
                if (flat.length === 0) return [];

                const sorted = flat.sort((a, b) => {
                  const da = a.fecha ? new Date(a.fecha).getTime() :
                            a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const db = b.fecha ? new Date(b.fecha).getTime() :
                            b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return db - da;
                });

                return sorted.slice(0, limitCount);
              })
            );
          })
        );
      })
    );
  }

  getGoals(): Observable<Goal[]> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of([]);
        const col = collection(this.fs, `users/${u.uid}/goals`);
        return collectionData(col, { idField: 'id' }) as Observable<Goal[]>;
      })
    );
  }
}
