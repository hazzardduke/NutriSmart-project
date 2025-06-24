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
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
  shortText: string;
  detail: string;
  createdAt: string;
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
        const col = collection(this.fs, `users/${u.uid}/recommendations`);
        const q = query(col, orderBy('createdAt', 'desc'), limit(limitCount));
        return collectionData(q, { idField: 'id' }) as Observable<Recommendation[]>;
      })
    );
  }

  getGoals(): Observable<Goal[]> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of([]);
        const col = collection(this.fs, `users/${u.uid}/goals`);
        const q = query(col, orderBy('createdAt', 'desc'));
        return collectionData(q, { idField: 'id' }) as Observable<Goal[]>;
      })
    );
  }
}
