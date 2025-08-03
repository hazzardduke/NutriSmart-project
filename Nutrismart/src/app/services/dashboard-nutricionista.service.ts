import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  doc,
  docData
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, of, combineLatest } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

export interface Appointment {
  id?: string;
  userId: string;
  datetime: string;    // ISO string
  status: string;
}

export interface AppointmentWithClient {
  id?: string;
  datetime: string;
  status: string;
  clientName: string;
}

export interface ClientSummary {
  id?: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardNutricionistaService {
  private fs   = inject(Firestore);
  private auth = inject(AuthService);

  /** 1) RAW: citas de hoy (00:00–23:59) */
  private getTodayRaw(): Observable<Appointment[]> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of([]);
        const start    = new Date(); start.setHours(0,0,0,0);
        const end      = new Date(); end.setHours(23,59,59,999);
        const isoStart = start.toISOString();
        const isoEnd   = end.toISOString();

        const col = collection(this.fs, 'appointments');
        const q   = query(
          col,
          where('datetime','>=', isoStart),
          where('datetime','<=', isoEnd),
          orderBy('datetime','asc')
        );
        return collectionData(q, { idField: 'id' }) as Observable<Appointment[]>;
      })
    );
  }

  /** 2) Enriquecer una lista de citas con el nombre del cliente */
  private enrichWithClient(appts: Appointment[]): Observable<AppointmentWithClient[]> {
    if (appts.length === 0) return of([]);
    const streams = appts.map(a => {
      const userRef = doc(this.fs, `users/${a.userId}`);
      return docData(userRef).pipe(
        map((u: any) => ({
          id:         a.id,
          datetime:   a.datetime,
          status:     a.status,
          clientName: `${u.nombre} ${u.apellidos}`  // ajusta a tus campos reales
        }))
      );
    });
    return combineLatest(streams);
  }

  /** 3) Public: citas de hoy ya enriquecidas */
  getTodaysWithClient(): Observable<AppointmentWithClient[]> {
    return this.getTodayRaw().pipe(
      switchMap(raw => this.enrichWithClient(raw))
    );
  }

  /** 4) Public: clientes activos */
  getActiveClients(): Observable<ClientSummary[]> {
    return this.auth.user$.pipe(
      switchMap(u => {
        if (!u) return of<ClientSummary[]>([]);
        const col = collection(this.fs, 'users');
        const q   = query(
          col,
          where('role','==','cliente'),
          orderBy('nombre','asc')
        );
        return collectionData(q, { idField: 'id' }) as Observable<any[]>;
      }),
      map(users =>
        users
          .filter(u => u.active === true)
          .map(u => ({
            id:   u.id,
            name: `${u.nombre} ${u.apellidos}`
          }))
      )
    );
  }
}
